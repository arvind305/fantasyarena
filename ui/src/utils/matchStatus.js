/**
 * matchStatus.js — Shared DB status → UI status mapping.
 *
 * Single source of truth for the status flow:
 *   DRAFT → UPCOMING, OPEN → UPCOMING, LOCKED → LIVE, SCORED → COMPLETED
 */

export function mapDbStatusToUiStatus(dbStatus) {
  if (!dbStatus || dbStatus === 'DRAFT' || dbStatus === 'OPEN') return 'UPCOMING';
  if (dbStatus === 'LOCKED') return 'LIVE';
  if (dbStatus === 'SCORED') return 'COMPLETED';
  return dbStatus; // LIVE, COMPLETED, ABANDONED, NO_RESULT pass through
}
