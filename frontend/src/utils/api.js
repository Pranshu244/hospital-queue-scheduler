/**
 * Centralized API Integration Service
 * Manages all 8 endpoints for the Hospital Queue Scheduler:
 * 1. GET /api/options
 * 2. GET /api/dashboard
 * 3. GET /api/doctors
 * 4. POST /api/patients
 * 5. POST /api/patients/{id}/urgency
 * 6. POST /api/patients/{id}/cancel
 * 7. POST /api/doctors/{id}/finish
 * 8. POST /api/doctors/{id}/duty
 *
 * Rules:
 * - Always relative paths (/api/...)
 * - Never hardcode http://localhost:8000
 * - Never sort queues or assign doctors in frontend
 * - Format wait estimates: "About 20 min" or "No doctor on duty"
 * - Map urgencies: CRITICAL -> Immediate, HIGH -> Urgent, MEDIUM -> Semi-urgent, LOW -> Routine
 * - STRICT RULE: Never use words "emergency" or "life-threatening"
 */

export const API_BASE = '/api';

/**
 * Common fetch helper handling HTTP 400, 422, and Network Failures
 */
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      if (res.status === 400 && data && data.detail) {
        // Backend readable error message
        const err = new Error(data.detail);
        err.status = 400;
        throw err;
      } else if (res.status === 422 && data && data.detail) {
        // Pydantic validation error list
        const msg = Array.isArray(data.detail)
          ? data.detail.map((d) => `${d.loc ? d.loc.slice(-1)[0] : 'field'}: ${d.msg}`).join(', ')
          : 'Please check the form';
        const err = new Error(msg);
        err.status = 422;
        err.isValidationError = true;
        err.validationDetails = data.detail;
        throw err;
      } else {
        const err = new Error((data && data.detail) || `Server error (${res.status})`);
        err.status = res.status;
        throw err;
      }
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network / server connection failure
    const netErr = new Error('Cannot reach the server, retrying');
    netErr.isNetworkError = true;
    throw netErr;
  }
}

// 1. GET /api/options
export async function fetchOptions() {
  return await request(`${API_BASE}/options`);
}

// 2. GET /api/dashboard?completed_limit=20
export async function fetchDashboard(completedLimit = 20) {
  return await request(`${API_BASE}/dashboard?completed_limit=${completedLimit}`);
}

// 3. GET /api/doctors
export async function fetchDoctors() {
  return await request(`${API_BASE}/doctors`);
}

// 4. POST /api/patients
export async function registerPatient({ name, urgency, required_specialization, age, complaint }) {
  const payload = {
    name: name.trim(),
    urgency,
    required_specialization,
    complaint: complaint ? complaint.trim() : '',
  };
  if (age !== undefined && age !== null && age !== '') {
    payload.age = parseInt(age, 10);
  }
  return await request(`${API_BASE}/patients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 5. POST /api/patients/{id}/urgency
export async function updatePatientUrgency(patientId, urgency) {
  return await request(`${API_BASE}/patients/${patientId}/urgency`, {
    method: 'POST',
    body: JSON.stringify({ urgency }),
  });
}

// 6. POST /api/patients/{id}/cancel
export async function cancelPatient(patientId) {
  return await request(`${API_BASE}/patients/${patientId}/cancel`, {
    method: 'POST',
  });
}

// 7. POST /api/doctors/{id}/finish
export async function finishTreatment(doctorId, patientId) {
  const body = patientId ? { patient_id: patientId } : {};
  return await request(`${API_BASE}/doctors/${doctorId}/finish`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// 8. POST /api/doctors/{id}/duty
export async function setDoctorDuty(doctorId, onDuty) {
  return await request(`${API_BASE}/doctors/${doctorId}/duty`, {
    method: 'POST',
    body: JSON.stringify({ on_duty: Boolean(onDuty) }),
  });
}

// ================= Formatting & Helper Functions =================

/**
 * Format ISO 8601 server timestamp (no timezone, server local time) to clock time
 */
export function formatClockTime(isoString) {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Format wait estimate as specified:
 * "About 20 min"
 * If estimate is null: "No doctor on duty"
 */
export function formatEstimate(minutes) {
  if (minutes === null || minutes === undefined) {
    return 'No doctor on duty';
  }
  return `About ${minutes} min`;
}

/**
 * Urgency display mapping:
 * CRITICAL -> Immediate (Red)
 * HIGH -> Urgent (Orange)
 * MEDIUM -> Semi-urgent (Amber)
 * LOW -> Routine (Green or Blue)
 * NO words "emergency" or "life-threatening"
 */
export const URGENCY_MAP = {
  CRITICAL: {
    label: 'Immediate',
    meaning: "Needs the doctor's attention right now",
    badgeClass: 'bg-red-600 text-white border-red-700',
    dotClass: 'bg-white',
    pillClass: 'bg-red-50 text-red-700 border-red-200',
  },
  HIGH: {
    label: 'Urgent',
    meaning: 'To be seen today, ahead of routine cases',
    badgeClass: 'bg-orange-500 text-white border-orange-600',
    dotClass: 'bg-white',
    pillClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  MEDIUM: {
    label: 'Semi-urgent',
    meaning: 'Can wait a short while',
    badgeClass: 'bg-amber-500 text-slate-900 border-amber-600',
    dotClass: 'bg-slate-900',
    pillClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  LOW: {
    label: 'Routine',
    meaning: 'Planned or non-urgent: check-ups, follow-ups, refills',
    badgeClass: 'bg-teal-600 text-white border-teal-700',
    dotClass: 'bg-white',
    pillClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export function getUrgencyConfig(urgency) {
  const key = (urgency || '').toUpperCase();
  return URGENCY_MAP[key] || URGENCY_MAP.LOW;
}
