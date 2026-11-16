import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, type QueryCtx, query } from "./_generated/server";
import { requireUser } from "./lib/session";

export const MIN_CASHOUT_CENTS = 500;

/** Credits a reward once per (user, key). */
export async function credit(
  ctx: MutationCtx,
  userId: Id<"users">,
  key: string,
  cents: number,
  label: string,
) {
  const seen = await ctx.db
    .query("earnings")
    .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", key))
    .unique();
  if (!seen) await ctx.db.insert("earnings", { userId, key, cents, label });
}

export type Movement = {
  id: string;
  kind: "earning" | "payout";
  cents: number;
  label: string;
  at: number;
};

/** The user's newest `limit` movements, earnings and payouts merged by time. */
async function latestMovements(ctx: QueryCtx, userId: Id<"users">, limit: number) {
  const [earnings, payouts] = await Promise.all([
    ctx.db
      .query("earnings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit + 1),
    ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit + 1),
  ]);
  const all: Movement[] = [
    ...earnings.map((e) => ({
      id: e._id,
      kind: "earning" as const,
      cents: e.cents,
      label: e.label,
      at: e._creationTime,
    })),
    ...payouts.map((p) => ({
      id: p._id,
      kind: "payout" as const,
      cents: p.cents,
      label: `Retiro · ${p.method} · ${p.status}`,
      at: p._creationTime,
    })),
  ].sort((a, b) => b.at - a.at);
  return { items: all.slice(0, limit), hasMore: all.length > limit };
}

/** Totals plus the latest 3 movements; the full history lives on /perfil/billetera. */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    // Totals still read every row (concept scale); a real ledger would keep a running balance.
    const [earnings, payouts, latest] = await Promise.all([
      ctx.db
        .query("earnings")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("payouts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      latestMovements(ctx, userId, 3),
    ]);
    const earnedCents = earnings.reduce((s, e) => s + e.cents, 0);
    const paidCents = payouts.reduce((s, p) => s + p.cents, 0);
    return {
      earnedCents,
      paidCents,
      balanceCents: earnedCents - paidCents,
      minCashoutCents: MIN_CASHOUT_CENTS,
      recent: latest.items,
      hasMore: latest.hasMore,
    };
  },
});

export const HISTORY_PAGE = 20;

/** Full history for /perfil/billetera: the client raises `limit` by HISTORY_PAGE on "Cargar más". */
export const movements = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const n = Math.min(Math.max(1, Math.floor(limit)), 500);
    return latestMovements(ctx, userId, n);
  },
});

export const cashOut = mutation({
  args: {
    method: v.union(
      v.literal("paypal"),
      v.literal("payoneer"),
      v.literal("nequi"),
      v.literal("tarjeta"),
    ),
    handle: v.string(),
  },
  handler: async (ctx, { method, handle }) => {
    const userId = await requireUser(ctx);
    const clean = handle.trim();
    if (clean.length < 4 || clean.length > 80) throw new Error("Escribe tu cuenta o correo");
    const earnings = await ctx.db
      .query("earnings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const balance =
      earnings.reduce((s, e) => s + e.cents, 0) - payouts.reduce((s, p) => s + p.cents, 0);
    if (balance < MIN_CASHOUT_CENTS) throw new Error("Necesitas al menos $5 para retirar");
    await ctx.db.insert("payouts", {
      userId,
      cents: balance,
      method,
      handle: clean,
      status: "pendiente",
    });
    return balance;
  },
});
