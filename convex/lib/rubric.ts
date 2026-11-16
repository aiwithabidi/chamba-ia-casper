// Quality rubric. Multiple choice measures domain knowledge and detail (deterministic); the AI judges only
// free text: did they follow the stated constraint, and is their Spanish accurate. Code computes the overall score.
import type { Category } from "./domain";

export const RUBRIC = [
  { key: "instrucciones", label: "Sigue instrucciones", weight: 0.3 }, // AI, free text
  { key: "espanol", label: "Español preciso", weight: 0.25 }, // AI, free text
  { key: "conocimiento", label: "Conocimiento y detalle", weight: 0.45 }, // multiple-choice pre-qualifier
] as const;

export type RubricKey = (typeof RUBRIC)[number]["key"];
export type RubricItem = { key: string; score: number; evidence: string };

/** One bar for every dimension threshold behind "También encajas en N trabajos más". */
export const QUALIFY_BAR = 72;

/** A dimension counts as a strength from this score up. */
export const STRENGTH_MIN = 70;

/** Labels of the dimensions the candidate actually did well on; empty when none. */
export function strengthsOf(rubric: RubricItem[]): string[] {
  return RUBRIC.filter(
    (d) => (rubric.find((r) => r.key === d.key)?.score ?? 0) >= STRENGTH_MIN,
  ).map((d) => d.label);
}

/** The pre-qualifier result as a rubric item; null until the worker has taken it. */
export function knowledgeItem(correct: number | undefined, total: number): RubricItem | null {
  if (correct === undefined) return null;
  return {
    key: "conocimiento",
    score: Math.round((correct / total) * 100),
    evidence: `${correct} de ${total} correctas en la prueba de opción múltiple`,
  };
}

/** Weighted 0-100 score over the dimensions present (renormalized when the pre-qualifier is missing). */
export function overall(rubric: RubricItem[]): number {
  const present = RUBRIC.flatMap((d) => {
    const item = rubric.find((r) => r.key === d.key);
    return item ? [{ weight: d.weight, score: item.score }] : [];
  });
  const weight = present.reduce((s, p) => s + p.weight, 0);
  return weight === 0
    ? 0
    : Math.round(present.reduce((s, p) => s + p.weight * p.score, 0) / weight);
}

export type Qualification = { category: Category; reason: string };

/** Categories a graded interview proves the candidate for. A missing dimension never qualifies. */
export function qualifiesFor(
  rubric: RubricItem[],
  profile: { equipment: string[] },
  interviewed: Category,
): Qualification[] {
  const ok = (key: RubricKey) => (rubric.find((r) => r.key === key)?.score ?? 0) >= QUALIFY_BAR;
  const rules: { category: Category; when: boolean; reason: string }[] = [
    {
      category: "transcripcion",
      when: ok("espanol") && ok("conocimiento"),
      reason: "Tu ortografía y atención al detalle son las que piden en transcripción",
    },
    {
      category: "evaluacion",
      when: ok("instrucciones") && ok("espanol"),
      reason: "Sigues instrucciones y escribes bien: clave para evaluar IA",
    },
    {
      category: "voz",
      when: ok("espanol") && profile.equipment.includes("microfono"),
      reason: "Tu español es claro y tienes micrófono",
    },
    {
      category: "expertos",
      when: interviewed === "expertos" && ok("conocimiento"),
      reason: "Demostraste conocimiento del área",
    },
    {
      category: "tecnico",
      when: interviewed === "tecnico" && ok("conocimiento"),
      reason: "Demostraste conocimiento del área",
    },
  ];
  return rules.filter((r) => r.when).map(({ category, reason }) => ({ category, reason }));
}
