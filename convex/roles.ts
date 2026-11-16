import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { internalMutation, query } from "./_generated/server";
import { affinity } from "./lib/affinity";
import { computeFit } from "./lib/fit";
import { rankByFreshness } from "./lib/freshness";
import { getProfile } from "./lib/session";
import { LIVE_ROLES } from "./liveRoles";
import { outcomeSignals } from "./outcomes";
import { vCategory } from "./schema";
import { SEED_ROLES } from "./seedData";

/** The swipe deck: unswiped roles ranked by fit + swipe affinity + placement outcomes, optionally filtered by category. */
export const deck = query({
  args: { category: v.optional(vCategory) },
  handler: async (ctx, { category }) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const swiped = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    const seen = new Set(swiped.map((s) => s.roleId));
    const roles: Doc<"roles">[] = category
      ? await ctx.db
          .query("roles")
          .withIndex("by_category", (q) => q.eq("category", category))
          .collect()
      : await ctx.db.query("roles").collect();
    const byId = new Map(roles.map((r) => [r._id, r]));
    const swipedRoles = await Promise.all(
      swiped.map(async (s) => ({ s, r: byId.get(s.roleId) ?? (await ctx.db.get(s.roleId)) })),
    );
    const learned = affinity(
      swipedRoles.flatMap(({ s, r }) => (r ? [{ category: r.category, liked: s.liked }] : [])),
    );
    const outcomes = await outcomeSignals(ctx, profile.userId);
    // Main deck hides categories the user keeps passing; an Explorar category deck always shows them.
    // Old postings decay (see lib/freshness) so a 9-month-old listing never leads the deck.
    return rankByFreshness(
      roles
        .filter((r) => !seen.has(r._id) && (category || learned[r.category].status !== "oculto"))
        .map((r) => ({
          ...r,
          fit: computeFit(profile, r),
          rank: computeFit(profile, r).score + learned[r.category].boost + outcomes.boost(r),
        })),
      Date.now(),
    );
  },
});

/** "Tu algoritmo": what the deck shows more, less, or hides, learned from swipes. */
export const algorithm = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const swiped = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    const rows = await Promise.all(swiped.map(async (s) => ({ s, r: await ctx.db.get(s.roleId) })));
    return affinity(
      rows.flatMap(({ s, r }) => (r ? [{ category: r.category, liked: s.liked }] : [])),
    );
  },
});

export const get = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, { roleId }) => {
    const role = await ctx.db.get(roleId);
    const profile = await getProfile(ctx);
    if (!role) return null;
    return { ...role, fit: profile ? computeFit(profile, role) : null };
  },
});

/** Category tiles for Explorar: count of roles and the top pay per category. */
export const categories = query({
  args: {},
  handler: async (ctx) => {
    const roles = await ctx.db.query("roles").collect();
    const out: Record<string, { count: number; topPay: number }> = {};
    for (const r of roles) {
      const c = (out[r.category] ??= { count: 0, topPay: 0 });
      c.count += 1;
      c.topPay = Math.max(c.topPay, r.payMax ?? 0);
    }
    return out;
  },
});

/** Idempotent seed (upsert by slug) of curated + live scraped roles: bunx convex run roles:seed */
export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    const all = [...SEED_ROLES, ...LIVE_ROLES];
    for (const role of all) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_slug", (q) => q.eq("slug", role.slug))
        .unique();
      if (existing)
        await ctx.db.replace(existing._id, role); // replace, so a refresh also clears dropped pay fields
      else {
        await ctx.db.insert("roles", role);
        inserted += 1;
      }
    }
    // Prune roles the seed no longer lists (e.g. collapsed near-duplicates) so a refresh converges.
    const slugs = new Set(all.map((r) => r.slug));
    const stale = (await ctx.db.query("roles").collect()).filter((r) => !slugs.has(r.slug));
    for (const r of stale) await ctx.db.delete(r._id);
    return { inserted, removed: stale.length, total: all.length };
  },
});
