"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ErrorNote, SectionLabel } from "./ui";

/** Operator-only queue: acceptance screenshots to verify or reject. Renders nothing for everyone else. */
export function ProofReview() {
  const queue = useQuery(api.outcomes.reviewQueue);
  const decide = useMutation(api.outcomes.reviewProof);
  const [error, setError] = useState<string | null>(null);
  if (!queue) return null;

  const act = (id: Id<"applications">, proofId: Id<"_storage">, ok: boolean) => {
    setError(null);
    decide({ id, proofId, ok }).catch((err: unknown) => {
      console.warn("No se pudo guardar la revisión", err);
      setError("No se pudo guardar la revisión. Intenta de nuevo.");
    });
  };

  return (
    <section className="space-y-3 rounded-tile bg-surface p-4">
      <SectionLabel>Capturas por revisar · {queue.length}</SectionLabel>
      {queue.length === 0 && <p className="text-sm text-muted">No hay capturas pendientes.</p>}
      {error && <ErrorNote>{error}</ErrorNote>}
      {queue.map((q) => (
        <div
          key={q._id}
          className="space-y-2 border-t border-line pt-3 first-of-type:border-0 first-of-type:pt-0"
        >
          <p className="font-semibold">
            {q.title} <span className="font-normal text-muted">· {q.platform}</span>
          </p>
          {q.url && (
            <a
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[12px] bg-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.url}
                alt="Captura del correo de aceptación"
                className="max-h-72 w-full object-contain"
              />
            </a>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => q.proofId && act(q._id, q.proofId, true)}
              className="bg-accent min-h-11 flex-1 rounded-full font-semibold"
            >
              Verificar
            </button>
            <button
              type="button"
              onClick={() => q.proofId && act(q._id, q.proofId, false)}
              className="min-h-11 flex-1 rounded-full border border-line font-semibold"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
