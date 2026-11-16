import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { CATEGORIES, VARIANTS } from "./lib/domain";

export const vCategory = v.union(...CATEGORIES.map((c) => v.literal(c)));
export const vVariant = v.union(...VARIANTS.map((x) => v.literal(x)));

export default defineSchema({
  users: defineTable({}),

  profiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    country: v.string(),
    variant: vVariant,
    jobTypes: v.array(vCategory),
    skills: v.array(v.string()),
    equipment: v.array(v.string()),
    hoursPerWeek: v.number(),
    tutorialSeen: v.boolean(),
    inviteCode: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_invite_code", ["inviteCode"]),

  /** Credited referrals: one row per referred user, at most 3 per inviter. */
  referrals: defineTable({
    inviterId: v.id("users"),
    referredId: v.id("users"),
    name: v.string(),
  })
    .index("by_inviter", ["inviterId"])
    .index("by_referred", ["referredId"]),

  roles: defineTable({
    slug: v.string(),
    platform: v.string(),
    titleEs: v.string(),
    titleOriginal: v.string(),
    category: vCategory,
    variant: vVariant,
    remote: v.boolean(),
    posted: v.string(),
    url: v.string(),
    payMin: v.optional(v.number()),
    payMax: v.optional(v.number()),
    payNote: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),

  swipes: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    liked: v.boolean(),
    prequal: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_role", ["userId", "roleId"]),

  /** One graded multiple-choice attempt per user and category: the questions are per category, so a retake would leak the key. */
  prequals: defineTable({
    userId: v.id("users"),
    category: vCategory,
    correct: v.number(),
  }).index("by_user_category", ["userId", "category"]),

  screenings: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    turns: v.array(v.object({ q: v.string(), a: v.optional(v.string()) })),
    done: v.boolean(),
    score: v.optional(v.number()),
    feedback: v.optional(v.string()),
    card: v.optional(
      v.object({
        level: v.string(),
        skills: v.array(v.object({ name: v.string(), score: v.number() })),
        strengths: v.array(v.string()),
        evidence: v.string(),
        rubric: v.optional(
          v.array(v.object({ key: v.string(), score: v.number(), evidence: v.string() })),
        ),
      }),
    ),
    source: v.union(v.literal("ia"), v.literal("plantilla")),
    /** Who graded the finished interview: the model, or the heuristic fallback (no key, error, or over budget). */
    graded: v.optional(v.union(v.literal("ia"), v.literal("heuristica"))),
  })
    .index("by_user", ["userId"])
    .index("by_user_role", ["userId", "roleId"]),

  /** Anthropic spend per UTC day, enforced against DAILY_AI_BUDGET_CENTS (convex/lib/aiBudget.ts). */
  aiUsage: defineTable({ day: v.string(), cents: v.number(), calls: v.number() }).index("by_day", [
    "day",
  ]),

  /** Chamba rewards credited to a tester (cents, USD). */
  earnings: defineTable({
    userId: v.id("users"),
    cents: v.number(),
    label: v.string(),
    key: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_key", ["userId", "key"]),

  /** Outbound "Postular" clicks and their follow-up answers; one row per user + role. Rules: lib/outcomes.ts. */
  applications: defineTable({
    userId: v.id("users"),
    roleId: v.id("roles"),
    clickedAt: v.number(),
    askAfter: v.number(),
    asks: v.number(),
    applied: v.optional(v.boolean()),
    accepted: v.optional(v.boolean()),
    lastReply: v.optional(v.union(v.literal("no"), v.literal("no_se"))),
    resolvedAt: v.optional(v.number()),
    // Proof of acceptance: only operator-verified placements count globally (deck tie-breaker, headline stat).
    proofId: v.optional(v.id("_storage")),
    verified: v.optional(v.boolean()),
    proofSkips: v.optional(v.number()),
    proofAskAfter: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_role", ["userId", "roleId"]),

  payouts: defineTable({
    userId: v.id("users"),
    cents: v.number(),
    method: v.union(
      v.literal("paypal"),
      v.literal("payoneer"),
      v.literal("nequi"),
      v.literal("tarjeta"),
    ),
    handle: v.string(),
    status: v.literal("pendiente"),
  }).index("by_user", ["userId"]),
});
