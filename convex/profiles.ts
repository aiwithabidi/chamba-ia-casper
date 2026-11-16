import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { COUNTRIES, EQUIPMENT, SKILL_GROUPS } from "./lib/domain";
import { codeFor } from "./lib/referral";
import { getProfile, requireUser } from "./lib/session";
import { recordReferral } from "./referrals";
import { vCategory, vVariant } from "./schema";
import { credit } from "./wallet";

const SKILL_IDS = new Set(SKILL_GROUPS.flatMap((g) => g.skills.map((s) => s.id)));
const EQUIPMENT_IDS = new Set<string>(EQUIPMENT.map((e) => e.id));

export const me = query({
  args: {},
  handler: async (ctx) => getProfile(ctx),
});

export const save = mutation({
  args: {
    name: v.string(),
    country: v.string(),
    variant: vVariant,
    jobTypes: v.array(vCategory),
    skills: v.array(v.string()),
    equipment: v.array(v.string()),
    hoursPerWeek: v.number(),
    ref: v.optional(v.string()),
  },
  handler: async (ctx, { ref, ...args }) => {
    const userId = await requireUser(ctx);
    const name = args.name.trim();
    if (name.length < 2 || name.length > 40) throw new Error("Nombre inválido");
    if (!Number.isInteger(args.hoursPerWeek) || args.hoursPerWeek < 1 || args.hoursPerWeek > 80)
      throw new Error("Horas inválidas");
    // Only known values: these strings feed the public /talento aggregates and the qualification rules.
    if (!COUNTRIES.some((c) => c.code === args.country)) throw new Error("País inválido");
    const clean = {
      ...args,
      jobTypes: [...new Set(args.jobTypes)],
      // Unknown ids are dropped, not rejected, so a profile saved under an older list still re-saves.
      skills: [...new Set(args.skills)].filter((s) => SKILL_IDS.has(s)),
      equipment: [...new Set(args.equipment)].filter((e) => EQUIPMENT_IDS.has(e)),
    };
    const existing = await getProfile(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, { ...clean, name });
      return existing._id;
    }
    await credit(ctx, userId, "perfil", 100, "Bono de bienvenida: perfil completo");
    await recordReferral(ctx, userId, ref, name);
    return ctx.db.insert("profiles", {
      ...clean,
      name,
      userId,
      tutorialSeen: false,
      inviteCode: codeFor(userId),
    });
  },
});

export const markTutorialSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (profile) await ctx.db.patch(profile._id, { tutorialSeen: true });
  },
});
