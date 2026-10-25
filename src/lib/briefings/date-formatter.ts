/**
 * Utility functions to format raw ISO and server timestamps into human-friendly, readable strings
 */

/**
 * Formats a date/time string into a clear, natural English format
 * Examples:
 * - "2027-04-20T00:00:00+05:30" -> "Tue, Apr 20, 2027 (All day)"
 * - "2026-10-25T14:30:00+05:30" -> "Today at 2:30 PM"
 * - "2026-10-24T18:00:00Z" -> "Yesterday at 11:30 PM"
 * - "Sun, 25 Oct 2026 04:08:00 +0000" -> "Today at 9:38 AM"
 */
export function formatHumanDateTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  try {
    const raw = String(dateInput).trim();
    if (!raw) return "";

    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const isMidnight = /^\d{4}-\d{2}-\d{2}T00:00:00/.test(raw);

    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;

    const now = new Date();
    const isSameDay = d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const isSameYear = d.getFullYear() === now.getFullYear();

    // All-day or midnight calendar event
    if (isDateOnly || isMidnight) {
      if (isSameDay) return "Today (All day)";
      if (isTomorrow) return "Tomorrow (All day)";
      if (isYesterday) return "Yesterday (All day)";

      const formattedDate = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: isSameYear ? undefined : "numeric",
      });
      return `${formattedDate} (All day)`;
    }

    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (isSameDay) {
      return `Today at ${timeStr}`;
    }
    if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: isSameYear ? undefined : "numeric",
    });

    return `${dateStr} at ${timeStr}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats timestamps into a compact tag for item lists
 * Examples:
 * - Today's email: "9:38 AM"
 * - Yesterday: "Yesterday"
 * - Future/Past date: "Apr 20, 2027" or "Oct 24"
 */
export function formatCompactTime(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return "";
  try {
    const raw = String(dateInput).trim();
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const isMidnight = /^\d{4}-\d{2}-\d{2}T00:00:00/.test(raw);

    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;

    const now = new Date();
    const isSameDay = d.toDateString() === now.toDateString();
    const isSameYear = d.getFullYear() === now.getFullYear();

    if (isSameDay && !isDateOnly && !isMidnight) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: isSameYear ? undefined : "numeric",
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Sanitizes snippets to replace ugly raw ISO strings like
 * "Scheduled at 2027-04-20T00:00:00+05:30" with human-readable text like
 * "Scheduled on Tue, Apr 20, 2027 (All day)"
 */
export function formatSnippetText(text: string | undefined | null): string {
  if (!text) return "";

  // Pattern 1: "Scheduled at <ISO_DATE>"
  let result = text.replace(
    /Scheduled at (\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?)/gi,
    (_, dateGroup) => {
      return `Scheduled on ${formatHumanDateTime(dateGroup)}`;
    }
  );

  // Pattern 2: Any lingering bare ISO timestamp strings (YYYY-MM-DDTHH:mm:ss...)
  result = result.replace(
    /\b(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b/g,
    (isoDate) => {
      return formatHumanDateTime(isoDate);
    }
  );

  return result;
}
