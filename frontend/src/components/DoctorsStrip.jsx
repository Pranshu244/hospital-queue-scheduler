import React from 'react';
import { UserCheck, Stethoscope, Clock, ShieldAlert } from 'lucide-react';

/**
 * Doctors availability section showing every doctor with:
 * - Free
 * - Treating – Patient Name
 * - Off Duty (or pending off duty)
 * Fully dynamic: scales gracefully if doctors change or grow.
 */
export default function DoctorsStrip({ doctors = [], activePatients = [], offDutyDoctors = [] }) {
  // Map doctor_id -> current treating patient name
  const treatingMap = {};
  if (Array.isArray(activePatients)) {
    activePatients.forEach((p) => {
      if (p.doctor_id) {
        treatingMap[p.doctor_id] = p.name;
      }
    });
  }

  // Map doctor_id -> isOffDuty
  const offDutyMap = {};
  if (Array.isArray(offDutyDoctors)) {
    offDutyDoctors.forEach((d) => {
      offDutyMap[d.doctor_id] = true;
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-sky-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            Doctor Availability Strip
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
          {doctors.length} Doctors
        </span>
      </div>

      {doctors.length === 0 ? (
        <p className="text-slate-500 italic text-sm py-2">Loading doctor stations...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
          {doctors.map((doc) => {
            const treatingName =
              treatingMap[doc.doctor_id] || (doc.current_patient?.name ?? null);
            const isOffDuty = offDutyMap[doc.doctor_id] || !doc.on_duty;
            const isTreating = Boolean(treatingName);
            const isPendingOffDuty = isOffDuty && isTreating;

            let cardBg = 'bg-slate-50 border-slate-200';
            let badge = null;

            if (isPendingOffDuty) {
              cardBg = 'bg-amber-50/80 border-amber-300';
              badge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-white">
                  <Clock className="w-3 h-3" /> Finishing (Off Duty Pending)
                </span>
              );
            } else if (isOffDuty) {
              cardBg = 'bg-slate-100/70 border-slate-200 opacity-80';
              badge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-500 text-white">
                  <ShieldAlert className="w-3 h-3" /> Off Duty
                </span>
              );
            } else if (isTreating) {
              cardBg = 'bg-sky-50 border-sky-300';
              badge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-sky-600 text-white">
                  <UserCheck className="w-3 h-3" /> Treating – {treatingName}
                </span>
              );
            } else {
              cardBg = 'bg-emerald-50 border-emerald-300';
              badge = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Free
                </span>
              );
            }

            const specs = Array.isArray(doc.specializations)
              ? doc.specializations.join(', ')
              : doc.specializations || 'General';

            return (
              <div
                key={doc.doctor_id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all shadow-sm ${cardBg}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                    <span className="text-xs font-mono text-slate-500">#{doc.doctor_id}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2.5 line-clamp-1" title={specs}>
                    {specs}
                  </p>
                </div>
                <div>{badge}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
