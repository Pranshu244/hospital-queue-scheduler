import copy
import os
import threading
from typing import Optional
from fastapi import FastAPI,HTTPException,Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field
from algorithms.scheduler import HospitalScheduler,URGENCY_HANDICAP
from storage import SqliteStore
doctors=[
    {"doctor_id":1,"name":"Dr. Sharma","specializations":["Cardiology","General Medicine"]},
    {"doctor_id":2,"name":"Dr. Verma","specializations":["General Medicine"]},
    {"doctor_id":3,"name":"Dr. Gupta","specializations":["Orthopedics"]}
]
scheduler=HospitalScheduler(doctors,store=SqliteStore(os.environ.get("HOSPITAL_DB","hospital.db")))
lock=threading.Lock()
app=FastAPI(title="Hospital Patient Queue and Resource Scheduler")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])
class PatientIn(BaseModel):
    name:str=Field(min_length=1,max_length=100)
    urgency:str
    required_specialization:str
    age:Optional[int]=Field(default=None,ge=0,le=120)
    complaint:str=Field(default="",max_length=500)
class UrgencyIn(BaseModel):
    urgency:str
class FinishIn(BaseModel):
    patient_id:int
class DutyIn(BaseModel):
    on_duty:bool
def call(method,*args):
    with lock:
        try:
            return copy.deepcopy(method(*args))
        except ValueError as error:
            raise HTTPException(status_code=400,detail=str(error))
@app.get("/api/options")
def get_options():
    return {"urgencies":list(URGENCY_HANDICAP),"specializations":sorted(scheduler.specializations)}
@app.get("/api/dashboard")
def get_dashboard(completed_limit:int=Query(default=20,ge=0,le=1000)):
    return call(scheduler.get_dashboard,completed_limit)
@app.get("/api/doctors")
def get_doctors():
    return call(scheduler.get_doctors)
@app.post("/api/patients")
def register_patient(patient:PatientIn):
    return call(scheduler.register_patient,patient.name,patient.urgency,patient.required_specialization,patient.age,patient.complaint)
@app.post("/api/patients/{patient_id}/cancel")
def cancel_patient(patient_id:int):
    return call(scheduler.cancel_patient,patient_id)
@app.post("/api/patients/{patient_id}/urgency")
def change_urgency(patient_id:int,body:UrgencyIn):
    return call(scheduler.change_urgency,patient_id,body.urgency)
@app.post("/api/doctors/{doctor_id}/finish")
def finish_treatment(doctor_id:int,body:Optional[FinishIn]=None):
    return call(scheduler.complete_treatment,doctor_id,body.patient_id if body else None)
@app.post("/api/doctors/{doctor_id}/duty")
def set_duty(doctor_id:int,body:DutyIn):
    return call(scheduler.set_doctor_duty,doctor_id,body.on_duty)