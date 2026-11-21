def maximum_matching(patients, doctors):
    available_doctors={}
    doctor_to_patient={}
    patient_to_doctor={}
    for doctor in doctors:
        if doctor["available"]:
            available_doctors[doctor["doctor_id"]]=doctor
    graph={}
    for patient in patients:
        patient_id=patient["patient_id"]
        required=patient["required_specialization"]
        graph[patient_id]=[]
        for doctor_id,doctor in available_doctors.items():
            if required in doctor["specializations"]:
                graph[patient_id].append(doctor_id)
    def assign_patient(patient_id,visited):
        for doctor_id in graph[patient_id]:
            if doctor_id in visited:
                continue
            visited.add(doctor_id)
            if doctor_id not in doctor_to_patient or assign_patient(doctor_to_patient[doctor_id],visited):
                doctor_to_patient[doctor_id]=patient_id
                return True
        return False
    for patient in patients:
        patient_id=patient["patient_id"]
        assign_patient(patient_id,set())
    for doctor_id,patient_id in doctor_to_patient.items():
        patient_to_doctor[patient_id]=doctor_id
    assignments=[]
    unassigned_patients=[]
    for patient in patients:
        patient_id=patient["patient_id"]
        if patient_id in patient_to_doctor:
            doctor_id=patient_to_doctor[patient_id]
            doctor=available_doctors[doctor_id]
            assignments.append({
                "patient_id": patient_id,
                "patient_name": patient["name"],
                "doctor_id": doctor_id,
                "doctor_name": doctor["name"],
                "specialization": patient["required_specialization"]
            })
        else:
            unassigned_patients.append(patient)
    return {
        "assignments": assignments,
        "unassigned_patients": unassigned_patients
    }