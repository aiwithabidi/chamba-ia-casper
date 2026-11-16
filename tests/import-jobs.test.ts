import { describe, expect, test } from "bun:test";
import {
  categoryOf,
  collapseNearDuplicates,
  dropReason,
  importJobs,
  payOf,
  type ScrapedJob,
  toRole,
  variantOf,
} from "../convex/lib/importJobs";

const job = (over: Partial<ScrapedJob> = {}): ScrapedJob => ({
  platform: "Mercor",
  jobId: "abc123",
  title: "Spanish Linguistic Expert",
  payMin: 40,
  payMax: 40,
  payPeriod: "hour",
  payText: "$40/hr",
  location: "Remote",
  eligibleCountries: null,
  postedAt: "2026-11-13T14:14:35Z",
  url: "https://example.com/job",
  description: "",
  workArrangement: "remote",
  ...over,
});

describe("dropReason", () => {
  test("keeps a remote Spanish job", () => {
    expect(dropReason(job())).toBeNull();
  });

  test("drops non-Spanish titles unless the description requires Spanish", () => {
    expect(dropReason(job({ title: "Korean Bilingual Expert" }))).toBe("not-spanish");
    expect(
      dropReason(job({ title: "Translation Rater", description: "Must be fluent in Spanish." })),
    ).toBeNull();
  });

  test("keeps LATAM-titled jobs without the word Spanish", () => {
    expect(dropReason(job({ title: "At-Home Video Recorder (LATAM)" }))).toBeNull();
  });

  test("drops US-only roles by title, eligibility or US-city location", () => {
    expect(dropReason(job({ title: "Audiobook QA Expert — Spanish (US)" }))).toBe("us-only");
    expect(
      dropReason(job({ location: "Sunnyvale, CA, Boston, MA", eligibleCountries: ["US"] })),
    ).toBe("us-only");
    expect(dropReason(job({ location: "San Mateo, California, United States" }))).toBe("us-only");
  });

  test("a LATAM country in the location overrides a stray US eligibility entry", () => {
    expect(
      dropReason(
        job({ location: "Remote, Argentina, Mexico, United States", eligibleCountries: ["US"] }),
      ),
    ).toBeNull();
  });

  test("drops Spain-only and Castilian roles", () => {
    expect(dropReason(job({ title: "Spanish EI Audio - Castilian Spanish Speaker" }))).toBe(
      "spain-only",
    );
    expect(
      dropReason(
        job({
          title: "Spanish Workspace Evaluator",
          location: "Remote (Madrid)",
          eligibleCountries: ["ES"],
        }),
      ),
    ).toBe("spain-only");
  });

  test("drops salaried and non-AI roles", () => {
    expect(
      dropReason(
        job({ title: "Spanish Data Lead", payPeriod: "year", payMin: 35000, payMax: 50000 }),
      ),
    ).toBe("non-ai");
    expect(dropReason(job({ title: "Customer Support Agent (Fluent in Spanish)" }))).toBe("non-ai");
  });

  test("drops a Spanish job fixed to a non-LATAM city", () => {
    expect(dropReason(job({ location: "Tokyo, Japan" }))).toBe("not-latam");
  });
});

describe("categoryOf", () => {
  test.each([
    ["Spanish (Spain) Audio Transcriptionist", "transcripcion"],
    ["Voice Actor - Spanish (Mexico)", "voz"],
    ["Remote Work From Home: Record Chilean Spanish", "voz"],
    ["Mathematics Specialist (Fluent in Spanish)", "tecnico"],
    ["LaTex Specialist (Fluent in Spanish)", "tecnico"],
    ["Science Specialist (Fluent in Spanish)", "expertos"],
    ["Analista de Negocios", "expertos"],
    ["At-Home Video Recorder (LATAM)", "evaluacion"],
    ["Ads Quality Rater - Spanish", "evaluacion"],
  ])("%s -> %s", (title, category) => {
    expect(categoryOf(title)).toBe(category as ReturnType<typeof categoryOf>);
  });
});

describe("variantOf", () => {
  test("reads the dialect from the title first", () => {
    expect(
      variantOf(
        job({ title: "Spanish (Rioplatense — Argentina/Uruguay) Expert", location: "Mexico" }),
      ),
    ).toBe("ar");
  });

  test("falls back to a single-country location, accent-insensitive", () => {
    expect(variantOf(job({ location: "Mexico City, Mexico" }))).toBe("mx");
    expect(variantOf(job({ location: "Lima, Perú" }))).toBe("pe");
  });

  test("several countries or none is general", () => {
    expect(variantOf(job({ location: "Santiago, Chile, Mexico" }))).toBe("general");
    expect(variantOf(job())).toBe("general");
  });
});

describe("payOf", () => {
  test("keeps a sane hourly range", () => {
    expect(payOf(job({ payMin: 15, payMax: 35 }))).toEqual({ payMin: 15, payMax: 35 });
  });

  test("an 'up to' rate becomes payMax with the hasta note", () => {
    expect(payOf(job({ payMin: null, payMax: 40, payText: "Up to $40/hr" }))).toEqual({
      payMax: 40,
      payNote: "hasta",
    });
  });

  test("an hourly figure over 200 falls back to a trimmed note", () => {
    const text = "$100/hour, up to $2,400 for the full study across several sessions";
    const pay = payOf(job({ payMin: 100, payMax: 2400, payText: text }));
    expect(pay.payMax).toBeUndefined();
    expect(pay.payNote?.length).toBeLessThanOrEqual(40);
    expect(text.startsWith(pay.payNote!.replace(/…$/, ""))).toBe(true);
  });

  test("non-hourly pay keeps only the note; sub-dollar junk keeps nothing", () => {
    expect(payOf(job({ payPeriod: null, payMin: 11, payMax: 30, payText: "$11-30" }))).toEqual({
      payNote: "$11-30",
    });
    expect(
      payOf(job({ payPeriod: "one-time", payMin: 0.03, payMax: 0.03, payText: "$0.03 one-time" })),
    ).toEqual({});
  });
});

describe("toRole", () => {
  test("keeps the posted title untranslated and builds slug and date", () => {
    const r = toRole(job({ platform: "Meridial (Invisible)", title: " Analista de Negocios " }));
    expect(r.titleEs).toBe("Analista de Negocios");
    expect(r.titleOriginal).toBe(r.titleEs);
    expect(r.slug).toBe("meridial-invisible-abc123");
    expect(r.posted).toBe("2026-11-13");
  });

  test("onsite in a country is not remote; remote wording overrides", () => {
    expect(toRole(job({ workArrangement: "onsite", location: "Lima" })).remote).toBe(false);
    expect(
      toRole(job({ workArrangement: "onsite", title: "Remote Work From Home: Record Spanish" }))
        .remote,
    ).toBe(true);
  });
});

describe("collapseNearDuplicates", () => {
  const role = (slug: string, posted: string, over: Partial<ReturnType<typeof toRole>> = {}) => ({
    ...toRole(job({ jobId: slug })),
    slug,
    posted,
    ...over,
  });

  test("same platform + category + variant + pay keeps only the earliest posted", () => {
    const out = collapseNearDuplicates([
      role("a", "2025-12-17"),
      role("b", "2025-12-16"),
      role("c", "2025-12-18"),
    ]);
    expect(out.map((r) => r.slug)).toEqual(["b"]);
  });

  test("an undated row loses to a dated one; equal dates keep the first", () => {
    expect(
      collapseNearDuplicates([role("a", "sin fecha"), role("b", "2025-01-01")]).map((r) => r.slug),
    ).toEqual(["b"]);
    expect(
      collapseNearDuplicates([role("a", "2025-01-01"), role("b", "2025-01-01")]).map((r) => r.slug),
    ).toEqual(["a"]);
  });

  test("a different pay or variant is a different card", () => {
    const out = collapseNearDuplicates([
      role("a", "2025-01-01"),
      role("b", "2025-01-01", { payMax: 50 }),
      role("c", "2025-01-01", { variant: "mx" }),
    ]);
    expect(out.map((r) => r.slug)).toEqual(["a", "b", "c"]);
  });

  test("roles with no published pay are never merged", () => {
    const unpaid = { payMin: undefined, payMax: undefined };
    expect(
      collapseNearDuplicates([role("a", "2025-01-01", unpaid), role("b", "2025-01-01", unpaid)]),
    ).toHaveLength(2);
  });
});

describe("importJobs", () => {
  test("dedupes by platform + normalized title and counts each drop reason", () => {
    const { roles, dropped } = importJobs([
      job({ jobId: "a" }),
      job({ jobId: "b", title: "spanish linguistic  expert!" }),
      job({ jobId: "c", platform: "Turing" }),
      job({ jobId: "d", title: "Korean Bilingual Expert" }),
    ]);
    expect(roles.map((r) => r.slug)).toEqual(["mercor-a", "turing-c"]);
    expect(dropped.duplicate).toBe(1);
    expect(dropped["not-spanish"]).toBe(1);
  });

  test("collapses near-duplicate titles with the same pay into the earliest posting", () => {
    const { roles, dropped } = importJobs([
      job({
        jobId: "late",
        title: "Voice Talent - Spanish (Mexico)",
        postedAt: "2025-12-17T00:00:00Z",
      }),
      job({
        jobId: "early",
        title: "Voice Actor - Spanish (Mexico)",
        postedAt: "2025-12-16T00:00:00Z",
      }),
    ]);
    expect(roles.map((r) => r.slug)).toEqual(["mercor-early"]);
    expect(dropped["near-duplicate"]).toBe(1);
  });
});
