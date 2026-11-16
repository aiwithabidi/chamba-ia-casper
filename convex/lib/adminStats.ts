// Admin funnel: pure counting over existing rows, so the operator panel is testable without a database.
import { PREQUAL_PASS } from "./prequal";
import { QUALIFY_BAR } from "./rubric";

export type FunnelRows = {
  users: string[];
  profiles: string[];
  swipes: { userId: string; liked: boolean }[];
  prequals: { userId: string; correct: number }[];
  screenings: { userId: string; done: boolean; score?: number }[];
  applications: { userId: string; applied?: boolean; verified?: boolean }[];
};

/** `pctOfTop`: share of all signups that reached this step, so it never exceeds 100%. */
export type FunnelStep = { label: string; count: number; pctOfTop: number };

const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

/** Per-step reach: each step counts the users who did that step at all, as a share of signups. */
export function funnel(rows: FunnelRows): FunnelStep[] {
  const has = (ids: string[]) => new Set(ids);
  const steps: [string, Set<string>][] = [
    ["Se registraron", has(rows.users)],
    ["Completaron perfil", has(rows.profiles)],
    ["Dieron sí a un trabajo", has(rows.swipes.filter((s) => s.liked).map((s) => s.userId))],
    [
      "Pasaron la pre-calificación",
      has(rows.prequals.filter((p) => p.correct >= PREQUAL_PASS).map((p) => p.userId)),
    ],
    [
      "Terminaron la entrevista IA",
      has(rows.screenings.filter((s) => s.done).map((s) => s.userId)),
    ],
    [
      "Calificados",
      has(
        rows.screenings.filter((s) => s.done && (s.score ?? 0) >= QUALIFY_BAR).map((s) => s.userId),
      ),
    ],
    ["Postularon", has(rows.applications.filter((a) => a.applied).map((a) => a.userId))],
    [
      "Aceptados (verificado)",
      has(rows.applications.filter((a) => a.verified === true).map((a) => a.userId)),
    ],
  ];
  return steps.map(([label, set]) => ({
    label,
    count: set.size,
    pctOfTop: pct(set.size, steps[0][1].size),
  }));
}

/** The business metric: of the applications sent, how many the company accepted (operator-verified). */
export function acceptanceRate(applications: FunnelRows["applications"]) {
  const applied = applications.filter((a) => a.applied).length;
  const accepted = applications.filter((a) => a.applied && a.verified === true).length;
  return { applied, accepted, pct: pct(accepted, applied) };
}
