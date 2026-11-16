"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Check, Heart, X } from "lucide-react";
import { ApplyLink } from "@/components/apply-link";
import { PillLink } from "@/components/ui";
import { TopBar } from "@/components/wallet-pill";
import { api } from "../../../../convex/_generated/api";
import { CATEGORY_INFO, formatPay } from "../../../../convex/lib/domain";

export default function Guardados() {
  const saved = useQuery(api.swipes.saved);
  const remove = useMutation(api.swipes.remove);
  return (
    <>
      <TopBar title="Guardados" />
      <div className="scroll-body">
        {saved?.length === 0 && (
          <div
            data-tour="saved-empty"
            className="mx-4 flex flex-col items-center gap-3 rounded-tile bg-surface p-8 text-center"
          >
            <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-muted">
              <Heart size={22} strokeWidth={2} />
            </span>
            <p className="font-bold">Aún no guardas trabajos</p>
            <PillLink href="/descubrir" size="sm" fit>
              Ir a descubrir
            </PillLink>
          </div>
        )}
        {saved === undefined && (
          <div className="space-y-3 px-4" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[132px] animate-pulse rounded-tile bg-surface motion-reduce:animate-none"
              />
            ))}
          </div>
        )}
        <ul className="space-y-3 px-4">
          {saved?.map((r, i) => (
            <li key={r._id} className="rounded-tile bg-surface p-4">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/img/${r.category}.jpg`}
                  alt=""
                  className="size-14 shrink-0 rounded-[12px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{r.titleEs}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {r.platform} · {formatPay(r)}
                  </p>
                  <p className="text-sm text-like tabular-nums">
                    {r.fit.score}% encaje
                    {r.screeningScore !== null ? ` · Pre-entrevista ${r.screeningScore}/100` : ""}
                  </p>
                  {r.prequal !== null && r.prequal >= 2 && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-like/15 px-2.5 py-0.5 text-xs font-semibold text-like">
                      <Check size={12} strokeWidth={3} />
                      Precalificado
                    </span>
                  )}
                </div>
                <button
                  onClick={() => remove({ roleId: r._id })}
                  className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center self-start rounded-full text-muted"
                  aria-label="Quitar"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span data-tour={i === 0 ? "interview" : undefined} className="min-w-0 flex-1">
                  <PillLink href={`/entrevista/${r._id}`} size="sm">
                    {r.screeningScore !== null ? "Ver resultado" : "Pre-entrevista IA"}
                  </PillLink>
                </span>
                <ApplyLink
                  roleId={r._id}
                  href={r.url}
                  variant="ghost"
                  size="sm"
                  fit
                  tour={i === 0 ? "apply" : undefined}
                >
                  Postular
                  <ArrowUpRight size={16} strokeWidth={2} />
                </ApplyLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
