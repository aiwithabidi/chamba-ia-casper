"use client";

import { useQuery } from "convex/react";
import { BackButton, SectionLabel } from "@/components/ui";
import { usd } from "@/lib/money";
import { api } from "../../../../../convex/_generated/api";

export default function Admin() {
  const s = useQuery(api.admin.stats);
  return (
    <>
      <header className="flex shrink-0 items-center gap-1 px-4 pb-3">
        <BackButton href="/perfil" label="Volver a Perfil" />
        <h1 className="text-xl font-bold tracking-tight">Panel de admin</h1>
      </header>
      {s === undefined ? null : s === null ? (
        <p className="px-4 text-muted">Solo para operadores.</p>
      ) : (
        <div className="scroll-body space-y-5 px-4">
          <section className="rounded-card bg-surface p-5">
            <SectionLabel as="p">Enviados que la empresa acepta</SectionLabel>
            <p className="mt-1 text-[44px] leading-none font-bold tracking-tight text-like tabular-nums">
              {s.acceptance.pct}%
            </p>
            <p className="mt-1 text-sm text-muted tabular-nums">
              {s.acceptance.accepted} aceptados (verificados) de {s.acceptance.applied}{" "}
              postulaciones
            </p>
          </section>

          <section className="space-y-3 rounded-card bg-surface p-5">
            <SectionLabel>Embudo</SectionLabel>
            <ol className="space-y-2.5">
              {s.funnel.map((step) => {
                const width = s.totalUsers ? (step.count / s.totalUsers) * 100 : 0;
                return (
                  <li key={step.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold">{step.label}</span>
                      <span className="shrink-0 text-muted tabular-nums">
                        <b className="text-text">{step.count}</b>
                        {` · ${step.pctOfTop}%`}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                      <div className="h-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="text-xs text-muted">% sobre el total de registrados.</p>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Usuarios" value={s.totalUsers} />
            <Stat label="Talento calificado" value={s.qualifiedTalent} />
            <Stat label="Colocaciones aceptadas" value={s.acceptedPlacements} />
            <Stat label="Fit promedio" value={s.avgFit === null ? "—" : `${s.avgFit}%`} />
          </div>

          <section className="space-y-2 rounded-card bg-surface p-5">
            <SectionLabel>Top categorías (calificados)</SectionLabel>
            {s.topCategories.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay talento calificado.</p>
            ) : (
              <ol className="space-y-1 text-sm">
                {s.topCategories.map((c, i) => (
                  <li key={c.label} className="flex justify-between">
                    <span>
                      {i + 1}. {c.label}
                    </span>
                    <span className="text-muted tabular-nums">{c.count}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="space-y-3 rounded-card bg-surface p-5">
            <SectionLabel>Operación IA</SectionLabel>
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">Gasto IA hoy</span>
                <span className="tabular-nums">
                  <b>{usd(s.ai.todayCents)}</b>{" "}
                  <span className="text-muted">de {usd(s.ai.capCents)}</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, (s.ai.todayCents / s.ai.capCents) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Últimos 7 días</p>
              <div className="mt-2 flex h-16 items-end gap-1.5">
                {s.ai.last7.map((d) => (
                  <div key={d.day} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      title={`${d.day}: ${usd(d.cents)}`}
                      className="rounded-t-[4px] bg-primary"
                      style={{
                        height: `${Math.max(2, Math.min(100, (d.cents / s.ai.capCents) * 100))}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Altura = % del tope diario de $3.00.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Llamadas IA hoy" value={s.ai.callsToday} inset />
              <Stat label="Calificadas sin IA" value={s.ai.fallbackGraded} inset />
            </div>
            <p className="text-sm text-muted">
              Disponibilidad: Convex Cloud · estado: status.convex.dev{" "}
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">demo</span>
            </p>
          </section>
        </div>
      )}
    </>
  );
}

function Stat({ label, value, inset }: { label: string; value: number | string; inset?: boolean }) {
  return (
    <div className={`rounded-card p-4 ${inset ? "bg-surface-2" : "bg-surface"}`}>
      <p className="text-[28px] leading-none font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-sm leading-snug text-muted">{label}</p>
    </div>
  );
}
