/**
 * Format a date string to DD/MM/YYYY in Indian Standard Time (IST)
 */
export function formatDateIST(dateInput: string | Date): string {
  const date = new Date(dateInput);
  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format a date string to DD/MM/YYYY, HH:MM AM/PM in IST
 */
export function formatDateTimeIST(dateInput: string | Date): string {
  const date = new Date(dateInput);

  const datePart = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
}

/**
 * Strip HTML tags and return plain text (for excerpts)
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  
  // First, strip out the "Remove" buttons (both old and new formats) to prevent "Remove" from appearing in excerpts
  const cleanHtml = html.replace(/<button[^>]*>Remove<\/button>/gi, "");
  
  // Then strip all remaining HTML tags
  return cleanHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
