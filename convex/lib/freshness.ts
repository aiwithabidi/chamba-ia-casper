// Deterministic freshness decay for the deck: a posting stays at full rank for 60 days, loses up
// to 40 points by 180 days, and after that sinks below every fresher posting.

const DAY_MS = 86_400_000;
const FRESH_DAYS = 60;
const STALE_DAYS = 180;
const MAX_DECAY = 40;
/** Larger than any fit + affinity + outcome rank, so stale postings sort after all others. */
const STALE_PENALTY = 1000;
const UNIT_DAYS = { d: 1, w: 7, mo: 30, y: 365 } as const;

/** Age of a posting in days from an ISO date or a curated "3d ago" / "1y+ ago" string; null if unknown. */
export function ageDays(posted: string, nowMs: number): number | null {
  const rel = /^(\d+)(d|w|mo|y)\+? ago$/.exec(posted.trim());
  if (rel) return Number(rel[1]) * UNIT_DAYS[rel[2] as keyof typeof UNIT_DAYS];
  const time = Date.parse(posted.slice(0, 10));
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((nowMs - time) / DAY_MS));
}

/** Points to add to a role's rank (zero or negative). Undated postings are not penalized. */
export function freshnessPenalty(days: number | null): number {
  if (days === null || days <= FRESH_DAYS) return 0;
  if (days > STALE_DAYS) return -STALE_PENALTY;
  return -Math.round(((days - FRESH_DAYS) / (STALE_DAYS - FRESH_DAYS)) * MAX_DECAY);
}

/** Applies the decay to each rank and sorts best first; ties go to the higher pay. */
export function rankByFreshness<T extends { rank: number; posted: string; payMax?: number }>(
  roles: T[],
  nowMs: number,
): T[] {
  return roles
    .map((r) => ({ ...r, rank: r.rank + freshnessPenalty(ageDays(r.posted, nowMs)) }))
    .sort((a, b) => b.rank - a.rank || (b.payMax ?? 0) - (a.payMax ?? 0));
}
