import { describe, expect, test } from "bun:test";
import { canCredit, codeFor, MAX_REFERRALS, normalizeCode } from "../convex/lib/referral";

describe("canCredit", () => {
  const base = { count: 0, inviterId: "u1", referredId: "u2", alreadyReferred: false };

  test("a first referral from a different user is credited", () => {
    expect(canCredit(base)).toBe(true);
  });

  test("the last open slot is still credited", () => {
    expect(canCredit({ ...base, count: MAX_REFERRALS - 1 })).toBe(true);
  });

  test("a full inviter is not credited", () => {
    expect(canCredit({ ...base, count: MAX_REFERRALS })).toBe(false);
  });

  test("self-referral is blocked", () => {
    expect(canCredit({ ...base, referredId: "u1" })).toBe(false);
  });

  test("a user already referred once is not credited again", () => {
    expect(canCredit({ ...base, alreadyReferred: true })).toBe(false);
  });
});

describe("codeFor", () => {
  test("is stable for the same user and differs across users", () => {
    expect(codeFor("k57abc")).toBe(codeFor("k57abc"));
    expect(codeFor("k57abc")).not.toBe(codeFor("k57abd"));
  });

  test("is 6 unambiguous uppercase characters", () => {
    for (const id of ["a", "k57abc", "jd7x9q2m3n4p5r6s"])
      expect(codeFor(id)).toMatch(/^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/);
  });
});

describe("normalizeCode", () => {
  test("accepts a pasted code with spaces and lowercase", () => {
    expect(normalizeCode(" ab3x9k ")).toBe("AB3X9K");
  });

  test("rejects anything that is not a valid code", () => {
    expect(normalizeCode("")).toBeNull();
    expect(normalizeCode("AB3")).toBeNull();
    expect(normalizeCode("AB3X9K!")).toBeNull();
    expect(normalizeCode(null)).toBeNull();
  });
});
