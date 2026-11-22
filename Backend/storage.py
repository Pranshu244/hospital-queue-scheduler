import json
import sqlite3

SCHEMA="""
CREATE TABLE IF NOT EXISTS doctors(
    doctor_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    specializations TEXT NOT NULL,
    on_duty INTEGER NOT NULL,
    available INTEGER NOT NULL,
    current_patient INTEGER
);
CREATE TABLE IF NOT EXISTS patients(
    patient_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    complaint TEXT NOT NULL,
    urgency TEXT NOT NULL,
    required_specialization TEXT NOT NULL,
    status TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    doctor_id INTEGER,
    doctor_name TEXT,
    start_time TEXT,
    end_time TEXT
);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
"""

PATIENT_FIELDS=["patient_id","name","age","complaint","urgency","required_specialization","status","arrival_time","doctor_id","doctor_name","start_time","end_time"]

class SqliteStore:
    def __init__(self,path="hospital.db"):
        self.conn=sqlite3.connect(path,check_same_thread=False)
        self.conn.row_factory=sqlite3.Row
        self.conn.executescript(SCHEMA)
    def seed_doctors(self,doctors):
        with self.conn:
            for d in doctors:
                self.conn.execute("INSERT OR IGNORE INTO doctors VALUES(?,?,?,?,?,?)",(d["doctor_id"],d["name"],json.dumps(d["specializations"]),int(d["on_duty"]),int(d["available"]),d["current_patient"]))
                self.conn.execute("UPDATE doctors SET name=?,specializations=? WHERE doctor_id=?",(d["name"],json.dumps(d["specializations"]),d["doctor_id"]))
    def load_doctors(self):
        rows=self.conn.execute("SELECT * FROM doctors ORDER BY doctor_id").fetchall()
        return [{"doctor_id":r["doctor_id"],"name":r["name"],"specializations":json.loads(r["specializations"]),"on_duty":bool(r["on_duty"]),"available":bool(r["available"]),"current_patient":r["current_patient"]} for r in rows]
    def load_patients(self):
        rows=self.conn.execute("SELECT * FROM patients ORDER BY patient_id").fetchall()
        return [{f:r[f] for f in PATIENT_FIELDS} for r in rows]
    def save(self,patients,doctors):
        with self.conn:
            for p in patients:
                self.conn.execute("INSERT OR REPLACE INTO patients VALUES(%s)"%",".join("?"*len(PATIENT_FIELDS)),[p[f] for f in PATIENT_FIELDS])
            for d in doctors:
                self.conn.execute("UPDATE doctors SET on_duty=?,available=?,current_patient=? WHERE doctor_id=?",(int(d["on_duty"]),int(d["available"]),d["current_patient"],d["doctor_id"]))
    def close(self):
        self.conn.close()