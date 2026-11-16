import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { utcDay } from "./lib/aiBudget";

/** Today's Anthropic spend in cents (UTC day). */
export const _spentToday = internalQuery({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("aiUsage")
      .withIndex("by_day", (q) => q.eq("day", utcDay(Date.now())))
      .unique();
    return row?.cents ?? 0;
  },
});

/** Adds one model call's cost to today's row. */
export const _record = internalMutation({
  args: { cents: v.number() },
  handler: async (ctx, { cents }) => {
    const day = utcDay(Date.now());
    const row = await ctx.db
      .query("aiUsage")
      .withIndex("by_day", (q) => q.eq("day", day))
      .unique();
    if (row) await ctx.db.patch(row._id, { cents: row.cents + cents, calls: row.calls + 1 });
    else await ctx.db.insert("aiUsage", { day, cents, calls: 1 });
  },
});
