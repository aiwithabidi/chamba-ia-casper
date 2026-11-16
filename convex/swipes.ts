import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { computeFit } from "./lib/fit";
import { PREQUAL } from "./lib/prequal";
import { getProfile, requireUser } from "./lib/session";
import { vCategory } from "./schema";

export const record = mutation({
  args: { roleId: v.id("roles"), liked: v.boolean() },
  handler: async (ctx, { roleId, liked }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("roleId", roleId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { liked });
    else await ctx.db.insert("swipes", { userId, roleId, liked });
  },
});

/** Undo the most recent swipe (the ↺ button). */
export const undoLast = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const last = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (last) await ctx.db.delete(last._id);
  },
});

/** "Mostrar de nuevo" in Tu algoritmo: forget this user's passes in a category so it returns to the deck. */
export const resetCategory = mutation({
  args: { category: vCategory },
  handler: async (ctx, { category }) => {
    const userId = await requireUser(ctx);
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const s of swipes.filter((x) => !x.liked)) {
      const role = await ctx.db.get(s.roleId);
      if (role?.category === category) await ctx.db.delete(s._id);
    }
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return { likes: 0, passes: 0 };
    const all = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect();
    const likes = all.filter((s) => s.liked).length;
    return { likes, passes: all.length - likes };
  },
});

/** Guardados: liked roles with fit and pre-screen status. */
export const saved = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return [];
    const likes = await ctx.db
      .query("swipes")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .order("desc")
      .collect();
    const out = [];
    for (const s of likes.filter((x) => x.liked)) {
      const role = await ctx.db.get(s.roleId);
      if (!role) continue;
      const screening = await ctx.db
        .query("screenings")
        .withIndex("by_user_role", (q) => q.eq("userId", profile.userId).eq("roleId", role._id))
        .unique();
      out.push({
        ...role,
        fit: computeFit(profile, role),
        screeningScore: screening?.score ?? null,
        prequal: s.prequal ?? null,
      });
    }
    return out;
  },
});

export const remove = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, { roleId }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("roleId", roleId))
      .unique();
    if (existing) await ctx.db.patch(existing._id, { liked: false });
  },
});

/** Grades the 3 multiple-choice pre-qualifying answers on the server and stores the count right.
 * One attempt per category: a later role in the same category reuses the first result. */
export const prequal = mutation({
  args: { roleId: v.id("roles"), answers: v.array(v.number()) },
  handler: async (ctx, { roleId, answers }) => {
    const userId = await requireUser(ctx);
    const role = await ctx.db.get(roleId);
    if (!role) throw new Error("Trabajo no encontrado");
    const qs = PREQUAL[role.category];
    if (
      answers.length !== qs.length ||
      answers.some((a, i) => !Number.isInteger(a) || a < 0 || a >= qs[i].options.length)
    )
      throw new Error("Responde todas las preguntas");
    const prior = await ctx.db
      .query("prequals")
      .withIndex("by_user_category", (q) => q.eq("userId", userId).eq("category", role.category))
      .unique();
    const correct = prior?.correct ?? qs.filter((q, i) => q.correct === answers[i]).length;
    if (!prior) await ctx.db.insert("prequals", { userId, category: role.category, correct });
    const swipe = await ctx.db
      .query("swipes")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("roleId", roleId))
      .unique();
    if (swipe) await ctx.db.patch(swipe._id, { prequal: correct });
    else await ctx.db.insert("swipes", { userId, roleId, liked: true, prequal: correct });
    return { correct, total: qs.length, repeat: prior !== null };
  },
});

/** Questions without the answer key, so the client never sees what is correct. */
export const prequalQuestions = query({
  args: { roleId: v.id("roles") },
  handler: async (ctx, { roleId }) => {
    const role = await ctx.db.get(roleId);
    return role ? PREQUAL[role.category].map(({ q, options }) => ({ q, options })) : null;
  },
});
