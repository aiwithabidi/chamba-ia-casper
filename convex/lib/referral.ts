/** Referral rules: each user invites up to MAX_REFERRALS friends, $5 per signup. */
export const MAX_REFERRALS = 3;
export const REFERRAL_CENTS = 500;

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ"; // no 0/O, 1/I/L, U
const CODE_LEN = 6;
const CODE_RE = new RegExp(`^[${ALPHABET}]{${CODE_LEN}}$`);

/** Deterministic short invite code from a user id (FNV-1a, 32-bit). */
export function codeFor(userId: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    h ^= userId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length) ^ (Math.imul(h, 0x9e3779b1) >>> 0);
    h >>>= 0;
  }
  return out;
}

/** Cleans a code from a URL or paste; null when it cannot be a valid code. */
export function normalizeCode(raw: string | null | undefined): string | null {
  const code = (raw ?? "").trim().toUpperCase();
  return CODE_RE.test(code) ? code : null;
}

export function canCredit(r: {
  count: number;
  inviterId: string;
  referredId: string;
  alreadyReferred: boolean;
}): boolean {
  return r.inviterId !== r.referredId && !r.alreadyReferred && r.count < MAX_REFERRALS;
}
