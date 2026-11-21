from datetime import datetime
from algorithms.min_heap import MinHeap
from algorithms.bipartite_matching import maximum_matching

URGENCY_HANDICAP={"CRITICAL":0,"HIGH":15,"MEDIUM":45,"LOW":90}
AVG_DURATION={"CRITICAL":30,"HIGH":20,"MEDIUM":15,"LOW":10}

class HospitalScheduler:
    def __init__(self,doctors,clock=datetime.now,store=None):
        self.clock=clock
        self.store=store
        self.dirty_patients=set()
        self.dirty_doctors=set()
        self.queue=MinHeap()
        self.patients={}
        self.next_id=1
        self.doctors={}
        for doctor in doctors:
            if doctor["doctor_id"] in self.doctors:
                raise ValueError("Duplicate doctor id: "+str(doctor["doctor_id"]))
            if not doctor["specializations"]:
                raise ValueError(doctor["name"]+" has no specializations")
            self.doctors[doctor["doctor_id"]]={
                "doctor_id":doctor["doctor_id"],
                "name":doctor["name"],
                "specializations":list(doctor["specializations"]),
                "on_duty":True,
                "available":True,
                "current_patient":None
            }
        if store is not None:
            store.seed_doctors(list(self.doctors.values()))
            for saved in store.load_doctors():
                if saved["doctor_id"] in self.doctors:
                    self.doctors[saved["doctor_id"]].update(on_duty=saved["on_duty"],available=saved["available"],current_patient=saved["current_patient"])
                else:
                    self.doctors[saved["doctor_id"]]=saved
        self.specializations={s for d in self.doctors.values() for s in d["specializations"]}
        if store is not None:
            items=[]
            for saved in store.load_patients():
                self.patients[saved["patient_id"]]=saved
                if saved["status"]=="WAITING":
                    items.append((self.make_key(saved),saved))
            self.queue.build_heap(items)
            self.next_id=max(self.patients,default=0)+1
            self.allocate()
    def make_key(self,patient):
        arrival=datetime.fromisoformat(patient["arrival_time"])
        return (arrival.timestamp()/60+URGENCY_HANDICAP[patient["urgency"]],patient["patient_id"])
    def touch(self,patient=None,doctor=None):
        if patient is not None:
            self.dirty_patients.add(patient["patient_id"])
        if doctor is not None:
            self.dirty_doctors.add(doctor["doctor_id"])
    def flush(self):
        if self.store is None or not (self.dirty_patients or self.dirty_doctors):
            return
        self.store.save([self.patients[i] for i in self.dirty_patients],[self.doctors[i] for i in self.dirty_doctors])
        self.dirty_patients.clear()
        self.dirty_doctors.clear()
    def register_patient(self,name,urgency,required_specialization,age=None,complaint=""):
        name=name.strip()
        if not name:
            raise ValueError("Patient name is required")
        urgency=urgency.strip().upper()
        required_specialization=required_specialization.strip()
        if urgency not in URGENCY_HANDICAP:
            raise ValueError("Invalid urgency level: "+urgency)
        if required_specialization not in self.specializations:
            raise ValueError("No doctor with specialization: "+required_specialization)
        arrival=self.clock()
        patient_id=self.next_id
        self.next_id+=1
        patient={
            "patient_id":patient_id,
            "name":name,
            "age":age,
            "complaint":complaint,
            "urgency":urgency,
            "required_specialization":required_specialization,
            "status":"WAITING",
            "arrival_time":arrival.isoformat(),
            "doctor_id":None,
            "doctor_name":None,
            "start_time":None,
            "end_time":None
        }
        self.patients[patient_id]=patient
        self.queue.insert((self.make_key(patient),patient))
        self.touch(patient=patient)
        self.allocate()
        return patient
    def allocate(self):
        started=self.match_waiting()
        self.flush()
        return started
    def match_waiting(self):
        if self.queue.is_empty() or not any(d["available"] for d in self.doctors.values()):
            return []
        waiting=[]
        while not self.queue.is_empty():
            waiting.append(self.queue.extract_min())
        doctors=sorted(self.doctors.values(),key=lambda d:len(d["specializations"]))
        result=maximum_matching([item[1] for item in waiting],doctors)
        matched={a["patient_id"]:a["doctor_id"] for a in result["assignments"]}
        started=[]
        unmatched=[]
        for key,patient in waiting:
            patient_id=patient["patient_id"]
            if patient_id in matched:
                doctor=self.doctors[matched[patient_id]]
                doctor["available"]=False
                doctor["current_patient"]=patient_id
                patient["status"]="IN_TREATMENT"
                patient["doctor_id"]=doctor["doctor_id"]
                patient["doctor_name"]=doctor["name"]
                patient["start_time"]=self.clock().isoformat()
                started.append(patient)
                self.touch(patient,doctor)
            else:
                unmatched.append((key,patient))
        self.queue.build_heap(unmatched)
        return started
    def complete_treatment(self,doctor_id,patient_id=None):
        doctor=self.doctors.get(doctor_id)
        if doctor is None:
            raise ValueError("Unknown doctor: "+str(doctor_id))
        if doctor["current_patient"] is None:
            raise ValueError(doctor["name"]+" is not treating anyone")
        if patient_id is not None and doctor["current_patient"]!=patient_id:
            raise ValueError(doctor["name"]+" is no longer treating patient "+str(patient_id))
        patient=self.patients[doctor["current_patient"]]
        patient["status"]="COMPLETED"
        patient["end_time"]=self.clock().isoformat()
        doctor["available"]=doctor["on_duty"]
        doctor["current_patient"]=None
        self.touch(patient,doctor)
        self.allocate()
        return patient
    def get_waiting_patient(self,patient_id):
        patient=self.patients.get(patient_id)
        if patient is None:
            raise ValueError("Unknown patient: "+str(patient_id))
        if patient["status"]!="WAITING":
            raise ValueError(patient["name"]+" is not waiting")
        return patient
    def remove_from_queue(self,patient_id):
        self.queue.build_heap([item for item in self.queue.heap if item[1]["patient_id"]!=patient_id])
    def cancel_patient(self,patient_id):
        patient=self.get_waiting_patient(patient_id)
        self.remove_from_queue(patient_id)
        patient["status"]="LEFT"
        patient["end_time"]=self.clock().isoformat()
        self.touch(patient=patient)
        self.flush()
        return patient
    def change_urgency(self,patient_id,urgency):
        urgency=urgency.strip().upper()
        if urgency not in URGENCY_HANDICAP:
            raise ValueError("Invalid urgency level: "+urgency)
        patient=self.get_waiting_patient(patient_id)
        self.remove_from_queue(patient_id)
        patient["urgency"]=urgency
        self.queue.insert((self.make_key(patient),patient))
        self.touch(patient=patient)
        self.flush()
        return patient
    def set_doctor_duty(self,doctor_id,on_duty):
        doctor=self.doctors.get(doctor_id)
        if doctor is None:
            raise ValueError("Unknown doctor: "+str(doctor_id))
        doctor["on_duty"]=on_duty
        if doctor["current_patient"] is None:
            doctor["available"]=on_duty
        self.touch(doctor=doctor)
        if on_duty:
            self.allocate()
        self.flush()
        return doctor
    def remaining_minutes(self,doctor):
        if doctor["available"]:
            return 0
        patient=self.patients[doctor["current_patient"]]
        elapsed=max(0,(self.clock()-datetime.fromisoformat(patient["start_time"])).total_seconds()/60)
        return max(0,AVG_DURATION[patient["urgency"]]-elapsed)
    def get_dashboard(self,completed_limit=20):
        now=self.clock()
        ordered=sorted(self.queue.heap,key=lambda item:item[0])
        load={}
        waiting=[]
        for position,(key,patient) in enumerate(ordered,1):
            spec=patient["required_specialization"]
            capable=[d for d in self.doctors.values() if spec in d["specializations"] and d["on_duty"]]
            ahead=load.get(spec,0)
            wait=round(min(self.remaining_minutes(d) for d in capable)+ahead/len(capable)) if capable else None
            load[spec]=ahead+AVG_DURATION[patient["urgency"]]
            waited=max(0,(now-datetime.fromisoformat(patient["arrival_time"])).total_seconds()/60)
            waiting.append(dict(patient,position=position,waited_minutes=round(waited),estimated_wait_minutes=wait))
        active=[p for p in self.patients.values() if p["status"]=="IN_TREATMENT"]
        completed=[p for p in self.patients.values() if p["status"]=="COMPLETED"]
        completed.sort(key=lambda p:p["end_time"],reverse=True)
        available=[{"doctor_id":d["doctor_id"],"name":d["name"],"specializations":d["specializations"]} for d in self.doctors.values() if d["available"]]
        off_duty=[{"doctor_id":d["doctor_id"],"name":d["name"]} for d in self.doctors.values() if not d["on_duty"]]
        return {"waiting":waiting,"active":active,"available_doctors":available,"off_duty_doctors":off_duty,"completed":completed[:completed_limit],"completed_count":len(completed)}
    def get_doctors(self):
        return [dict(d,current_patient=self.patients[d["current_patient"]] if d["current_patient"] else None) for d in self.doctors.values()]