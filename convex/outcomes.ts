import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import {
  attachProof,
  needsProof,
  nextAsk,
  type Outcome,
  outcomeStats,
  placementBoost,
  rankCandidates,
  rateBoost,
  recordClick,
  review,
  roleTallies,
  skipProof,
} from "./lib/outcomes";
import { requireUser } from "./lib/session";

const MAX_PROOF_BYTES = 10 * 1024 * 1024;
/** Raster images only: an SVG "screenshot" could run script when an operator opens it. */
const PROOF_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
]);

const fields = (row: Doc<"applications">): Outcome => ({
  clickedAt: row.clickedAt,
  askAfter: row.askAfter,
  asks: row.asks,
  applied: row.applied,
  accepted: row.accepted,
  lastReply: row.lastReply,
  resolvedAt: row.resolvedAt,
  proofId: row.proofId,
  verified: row.verified,
  proofSkips: row.proofSkips,
  proofAskAfter: row.proofAskAfter,
});

/** The pure functions never change proofId, so patches leave the typed storage id alone. */
const patchOf = (o: Outcome): Omit<Outcome, "proofId"> => {
  const copy = { ...o };
  delete copy.proofId;
  return copy;
};

async function ownRow(ctx: QueryCtx, id: Id<"applications">) {
  const userId = await requireUser(ctx);
  const row = await ctx.db.get(id);
  if (!row || row.userId !== userId) throw new Error("Postulación no encontrada");
  return row;
}

/** Operators review proof screenshots. Set with: bunx convex env set OPERATOR_USER_IDS <userId>[,<userId>] */
export async function isOperator(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  const ids = (process.env.OPERATOR_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return userId !== null && ids.includes(userId);
}

/** Fired (not awaited) by every "Postular" link. Upserts the user + role row. */
export const click = mutation({
  args: { roleId: v.id("roles") },
  handler: async (ctx, { roleId }) => {
    const userId = await requireUser(ctx);
    if (!(await ctx.db.get(roleId))) throw new Error("Proyecto no encontrado");
    const existing = await ctx.db
      .query("applications")
      .withIndex("by_user_role", (q) => q.eq("userId", userId).eq("roleId", roleId))
      .unique();
    if (existing)
      await ctx.db.patch(existing._id, patchOf(recordClick(fields(existing), Date.now())));
    else
      await ctx.db.insert("applications", {
        userId,
        roleId,
        ...patchOf(recordClick(null, Date.now())),
      });
  },
});

/** This user's rows that may still need a question (unanswered, or a placement without its screenshot),
 * with the role they point at. The client picks the due one with `due()`, because a cached query cannot
 * see the clock advance. */
export const pending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const open = rows.filter((r) => r.resolvedAt === undefined || needsProof(fields(r)));
    const withRole = await Promise.all(
      open.map(async (r) => ({ r, role: await ctx.db.get(r.roleId) })),
    );
    return withRole.flatMap(({ r, role }) =>
      role
        ? [
            {
              ...fields(r),
              _id: r._id,
              role: { titleEs: role.titleEs, platform: role.platform, category: role.category },
            },
          ]
        : [],
    );
  },
});

export const answer = mutation({
  args: {
    id: v.id("applications"),
    answer: v.union(
      v.literal("dismiss"),
      v.literal("applied_no"),
      v.literal("applied_yes"),
      v.literal("accepted_si"),
      v.literal("accepted_no"),
      v.literal("accepted_no_se"),
    ),
  },
  handler: async (ctx, { id, answer }) => {
    const row = await ownRow(ctx, id);
    await ctx.db.patch(id, patchOf(nextAsk(fields(row), answer, Date.now())));
  },
});

/** "Subir después" or closing the sheet on the screenshot step. */
export const skipProofUpload = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, { id }) => {
    const row = await ownRow(ctx, id);
    await ctx.db.patch(id, patchOf(skipProof(fields(row), Date.now())));
  },
});

/** Upload URLs only for the caller's own accepted application, the one case that takes a screenshot. */
export const generateUploadUrl = mutation({
  args: { id: v.id("applications") },
  handler: async (ctx, { id }) => {
    const row = await ownRow(ctx, id);
    if (row.accepted !== true) throw new Error("Solo una postulación aceptada lleva captura");
    return ctx.storage.generateUploadUrl();
  },
});

/** Attach the acceptance-email screenshot: images up to 10 MB; a re-upload replaces the old file. */
export const submitProof = mutation({
  args: { id: v.id("applications"), storageId: v.id("_storage") },
  handler: async (ctx, { id, storageId }) => {
    const row = await ownRow(ctx, id);
    const meta = await ctx.db.system.get(storageId);
    if (!meta || !PROOF_TYPES.has(meta.contentType ?? "") || meta.size > MAX_PROOF_BYTES) {
      // Return, not throw: a throw rolls the mutation back, delete included, and orphans the file.
      if (meta) await ctx.storage.delete(storageId);
      return { ok: false as const, error: "Sube una imagen (captura) de hasta 10 MB" };
    }
    const next = attachProof(fields(row), storageId);
    if (row.proofId && row.proofId !== storageId) await ctx.storage.delete(row.proofId);
    await ctx.db.patch(id, { ...patchOf(next), proofId: storageId });
    return { ok: true as const };
  },
});

/** Operator queue: placements with a screenshot not yet reviewed. Null for everyone else. */
export const reviewQueue = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isOperator(ctx))) return null;
    const rows = (await ctx.db.query("applications").collect()).filter(
      (r) => r.accepted === true && r.proofId !== undefined && r.verified === undefined,
    );
    return Promise.all(
      rows.map(async (r) => {
        const role = await ctx.db.get(r.roleId);
        return {
          _id: r._id,
          title: role?.titleEs ?? "Proyecto",
          platform: role?.platform ?? "",
          proofId: r.proofId,
          url: r.proofId ? await ctx.storage.getUrl(r.proofId) : null,
        };
      }),
    );
  },
});

export const reviewProof = mutation({
  // proofId: the screenshot the operator saw, so a replacement uploaded meanwhile is not approved unseen.
  args: { id: v.id("applications"), proofId: v.id("_storage"), ok: v.boolean() },
  handler: async (ctx, { id, proofId, ok }) => {
    if (!(await isOperator(ctx))) throw new Error("Solo operadores");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Postulación no encontrada");
    if (row.proofId !== proofId) throw new Error("La captura cambió: revisa la nueva");
    await ctx.db.patch(id, patchOf(review(fields(row), ok)));
  },
});

/** The number the founder quotes: verified placements, with self-reported beside it. Aggregate only. */
export const stats = query({
  args: {},
  handler: async (ctx) => outcomeStats((await ctx.db.query("applications").collect()).map(fields)),
});

/** Deck signals: this user's own placements boost a category (+10 verified, +3 self-reported, only their
 * own deck); each role's global tie-breaker counts VERIFIED placements only. */
export async function outcomeSignals(ctx: QueryCtx, userId: Id<"users">) {
  const all = await ctx.db.query("applications").collect();
  const mine = await Promise.all(
    all
      .filter((a) => a.userId === userId && a.accepted === true)
      .map(async (a) => ({
        category: (await ctx.db.get(a.roleId))?.category,
        verified: a.verified,
      })),
  );
  const tally = roleTallies(all.map((a) => ({ ...fields(a), roleId: a.roleId })));
  const placed = placementBoost(
    mine.flatMap((m) => (m.category ? [{ category: m.category, verified: m.verified }] : [])),
  );
  return {
    boost: (r: Doc<"roles">) => {
      const t = tally.get(r._id);
      return placed[r.category] + (t ? rateBoost(t.applied, t.accepted) : 0);
    },
  };
}

/** Platforms of a user's VERIFIED placements, deduplicated. */
async function provenPlatforms(ctx: QueryCtx, rows: Doc<"applications">[]) {
  const verified = rows.filter((r) => r.accepted === true && r.verified === true);
  const roles = await Promise.all(verified.map((r) => ctx.db.get(r.roleId)));
  return [...new Set(roles.flatMap((r) => (r ? [r.platform] : [])))];
}

/** Perfil "Tu progreso": this user's own applications and acceptances (self-reported, verified beside it). */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { applied: 0, accepted: 0, verified: 0 };
    const rows = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return {
      applied: rows.filter((r) => r.applied === true).length,
      accepted: rows.filter((r) => r.accepted === true).length,
      verified: rows.filter((r) => r.accepted === true && r.verified === true).length,
    };
  },
});

/** For the worker's own talent card: "Colocación verificada · {platform}" badges. */
export const myVerified = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const rows = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return provenPlatforms(ctx, rows);
  },
});

/** Operator candidate view: workers with verified placements first ("Probado en {platform}"). Null for non-operators. */
export const candidates = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isOperator(ctx))) return null;
    const profiles = await ctx.db.query("profiles").collect();
    const all = await ctx.db.query("applications").collect();
    const list = await Promise.all(
      profiles.map(async (p) => ({
        _id: p._id,
        name: p.name,
        country: p.country,
        jobTypes: p.jobTypes,
        hoursPerWeek: p.hoursPerWeek,
        provenOn: await provenPlatforms(
          ctx,
          all.filter((a) => a.userId === p.userId),
        ),
      })),
    );
    return rankCandidates(list);
  },
});
