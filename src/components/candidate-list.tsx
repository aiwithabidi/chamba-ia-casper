"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CATEGORY_INFO, COUNTRIES } from "../../convex/lib/domain";
import { SectionLabel } from "./ui";

/** Operator-only candidate view: workers with verified placements first. Renders nothing for everyone else. */
export function CandidateList() {
  const list = useQuery(api.outcomes.candidates);
  if (!list) return null;
  return (
    <section className="space-y-2 rounded-tile bg-surface p-4">
      <SectionLabel>Candidatos · {list.length}</SectionLabel>
      {list.length === 0 && <p className="text-sm text-muted">Sin testers aún.</p>}
      <ul className="divide-y divide-line">
        {list.map((c) => (
          <li key={c._id} className="space-y-1 py-2.5">
            <p className="flex justify-between gap-2">
              <span className="truncate font-semibold">{c.name}</span>
              <span className="shrink-0 text-sm text-muted tabular-nums">
                {c.hoursPerWeek} h/sem
              </span>
            </p>
            <p className="text-[13px] text-muted">
              {COUNTRIES.find((x) => x.code === c.country)?.label ?? c.country} ·{" "}
              {c.jobTypes.map((j) => CATEGORY_INFO[j].label).join(", ")}
            </p>
            {c.provenOn.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {c.provenOn.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary"
                  >
                    Probado en {p}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
