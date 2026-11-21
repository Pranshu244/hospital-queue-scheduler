import React, { useState, useEffect, useRef } from 'react';
import {
  fetchDoctors,
  fetchDashboard,
  finishTreatment,
  setDoctorDuty,
  formatClockTime,
  formatEstimate,
  getUrgencyConfig,
} from '../utils/api';
import Navbar from '../components/Navbar';
import StatusBanner from '../components/StatusBanner';
import UrgencyBadge from '../components/UrgencyBadge';
import ConfirmModal from '../components/ConfirmModal';
import {
  Stethoscope,
  CheckCircle,
  Clock,
  User,
  Power,
  ClipboardList,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'hospital_scheduler_selected_doctor_id';

export default function DoctorPage() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  // Current selected doctor object
  const [currentDoctor, setCurrentDoctor] = useState(null);

  // Global waiting list from /api/dashboard for filtering "Waiting List for This Doctor"
  const [allWaiting, setAllWaiting] = useState([]);

  // Treatment Duration timer string
  const [durationString, setDurationString] = useState('');

  // Status & Error
  const [errorMessage, setErrorMessage] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Action Loading States
  const [isFinishing, setIsFinishing] = useState(false);
  const [isUpdatingDuty, setIsUpdatingDuty] = useState(false);

  // Duty Confirm Modal
  const [showDutyModal, setShowDutyModal] = useState(false);

  // 1. Fetch Doctor & Dashboard Data
  const loadDoctorData = async () => {
    try {
      const [docsData, dashData] = await Promise.all([
        fetchDoctors(),
        fetchDashboard(20).catch(() => null),
      ]);

      setIsOffline(false);
      setErrorMessage(null);

      if (Array.isArray(docsData)) {
        setDoctors(docsData);

        // Auto-select first doctor if none selected or if selected ID is invalid
        let targetId = selectedDoctorId;
        if (!targetId || !docsData.some((d) => d.doctor_id === targetId)) {
          if (docsData.length > 0) {
            targetId = docsData[0].doctor_id;
            setSelectedDoctorId(targetId);
            try {
              localStorage.setItem(STORAGE_KEY, String(targetId));
            } catch {}
          }
        }

        const foundDoc = docsData.find((d) => d.doctor_id === targetId);
        setCurrentDoctor(foundDoc || null);
      }

      if (dashData && dashData.waiting) {
        setAllWaiting(dashData.waiting);
      }
    } catch (err) {
      if (err.isNetworkError) {
        setIsOffline(true);
      } else {
        setErrorMessage(err.message);
      }
    }
  };

  // 2. Poll every 3 seconds with cleanup
  useEffect(() => {
    loadDoctorData();
    const interval = setInterval(loadDoctorData, 3000);
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  // 3. Treatment Duration Live Timer
  useEffect(() => {
    const updateTimer = () => {
      const pt = currentDoctor?.current_patient;
      if (!pt || !pt.start_time) {
        setDurationString('');
        return;
      }
      try {
        const start = new Date(pt.start_time).getTime();
        const now = Date.now();
        const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
        const mins = Math.floor(diffSeconds / 60);
        const secs = diffSeconds % 60;
        setDurationString(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      } catch {
        setDurationString('');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentDoctor?.current_patient]);

  // 4. Handle Doctor Selector Dropdown
  const handleDoctorChange = (e) => {
    const newId = parseInt(e.target.value, 10);
    setSelectedDoctorId(newId);
    try {
      localStorage.setItem(STORAGE_KEY, String(newId));
    } catch {}
    const doc = doctors.find((d) => d.doctor_id === newId);
    setCurrentDoctor(doc || null);
  };

  // 5. Handle Finish Treatment
  const handleFinish = async () => {
    if (!currentDoctor || !currentDoctor.current_patient || isFinishing) return;
    const patientId = currentDoctor.current_patient.patient_id;

    setIsFinishing(true);
    setErrorMessage(null);

    try {
      await finishTreatment(currentDoctor.doctor_id, patientId);
      // Backend automatically assigns next patient, immediately refresh
      await loadDoctorData();
    } catch (err) {
      // RULE: If server answers that the doctor is no longer treating that patient,
      // refresh quietly instead of showing an alarming error!
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('no longer treating') || msg.includes('not treating')) {
        await loadDoctorData();
      } else if (err.isNetworkError) {
        setIsOffline(true);
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setIsFinishing(false);
    }
  };

  // 6. Handle Duty Toggle
  const handleDutyToggleRequest = (targetOnDuty) => {
    if (!targetOnDuty) {
      // Switching off duty requires confirmation
      setShowDutyModal(true);
    } else {
      executeDutyChange(true);
    }
  };

  const executeDutyChange = async (targetOnDuty) => {
    if (!currentDoctor || isUpdatingDuty) return;
    setIsUpdatingDuty(true);
    setErrorMessage(null);

    try {
      await setDoctorDuty(currentDoctor.doctor_id, targetOnDuty);
      setShowDutyModal(false);
      await loadDoctorData();
    } catch (err) {
      if (err.isNetworkError) setIsOffline(true);
      else setErrorMessage(err.message);
    } finally {
      setIsUpdatingDuty(false);
    }
  };

  // Filter "Waiting List for This Doctor"
  const doctorSpecs = currentDoctor?.specializations || [];
  const waitingForThisDoctor = allWaiting.filter((pt) =>
    doctorSpecs.includes(pt.required_specialization)
  );

  const currentPatient = currentDoctor?.current_patient;
  const isOnDuty = Boolean(currentDoctor?.on_duty);
  const isTreating = Boolean(currentPatient);
  const isPendingOffDuty = !isOnDuty && isTreating;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar isOnline={!isOffline} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Status / Reconnection Banner */}
        <StatusBanner
          error={errorMessage}
          isOffline={isOffline}
          onDismiss={() => setErrorMessage(null)}
        />

        {/* Doctor Selection & Duty Station Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Doctor Station
              </h2>
            </div>
          </div>

          {/* Doctor Selection Dropdown */}
          <div>
            <label htmlFor="doctor-picker" className="block text-sm font-bold text-slate-800 mb-1">
              Select Doctor Profile
            </label>
            <select
              id="doctor-picker"
              value={selectedDoctorId || ''}
              onChange={handleDoctorChange}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-base font-bold bg-white shadow-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              style={{ minHeight: '48px' }}
            >
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.name} ({Array.isArray(doc.specializations) ? doc.specializations.join(', ') : doc.specializations})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Selection remembered in this browser.
            </p>
          </div>

          {/* Duty Switch */}
          {currentDoctor && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span className="text-sm font-bold text-slate-800">
                  {isOnDuty ? 'Currently On Duty' : 'Currently Off Duty'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDutyToggleRequest(!isOnDuty)}
                disabled={isUpdatingDuty}
                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                  isOnDuty
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                style={{ minHeight: '44px' }}
              >
                <Power className="w-4 h-4" />
                <span>
                  {isUpdatingDuty
                    ? 'Updating...'
                    : isOnDuty
                    ? 'Switch Off Duty'
                    : 'Go On Duty'}
                </span>
              </button>
            </div>
          )}

          {/* Pending Off Duty Notice */}
          {isPendingOffDuty && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-pulse">
              <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>
                Finishing current patient before going off duty. No new patients will be assigned.
              </span>
            </div>
          )}
        </div>

        {/* Current Patient Card (Main Action at Top) */}
        <div className="bg-white rounded-3xl shadow-md border-2 border-slate-300 overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-400" />
              <span>Current Patient Card</span>
            </span>
            {durationString && (
              <span className="text-xs font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-md text-emerald-400 border border-slate-700">
                ⏱ {durationString}
              </span>
            )}
          </div>

          <div className="p-6">
            {currentPatient ? (
              <div className="space-y-5">
                {/* Patient Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                      {currentPatient.name}
                    </h3>
                    <p className="text-sm text-slate-500 font-semibold mt-1">
                      {currentPatient.age !== null && currentPatient.age !== undefined
                        ? `${currentPatient.age} years old • `
                        : ''}
                      Specialization: {currentPatient.required_specialization}
                    </p>
                  </div>
                  <UrgencyBadge urgency={currentPatient.urgency} size="large" />
                </div>

                {/* Complaint */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Chief Complaint
                  </span>
                  <p className="text-base text-slate-800 font-medium leading-relaxed">
                    {currentPatient.complaint || 'No complaint specified.'}
                  </p>
                </div>

                {/* Timing Details */}
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">
                      Arrival Time
                    </span>
                    <span className="font-mono text-slate-700 text-sm font-semibold">
                      {formatClockTime(currentPatient.arrival_time)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">
                      Treatment Started
                    </span>
                    <span className="font-mono text-slate-700 text-sm font-semibold">
                      {formatClockTime(currentPatient.start_time)}
                    </span>
                  </div>
                </div>

                {/* Finish Treatment Button (Large, prominent >= 44px) */}
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isFinishing}
                  className="w-full py-5 px-6 rounded-2xl font-black text-xl text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 shadow-xl transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-teal-200"
                  style={{ minHeight: '60px' }}
                >
                  <CheckCircle className="w-6 h-6" />
                  <span>{isFinishing ? 'Finishing Treatment...' : 'Finish Treatment'}</span>
                </button>
                <p className="text-center text-xs text-slate-500">
                  Frees this station. The backend scheduler immediately assigns the next eligible patient.
                </p>
              </div>
            ) : (
              /* Empty State */
              <div className="py-12 px-4 text-center space-y-3">
                <span className="text-5xl block">
                  {isOnDuty ? '☕' : '🚪'}
                </span>
                <h3 className="text-xl font-bold text-slate-800">
                  {isOnDuty ? 'No patient assigned. You are free.' : 'You are currently off duty.'}
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {isOnDuty
                    ? 'The automated backend algorithm will assign the next waiting patient matching your specialization as soon as they arrive.'
                    : 'Switch back on duty when you are ready to receive patients.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Waiting List For This Doctor (Informational Only) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-sky-600" />
                <span>Waiting List for This Doctor</span>
              </h3>
              <p className="text-xs text-slate-500">
                Matching specializations: ({doctorSpecs.join(', ')})
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
              {waitingForThisDoctor.length} Queued
            </span>
          </div>

          <p className="text-xs text-slate-400 italic">
            Informational only — patient assignment is automatic by the scheduling algorithm.
          </p>

          {waitingForThisDoctor.length === 0 ? (
            <p className="text-slate-500 italic text-sm py-4 text-center">
              No waiting patients for your specializations.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {waitingForThisDoctor.map((pt) => (
                <div key={pt.patient_id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                      {pt.position}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{pt.name}</h4>
                      <p className="text-xs text-slate-500">
                        {pt.age ? `${pt.age} yrs • ` : ''}{pt.required_specialization}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <UrgencyBadge urgency={pt.urgency} />
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      {formatEstimate(pt.estimated_wait_minutes)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Switching Off Duty */}
      <ConfirmModal
        isOpen={showDutyModal}
        title="Confirm Switching Off Duty"
        message={
          isTreating
            ? `You are currently treating ${currentPatient.name}. If you switch off duty now, you will finish this consultation first and no new patients will be assigned.`
            : 'Are you sure you want to switch off duty? You will not receive any patients until you turn duty back on.'
        }
        confirmText="Confirm Off Duty"
        isDanger={true}
        isLoading={isUpdatingDuty}
        onConfirm={() => executeDutyChange(false)}
        onCancel={() => setShowDutyModal(false)}
      />
    </div>
  );
}
