// Activity heatmap rules (Perfil → "Tu actividad"). Pure, UTC-day based, no streak penalty.

export const HEATMAP_WEEKS = 17;
const DAY_MS = 86_400_000;

export type DayCount = { day: string; count: number };
export type Cell = { day: string; count: number; level: number } | null;

/** UTC calendar day of a timestamp, "YYYY-MM-DD". */
export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** First UTC midnight shown in the grid: the Monday that starts the oldest column. */
export function gridStart(nowMs: number, weeks = HEATMAP_WEEKS): number {
  const today = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const sinceMonday = (new Date(today).getUTCDay() + 6) % 7;
  return today - (sinceMonday + (weeks - 1) * 7) * DAY_MS;
}

/** Collapse event timestamps into one sorted row per active UTC day. */
export function countByDay(timestamps: readonly number[]): DayCount[] {
  const counts = new Map<string, number>();
  for (const t of timestamps) {
    const k = dayKey(t);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

/** Shade 0-4: fixed thresholds so a day's color never changes because another day got busier. */
export function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

/** Week columns (Monday first) ending with the current week; days after today are null. */
export function buildGrid(
  days: readonly DayCount[],
  nowMs: number,
  weeks = HEATMAP_WEEKS,
): Cell[][] {
  const counts = new Map(days.map((d) => [d.day, d.count]));
  const start = gridStart(nowMs, weeks);
  const today = dayKey(nowMs);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = dayKey(start + (w * 7 + d) * DAY_MS);
      if (day > today) return null;
      const count = counts.get(day) ?? 0;
      return { day, count, level: level(count) };
    }),
  );
}

/**
 * Consecutive active days ending today, or ending yesterday while today is still open:
 * a streak only shows what you did, it is never "lost" mid-day.
 */
export function currentStreak(days: readonly DayCount[], nowMs: number): number {
  const active = new Set(days.filter((d) => d.count > 0).map((d) => d.day));
  let cursor = Math.floor(nowMs / DAY_MS) * DAY_MS;
  if (!active.has(dayKey(cursor))) cursor -= DAY_MS;
  let streak = 0;
  while (active.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}
