import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { canCredit, codeFor, MAX_REFERRALS, normalizeCode, REFERRAL_CENTS } from "./lib/referral";
import { getProfile } from "./lib/session";
import { credit } from "./wallet";

/**
 * Records a referral when a new profile is created. A bad, unknown or capped code is
 * ignored silently: signup must never fail because of a referral.
 */
export async function recordReferral(
  ctx: MutationCtx,
  referredId: Id<"users">,
  rawCode: string | undefined,
  name: string,
) {
  const code = normalizeCode(rawCode);
  if (!code) return;
  const inviter = await ctx.db
    .query("profiles")
    .withIndex("by_invite_code", (q) => q.eq("inviteCode", code))
    .first();
  if (!inviter) return;
  const existing = await ctx.db
    .query("referrals")
    .withIndex("by_inviter", (q) => q.eq("inviterId", inviter.userId))
    .collect();
  const already = await ctx.db
    .query("referrals")
    .withIndex("by_referred", (q) => q.eq("referredId", referredId))
    .first();
  if (
    !canCredit({
      count: existing.length,
      inviterId: inviter.userId,
      referredId,
      alreadyReferred: already !== null,
    })
  )
    return;
  const firstName = name.split(/\s+/)[0] ?? name;
  await ctx.db.insert("referrals", { inviterId: inviter.userId, referredId, name: firstName });
  await credit(
    ctx,
    inviter.userId,
    `referido:${referredId}`,
    REFERRAL_CENTS,
    `Invitaste a ${firstName}`,
  );
}

/** The signed-in user's invite code and filled slots. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (!profile) return null;
    const rows = await ctx.db
      .query("referrals")
      .withIndex("by_inviter", (q) => q.eq("inviterId", profile.userId))
      .collect();
    return {
      code: profile.inviteCode ?? codeFor(profile.userId),
      stored: profile.inviteCode !== undefined,
      friends: rows.slice(0, MAX_REFERRALS).map((r) => r.name),
      max: MAX_REFERRALS,
      cents: REFERRAL_CENTS,
    };
  },
});

/** Stores the derived code on profiles created before referrals existed. */
export const claimCode = mutation({
  args: {},
  handler: async (ctx) => {
    const profile = await getProfile(ctx);
    if (profile && profile.inviteCode === undefined)
      await ctx.db.patch(profile._id, { inviteCode: codeFor(profile.userId) });
  },
});
