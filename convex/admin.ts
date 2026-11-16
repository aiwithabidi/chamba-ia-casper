import { query } from "./_generated/server";
import { acceptanceRate, funnel } from "./lib/adminStats";
import { DAILY_AI_BUDGET_CENTS, utcDay } from "./lib/aiBudget";
import { CATEGORY_INFO, type Category } from "./lib/domain";
import { computeFit } from "./lib/fit";
import { QUALIFY_BAR } from "./lib/rubric";
import { isOperator } from "./outcomes";

const DAY_MS = 86_400_000;

/** Shows the "Panel de admin" row in Perfil only to operators. */
export const amOperator = query({ args: {}, handler: (ctx) => isOperator(ctx) });

/** Operator dashboard: funnel, talent and AI-ops numbers from existing tables. Null for non-operators.
 * Concept-grade: full scans, fine at demo scale; a real version would keep running counters. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isOperator(ctx))) return null;
    const [users, profiles, swipes, prequals, screenings, applications, roles, usage] =
      await Promise.all([
        ctx.db.query("users").collect(),
        ctx.db.query("profiles").collect(),
        ctx.db.query("swipes").collect(),
        ctx.db.query("prequals").collect(),
        ctx.db.query("screenings").collect(),
        ctx.db.query("applications").collect(),
        ctx.db.query("roles").collect(),
        ctx.db.query("aiUsage").collect(),
      ]);
    const roleById = new Map(roles.map((r) => [r._id, r]));
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    const fits = swipes.flatMap((s) => {
      const p = profileByUser.get(s.userId);
      const r = roleById.get(s.roleId);
      return s.liked && p && r ? [computeFit(p, r).score] : [];
    });

    const qualified = screenings.filter((s) => s.done && (s.score ?? 0) >= QUALIFY_BAR);
    const qualifiedByCat = new Map<Category, Set<string>>();
    for (const s of qualified) {
      const cat = roleById.get(s.roleId)?.category;
      if (cat) qualifiedByCat.set(cat, (qualifiedByCat.get(cat) ?? new Set()).add(s.userId));
    }

    const now = Date.now();
    const last7 = Array.from({ length: 7 }, (_, i) => utcDay(now - (6 - i) * DAY_MS));
    const byDay = new Map(usage.map((u) => [u.day, u]));
    const today = byDay.get(utcDay(now));

    return {
      acceptance: acceptanceRate(applications),
      funnel: funnel({
        users: users.map((u) => u._id),
        profiles: profiles.map((p) => p.userId),
        swipes,
        prequals,
        screenings,
        applications,
      }),
      totalUsers: users.length,
      qualifiedTalent: new Set(qualified.map((s) => s.userId)).size,
      acceptedPlacements: applications.filter((a) => a.verified === true).length,
      avgFit: fits.length ? Math.round(fits.reduce((a, b) => a + b, 0) / fits.length) : null,
      topCategories: [...qualifiedByCat]
        .map(([c, set]) => ({ label: CATEGORY_INFO[c].label, count: set.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3),
      ai: {
        todayCents: today?.cents ?? 0,
        capCents: DAILY_AI_BUDGET_CENTS,
        callsToday: today?.calls ?? 0,
        last7: last7.map((day) => ({ day, cents: byDay.get(day)?.cents ?? 0 })),
        fallbackGraded: screenings.filter((s) => s.graded === "heuristica").length,
      },
    };
  },
});
