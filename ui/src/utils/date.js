/**
 * Date formatting utilities using Intl.DateTimeFormat
 * No external libraries needed
 */

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
