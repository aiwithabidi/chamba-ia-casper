import { describe, expect, test } from "bun:test";
import { buildGrid, countByDay, currentStreak, level } from "../convex/lib/activity";

const at = (iso: string) => Date.parse(iso);
// Wednesday 2026-11-11, mid-afternoon UTC.
const NOW = at("2026-11-11T15:00:00Z");

describe("countByDay", () => {
  test("groups by UTC day, so 23:59Z and 00:01Z land on different days", () => {
    expect(
      countByDay([
        at("2026-11-10T23:59:00Z"),
        at("2026-11-11T00:01:00Z"),
        at("2026-11-11T09:00:00Z"),
      ]),
    ).toEqual([
      { day: "2026-11-10", count: 1 },
      { day: "2026-11-11", count: 2 },
    ]);
  });
});

describe("buildGrid", () => {
  const grid = buildGrid([{ day: "2026-11-09", count: 4 }], NOW, 3);

  test("columns are Monday-first weeks ending with the current week", () => {
    expect(grid).toHaveLength(3);
    expect(grid[0][0]?.day).toBe("2026-10-26");
    expect(grid[2][0]?.day).toBe("2026-11-09");
  });

  test("today is the last real cell and later days are empty slots", () => {
    expect(grid[2][2]?.day).toBe("2026-11-11");
    expect(grid[2].slice(3)).toEqual([null, null, null, null]);
  });

  test("active days carry their count and shade; quiet days are level 0", () => {
    expect(grid[2][0]).toEqual({ day: "2026-11-09", count: 4, level: 2 });
    expect(grid[2][1]).toEqual({ day: "2026-11-10", count: 0, level: 0 });
  });
});

describe("level", () => {
  test("rises with activity through five shades", () => {
    expect([0, 1, 3, 7, 25].map(level)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("currentStreak", () => {
  const days = (...d: string[]) => d.map((day) => ({ day, count: 1 }));

  test("counts consecutive days ending today", () => {
    expect(currentStreak(days("2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11"), NOW)).toBe(
      4,
    );
  });

  test("a gap ends the run", () => {
    expect(currentStreak(days("2026-11-07", "2026-11-09", "2026-11-10", "2026-11-11"), NOW)).toBe(
      3,
    );
  });

  test("today not yet active keeps yesterday's run instead of resetting it", () => {
    expect(currentStreak(days("2026-11-09", "2026-11-10"), NOW)).toBe(2);
  });

  test("nothing yesterday or today is zero", () => {
    expect(currentStreak(days("2026-11-08"), NOW)).toBe(0);
  });
});
