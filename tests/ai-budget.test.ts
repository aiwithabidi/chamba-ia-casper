import { describe, expect, test } from "bun:test";
import {
  costCents,
  DAILY_AI_BUDGET_CENTS,
  INPUT_CENTS_PER_MTOK,
  OUTPUT_CENTS_PER_MTOK,
  overBudget,
  utcDay,
} from "../convex/lib/aiBudget";

const M = 1_000_000;

describe("costCents", () => {
  test("a million tokens costs the per-MTok price, input and output priced separately", () => {
    expect(costCents({ inputTokens: M, outputTokens: 0 })).toBeCloseTo(INPUT_CENTS_PER_MTOK, 9);
    expect(costCents({ inputTokens: 0, outputTokens: M })).toBeCloseTo(OUTPUT_CENTS_PER_MTOK, 9);
  });

  test("input and output add up, scaled linearly by token count", () => {
    const expected = (600 * INPUT_CENTS_PER_MTOK + 80 * OUTPUT_CENTS_PER_MTOK) / M;
    expect(costCents({ inputTokens: 600, outputTokens: 80 })).toBeCloseTo(expected, 9);
    expect(costCents({ inputTokens: 1200, outputTokens: 160 })).toBeCloseTo(2 * expected, 9);
  });

  test("output tokens cost more than input tokens", () => {
    expect(costCents({ outputTokens: 1000 })).toBeGreaterThan(costCents({ inputTokens: 1000 }));
  });

  test("missing token counts cost nothing instead of NaN", () => {
    expect(costCents({})).toBe(0);
    expect(costCents({ inputTokens: undefined, outputTokens: 500 })).toBeCloseTo(
      (500 * OUTPUT_CENTS_PER_MTOK) / M,
      9,
    );
  });
});

describe("overBudget", () => {
  test("the cap is reached at exactly the cap, not before", () => {
    expect(overBudget(DAILY_AI_BUDGET_CENTS - 0.01)).toBe(false);
    expect(overBudget(DAILY_AI_BUDGET_CENTS)).toBe(true);
    expect(overBudget(0)).toBe(false);
  });
});

describe("utcDay", () => {
  test("buckets by UTC date, not local time", () => {
    expect(utcDay(Date.UTC(2026, 10, 15, 23, 59))).toBe("2026-11-15");
    expect(utcDay(Date.UTC(2026, 10, 16, 0, 0))).toBe("2026-11-16");
  });
});
