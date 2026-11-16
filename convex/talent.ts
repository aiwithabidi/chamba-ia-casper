import { query } from "./_generated/server";
import {
  CATEGORY_INFO,
  type Category,
  COUNTRIES,
  SKILL_GROUPS,
  VARIANT_LABEL,
  type Variant,
} from "./lib/domain";

function tally<T extends string>(items: T[]): { key: T; count: number }[] {
  const m = new Map<T, number>();
  for (const i of items) m.set(i, (m.get(i) ?? 0) + 1);
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

const SKILL_LABEL = Object.fromEntries(
  SKILL_GROUPS.flatMap((g) => g.skills.map((s) => [s.id, s.label])),
);

/** Aggregate pool stats only: no names or individual profiles leave the backend. */
export const pool = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const swipes = await ctx.db.query("swipes").collect();
    const screenings = await ctx.db.query("screenings").collect();
    const scored = screenings.filter((s) => s.score !== undefined);
    return {
      testers: profiles.length,
      hours: profiles.reduce((sum, p) => sum + p.hoursPerWeek, 0),
      likes: swipes.filter((s) => s.liked).length,
      screenings: scored.length,
      avgScore: scored.length
        ? Math.round(scored.reduce((s, x) => s + (x.score ?? 0), 0) / scored.length)
        : null,
      byCountry: tally(profiles.map((p) => p.country)).map((r) => ({
        label: COUNTRIES.find((c) => c.code === r.key)?.label ?? r.key,
        count: r.count,
      })),
      byVariant: tally(profiles.map((p) => p.variant as Variant)).map((r) => ({
        label: VARIANT_LABEL[r.key],
        count: r.count,
      })),
      byCategory: tally(profiles.flatMap((p) => p.jobTypes as Category[])).map((r) => ({
        label: CATEGORY_INFO[r.key].label,
        count: r.count,
      })),
      bySkill: tally(profiles.flatMap((p) => p.skills)).map((r) => ({
        label: SKILL_LABEL[r.key] ?? r.key,
        count: r.count,
      })),
    };
  },
});
