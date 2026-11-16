import { describe, expect, test } from "bun:test";
import { ageDays, freshnessPenalty, rankByFreshness } from "../convex/lib/freshness";

const NOW = Date.parse("2026-11-15T12:00:00Z");

describe("ageDays", () => {
  test("reads ISO dates and the curated relative strings", () => {
    expect(ageDays("2026-11-13", NOW)).toBe(2);
    expect(ageDays("3d ago", NOW)).toBe(3);
    expect(ageDays("2w ago", NOW)).toBe(14);
    expect(ageDays("3mo ago", NOW)).toBe(90);
    expect(ageDays("1y+ ago", NOW)).toBe(365);
  });

  test("unknown dates have no age", () => {
    expect(ageDays("sin fecha", NOW)).toBeNull();
  });
});

describe("freshnessPenalty", () => {
  test("recent and undated postings keep their score", () => {
    expect(freshnessPenalty(0)).toBe(0);
    expect(freshnessPenalty(60)).toBe(0);
    expect(freshnessPenalty(null)).toBe(0);
  });

  test("between 60 and 180 days the penalty grows with age", () => {
    const at90 = freshnessPenalty(90);
    const at150 = freshnessPenalty(150);
    expect(at90).toBeLessThan(0);
    expect(at150).toBeLessThan(at90);
  });
});

describe("rankByFreshness", () => {
  test("a 9-month-old perfect fit ranks below a fresh weaker fit", () => {
    const roles = [
      { id: "old", rank: 100, posted: "2026-02-15" },
      { id: "fresh", rank: 20, posted: "2026-11-10" },
    ];
    expect(rankByFreshness(roles, NOW).map((r) => r.id)).toEqual(["fresh", "old"]);
  });

  test("a 4-month-old strong fit still beats a fresh weak one, but by less", () => {
    const roles = [
      { id: "aging", rank: 90, posted: "2026-07-15" },
      { id: "fresh", rank: 50, posted: "2026-11-10" },
    ];
    const ranked = rankByFreshness(roles, NOW);
    expect(ranked.map((r) => r.id)).toEqual(["aging", "fresh"]);
    expect(ranked[0].rank).toBeLessThan(90);
  });

  test("stale postings keep their fit order among themselves", () => {
    const roles = [
      { id: "stale-weak", rank: 30, posted: "1y+ ago" },
      { id: "stale-strong", rank: 80, posted: "2025-09-15" },
    ];
    expect(rankByFreshness(roles, NOW).map((r) => r.id)).toEqual(["stale-strong", "stale-weak"]);
  });
});
