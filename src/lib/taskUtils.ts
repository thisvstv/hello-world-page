import type { DayColumn } from "@/types";

/**
 * Timezone-safe date normaliser.
 * Returns a YYYY-MM-DD string using the *local* timezone parts,
 * so "2025-06-15T00:00:00.000Z" in UTC-5 still shows "2025-06-14".
 */
export function toLocalDateStr(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// ── Saturday-to-Friday week helpers ──────────────────

/**
 * Returns the Saturday that starts the week containing `d`.
 * Our weeks run Saturday (day 6) → Friday (day 5).
 */
export function getSaturdayOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun … 6=Sat
  // If today is Saturday (6) offset=0, Sun(0)=-1, Mon(1)=-2 … Fri(5)=-6
  const offset = day === 6 ? 0 : -(day + 1);
  const sat = new Date(d);
  sat.setDate(d.getDate() + offset);
  // Use LOCAL NOON (12:00) instead of midnight.
  // Midnight local time in UTC+ timezones converts to the *previous* UTC day
  // when .toISOString() is called, causing reorder/createTask payloads to
  // land on the wrong column in the backend.  Noon is safely within the same
  // calendar day for every timezone on earth (±11 h).
  sat.setHours(12, 0, 0, 0);
  return sat;
}

/**
 * Build an empty 7-day DayColumn[] for the week that is
 * `weekOffset` weeks away from the current week.
 * weekOffset=0 → this week, -1 → last week, +1 → next week.
 */
export function buildWeekForOffset(weekOffset: number): DayColumn[] {
  const saturday = getSaturdayOfWeek(new Date());
  saturday.setDate(saturday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(saturday);
    date.setDate(saturday.getDate() + i);
    return { date, tasks: [] };
  });
}

/**
 * Human-readable week label.
 * e.g. "Feb 22 – Feb 28, 2026"
 */
export function weekLabel(weekOffset: number): string {
  const saturday = getSaturdayOfWeek(new Date());
  saturday.setDate(saturday.getDate() + weekOffset * 7);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const yearStr = friday.getFullYear();
  return `${fmt(saturday)} – ${fmt(friday)}, ${yearStr}`;
}

/**
 * Returns the ISO-8601 week number and week-year for `date`.
 *
 * Algorithm (ISO-8601 §1.2):
 *   – Weeks start on Monday.
 *   – Week 1 is the week containing the year's first Thursday
 *     (equivalently: the week that contains January 4th).
 *   – A year therefore has either 52 or 53 ISO weeks.
 *
 * The returned `year` is the *ISO week-year*, which may differ from
 * `date.getFullYear()` for dates in the last few days of December or
 * the first few days of January.
 *
 * All arithmetic is done in UTC to eliminate local-timezone drift.
 */
export function getISOWeek(date: Date): { week: number; year: number } {
  // Build a UTC-midnight copy so month/day arithmetic is timezone-safe.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO weekday: Mon = 1 … Sun = 7  (JS getUTCDay: Sun = 0)
  const isoDay = d.getUTCDay() || 7;
  // Shift `d` to the Thursday of the same ISO week — the "pivot" day
  // that determines which year and which week number this date belongs to.
  d.setUTCDate(d.getUTCDate() + (4 - isoDay));
  const year = d.getUTCFullYear();
  // Distance in days from Jan 1 of the ISO week-year to the pivot Thursday.
  const yearStart = Date.UTC(year, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return { week, year };
}

/**
 * Returns the ISO-8601 week number (1 – 53) for `target`.
 *
 * Note: for dates at the very end of December or the very start of
 * January this returns the week number within the *ISO week-year*,
 * which may differ from the calendar year.  Use `getISOWeek()` if
 * you also need the ISO week-year.
 */
export function getWeekNumberForDate(target: Date): number {
  return getISOWeek(target).week;
}

export function getWeekNumber(weekOffset: number): number {
  // Use the Wednesday of the displayed Sat-Fri window as the ISO pivot.
  // Sat + 4 = Wed, which always shares the same ISO Mon-Sun week as
  // Thursday — the ISO-8601 anchor day — guaranteeing the week number
  // shown on mobile matches the dates visible in the calendar panel,
  // even when today is Saturday or Sunday (which occupy a different ISO
  // week than the Mon-Fri portion of the rendered Sat-Fri range).
  const saturday = getSaturdayOfWeek(new Date());
  saturday.setDate(saturday.getDate() + weekOffset * 7);
  const wednesday = new Date(saturday);
  wednesday.setDate(saturday.getDate() + 4); // Wed = Sat + 4 days
  return getWeekNumberForDate(wednesday);
}

/**
 * Compute overall board progress (0-100) from task columns.
 */
export function computeProgress(cols: DayColumn[]): number {
  let total = 0;
  let done = 0;
  for (const col of cols) {
    for (const t of col.tasks) {
      total++;
      if (t.done) done++;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/**
 * Priority → dot colour class mapping (for task cards).
 */
export const PRIORITY_DOT: Record<string, string> = {
  low: "bg-emerald-500",
  medium: "bg-sky-500",
  high: "bg-amber-500",
  critical: "bg-rose-500",
};

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};
