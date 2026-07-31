import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * @deprecated Refactored into modular subpages under /individual:
 * - /individual (IndividualOverview.tsx)
 * - /individual/creator (IndividualCreator.tsx)
 * - /individual/voice (IndividualVoice.tsx)
 * - /individual/linkedin (IndividualLinkedIn.tsx)
 */
export function IndividualDashboard() {
  return <Navigate to="/individual" replace />;
}
