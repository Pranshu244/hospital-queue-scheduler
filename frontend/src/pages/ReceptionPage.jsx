import React, { useState, useEffect, useRef } from 'react';
import {
  fetchOptions,
  fetchDashboard,
  fetchDoctors,
  registerPatient,
  updatePatientUrgency,
  cancelPatient,
  formatClockTime,
  formatEstimate,
  getUrgencyConfig,
} from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBanner from '../components/StatusBanner';
import UrgencyBadge from '../components/UrgencyBadge';
import ConfirmModal from '../components/ConfirmModal';
import DoctorsStrip from '../components/DoctorsStrip';
import {
  UserPlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  User,
  HeartPulse,
  Activity,
  Calendar,
} from 'lucide-react';

export default function ReceptionPage() {
  // Options
  const [urgencyOptions, setUrgencyOptions] = useState([]);
  const [specializationOptions, setSpecializationOptions] = useState([]);

  // Dashboard Data
  const [waitingList, setWaitingList] = useState([]);
  const [activeList, setActiveList] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [offDutyDoctors, setOffDutyDoctors] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);

  // Doctors list for Doctors Strip
  const [doctorsList, setDoctorsList] = useState([]);

  // Registration Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [complaint, setComplaint] = useState('');
  const [urgency, setUrgency] = useState('');
  const [requiredSpecialization, setRequiredSpecialization] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result Notification
  const [registrationResult, setRegistrationResult] = useState(null);

  // Network & Error State
  const [errorMessage, setErrorMessage] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Viva Algorithm Change Feedback Tracking
  const [changedPatientIds, setChangedPatientIds] = useState(new Set());
  const prevQueueSnapshot = useRef(new Map());

  // Confirm Modal: Patient Left
  const [patientToCancel, setPatientToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Change Urgency Modal
  const [patientToUpdateUrgency, setPatientToUpdateUrgency] = useState(null);
  const [selectedNewUrgency, setSelectedNewUrgency] = useState('');
  const [isUpdatingUrgency, setIsUpdatingUrgency] = useState(false);

  // 1. Initial Options Loading
  useEffect(() => {
    let isMounted = true;
    fetchOptions()
      .then((data) => {
        if (!isMounted) return;
        const u = data.urgencies || ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const s = data.specializations || ['Cardiology', 'General Medicine', 'Orthopedics'];
        setUrgencyOptions(u);
        setSpecializationOptions(s);
        if (u.length > 0) setUrgency(u[u.length - 1]); // default to LOW / Routine
        if (s.length > 0) setRequiredSpecialization(s[0]);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.isNetworkError) setIsOffline(true);
        else setErrorMessage(err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Data Helper (Dashboard + Doctors)
  const loadDashboardData = async () => {
    try {
      const [dash, docs] = await Promise.all([
        fetchDashboard(20),
        fetchDoctors().catch(() => null),
      ]);

      // Server is online: clear network error
      setIsOffline(false);
      setErrorMessage(null);

      if (dash) {
        const newWaiting = dash.waiting || [];
        setWaitingList(newWaiting);
        setActiveList(dash.active || []);
        setAvailableDoctors(dash.available_doctors || []);
        setOffDutyDoctors(dash.off_duty_doctors || []);
        setCompletedList(dash.completed || []);
        setCompletedCount(dash.completed_count ?? 0);

        // Algorithm change tracking for viva presentation
        const changed = new Set();
        const currentMap = new Map();
        newWaiting.forEach((p) => {
          currentMap.set(p.patient_id, { position: p.position, urgency: p.urgency });
          const prev = prevQueueSnapshot.current.get(p.patient_id);
          if (prev && (prev.position !== p.position || prev.urgency !== p.urgency)) {
            changed.add(p.patient_id);
          }
        });
        prevQueueSnapshot.current = currentMap;

        if (changed.size > 0) {
          setChangedPatientIds(changed);
          setTimeout(() => {
            setChangedPatientIds(new Set());
          }, 2500);
        }
      }

      if (docs && Array.isArray(docs)) {
        setDoctorsList(docs);
      }
    } catch (err) {
      if (err.isNetworkError) {
        setIsOffline(true);
      } else {
        setErrorMessage(err.message);
      }
    }
  };

  // 3. Polling every 3 seconds with cleanup
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  // 4. Form Validation before submission
  const validateForm = () => {
    const errors = {};
    const trimmed = name.trim();
    if (!trimmed) {
      errors.name = 'Patient name is required';
    } else if (trimmed.length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    if (age !== '' && age !== null && age !== undefined) {
      const numAge = Number(age);
      if (isNaN(numAge) || numAge < 0 || numAge > 120 || !Number.isInteger(numAge)) {
        errors.age = 'Age must be an integer between 0 and 120';
      }
    }

    if (complaint && complaint.length > 500) {
      errors.complaint = 'Complaint must be 500 characters or less';
    }

    if (!urgency) {
      errors.urgency = 'Please select a triage urgency';
    }

    if (!requiredSpecialization) {
      errors.requiredSpecialization = 'Please select a specialization';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 5. Patient Registration Submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // double-click duplicate prevention
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setRegistrationResult(null);

    try {
      const patient = await registerPatient({
        name,
        urgency,
        required_specialization: requiredSpecialization,
        age: age !== '' ? age : null,
        complaint,
      });

      // Clear input fields
      setName('');
      setAge('');
      setComplaint('');
      setFormErrors({});

      // Set registration result
      if (patient.status === 'IN_TREATMENT') {
        setRegistrationResult({
          type: 'treatment',
          patientName: patient.name,
          message: `Started treatment immediately with ${patient.doctor_name || 'assigned doctor'}!`,
        });
      } else {
        const posText = patient.position ? `at queue position #${patient.position}` : 'in waiting queue';
        setRegistrationResult({
          type: 'queue',
          patientName: patient.name,
          message: `Registered and placed ${posText}.`,
        });
      }

      // Refresh immediately
      await loadDashboardData();
    } catch (err) {
      if (err.isNetworkError) {
        setIsOffline(true);
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Change Urgency Action
  const handleConfirmUrgencyChange = async () => {
    if (!patientToUpdateUrgency || !selectedNewUrgency || isUpdatingUrgency) return;
    setIsUpdatingUrgency(true);
    setErrorMessage(null);

    try {
      await updatePatientUrgency(patientToUpdateUrgency.patient_id, selectedNewUrgency);
      setPatientToUpdateUrgency(null);
      await loadDashboardData();
    } catch (err) {
      if (err.isNetworkError) setIsOffline(true);
      else setErrorMessage(err.message);
    } finally {
      setIsUpdatingUrgency(false);
    }
  };

  // 7. Patient Left Action
  const handleConfirmPatientLeft = async () => {
    if (!patientToCancel || isCancelling) return;
    setIsCancelling(true);
    setErrorMessage(null);

    try {
      await cancelPatient(patientToCancel.patient_id);
      setPatientToCancel(null);
      await loadDashboardData();
    } catch (err) {
      if (err.isNetworkError) setIsOffline(true);
      else setErrorMessage(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar isOnline={!isOffline} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status / Reconnection Banner */}
        <StatusBanner
          error={errorMessage}
          isOffline={isOffline}
          onDismiss={() => setErrorMessage(null)}
        />

        {/* Reception Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>📋</span> Reception & Triage Desk
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Triage patient registrations, inspect live priority queues, and monitor consultations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Polling 3s
            </span>
            <button
              onClick={loadDashboardData}
              type="button"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
              style={{ minHeight: '36px' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Form (Left) & Queue (Right - Largest Area) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Patient Registration Form (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Patient Registration</h3>
              </div>

              {/* Registration Result Banner */}
              {registrationResult && (
                <div
                  className={`p-3.5 mb-4 rounded-xl border text-sm flex items-start justify-between ${
                    registrationResult.type === 'treatment'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-sky-50 border-sky-300 text-sky-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-base flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{registrationResult.patientName}</span>
                    </div>
                    <p className="text-xs sm:text-sm">{registrationResult.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegistrationResult(null)}
                    className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}

              <form onSubmit={handleRegister} noValidate className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-bold text-slate-800 mb-1">
                    Patient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    placeholder="e.g. Ramesh Patel"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-base outline-none transition-all ${
                      formErrors.name
                        ? 'border-red-500 bg-red-50/50 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                    }`}
                    required
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="reg-age" className="block text-sm font-bold text-slate-800 mb-1">
                    Age <span className="text-xs font-normal text-slate-500">(0 to 120, optional)</span>
                  </label>
                  <input
                    id="reg-age"
                    type="number"
                    min={0}
                    max={120}
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (formErrors.age) setFormErrors({ ...formErrors, age: null });
                    }}
                    placeholder="e.g. 42"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-base outline-none transition-all ${
                      formErrors.age
                        ? 'border-red-500 bg-red-50/50 focus:ring-2 focus:ring-red-200'
                        : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                    }`}
                  />
                  {formErrors.age && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{formErrors.age}</p>
                  )}
                </div>

                {/* Urgency */}
                <div>
                  <label htmlFor="reg-urgency" className="block text-sm font-bold text-slate-800 mb-1">
                    Urgency Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reg-urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-medium"
                  >
                    {urgencyOptions.map((u) => {
                      const cfg = getUrgencyConfig(u);
                      return (
                        <option key={u} value={u}>
                          {cfg.label} ({u}) — {cfg.meaning}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Triage level decided by reception staff.
                  </p>
                </div>

                {/* Required Specialization */}
                <div>
                  <label htmlFor="reg-spec" className="block text-sm font-bold text-slate-800 mb-1">
                    Required Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reg-spec"
                    value={requiredSpecialization}
                    onChange={(e) => setRequiredSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-medium"
                  >
                    {specializationOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Complaint */}
                <div>
                  <label htmlFor="reg-complaint" className="block text-sm font-bold text-slate-800 mb-1">
                    Chief Complaint <span className="text-xs font-normal text-slate-500">(up to 500 chars)</span>
                  </label>
                  <textarea
                    id="reg-complaint"
                    rows={3}
                    maxLength={500}
                    value={complaint}
                    onChange={(e) => {
                      setComplaint(e.target.value);
                      if (formErrors.complaint) setFormErrors({ ...formErrors, complaint: null });
                    }}
                    placeholder="e.g. Mild shortness of breath, joint pain"
                    className={`w-full px-3.5 py-2 rounded-xl border text-base outline-none transition-all resize-none ${
                      formErrors.complaint
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                    }`}
                  />
                  {formErrors.complaint && (
                    <p className="text-xs text-red-600 font-semibold mt-1">{formErrors.complaint}</p>
                  )}
                  <div className="text-right text-xs text-slate-400 mt-0.5">{complaint.length}/500</div>
                </div>

                {/* Submit Button (Disabled while running to prevent duplicate patients) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-base text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 shadow-md transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-sky-200"
                  style={{ minHeight: '48px' }}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>{isSubmitting ? 'Registering Patient...' : 'Register Patient'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Live Waiting Queue (8 cols on lg - Largest Section) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-600" />
                    <span>Live Waiting Queue</span>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      {waitingList.length} Waiting
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Order determined by DAA Min-Heap Priority Algorithm with Starvation Ageing. (Never sorted in frontend)
                  </p>
                </div>
              </div>

              {waitingList.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <span className="text-4xl block">🎉</span>
                  <p className="font-bold text-base text-slate-700">No patients waiting</p>
                  <p className="text-xs text-slate-500">
                    All registered patients are currently in consultation or completed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                        <th className="py-3 px-3 text-center w-14">Pos</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-3">Urgency</th>
                        <th className="py-3 px-3">Specialization</th>
                        <th className="py-3 px-3 text-center">Waited</th>
                        <th className="py-3 px-3">Est. Wait</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {waitingList.map((patient) => {
                        const isChanged = changedPatientIds.has(patient.patient_id);
                        return (
                          <tr
                            key={patient.patient_id}
                            className={`transition-colors hover:bg-slate-50/80 ${
                              isChanged ? 'row-changed' : ''
                            }`}
                          >
                            {/* Position */}
                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-800 text-xs font-extrabold shadow-inner">
                                {patient.position}
                              </span>
                            </td>

                            {/* Name, Age, Complaint */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 text-base">{patient.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                                {patient.age !== null && patient.age !== undefined && (
                                  <span className="font-medium text-slate-700">{patient.age} yrs</span>
                                )}
                                {patient.complaint && (
                                  <span className="truncate max-w-xs italic text-slate-600" title={patient.complaint}>
                                    • "{patient.complaint}"
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Urgency Badge */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <UrgencyBadge urgency={patient.urgency} />
                            </td>

                            {/* Specialization */}
                            <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap text-xs sm:text-sm">
                              {patient.required_specialization}
                            </td>

                            {/* Minutes Waited */}
                            <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-xs">
                              <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                {patient.waited_minutes ?? 0}m
                              </span>
                            </td>

                            {/* Estimated Wait */}
                            <td className="py-3.5 px-3 whitespace-nowrap text-xs">
                              <span
                                className={`font-semibold ${
                                  patient.estimated_wait_minutes === null
                                    ? 'text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200'
                                    : 'text-slate-700'
                                }`}
                              >
                                {formatEstimate(patient.estimated_wait_minutes)}
                              </span>
                            </td>

                            {/* Row Actions */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPatientToUpdateUrgency(patient);
                                    setSelectedNewUrgency(patient.urgency);
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
                                  style={{ minHeight: '36px' }}
                                >
                                  Urgency
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPatientToCancel(patient)}
                                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors shadow-sm"
                                  style={{ minHeight: '36px' }}
                                >
                                  Left
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Doctor Availability Strip */}
        <DoctorsStrip
          doctors={doctorsList}
          activePatients={activeList}
          offDutyDoctors={offDutyDoctors}
        />

        {/* Bottom Section: Currently in Treatment (Read-only) & Recently Completed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Currently In Treatment (Read-only) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-emerald-600" />
                <span>Currently In Treatment</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeList.length} Active
                </span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">Read only</span>
            </div>

            {activeList.length === 0 ? (
              <p className="text-slate-500 italic text-sm py-6 text-center">
                No patients currently receiving treatment
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeList.map((pt) => (
                  <div key={pt.patient_id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{pt.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Assigned to <span className="font-semibold text-slate-800">{pt.doctor_name || `Doctor #${pt.doctor_id}`}</span> • {pt.required_specialization}
                      </p>
                    </div>
                    <div className="text-right">
                      <UrgencyBadge urgency={pt.urgency} />
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        Started: {formatClockTime(pt.start_time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Completed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sky-600" />
                <span>Recently Completed</span>
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                Total Completed: {completedCount}
              </span>
            </div>

            {completedList.length === 0 ? (
              <p className="text-slate-500 italic text-sm py-6 text-center">
                No completed cases yet
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {completedList.slice(0, 20).map((c) => (
                  <div key={c.patient_id} className="py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({c.required_specialization})
                      </span>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-mono">
                      By {c.doctor_name || `Doc #${c.doctor_id}`} • {formatClockTime(c.end_time)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal: Patient Left */}
      <ConfirmModal
        isOpen={Boolean(patientToCancel)}
        title="Confirm Patient Left"
        message={
          patientToCancel
            ? `Are you sure ${patientToCancel.name} has left without treatment? This will remove them from the waiting queue.`
            : ''
        }
        confirmText="Remove Patient"
        isDanger={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmPatientLeft}
        onCancel={() => setPatientToCancel(null)}
      />

      {/* Change Urgency Modal */}
      {patientToUpdateUrgency && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Change Urgency Level</h3>
            <p className="text-sm text-slate-600 mb-4">
              Updating urgency for <strong>{patientToUpdateUrgency.name}</strong> will cause the backend
              priority heap to recalculate queue order.
            </p>

            <div className="mb-6">
              <label htmlFor="modal-urgency" className="block text-sm font-bold text-slate-800 mb-1">
                New Urgency
              </label>
              <select
                id="modal-urgency"
                value={selectedNewUrgency}
                onChange={(e) => setSelectedNewUrgency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-semibold"
              >
                {urgencyOptions.map((u) => {
                  const cfg = getUrgencyConfig(u);
                  return (
                    <option key={u} value={u}>
                      {cfg.label} ({u}) — {cfg.meaning}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPatientToUpdateUrgency(null)}
                disabled={isUpdatingUrgency}
                className="px-5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUrgencyChange}
                disabled={isUpdatingUrgency}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
                style={{ minHeight: '44px' }}
              >
                {isUpdatingUrgency ? 'Saving...' : 'Update Urgency'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
