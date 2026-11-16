import { describe, expect, test } from "bun:test";
import {
  attachProof,
  due,
  nextAsk,
  type Outcome,
  outcomeStats,
  placementBoost,
  placementRate,
  rankCandidates,
  rateBoost,
  recordClick,
  review,
  roleTallies,
  skipProof,
} from "../convex/lib/outcomes";

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const T0 = 1_700_000_000_000;

const fresh = (): Outcome => recordClick(null, T0);
const answer = (row: Outcome, ...answers: Parameters<typeof nextAsk>[1][]) =>
  answers.reduce((r, a, i) => nextAsk(r, a, T0 + (i + 1) * DAY), row);

describe("recordClick", () => {
  test("a first click is not due right away (returning from the same tab)", () => {
    const row = fresh();
    expect(due([row], T0 + 5 * MIN)).toBeNull();
  });

  test("a first click is due on the next open after 10 minutes", () => {
    expect(due([fresh()], T0 + 10 * MIN)).not.toBeNull();
  });

  test("clicking again on a resolved role keeps it resolved", () => {
    const done = nextAsk(fresh(), "applied_no", T0 + DAY);
    expect(recordClick(done, T0 + 2 * DAY)).toEqual(done);
  });
});

describe("nextAsk", () => {
  test("applied No resolves and is never asked again", () => {
    const row = nextAsk(fresh(), "applied_no", T0 + DAY);
    expect(row.applied).toBe(false);
    expect(due([row], T0 + 365 * DAY)).toBeNull();
  });

  test("applied Yes then accepted Yes resolves as a placement", () => {
    const row = answer(fresh(), "applied_yes", "accepted_si");
    expect(row.accepted).toBe(true);
    expect(due([row], T0 + 365 * DAY)).toBeNull();
  });

  test("accepted No is asked again in 14 days, not before", () => {
    const at = T0 + DAY;
    const row = nextAsk({ ...fresh(), applied: true }, "accepted_no", at);
    expect(due([row], at + 13 * DAY)).toBeNull();
    expect(due([row], at + 14 * DAY)).not.toBeNull();
  });

  test("No and Todavía no sé both re-ask but are stored differently", () => {
    const no = nextAsk(fresh(), "accepted_no", T0);
    const unsure = nextAsk(fresh(), "accepted_no_se", T0);
    expect([no.lastReply, unsure.lastReply]).toEqual(["no", "no_se"]);
    expect(no.askAfter).toBe(unsure.askAfter);
  });

  test("three acceptance answers without a Sí resolve as not accepted", () => {
    const row = answer(fresh(), "applied_yes", "accepted_no_se", "accepted_no_se", "accepted_no");
    expect(row.accepted).toBe(false);
    expect(row.resolvedAt).toBeDefined();
  });

  test("two acceptance answers without a Sí are still pending", () => {
    const row = answer(fresh(), "applied_yes", "accepted_no_se", "accepted_no");
    expect(row.resolvedAt).toBeUndefined();
  });

  test("dismissing asks again tomorrow", () => {
    const row = nextAsk(fresh(), "dismiss", T0 + DAY);
    expect(due([row], T0 + DAY + 23 * 60 * MIN)).toBeNull();
    expect(due([row], T0 + 2 * DAY)).not.toBeNull();
  });

  test("an answer on a resolved row changes nothing", () => {
    const done = answer(fresh(), "applied_yes", "accepted_si");
    expect(nextAsk(done, "accepted_no", T0 + 9 * DAY)).toEqual(done);
  });
});

describe("due", () => {
  test("picks the oldest pending click", () => {
    const older = { ...recordClick(null, T0), id: "a" };
    const newer = { ...recordClick(null, T0 + MIN), id: "b" };
    expect(due([newer, older], T0 + DAY)?.id).toBe("a");
  });

  test("skips resolved rows", () => {
    const done = { ...nextAsk(fresh(), "applied_no", T0), id: "a" };
    const open = { ...recordClick(null, T0 + MIN), id: "b" };
    expect(due([done, open], T0 + DAY)?.id).toBe("b");
  });
});

describe("ranking signals", () => {
  test("boost order: verified > self-reported > none, per category", () => {
    const b = placementBoost([{ category: "voz", verified: true }, { category: "expertos" }]);
    expect(b.voz).toBeGreaterThan(b.expertos);
    expect(b.expertos).toBeGreaterThan(b.tecnico);
    expect(b.tecnico).toBe(0);
  });

  test("a verified placement wins over a self-reported one in the same category", () => {
    const both = placementBoost([{ category: "voz" }, { category: "voz", verified: true }]);
    expect(both.voz).toBe(placementBoost([{ category: "voz", verified: true }]).voz);
  });

  test("a rejected screenshot earns no boost", () => {
    expect(placementBoost([{ category: "voz", verified: false }]).voz).toBe(0);
  });

  test("candidates proven on more platforms sort first; ties keep their order", () => {
    const list = [
      { id: "a", provenOn: [] },
      { id: "b", provenOn: ["X"] },
      { id: "c", provenOn: [] },
      { id: "d", provenOn: ["X", "Y"] },
    ];
    expect(rankCandidates(list).map((c) => c.id)).toEqual(["d", "b", "a", "c"]);
  });

  test("smoothing: one acceptance out of one is not a perfect rate", () => {
    expect(placementRate(1, 1)).toBeCloseTo(2 / 3);
  });

  test("roles with no data and at-or-below even odds get no tie-breaker", () => {
    expect([rateBoost(0, 0), rateBoost(6, 3), rateBoost(4, 0)]).toEqual([0, 0, 0]);
  });

  test("a proven role outranks a single lucky acceptance, and stays under the cap of 5", () => {
    expect(rateBoost(10, 10)).toBeGreaterThan(rateBoost(1, 1));
    expect(rateBoost(1000, 1000)).toBeLessThanOrEqual(5);
  });
});

const placed = () => answer(fresh(), "applied_yes", "accepted_si");

describe("proof of acceptance", () => {
  test("Subir después reminds once, a day later", () => {
    const row = skipProof(placed(), T0 + 10 * DAY);
    expect(due([row], T0 + 10 * DAY + 23 * 60 * MIN)).toBeNull();
    expect(due([row], T0 + 11 * DAY)).not.toBeNull();
  });

  test("a second Subir después stops the reminders", () => {
    const row = skipProof(skipProof(placed(), T0 + 10 * DAY), T0 + 11 * DAY);
    expect(due([row], T0 + 365 * DAY)).toBeNull();
  });

  test("an uploaded screenshot ends the reminder", () => {
    const row = attachProof(skipProof(placed(), T0 + 10 * DAY), "file1");
    expect(due([row], T0 + 365 * DAY)).toBeNull();
  });

  test("only an accepted row takes a screenshot", () => {
    expect(() => attachProof(nextAsk(fresh(), "applied_no", T0), "file1")).toThrow();
  });

  test("a re-upload after a rejection goes back to review", () => {
    const rejected = review(attachProof(placed(), "file1"), false);
    expect(attachProof(rejected, "file2").verified).toBeUndefined();
  });

  test("nothing to review without a screenshot", () => {
    expect(() => review(placed(), true)).toThrow();
  });
});

describe("roleTallies (global rate input)", () => {
  const at = (roleId: string, row: Outcome) => ({ ...row, roleId });

  test("self-reported placements do not move a role's global rate", () => {
    const t = roleTallies([at("r1", placed()), at("r1", placed())]).get("r1");
    expect(t).toEqual({ applied: 2, accepted: 0 });
    expect(rateBoost(t!.applied, t!.accepted)).toBe(0);
  });

  test("verified placements do move it", () => {
    const ok = review(attachProof(placed(), "f"), true);
    const t = roleTallies([at("r1", ok), at("r1", ok)]).get("r1")!;
    expect(rateBoost(t.applied, t.accepted)).toBeGreaterThan(0);
  });

  test("a rejected screenshot does not count", () => {
    const no = review(attachProof(placed(), "f"), false);
    expect(roleTallies([at("r1", no)]).get("r1")).toEqual({ applied: 1, accepted: 0 });
  });

  test("clicks without a confirmed application are not counted", () => {
    expect(roleTallies([at("r1", fresh())]).get("r1")).toBeUndefined();
  });
});

describe("outcomeStats", () => {
  test("headline counts verified placements; self-reported is separate", () => {
    const rows = [
      fresh(),
      nextAsk(fresh(), "applied_no", T0),
      answer(fresh(), "applied_yes", "accepted_no"),
      placed(),
      review(attachProof(placed(), "f"), true),
    ];
    expect(outcomeStats(rows)).toEqual({
      clicks: 5,
      applied: 3,
      verified: 1,
      selfReported: 2,
      placementRate: 1 / 3,
    });
  });

  test("no applications means no rate, not zero", () => {
    expect(outcomeStats([fresh()]).placementRate).toBeNull();
  });
});
