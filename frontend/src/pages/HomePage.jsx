import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Stethoscope, ArrowRight, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Header */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 mb-4">
          <Cpu className="w-3.5 h-3.5" />
          <span>DAA Course Project • Priority Queue & Matching Algorithms</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Hospital OPD Queue Scheduler
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An intelligent outpatient and urgent-care queue management system powered by dynamic priority
          aging (starvation prevention) and bipartite doctor-specialization matching.
        </p>
      </div>

      {/* Two Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Reception Station Card */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl hover:border-sky-300 transition-all">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner">
                <ClipboardList className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Reception Desk</h3>
                <p className="text-sm text-slate-500 font-medium">Triage, Intake & Live Queue</p>
              </div>
            </div>
            <p className="text-slate-600 text-base mb-6 leading-relaxed">
              Register arriving patients, assign triage urgency levels, oversee live queue positions, adjust
              priority, and record departures.
            </p>
            <div className="space-y-2.5 mb-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Priority Queue with Age Starvation Prevention</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Live Doctor Availability Strip</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Dynamic Wait Time Estimates</span>
              </div>
            </div>
          </div>

          <Link
            to="/reception"
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-sky-200"
            style={{ minHeight: '52px' }}
          >
            <span>Open Reception Station</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Doctor Station Card */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-200 p-8 flex flex-col justify-between hover:shadow-xl hover:border-teal-300 transition-all">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center shadow-inner">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Doctor Station</h3>
                <p className="text-sm text-slate-500 font-medium">Consultation & Duty Controls</p>
              </div>
            </div>
            <p className="text-slate-600 text-base mb-6 leading-relaxed">
              Station screen for physicians on mobile phone or PC. View currently assigned patient, finish
              treatments, toggle duty, and inspect specialization queue.
            </p>
            <div className="space-y-2.5 mb-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Large "Finish Treatment" Action</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Graceful Off-Duty Handover</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Single-Column Phone Optimized</span>
              </div>
            </div>
          </div>

          <Link
            to="/doctor"
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-center shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-teal-200"
            style={{ minHeight: '52px' }}
          >
            <span>Open Doctor Station</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Dual Window Mentor Viva Instructions */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-6 h-6 text-sky-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-white text-base mb-1">
              Dual-Screen Mentor Demonstration Guide
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Open <strong>Reception</strong> in one browser tab and <strong>Doctor</strong> in a side-by-side tab.
              When a patient is registered or a treatment is finished, the backend algorithms match patients in real
              time and synchronize both dashboards within 3 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
