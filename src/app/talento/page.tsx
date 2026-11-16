"use client";

import { useQuery } from "convex/react";
import { CandidateList } from "@/components/candidate-list";
import { ProofReview } from "@/components/proof-review";
import { BackButton, SectionLabel } from "@/components/ui";
import { api } from "../../../convex/_generated/api";

function Bars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="space-y-2 rounded-tile bg-surface p-4">
      <SectionLabel>{title}</SectionLabel>
      {rows.length === 0 && <p className="text-sm text-muted">Sin datos aún</p>}
      {rows.slice(0, 6).map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="tabular-nums text-muted">{r.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div className="bg-accent h-full" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function Talento() {
  const pool = useQuery(api.talent.pool);
  const outcomes = useQuery(api.outcomes.stats);
  return (
    <main className="pt-safe pb-safe screen flex flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-1 px-4 pb-3">
        <BackButton href="/" />
        <h1 className="text-2xl font-bold tracking-tight">Comunidad de testers</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-4 px-4 pb-4">
        <p className="text-muted">
          El ejército de testers de IA en español, en vivo. Solo datos agregados.
        </p>
        {pool && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Testers", pool.testers],
                ["Horas/semana", pool.hours],
                ["Pre-entrevistas", pool.screenings],
                ["Puntaje medio", pool.avgScore ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-tile bg-surface p-4">
                  <p className="text-3xl font-bold tracking-tight tabular-nums">{v}</p>
                  <p className="text-sm text-muted">{k}</p>
                </div>
              ))}
            </div>
            {outcomes && (
              <section className="space-y-3 rounded-tile bg-surface p-4">
                <SectionLabel>Colocaciones</SectionLabel>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-4xl font-bold tracking-tight tabular-nums">
                    {outcomes.verified}
                  </span>
                  <span className="font-semibold">colocaciones verificadas</span>
                  <span className="text-sm text-muted tabular-nums">
                    · {outcomes.selfReported} autorreportadas
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ["Clics a Postular", outcomes.clicks],
                    ["Postularon", outcomes.applied],
                    [
                      "Tasa verificada",
                      outcomes.placementRate === null
                        ? "—"
                        : `${Math.round(outcomes.placementRate * 100)}%`,
                    ],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-2xl font-bold tracking-tight tabular-nums">{v}</p>
                      <p className="text-xs text-muted">{k}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted">
                  Tasa = verificadas / postularon. Solo cuentan las colocaciones con captura
                  revisada por el equipo.
                </p>
              </section>
            )}
            <ProofReview />
            <CandidateList />
            <Bars title="Por país" rows={pool.byCountry} />
            <Bars title="Por variante" rows={pool.byVariant} />
            <Bars title="Por tipo de trabajo" rows={pool.byCategory} />
            <Bars title="Habilidades" rows={pool.bySkill} />
          </>
        )}
      </div>
    </main>
  );
}
