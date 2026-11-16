import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    method: v.object({
      name: v.literal("usernamePassword"),
      profile: v.object({}),
    }),
  },
  returns: v.id("users"),
  handler: async (ctx) => ctx.db.insert("users", {}),
});

/** False when the client holds a token whose server session is gone (expired or deleted). */
export const signedIn = query({
  args: {},
  handler: async (ctx) => (await getAuthUserId(ctx)) !== null,
});
