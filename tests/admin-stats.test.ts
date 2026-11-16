import { describe, expect, test } from "bun:test";
import { acceptanceRate, type FunnelRows, funnel } from "../convex/lib/adminStats";
import { PREQUAL_PASS } from "../convex/lib/prequal";
import { QUALIFY_BAR } from "../convex/lib/rubric";

const empty: FunnelRows = {
  users: [],
  profiles: [],
  swipes: [],
  prequals: [],
  screenings: [],
  applications: [],
};

describe("funnel", () => {
  test("each step counts distinct users who did it, even if they skipped an earlier step", () => {
    const rows: FunnelRows = {
      ...empty,
      users: ["a", "b", "c", "d"],
      profiles: ["a", "b", "c"],
      swipes: [
        { userId: "a", liked: true },
        { userId: "b", liked: false },
        { userId: "a", liked: true },
        // d swiped without a profile: still counted as reaching this step
        { userId: "d", liked: true },
      ],
      applications: [
        { userId: "b", applied: true },
        { userId: "c", applied: true },
      ],
    };
    const counts = funnel(rows).map((s) => s.count);
    expect(counts.slice(0, 3)).toEqual([4, 3, 2]);
    expect(counts[6]).toBe(2);
  });

  test("percent is of signups, so a later step bigger than the one before stays under 100%", () => {
    const steps = funnel({
      ...empty,
      users: ["a", "b", "c", "d"],
      profiles: ["a", "b"],
      swipes: [{ userId: "a", liked: true }],
      // c and d finished an interview without a passed prequal: step 5 > step 4
      screenings: [
        { userId: "c", done: true },
        { userId: "d", done: true },
      ],
    });
    expect(steps[0].pctOfTop).toBe(100);
    expect(steps[1].pctOfTop).toBe(50); // 2 of 4
    expect(steps[2].pctOfTop).toBe(25); // 1 of 4, not 1 of 2
    expect(steps[3].pctOfTop).toBe(0);
    expect(steps[4].pctOfTop).toBe(50); // 2 of 4, not 2 of 0
    expect(steps.every((s) => s.pctOfTop <= 100)).toBe(true);
  });

  test("prequal and qualify thresholds are inclusive", () => {
    const base = { ...empty, users: ["a", "b"], profiles: ["a", "b"] };
    const rows: FunnelRows = {
      ...base,
      swipes: [
        { userId: "a", liked: true },
        { userId: "b", liked: true },
      ],
      prequals: [
        { userId: "a", correct: PREQUAL_PASS },
        { userId: "b", correct: PREQUAL_PASS - 1 },
      ],
      screenings: [
        { userId: "a", done: true, score: QUALIFY_BAR },
        { userId: "b", done: true, score: 100 },
      ],
      applications: [{ userId: "a", applied: true, verified: true }],
    };
    expect(funnel(rows).map((s) => s.count)).toEqual([2, 2, 2, 1, 2, 2, 1, 1]);
  });
});

describe("acceptanceRate", () => {
  test("only verified placements count as accepted, out of applications sent", () => {
    expect(
      acceptanceRate([
        { userId: "a", applied: true, verified: true },
        { userId: "b", applied: true, verified: false },
        { userId: "c", applied: true },
        { userId: "d", applied: false },
      ]),
    ).toEqual({ applied: 3, accepted: 1, pct: 33 });
  });

  test("no applications is 0%, not NaN", () => {
    expect(acceptanceRate([]).pct).toBe(0);
  });
});
