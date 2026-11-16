import { describe, expect, test } from "bun:test";
import {
  knowledgeItem,
  overall,
  QUALIFY_BAR,
  qualifiesFor,
  type RubricItem,
  STRENGTH_MIN,
  strengthsOf,
} from "../convex/lib/rubric";

const item = (key: string, score: number): RubricItem => ({ key, score, evidence: "" });
const r = (instrucciones: number, espanol: number, conocimiento?: number): RubricItem[] => [
  item("instrucciones", instrucciones),
  item("espanol", espanol),
  ...(conocimiento === undefined ? [] : [item("conocimiento", conocimiento)]),
];
const cats = (xs: { category: string }[]) => xs.map((x) => x.category).sort();
const mic = { equipment: ["microfono"] };
const noMic = { equipment: [] };

describe("knowledgeItem", () => {
  test("turns multiple-choice correct answers into a 0-100 score with a reason", () => {
    expect(knowledgeItem(3, 3)?.score).toBe(100);
    expect(knowledgeItem(2, 3)?.score).toBe(67);
    expect(knowledgeItem(0, 3)?.score).toBe(0);
    expect(knowledgeItem(2, 3)?.evidence).toContain("2 de 3");
  });

  test("no pre-qualifier yet means no knowledge item", () => {
    expect(knowledgeItem(undefined, 3)).toBeNull();
  });
});

describe("overall", () => {
  test("weights: instructions 30, Spanish 25, multiple-choice knowledge 45", () => {
    expect(overall(r(100, 0, 0))).toBe(30);
    expect(overall(r(0, 100, 0))).toBe(25);
    expect(overall(r(0, 0, 100))).toBe(45);
    expect(overall(r(100, 100, 100))).toBe(100);
  });

  test("rounds the weighted sum", () => {
    expect(overall(r(81, 70, 67))).toBe(72); // 24.3 + 17.5 + 30.15 = 71.95
  });

  test("without a pre-qualifier, renormalizes over the AI parts", () => {
    expect(overall(r(100, 0))).toBe(55); // 0.3 / 0.55
    expect(overall(r(80, 80))).toBe(80);
  });

  test("an empty rubric scores 0", () => {
    expect(overall([])).toBe(0);
  });
});

describe("strengthsOf", () => {
  test("lists only dimensions at or above 70, by label", () => {
    expect(strengthsOf(r(STRENGTH_MIN, STRENGTH_MIN - 1, 100))).toEqual([
      "Sigue instrucciones",
      "Conocimiento y detalle",
    ]);
  });

  test("a weak interview has no strengths at all", () => {
    expect(strengthsOf(r(10, 20, 0))).toEqual([]);
  });
});

describe("qualifiesFor", () => {
  test("strong Spanish plus a perfect multiple-choice check unlocks transcription", () => {
    expect(cats(qualifiesFor(r(0, QUALIFY_BAR, QUALIFY_BAR), noMic, "evaluacion"))).toEqual([
      "transcripcion",
    ]);
    expect(qualifiesFor(r(0, QUALIFY_BAR), noMic, "evaluacion")).toEqual([]);
  });

  test("one point under the bar unlocks nothing", () => {
    expect(
      qualifiesFor(r(QUALIFY_BAR - 1, QUALIFY_BAR - 1, QUALIFY_BAR - 1), mic, "expertos"),
    ).toEqual([]);
  });

  test("instructions and Spanish unlock AI evaluation", () => {
    expect(cats(qualifiesFor(r(QUALIFY_BAR, QUALIFY_BAR), noMic, "voz"))).toEqual(["evaluacion"]);
    expect(qualifiesFor(r(100, QUALIFY_BAR - 1), noMic, "voz")).toEqual([]);
  });

  test("voice needs clear Spanish and a mic", () => {
    expect(cats(qualifiesFor(r(0, QUALIFY_BAR), mic, "evaluacion"))).toEqual(["voz"]);
    expect(qualifiesFor(r(0, QUALIFY_BAR), noMic, "evaluacion")).toEqual([]);
  });

  test("domain knowledge counts only for expert and technical interviews", () => {
    expect(cats(qualifiesFor(r(0, 0, QUALIFY_BAR), noMic, "tecnico"))).toEqual(["tecnico"]);
    expect(cats(qualifiesFor(r(0, 0, QUALIFY_BAR), noMic, "expertos"))).toEqual(["expertos"]);
    expect(qualifiesFor(r(0, 0, 100), noMic, "voz")).toEqual([]);
  });

  test("every match carries a Spanish reason", () => {
    for (const m of qualifiesFor(r(100, 100, 100), mic, "tecnico"))
      expect(m.reason.length).toBeGreaterThan(10);
  });
});
