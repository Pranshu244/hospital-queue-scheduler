import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Confirmation modal for destructive actions:
 * - Patient left (POST /api/patients/{id}/cancel)
 * - Off duty (POST /api/doctors/{id}/duty)
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDanger ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-600'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h3>
        </div>

        <p className="text-slate-600 text-sm sm:text-base mb-6 leading-relaxed pl-13">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 transition-colors"
            style={{ minHeight: '44px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-200'
                : 'bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:ring-sky-200'
            }`}
            style={{ minHeight: '44px' }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
