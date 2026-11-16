/** In-app daily cap on Anthropic spend: the console has no daily limit, so the interview enforces one. */

/** Haiku 5.5 list price, in cents per million tokens ($0.10 in, $0.50 out). */
export const INPUT_CENTS_PER_MTOK = 10;
export const OUTPUT_CENTS_PER_MTOK = 50;

/** $3.00 a day (UTC). Past it, the interview uses its templates and heuristic grading. */
export const DAILY_AI_BUDGET_CENTS = 300;

/** Cost of one model call in cents (fractional), from the AI SDK's usage counts. */
export function costCents(usage: { inputTokens?: number; outputTokens?: number }): number {
  return (
    ((usage.inputTokens ?? 0) * INPUT_CENTS_PER_MTOK +
      (usage.outputTokens ?? 0) * OUTPUT_CENTS_PER_MTOK) /
    1_000_000
  );
}

export const overBudget = (spentCents: number) => spentCents >= DAILY_AI_BUDGET_CENTS;

/** The spend bucket: "YYYY-MM-DD" in UTC. */
export const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
