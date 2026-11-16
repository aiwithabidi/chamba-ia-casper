"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { RUBRIC } from "../../convex/lib/rubric";
import { PillLink } from "./ui";

type MoreRoles = {
  count: number;
  top: { roleId: string; titleEs: string; platform: string; category: string; reason: string }[];
};

// Per-dimension rubric scores and quotes are stored for the operator, never shown to the worker.
type Card = { level: string; strengths: string[]; moreRoles?: MoreRoles };

// Only real dimension strengths; older rows may still hold filler like "Completa las tareas".
const DIMENSION_LABELS = new Set<string>(RUBRIC.map((d) => d.label));

// provenOn: platforms of operator-verified placements (a screenshot the team reviewed), shown as earned badges.
export function TalentCard({
  name,
  card,
  score,
  provenOn = [],
}: {
  name?: string;
  card: Card;
  score?: number;
  provenOn?: string[];
}) {
  const more = card.moreRoles;
  const strengths = card.strengths.filter((s) => DIMENSION_LABELS.has(s));
  return (
    <div className="space-y-4 rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted uppercase">
            Tarjeta de talento
          </p>
          {name && <p className="text-2xl font-extrabold">{name}</p>}
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
          {card.level}
        </span>
      </div>
      {score !== undefined && (
        <p className="text-[44px] leading-none font-extrabold">
          {score}
          <span className="text-lg text-muted">/100</span>
        </p>
      )}
      {strengths.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {strengths.map((s) => (
            <span key={s} className="rounded-full bg-like/15 px-3 py-1 text-sm text-like">
              ✓ {s}
            </span>
          ))}
        </div>
      )}
      {provenOn.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {provenOn.map((p) => (
            <span
              key={p}
              className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary"
            >
              Colocación verificada · {p}
            </span>
          ))}
        </div>
      )}
      {more && more.count > 0 && (
        <div className="space-y-2 border-t border-line pt-4">
          <p className="font-bold">Más trabajos donde encajas ({more.count})</p>
          <p className="text-sm text-muted">{more.top[0].reason}</p>
          <ul className="space-y-1.5">
            {more.top.map((r) => (
              <li key={r.roleId}>
                <Link
                  href={`/entrevista/${r.roleId}`}
                  className="flex justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-sm"
                >
                  <span className="font-semibold">{r.titleEs}</span>
                  <span className="shrink-0 text-muted">{r.platform} ›</span>
                </Link>
              </li>
            ))}
          </ul>
          <PillLink href={`/explorar/${more.top[0].category}`} variant="secondary" size="sm">
            Ver todos
            <ChevronRight size={16} strokeWidth={2} aria-hidden />
          </PillLink>
        </div>
      )}
    </div>
  );
}
