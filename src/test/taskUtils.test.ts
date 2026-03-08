/**
 * src/test/taskUtils.test.ts
 *
 * Unit tests for the shared task-board utility helpers:
 *   - toLocalDateStr() — timezone-safe YYYY-MM-DD formatting
 *   - computeProgress() — board progress calculation
 *   - PRIORITY_DOT / PRIORITY_LABEL — color + label mappings
 */

import { describe, it, expect } from "vitest";
import {
  toLocalDateStr,
  computeProgress,
  PRIORITY_DOT,
  PRIORITY_LABEL,
  getWeekNumberForDate,
  getISOWeek,
  buildWeekForOffset,
} from "@/lib/taskUtils";
import type { DayColumn, Task } from "@/types";

// ── Helpers ────────────────────────────────────────────
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "t-1",
    title: overrides.title ?? "Task",
    description: overrides.description ?? "",
    tags: overrides.tags ?? [],
    assignees: overrides.assignees ?? [],
    done: overrides.done ?? false,
    rolledOver: overrides.rolledOver ?? false,
    priority: overrides.priority,
    ...overrides,
  };
}

function makeColumn(date: Date, tasks: Partial<Task>[]): DayColumn {
  return { date, tasks: tasks.map(makeTask) };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. toLocalDateStr
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("toLocalDateStr", () => {
  it("formats a Date object to YYYY-MM-DD", () => {
    const d = new Date(2025, 5, 15); // June 15, 2025 (local)
    expect(toLocalDateStr(d)).toBe("2025-06-15");
  });

  it("formats an ISO string using local interpretation", () => {
    // Construct an ISO string at midnight local time
    const d = new Date(2025, 0, 1); // Jan 1
    const iso = d.toISOString();
    expect(toLocalDateStr(iso)).toBe(toLocalDateStr(d));
  });

  it("pads single-digit months and days", () => {
    const d = new Date(2025, 0, 5); // Jan 5
    expect(toLocalDateStr(d)).toBe("2025-01-05");
  });

  it("handles December 31 correctly", () => {
    const d = new Date(2025, 11, 31); // Dec 31
    expect(toLocalDateStr(d)).toBe("2025-12-31");
  });

  it("handles leap day", () => {
    const d = new Date(2024, 1, 29); // Feb 29, 2024
    expect(toLocalDateStr(d)).toBe("2024-02-29");
  });

  it("Date and ISO string for same local date produce same output", () => {
    const d = new Date(2025, 6, 4); // July 4
    expect(toLocalDateStr(d.toISOString())).toBe(toLocalDateStr(d));
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. computeProgress
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("computeProgress", () => {
  it("returns 0 for no columns", () => {
    expect(computeProgress([])).toBe(0);
  });

  it("returns 0 for columns with no tasks", () => {
    expect(computeProgress([{ date: new Date(), tasks: [] }])).toBe(0);
  });

  it("returns 0 when no tasks are done", () => {
    const cols = [makeColumn(new Date(), [{ done: false }, { done: false }])];
    expect(computeProgress(cols)).toBe(0);
  });

  it("returns 100 when all tasks are done", () => {
    const cols = [makeColumn(new Date(), [{ done: true }, { done: true }])];
    expect(computeProgress(cols)).toBe(100);
  });

  it("returns 50 when half the tasks are done", () => {
    const cols = [
      makeColumn(new Date(), [
        { id: "a", done: true },
        { id: "b", done: false },
      ]),
    ];
    expect(computeProgress(cols)).toBe(50);
  });

  it("rounds correctly (1 of 3 = 33)", () => {
    const cols = [
      makeColumn(new Date(), [
        { id: "a", done: true },
        { id: "b", done: false },
        { id: "c", done: false },
      ]),
    ];
    expect(computeProgress(cols)).toBe(33);
  });

  it("aggregates across multiple columns", () => {
    const cols = [
      makeColumn(new Date(), [{ id: "a", done: true }]),
      makeColumn(new Date(), [{ id: "b", done: false }, { id: "c", done: true }]),
    ];
    // 2 of 3 = 67
    expect(computeProgress(cols)).toBe(67);
  });

  it("handles single task", () => {
    expect(computeProgress([makeColumn(new Date(), [{ done: true }])])).toBe(100);
    expect(computeProgress([makeColumn(new Date(), [{ done: false }])])).toBe(0);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. PRIORITY_DOT — colour mapping
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("PRIORITY_DOT", () => {
  it("maps all four priority levels to distinct colours", () => {
    expect(PRIORITY_DOT.low).toBe("bg-emerald-500");
    expect(PRIORITY_DOT.medium).toBe("bg-sky-500");
    expect(PRIORITY_DOT.high).toBe("bg-amber-500");
    expect(PRIORITY_DOT.critical).toBe("bg-rose-500");
  });

  it("all four colours are unique", () => {
    const values = Object.values(PRIORITY_DOT);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has exactly four entries", () => {
    expect(Object.keys(PRIORITY_DOT)).toHaveLength(4);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. PRIORITY_LABEL — human-readable labels
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("PRIORITY_LABEL", () => {
  it("maps all four priority levels", () => {
    expect(PRIORITY_LABEL.low).toBe("Low");
    expect(PRIORITY_LABEL.medium).toBe("Medium");
    expect(PRIORITY_LABEL.high).toBe("High");
    expect(PRIORITY_LABEL.critical).toBe("Critical");
  });

  it("has exactly four entries matching PRIORITY_DOT keys", () => {
    expect(Object.keys(PRIORITY_LABEL).sort()).toEqual(
      Object.keys(PRIORITY_DOT).sort()
    );
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. getWeekNumberForDate — ISO-8601 week numbering
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("getWeekNumberForDate — ISO-8601 week numbering", () => {
  it("returns a small week number in early January", () => {
    // Jan 5, 2026 = Monday. ISO pivot (Thu) = Jan 8.
    // year=2026, diff=7 days → week ceil(8/7) = 2.
    expect(getWeekNumberForDate(new Date(2026, 0, 5))).toBe(2);
  });

  it("returns a high week number in late December", () => {
    // Dec 27, 2025 = Saturday. ISO pivot (Thu) = Dec 25.
    // year=2025, diff=357 days → week ceil(358/7) = 52.
    expect(getWeekNumberForDate(new Date(2025, 11, 27))).toBe(52);
  });

  it("never exceeds 53 (ISO-8601 allows up to 53 weeks per year)", () => {
    // Sweep every year-boundary date from 2020 to 2035.
    for (let year = 2020; year <= 2035; year++) {
      for (let month = 0; month <= 11; month += 11) {
        for (let day = 1; day <= 31; day++) {
          const d = new Date(year, month, day);
          if (d.getMonth() !== month) continue; // skip invalid dates e.g. Feb 30
          const wk = getWeekNumberForDate(d);
          expect(wk).toBeGreaterThanOrEqual(1);
          expect(wk).toBeLessThanOrEqual(53);
        }
      }
    }
  });

  it("wraps from late December to ISO week 1 across the year boundary", () => {
    // Mon Dec 28, 2026 → week 52 of 2026.
    // Mon Jan  4, 2027 → week  1 of 2027.
    const decWeek = getWeekNumberForDate(new Date(2026, 11, 28));
    const janWeek = getWeekNumberForDate(new Date(2027, 0, 4));
    expect(decWeek).toBeGreaterThanOrEqual(50);
    expect(janWeek).toBe(1);
    expect(janWeek).toBeLessThan(decWeek);
  });

  // ── Dec 31 → Jan 1 ISO-8601 Boundary Tests ────────────────

  it("2022/2023 boundary (Dec 31=Sat, Jan 1=Sun → both ISO week 52 of 2022)", () => {
    // Dec 31, 2022 = Saturday. ISO pivot = Dec 29, 2022 (Thu). → Week 52 of 2022.
    // Jan  1, 2023 = Sunday.   ISO pivot = Dec 29, 2022 (Thu). → Week 52 of 2022.
    // Jan  2, 2023 = Monday.   ISO pivot = Jan  5, 2023 (Thu). → Week  1 of 2023.
    expect(getWeekNumberForDate(new Date(2022, 11, 31))).toBe(52);
    expect(getWeekNumberForDate(new Date(2023, 0, 1))).toBe(52);
    expect(getWeekNumberForDate(new Date(2023, 0, 2))).toBe(1);
  });

  it("2025/2026 boundary (Dec 31=Wed → ISO week 1 of 2026)", () => {
    // Dec 31, 2025 = Wednesday. ISO pivot = Jan 1, 2026 (Thu). → Week 1 of 2026.
    expect(getWeekNumberForDate(new Date(2025, 11, 31))).toBe(1);
    // Jan 1, 2026 = Thursday.  ISO pivot = Jan 1 itself.       → Week 1 of 2026.
    expect(getWeekNumberForDate(new Date(2026, 0, 1))).toBe(1);
    // Jan 4, 2026 = Sunday.    ISO pivot = Jan 1.              → Week 1 of 2026.
    expect(getWeekNumberForDate(new Date(2026, 0, 4))).toBe(1);
    // Jan 5, 2026 = Monday.    ISO pivot = Jan 8.              → Week 2 of 2026.
    expect(getWeekNumberForDate(new Date(2026, 0, 5))).toBe(2);
  });

  it("2026/2027 boundary (2026 has 53 ISO weeks; Jan 1=Fri → still week 53)", () => {
    // Jan 1, 2026 is a Thursday → 2026 is an ISO 53-week year.
    // Dec 31, 2026 = Thursday. ISO pivot = Dec 31.             → Week 53 of 2026.
    expect(getWeekNumberForDate(new Date(2026, 11, 31))).toBe(53);
    // Jan  1, 2027 = Friday.   ISO pivot = Dec 31, 2026.       → Week 53 of 2026.
    expect(getWeekNumberForDate(new Date(2027, 0, 1))).toBe(53);
    // Jan  3, 2027 = Sunday.   ISO pivot = Dec 31, 2026.       → Week 53 of 2026.
    expect(getWeekNumberForDate(new Date(2027, 0, 3))).toBe(53);
    // Jan  4, 2027 = Monday.   ISO pivot = Jan  7, 2027.       → Week  1 of 2027.
    expect(getWeekNumberForDate(new Date(2027, 0, 4))).toBe(1);
  });

  it("2027/2028 boundary (Jan 1=Sat, Jan 2=Sun → last ISO week of 2027)", () => {
    // Dec 31, 2027 = Friday.   ISO pivot = Dec 30 (Thu). → Week 52 of 2027.
    expect(getWeekNumberForDate(new Date(2027, 11, 31))).toBe(52);
    // Jan  1, 2028 = Saturday. ISO pivot = Dec 31, 2027.  → Week 52 of 2027.
    expect(getWeekNumberForDate(new Date(2028, 0, 1))).toBe(52);
    // Jan  2, 2028 = Sunday.   ISO pivot = Dec 30, 2027.  → Week 52 of 2027.
    // (Sunday is the final day of the Mon Dec 25 – Sun Jan 2 ISO week.)
    expect(getWeekNumberForDate(new Date(2028, 0, 2))).toBe(52);
    // Jan  3, 2028 = Monday.   ISO pivot = Jan  5, 2028.  → Week  1 of 2028.
    expect(getWeekNumberForDate(new Date(2028, 0, 3))).toBe(1);
  });

  it("2033/2034 boundary (Dec 31=Sat → week 52 of 2033, NOT week 1 of 2034)", () => {
    // Regression: Sat-Fri midpoint algorithm incorrectly attributed Dec 31, 2033
    // to 2034 (Week 1). ISO-8601 correctly places it in week 52 of 2033.
    // Dec 31, 2033 = Saturday. ISO pivot = Dec 29, 2033 (Thu). → Week 52 of 2033.
    expect(getWeekNumberForDate(new Date(2033, 11, 31))).toBe(52);
    // Jan  1, 2034 = Sunday.   ISO pivot = Dec 29, 2033 (Thu). → Week 52 of 2033.
    expect(getWeekNumberForDate(new Date(2034, 0, 1))).toBe(52);
    // Jan  2, 2034 = Monday.   ISO pivot = Jan  5, 2034 (Thu). → Week  1 of 2034.
    expect(getWeekNumberForDate(new Date(2034, 0, 2))).toBe(1);
  });

  it("2026 has exactly 53 ISO weeks (Jan 1 is a Thursday)", () => {
    // ISO week 1 of 2026 starts on Monday Dec 29, 2025.
    const isoWeek1Start = new Date(2025, 11, 29);
    const seenWeeks = new Set<number>();
    for (let i = 0; i < 53; i++) {
      const d = new Date(isoWeek1Start);
      d.setDate(isoWeek1Start.getDate() + i * 7);
      const { week, year } = getISOWeek(d);
      expect(year).toBe(2026);
      seenWeeks.add(week);
    }
    expect([...seenWeeks].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 53 }, (_, i) => i + 1),
    );
  });

  it("successive ISO weeks always increase by 1 within the same ISO year", () => {
    // Walk Mondays in mid-2026 — safely away from year-end boundaries.
    const start = new Date(2026, 1, 2); // Monday Feb 2, 2026
    for (let i = 0; i < 40; i++) {
      const d1 = new Date(start);
      d1.setDate(start.getDate() + i * 7);
      const d2 = new Date(d1);
      d2.setDate(d1.getDate() + 7);
      const { year: y1 } = getISOWeek(d1);
      const { year: y2 } = getISOWeek(d2);
      if (y1 === y2) {
        expect(getWeekNumberForDate(d2)).toBe(getWeekNumberForDate(d1) + 1);
      }
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. buildWeekForOffset — always produces 7 columns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("buildWeekForOffset", () => {
  it("always returns exactly 7 columns", () => {
    for (let off = -52; off <= 52; off++) {
      expect(buildWeekForOffset(off)).toHaveLength(7);
    }
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. QuickAdd deduplication (unit-level simulation)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("QuickAdd deduplication guard (simulated)", () => {
  /**
   * This simulates the QuickAdd submit() logic at unit level.
   * The guard: once isSubmitting = true, further calls are no-ops.
   */
  it("rapid successive calls only invoke onAdd once", () => {
    let callCount = 0;
    let isSubmitting = false;

    function simulateSubmit(value: string) {
      if (isSubmitting) return;
      const trimmed = value.trim();
      if (!trimmed) return;
      isSubmitting = true;
      callCount++;
      // Real code would call onAdd(trimmed) here
      // dismiss() resets state for the next open cycle
    }

    // Simulate rapid triple-Enter
    simulateSubmit("Buy milk");
    simulateSubmit("Buy milk");
    simulateSubmit("Buy milk");

    expect(callCount).toBe(1);
  });

  it("after reset (dismiss), a new submission is allowed", () => {
    let callCount = 0;
    let isSubmitting = false;

    function simulateSubmit(value: string) {
      if (isSubmitting) return;
      const trimmed = value.trim();
      if (!trimmed) return;
      isSubmitting = true;
      callCount++;
    }
    function dismiss() {
      isSubmitting = false;
    }

    simulateSubmit("Task A");
    expect(callCount).toBe(1);

    dismiss();
    simulateSubmit("Task B");
    expect(callCount).toBe(2);
  });

  it("empty/whitespace input never invokes onAdd", () => {
    let callCount = 0;
    let isSubmitting = false;
    function simulateSubmit(value: string) {
      if (isSubmitting) return;
      const trimmed = value.trim();
      if (!trimmed) return;
      isSubmitting = true;
      callCount++;
    }
    simulateSubmit("");
    simulateSubmit("   ");
    simulateSubmit("\t\n");
    expect(callCount).toBe(0);
  });
});
