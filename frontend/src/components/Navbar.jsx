import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, ClipboardList, Stethoscope, Activity } from 'lucide-react';

export default function Navbar({ isOnline = true }) {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-tight text-white flex items-center gap-2">
              Hospital Queue Scheduler
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                DAA Project
              </span>
            </h1>
            <p className="text-xs text-slate-400">OPD & Urgent-Care Scheduling System</p>
          </div>
        </div>

        {/* Navigation & Connection Pill */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{isOnline ? 'Live 3s Poll' : 'Offline'}</span>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </NavLink>

            <NavLink
              to="/reception"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <ClipboardList className="w-4 h-4" />
              <span>Reception</span>
            </NavLink>

            <NavLink
              to="/doctor"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
