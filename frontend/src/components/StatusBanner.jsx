import React from 'react';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

/**
 * Status banner handling:
 * - Network failure: "Cannot reach the server, retrying"
 * - HTTP 400: readable message
 * - HTTP 422: "Please check the form"
 */
export default function StatusBanner({ error, isOffline, onDismiss }) {
  if (!error && !isOffline) return null;

  const isNetwork = isOffline || (error && error.includes('Cannot reach the server'));

  return (
    <div
      role="alert"
      className={`w-full p-4 mb-5 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
        isNetwork
          ? 'bg-red-600 border-red-700 text-white animate-pulse'
          : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-3">
        {isNetwork ? (
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-white" />
        ) : (
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-base font-bold">
            {isNetwork ? 'Cannot reach the server, retrying' : error}
          </p>
          {isNetwork && (
            <p className="text-xs text-red-100 mt-0.5">
              Keeping last known queue data on screen. Will automatically reconnect when server recovers.
            </p>
          )}
        </div>
      </div>

      {onDismiss && !isNetwork && (
        <button
          onClick={onDismiss}
          type="button"
          className="ml-3 p-1.5 rounded-lg text-amber-800 hover:bg-amber-200 transition-colors"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
