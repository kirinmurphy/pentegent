/**
 * Formats an ISO date string to human-readable format.
 * - Shows month abbreviation, day, and time (HH:MM)
 * - Only includes year if different from current year
 *
 * Examples:
 * - Current year: "Feb 12 13:49"
 * - Different year: "Dec 31, 2025 23:59"
 *
 * @param isoDateString - ISO 8601 date string or SQL datetime format
 * @returns Human-readable date string
 */
export function formatHumanDate(isoDateString: string): string {
  // Handle SQL datetime format (YYYY-MM-DD HH:MM:SS) by converting to ISO
  let dateStr = isoDateString;
  if (dateStr.includes(" ") && !dateStr.includes("T")) {
    dateStr = dateStr.replace(" ", "T") + "Z";
  }

  const date = new Date(dateStr);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const dateYear = date.getUTCFullYear();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthNames[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const time = `${hours}:${minutes}`;

  if (dateYear === currentYear) {
    return `${month} ${day} ${time}`;
  } else {
    return `${month} ${day}, ${dateYear} ${time}`;
  }
}
