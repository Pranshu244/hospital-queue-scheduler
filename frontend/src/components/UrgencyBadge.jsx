import React from 'react';
import { getUrgencyConfig } from '../utils/api';

/**
 * Urgency badge with friendly label and accessible color.
 * Always displays both text and color.
 * Never uses "emergency" or "life-threatening".
 */
export default function UrgencyBadge({ urgency, size = 'normal' }) {
  const config = getUrgencyConfig(urgency);

  const sizeClasses =
    size === 'large'
      ? 'px-3 py-1.5 text-sm font-bold tracking-wide'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.badgeClass} ${sizeClasses}`}
      title={`${config.label}: ${config.meaning}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
