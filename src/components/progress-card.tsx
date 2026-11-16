"use client";

import { useQuery } from "convex/react";
import { Check } from "lucide-react";
import { SectionLabel } from "@/components/ui";
import { api } from "../../convex/_generated/api";

// Same pass mark as convex/lib/prequal.ts (PREQUAL_PASS) and the prequal modal; importing that file would ship the answer key.
const PREQUAL_PASS = 2;

/** Perfil → "Tu progreso": where the worker stands, from data the app already records. No money. */
export function ProgressCard() {
  const saved = useQuery(api.swipes.saved);
  const card = useQuery(api.screenings.myCard);
  const apps = useQuery(api.outcomes.mine);
  if (saved === undefined || card === undefined || apps === undefined) return null;

  const prequalPassed = saved.filter((r) => (r.prequal ?? 0) >= PREQUAL_PASS).length;
  const interviews = card?.interviews ?? 0;
  const steps = [
    { label: "Guarda un trabajo", done: saved.length > 0 },
    { label: "Pasa las 3 preguntas", done: prequalPassed > 0 },
    { label: "Completa una pre-entrevista", done: interviews > 0 },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const stats = [
    { n: prequalPassed, label: "Pre-calificaciones aprobadas" },
    { n: interviews, label: "Pre-entrevistas hechas" },
    { n: apps.applied, label: "Postulaciones" },
    { n: apps.accepted, label: "Aceptaciones" },
  ];

  return (
    <section
      id="progreso"
      data-tour="progress"
      className="scroll-mt-20 space-y-4 rounded-card bg-surface p-5"
    >
      <SectionLabel>Tu progreso</SectionLabel>

      <dl className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse rounded-tile bg-surface-2 px-4 py-3">
            <dt className="mt-1 text-sm leading-snug text-muted">{s.label}</dt>
            <dd className="text-[28px] leading-none font-bold tracking-tight tabular-nums">
              {s.n}
            </dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {card ? "Tarjeta de talento desbloqueada" : "Hacia tu tarjeta de talento"}
          <span className="ml-1 font-normal text-muted tabular-nums">
            {doneCount}/{steps.length}
          </span>
        </p>
        <div
          role="progressbar"
          aria-label="Hacia tu tarjeta de talento"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          className="h-2 overflow-hidden rounded-full bg-bg"
        >
          <div
            className="bg-accent h-full transition-[width] duration-300 ease-out"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-1.5 pt-1">
          {steps.map((s) => (
            <li
              key={s.label}
              className={`flex items-center gap-2.5 text-sm ${s.done ? "" : "text-muted"}`}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full ${s.done ? "bg-accent text-bg" : "border border-line"}`}
              >
                {s.done && <Check size={12} strokeWidth={3} aria-hidden />}
              </span>
              {s.label}
              <span className="sr-only">{s.done ? " (hecho)" : " (pendiente)"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
