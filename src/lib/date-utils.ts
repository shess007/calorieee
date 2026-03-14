/** Parse "2026-03-14" into a local Date without timezone issues */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Return ISO date string "2026-03-14" for a Date object (local time) */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Return the 7 Date objects for the week containing `anchor`, starting Monday */
export function getWeekDays(anchor: Date): Date[] {
  const d = new Date(anchor);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

/** Shift a date by N weeks */
export function shiftByWeeks(anchor: Date, weeks: number): Date {
  const d = new Date(anchor);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** Format for the header: "Freitag, 13. März" or "Friday, March 13" */
export function formatDateHeader(date: Date, locale: "de" | "en"): string {
  const loc = locale === "de" ? "de-DE" : "en-US";
  return date.toLocaleDateString(loc, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** Short weekday label: "Mo", "Di", ... or "Mon", "Tue", ... */
export function shortWeekday(date: Date, locale: "de" | "en"): string {
  const loc = locale === "de" ? "de-DE" : "en-US";
  const short = date.toLocaleDateString(loc, { weekday: "short" });
  // German returns "Mo.", "Di." etc — strip the trailing dot
  return short.replace(/\.$/, "");
}

/** Is this date today? */
export function isToday(date: Date): boolean {
  return toDateKey(date) === toDateKey(new Date());
}

/** Is this date in the future? */
export function isFuture(date: Date): boolean {
  return toDateKey(date) > toDateKey(new Date());
}
