"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronRight, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";
import { type AffinityStatus, HIDE_AFTER_NET_PASSES } from "../../convex/lib/affinity";
import { CATEGORIES, CATEGORY_INFO } from "../../convex/lib/domain";

const CHIP: Record<AffinityStatus, { label: string; className: string }> = {
  mas: { label: "Más", className: "bg-like/15 text-like" },
  menos: { label: "Menos", className: "bg-pass/15 text-pass" },
  oculto: { label: "Oculto", className: "bg-surface-2 text-muted" },
  normal: { label: "Normal", className: "bg-surface-2 text-text" },
};

/** "Tu algoritmo": what the deck shows more, less, or hides, learned from the user's swipes. */
export function AlgorithmPanel() {
  const algo = useQuery(api.roles.algorithm);
  const reset = useMutation(api.swipes.resetCategory);
  if (!algo) return null;

  return (
    <section className="space-y-3 rounded-card bg-surface p-5">
      <div className="space-y-1">
        <p className="text-sm text-muted">
          Aprende de tus swipes: una categoría se oculta cuando sus &quot;no&quot; superan a sus
          &quot;sí&quot; por {HIDE_AFTER_NET_PASSES}.
        </p>
        <p className="text-sm text-muted">
          Si nos muestras que te aceptaron, te recomendamos primero. Proyectos donde otros fueron
          aceptados suben un poco.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {CATEGORIES.map((c) => {
          const a = algo[c];
          const chip = CHIP[a.status];
          return (
            <li key={c} className="flex items-center gap-3 py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/${c}.jpg`}
                alt=""
                className={`size-11 shrink-0 rounded-[12px] object-cover ${a.status === "oculto" ? "opacity-40" : ""}`}
              />
              <div className="min-w-0 flex-1">
                <p className="leading-snug font-semibold text-balance">{CATEGORY_INFO[c].label}</p>
                <p className="text-[13px] text-muted tabular-nums">
                  {a.likes} sí · {a.passes} no
                </p>
              </div>
              {a.status === "oculto" ? (
                <button
                  onClick={() => reset({ category: c })}
                  className="min-h-11 shrink-0 rounded-full border border-line px-3 text-[13px] font-semibold"
                >
                  Mostrar de nuevo
                </button>
              ) : a.likes === a.passes ? null : (
                // A tie (1 sí · 1 no) is no signal yet, so no chip even though the ranking leans down.
                <span
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${chip.className}`}
                >
                  {chip.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Compact Perfil entry to the full panel at /perfil/algoritmo. */
export function AlgorithmRow() {
  const algo = useQuery(api.roles.algorithm);
  const rows = algo ? CATEGORIES.map((c) => algo[c]) : [];
  const hidden = rows.filter((a) => a.status === "oculto").length;
  const likes = rows.reduce((s, a) => s + a.likes, 0);
  const passes = rows.reduce((s, a) => s + a.passes, 0);
  return (
    <Link
      href="/perfil/algoritmo"
      data-tour="algorithm"
      className="flex min-h-16 items-center gap-3 rounded-card bg-surface p-4"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
        <SlidersHorizontal size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold">Tu algoritmo</span>
        <span className="block truncate text-sm text-muted tabular-nums">
          {algo
            ? `${hidden} ${hidden === 1 ? "categoría oculta" : "categorías ocultas"} · ${likes} sí · ${passes} no`
            : "…"}
        </span>
      </span>
      <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-muted" />
    </Link>
  );
}
