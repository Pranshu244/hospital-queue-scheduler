import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Activity } from 'lucide-react';

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
            </h1>
            <p className="text-xs text-slate-400">OPD & Urgent-Care Scheduling System</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
