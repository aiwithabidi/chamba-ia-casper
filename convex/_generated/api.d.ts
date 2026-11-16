/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as admin from "../admin.js";
import type * as aiUsage from "../aiUsage.js";
import type * as auth from "../auth.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_adminStats from "../lib/adminStats.js";
import type * as lib_affinity from "../lib/affinity.js";
import type * as lib_aiBudget from "../lib/aiBudget.js";
import type * as lib_domain from "../lib/domain.js";
import type * as lib_effort from "../lib/effort.js";
import type * as lib_fit from "../lib/fit.js";
import type * as lib_importJobs from "../lib/importJobs.js";
import type * as lib_outcomes from "../lib/outcomes.js";
import type * as lib_prequal from "../lib/prequal.js";
import type * as lib_referral from "../lib/referral.js";
import type * as lib_rubric from "../lib/rubric.js";
import type * as lib_session from "../lib/session.js";
import type * as liveRoles from "../liveRoles.js";
import type * as outcomes from "../outcomes.js";
import type * as profiles from "../profiles.js";
import type * as referrals from "../referrals.js";
import type * as roles from "../roles.js";
import type * as screenings from "../screenings.js";
import type * as seedData from "../seedData.js";
import type * as swipes from "../swipes.js";
import type * as talent from "../talent.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  admin: typeof admin;
  aiUsage: typeof aiUsage;
  auth: typeof auth;
  "lib/activity": typeof lib_activity;
  "lib/adminStats": typeof lib_adminStats;
  "lib/affinity": typeof lib_affinity;
  "lib/aiBudget": typeof lib_aiBudget;
  "lib/domain": typeof lib_domain;
  "lib/effort": typeof lib_effort;
  "lib/fit": typeof lib_fit;
  "lib/importJobs": typeof lib_importJobs;
  "lib/outcomes": typeof lib_outcomes;
  "lib/prequal": typeof lib_prequal;
  "lib/referral": typeof lib_referral;
  "lib/rubric": typeof lib_rubric;
  "lib/session": typeof lib_session;
  liveRoles: typeof liveRoles;
  outcomes: typeof outcomes;
  profiles: typeof profiles;
  referrals: typeof referrals;
  roles: typeof roles;
  screenings: typeof screenings;
  seedData: typeof seedData;
  swipes: typeof swipes;
  talent: typeof talent;
  users: typeof users;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
