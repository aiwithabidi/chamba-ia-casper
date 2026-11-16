// Placement follow-up: after a "Postular" click we ask "¿Postulaste?" and then "¿Te aceptaron?".
// Answers feed the deck (convex/roles.ts): a user's own placement lifts that category, and roles
// where others were accepted get a small tie-breaker. Pure and deterministic; time is passed in.
import { CATEGORIES, type Category } from "./domain";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** First ask: the next app open, but never within 10 minutes of the click (returning from the same tab). */
export const ASK_FIRST_AFTER_MS = 10 * MINUTE;
/** "No" or "Todavía no sé" on acceptance: ask again in two weeks. */
export const REASK_AFTER_DAYS = 14;
/** After this many acceptance answers without a "Sí", stop asking and record not accepted. */
export const MAX_ASKS = 3;
/** Closing the sheet without answering: ask again tomorrow (the server cannot see sessions, it can see time). */
export const DISMISS_SNOOZE_MS = DAY;

/** Deck boost for a category where this user was accepted. */
export const PLACEMENT_BOOST = 10;
/** Deck boost for a self-reported placement not yet verified: small, so the screenshot step matters. */
export const SELF_REPORTED_BOOST = 3;
/** Cap on the global "others were accepted here" tie-breaker. */
export const MAX_RATE_BOOST = 5;

export type Reply = "no" | "no_se";
export type Answer =
  | "dismiss"
  | "applied_no"
  | "applied_yes"
  | "accepted_si"
  | "accepted_no"
  | "accepted_no_se";

export type Outcome = {
  clickedAt: number;
  askAfter: number;
  asks: number;
  applied?: boolean;
  accepted?: boolean;
  lastReply?: Reply;
  resolvedAt?: number;
  /** Screenshot of the acceptance email (Convex storage id). */
  proofId?: string;
  /** Operator review of the proof: absent = not reviewed, true = verified, false = rejected. */
  verified?: boolean;
  /** "Subir después" taps; the proof is asked for once more, a day later, then never again. */
  proofSkips?: number;
  proofAskAfter?: number;
};

/** A self-reported placement waiting for its screenshot: what the proof reminder asks for. */
export const needsProof = (r: Outcome) =>
  r.accepted === true && r.proofId === undefined && r.verified === undefined;

/** "Subir después" (or closing the sheet on the proof step): one reminder tomorrow, then stop asking. */
export function skipProof(row: Outcome, now: number): Outcome {
  const proofSkips = (row.proofSkips ?? 0) + 1;
  return {
    ...row,
    proofSkips,
    proofAskAfter: proofSkips < 2 ? now + DISMISS_SNOOZE_MS : undefined,
  };
}

/** The user uploads a screenshot: it joins the operator queue (a re-upload after a rejection is reviewed again). */
export function attachProof(row: Outcome, proofId: string): Outcome {
  if (row.accepted !== true) throw new Error("Solo una postulación aceptada lleva captura");
  return { ...row, proofId, verified: undefined };
}

/** Operator decision on a screenshot. */
export function review(row: Outcome, ok: boolean): Outcome {
  if (row.proofId === undefined) throw new Error("No hay captura que revisar");
  return { ...row, verified: ok };
}

/** A "Postular" click: a new row, or a fresh first-ask window if the user never answered. */
export function recordClick(prev: Outcome | null, now: number): Outcome {
  if (!prev) return { clickedAt: now, askAfter: now + ASK_FIRST_AFTER_MS, asks: 0 };
  if (prev.resolvedAt !== undefined || prev.applied !== undefined) return prev;
  return { ...prev, clickedAt: now, askAfter: now + ASK_FIRST_AFTER_MS };
}

/** The new state after one answer in the sheet. */
export function nextAsk(row: Outcome, answer: Answer, now: number): Outcome {
  if (row.resolvedAt !== undefined) return row;
  switch (answer) {
    case "dismiss":
      return { ...row, askAfter: now + DISMISS_SNOOZE_MS };
    case "applied_no":
      return { ...row, applied: false, resolvedAt: now };
    case "applied_yes":
      // The acceptance question shows underneath; if the sheet closes before it, ask tomorrow.
      return { ...row, applied: true, askAfter: now + DISMISS_SNOOZE_MS };
    case "accepted_si":
      return { ...row, applied: true, accepted: true, resolvedAt: now };
    case "accepted_no":
    case "accepted_no_se": {
      const asks = row.asks + 1;
      const lastReply: Reply = answer === "accepted_no" ? "no" : "no_se";
      if (asks >= MAX_ASKS)
        return { ...row, applied: true, accepted: false, asks, lastReply, resolvedAt: now };
      return { ...row, applied: true, asks, lastReply, askAfter: now + REASK_AFTER_DAYS * DAY };
    }
  }
}

/** A row's question is due: an unanswered follow-up, or the one proof reminder. */
const isDue = (r: Outcome, now: number) =>
  (r.resolvedAt === undefined && r.askAfter <= now) ||
  (needsProof(r) && r.proofAskAfter !== undefined && r.proofAskAfter <= now);

/** The single oldest row with a question due now, or null. */
export function due<T extends Outcome>(rows: T[], now: number): T | null {
  return rows
    .filter((r) => isDue(r, now))
    .reduce<T | null>(
      (best, r) => (best === null || r.clickedAt < best.clickedAt ? r : best),
      null,
    );
}

/** Per user, per category: +10 for a verified placement, +3 for a self-reported one awaiting review,
 * 0 for none or a rejected screenshot (best one wins). Input: this user's accepted rows. */
export function placementBoost(
  placements: { category: string; verified?: boolean }[],
): Record<Category, number> {
  const points = (c: Category) =>
    Math.max(
      0,
      ...placements
        .filter((p) => p.category === c)
        .map((p) =>
          p.verified === true ? PLACEMENT_BOOST : p.verified === false ? 0 : SELF_REPORTED_BOOST,
        ),
    );
  return Object.fromEntries(CATEGORIES.map((c) => [c, points(c)])) as Record<Category, number>;
}

/** Operator candidate list: workers with verified placements first (more first), then the rest in their given order. */
export function rankCandidates<T extends { provenOn: string[] }>(candidates: T[]): T[] {
  return candidates
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.provenOn.length - a.c.provenOn.length || a.i - b.i)
    .map(({ c }) => c);
}

/** Laplace-smoothed acceptance rate, (accepted + 1) / (applied + 2): 0.5 with no data, so 1/1 is 0.67, not 1. */
export function placementRate(applied: number, accepted: number): number {
  return (accepted + 1) / (applied + 2);
}

/** Global tie-breaker: 0 at or below even odds, rising toward MAX_RATE_BOOST as the smoothed rate nears 1. */
export function rateBoost(applied: number, accepted: number): number {
  const above = Math.max(0, placementRate(applied, accepted) - 0.5) * 2;
  return Math.round(MAX_RATE_BOOST * above * 10) / 10;
}

/** Per role, for the global tie-breaker: confirmed applications and VERIFIED placements only, so a
 * self-reported "Sí" cannot push a role up for everyone. */
export function roleTallies<K>(
  rows: (Outcome & { roleId: K })[],
): Map<K, { applied: number; accepted: number }> {
  const out = new Map<K, { applied: number; accepted: number }>();
  for (const r of rows.filter((x) => x.applied === true)) {
    const t = out.get(r.roleId) ?? { applied: 0, accepted: 0 };
    out.set(r.roleId, {
      applied: t.applied + 1,
      accepted: t.accepted + (r.verified === true ? 1 : 0),
    });
  }
  return out;
}

/** Operator stats: clicks, confirmed applications, verified placements (the headline), self-reported
 * placements (shown small), and the placement rate = verified / applied. */
export function outcomeStats(rows: Outcome[]) {
  const applied = rows.filter((r) => r.applied === true).length;
  const verified = rows.filter((r) => r.accepted === true && r.verified === true).length;
  const selfReported = rows.filter((r) => r.accepted === true).length;
  return {
    clicks: rows.length,
    applied,
    verified,
    selfReported,
    placementRate: applied ? verified / applied : null,
  };
}
