// Filters scraped AI-training jobs down to roles for Spanish speakers a LATAM worker can take,
// and maps each to a deck row. Titles stay as posted (no translation). Pure: used by scripts/import-jobs.ts.
import { type Category, COUNTRIES, type SeedRole, type Variant } from "./domain";

export type ScrapedJob = {
  platform: string;
  jobId: string;
  title: string;
  payMin: number | null;
  payMax: number | null;
  payPeriod: string | null;
  payText: string | null;
  location: string | null;
  eligibleCountries: string[] | null;
  postedAt: string | null;
  url: string;
  description: string | null;
  workArrangement: string | null;
};

export type DropReason =
  | "not-spanish"
  | "non-ai"
  | "spain-only"
  | "us-only"
  | "not-latam"
  | "duplicate"
  | "near-duplicate";

const SPANISH_TITLE = /spanish|español|espanol|latam|latin america/i;
const SPANISH_DESC =
  /(fluen\w*|native|proficien\w*)\s+(in\s+)?spanish|spanish\s+(fluency|proficiency|native|speaker)/i;
const NON_AI_TITLE = /headhunter|recruit|customer (success|support)/i;
const SPAIN_TITLE = /spain|castilian|peninsular/i;
const US_TITLE = /united states|\(us\)/i;
const LATAM_PLACE =
  /latam|latin america|mexic|méxico|colombia|argentin|chile|\bper[uú]\b|venezuel|ecuador|bolivia|uruguay|paraguay|costa rica|panam|guatemala|honduras|salvador|nicaragua|dominican|puerto rico|cuba/i;
const LATAM_CODES = new Set(
  "MX MEX CO COL AR ARG CL CHL PE PER VE VEN EC ECU BO BOL UY URY PY PRY CR CRI PA PAN GT GTM HN HND SV SLV NI NIC DO DOM PR PRI CU CUB".split(
    " ",
  ),
);
const SPAIN_CODES = new Set(["ES", "ESP", "SPAIN"]);
const US_CODES = new Set(["US", "USA", "UNITED STATES"]);
const OPEN_LOCATION = /remote|worldwide|world wide|international/i;

const codes = (j: ScrapedJob) => (j.eligibleCountries ?? []).map((c) => c.trim().toUpperCase());
const onlyIn = (j: ScrapedJob, set: Set<string>) =>
  codes(j).length > 0 && codes(j).every((c) => set.has(c));
const latamPlace = (j: ScrapedJob) =>
  LATAM_PLACE.test(j.location ?? "") || codes(j).some((c) => LATAM_CODES.has(c));

/** Why a job is dropped, or null when it belongs in the deck (duplicates are handled by importJobs). */
export function dropReason(
  j: ScrapedJob,
): Exclude<DropReason, "duplicate" | "near-duplicate"> | null {
  if (!SPANISH_TITLE.test(j.title) && !SPANISH_DESC.test(j.description ?? "")) return "not-spanish";
  if (j.payPeriod === "year" || NON_AI_TITLE.test(j.title)) return "non-ai";
  const loc = j.location ?? "";
  // A LATAM place in location/eligibleCountries wins over a stray US or Spain entry in the same list.
  if (
    SPAIN_TITLE.test(j.title) ||
    (!latamPlace(j) && (onlyIn(j, SPAIN_CODES) || /spain|madrid/i.test(loc)))
  )
    return "spain-only";
  if (
    US_TITLE.test(j.title) ||
    (!latamPlace(j) && (onlyIn(j, US_CODES) || /united states/i.test(loc) || /\bUSA?\b/.test(loc)))
  )
    return "us-only";
  if (latamPlace(j) || OPEN_LOCATION.test(loc) || loc.trim() === "") return null;
  return "not-latam";
}

/** Deterministic keyword map onto the deck categories; first match wins. */
export function categoryOf(title: string): Category {
  if (/transcri/i.test(title)) return "transcripcion";
  if (/\bcod(e|ing)\b|math|\bstem\b|latex|software|engineer/i.test(title)) return "tecnico";
  if (/scien|financ|business|negocios|legal|\blaw/i.test(title)) return "expertos";
  if (/video/i.test(title)) return "evaluacion"; // video data collection, not voice work
  if (/voice|\bvo\b|speech|audio|record|locu/i.test(title)) return "voz";
  return "evaluacion";
}

const TITLE_VARIANTS: [RegExp, Variant][] = [
  [/mexic/i, "mx"],
  [/colombia/i, "co"],
  [/argentin|rioplatense/i, "ar"],
  [/chile/i, "cl"],
  [/peru|andean/i, "pe"],
  [/venezuel|caribbean|puerto rico|dominican/i, "caribe"],
  [/costa ric/i, "cr"],
  [/latin america|latam/i, "latam"],
];

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Dialect from the title first, then a single-country location or eligibility list, else general. */
export function variantOf(j: ScrapedJob): Variant {
  const fromTitle = TITLE_VARIANTS.find(([re]) => re.test(j.title))?.[1];
  if (fromTitle) return fromTitle;
  const loc = fold(j.location ?? "");
  const hits = COUNTRIES.filter((c) => codes(j).includes(c.code) || loc.includes(fold(c.label)));
  return hits.length === 1 ? hits[0].variant : "general";
}

/** Hourly USD range when sane (≤ 200/h); otherwise the posted pay text as a short note; junk (< $1) is omitted. */
export function payOf(j: ScrapedJob): Pick<SeedRole, "payMin" | "payMax" | "payNote"> {
  const { payMin, payMax } = j;
  if (payMax !== null && payMax < 1) return {};
  if (
    j.payPeriod === "hour" &&
    payMax !== null &&
    payMax <= 200 &&
    (payMin === null || (payMin > 0 && payMin <= payMax))
  ) {
    if (payMin === null)
      return /up to/i.test(j.payText ?? "") ? { payMax, payNote: "hasta" } : { payMax };
    return { payMin, payMax };
  }
  const text = (j.payText ?? "").trim();
  if (!text) return {};
  return { payNote: text.length > 40 ? `${text.slice(0, 39).trimEnd()}…` : text };
}

const slugPart = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const normTitle = (s: string) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function toRole(j: ScrapedJob): SeedRole {
  const title = j.title.trim();
  return {
    slug: `${slugPart(j.platform)}-${j.jobId}`,
    platform: j.platform,
    titleEs: title,
    titleOriginal: title,
    category: categoryOf(title),
    variant: variantOf(j),
    remote:
      j.workArrangement !== "onsite" ||
      /remote|work from home/i.test(`${title} ${j.location ?? ""}`),
    posted: j.postedAt ? j.postedAt.slice(0, 10) : "sin fecha",
    url: j.url,
    ...payOf(j),
  };
}

/**
 * Collapses near-duplicates: same platform + category + variant + published pay keeps one card,
 * the earliest posted (ties and undated keep the first). Roles with no published pay are never merged,
 * since "no pay" says nothing about whether two postings are the same job.
 */
export function collapseNearDuplicates(roles: SeedRole[]): SeedRole[] {
  const keyOf = (r: SeedRole) =>
    r.payMax === undefined
      ? null
      : [r.platform, r.category, r.variant, r.payMin ?? "", r.payMax].join("|");
  const dated = (r: SeedRole) => (/^\d{4}-\d{2}-\d{2}$/.test(r.posted) ? r.posted : "9999");
  const keep = new Map<string, SeedRole>();
  for (const r of roles) {
    const key = keyOf(r);
    if (key === null) continue;
    const cur = keep.get(key);
    if (!cur || dated(r) < dated(cur)) keep.set(key, r);
  }
  return roles.filter((r) => {
    const key = keyOf(r);
    return key === null || keep.get(key) === r;
  });
}

/** Kept rows (first of each platform + normalized title, then near-duplicates collapsed) and drop counts by reason. */
export function importJobs(jobs: ScrapedJob[]): {
  roles: SeedRole[];
  dropped: Record<DropReason, number>;
} {
  const dropped: Record<DropReason, number> = {
    "not-spanish": 0,
    "non-ai": 0,
    "spain-only": 0,
    "us-only": 0,
    "not-latam": 0,
    duplicate: 0,
    "near-duplicate": 0,
  };
  const seen = new Set<string>();
  const roles: SeedRole[] = [];
  for (const j of jobs) {
    const reason = dropReason(j);
    if (reason) {
      dropped[reason] += 1;
      continue;
    }
    const key = `${j.platform}|${normTitle(j.title)}`;
    if (seen.has(key)) {
      dropped.duplicate += 1;
      continue;
    }
    seen.add(key);
    roles.push(toRole(j));
  }
  const collapsed = collapseNearDuplicates(roles);
  dropped["near-duplicate"] = roles.length - collapsed.length;
  return { roles: collapsed, dropped };
}
