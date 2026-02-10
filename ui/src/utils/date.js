/**
 * Date formatting utilities using Intl.DateTimeFormat
 * No external libraries needed
 */

// IST is UTC+5:30 = 330 minutes
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert a UTC ISO string (from DB) to a datetime-local input value in IST.
 * e.g., "2026-06-15T05:30:00Z" → "2026-06-15T11:00:00"
 */
export function utcToIST(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  return istDate.toISOString().replace("Z", "").split(".")[0];
}

/**
 * Convert a datetime-local input value (assumed IST) to a UTC ISO string for DB.
 * e.g., "2026-06-15T11:00" → "2026-06-15T05:30:00.000Z"
 */
export function istToUTC(localString) {
  if (!localString) return null;
  // datetime-local gives us "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
  // Treat this as IST, so subtract 5:30 to get UTC
  const asUTC = new Date(localString + "Z"); // parse as UTC first
  const utcDate = new Date(asUTC.getTime() - IST_OFFSET_MS);
  return utcDate.toISOString();
}

/**
 * Format a date in IST for display.
 * e.g., "Sat, 15 Jun, 11:00 AM IST"
 */
export function formatDateIST(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " IST";
}

/**
 * Format a tournament date range in human-readable format
 * e.g., "7 Feb – 8 Mar 2026"
 */
export function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  });

  const endFormatter = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startFormatter.format(start)} – ${endFormatter.format(end)}`;
}

/**
 * Format a single date in human-readable format
 * e.g., "Sat, 7 Feb"
 */
export function formatMatchDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Format time in user's locale
 * e.g., "11:00 AM" or "11:00"
 */
export function formatMatchTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format date and time together
 * e.g., "Sat, 7 Feb at 11:00 AM"
 */
export function formatMatchDateTime(dateString) {
  return `${formatMatchDate(dateString)} at ${formatMatchTime(dateString)}`;
}

/**
 * Check if a date is today in user's local timezone
 */
export function isToday(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

/**
 * Check if a date is tomorrow in user's local timezone
 */
export function isTomorrow(dateString) {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

/**
 * Get relative day label: "Today", "Tomorrow", or formatted date
 */
export function getRelativeDayLabel(dateString) {
  if (isToday(dateString)) return "Today";
  if (isTomorrow(dateString)) return "Tomorrow";
  return formatMatchDate(dateString);
}
