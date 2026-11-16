import { query } from "./_generated/server";
import { countByDay, gridStart } from "./lib/activity";
import { getProfile } from "./lib/session";

/**
 * Perfil heatmap: the signed-in user's actions per UTC day over the grid window, derived from
 * existing rows (swipes, pre-screens, AI interviews, Postular clicks and outcome answers, cash-outs).
 */
export const heatmap = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    const userId = profile.userId;
    const since = gridStart(Date.now());

    const [swipes, prequals, screenings, applications, payouts] = await Promise.all([
      ctx.db
        .query("swipes")
        .withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", since))
        .collect(),
      // At most one row per category, so the unbounded per-user read stays tiny.
      ctx.db
        .query("prequals")
        .withIndex("by_user_category", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("screenings")
        .withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", since))
        .collect(),
      // One row per role applied to; read all so an outcome answered today on an old click counts.
      ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("payouts")
        .withIndex("by_user", (q) => q.eq("userId", userId).gte("_creationTime", since))
        .collect(),
    ]);

    const stamps = [
      ...swipes.map((s) => s._creationTime),
      ...prequals.map((p) => p._creationTime),
      ...screenings.map((s) => s._creationTime),
      ...applications.flatMap((a) => (a.resolvedAt ? [a.clickedAt, a.resolvedAt] : [a.clickedAt])),
      ...payouts.map((p) => p._creationTime),
    ].filter((t) => t >= since);

    return countByDay(stamps);
  },
});
