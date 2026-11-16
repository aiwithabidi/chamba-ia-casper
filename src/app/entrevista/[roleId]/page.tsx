"use client";

import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApplyLink } from "@/components/apply-link";
import { RequireProfile, Spinner } from "@/components/gate";
import { TalentCard } from "@/components/talent-card";
import { BackButton, ErrorNote, PillButton } from "@/components/ui";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { CATEGORY_INFO, formatPay } from "../../../../convex/lib/domain";
import { earnsPayout } from "../../../../convex/lib/effort";
import { QUALIFY_BAR } from "../../../../convex/lib/rubric";

const TURNS = 3;

function Interview() {
  const { roleId } = useParams<{ roleId: Id<"roles"> }>();
  const role = useQuery(api.roles.get, { roleId });
  const s = useQuery(api.screenings.forRole, { roleId });
  const start = useAction(api.screenings.start);
  const answer = useAction(api.screenings.answer);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const hasResult = Boolean(s?.done && s.card);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [s?.turns.length, busy]);

  // The composer disappears after the last answer; bring the result and talent card into view.
  useEffect(() => {
    if (hasResult) result.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hasResult]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      console.error("entrevista: la acción falló", err);
      setError(
        err instanceof ConvexError
          ? String(err.data)
          : process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "No pudimos procesar eso. Intenta de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (role === undefined || s === undefined) return <Spinner />;
  if (role === null) return <div className="p-6">Trabajo no encontrado.</div>;
  const info = CATEGORY_INFO[role.category];
  const current = s && !s.done ? s.turns[s.turns.length - 1] : null;

  return (
    <main className="pt-safe pb-safe screen flex flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-1 px-4 pb-3">
        <BackButton href="/guardados" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{role.titleEs}</p>
          <p className="text-[13px] text-muted tabular-nums">
            {role.platform} · {formatPay(role)}
          </p>
        </div>
      </header>

      {s && !s.done && (
        <div className="flex shrink-0 gap-1 px-4 pb-3">
          {Array.from({ length: TURNS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < s.turns.filter((t) => t.a).length ? "bg-accent" : "bg-surface-2"}`}
            />
          ))}
        </div>
      )}

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-3 px-4 pb-4">
        {!s && (
          <div className="space-y-4 pt-6 text-center">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight">
              Pre-entrevista IA
            </h1>
            <p className="text-muted">
              3 preguntas en español. Con respuestas completas, sumas a tu tarjeta de talento.
            </p>
            <PillButton disabled={busy} onClick={() => run(() => start({ roleId }))}>
              {busy ? "Preparando…" : "Empezar"}
            </PillButton>
          </div>
        )}

        {s?.turns.map((t, i) => (
          <div key={i} className="space-y-3">
            <div className="max-w-[85%] rounded-tile rounded-tl-md bg-surface-2 px-4 py-3">
              <p className="mb-1 text-[13px] font-semibold text-accent tabular-nums">
                Reclutador IA · {i + 1}/{TURNS}
              </p>
              <p>{t.q}</p>
            </div>
            {t.a && (
              <div className="bg-accent ml-auto max-w-[85%] rounded-tile rounded-tr-md px-4 py-3">
                {t.a}
              </div>
            )}
          </div>
        ))}
        {busy && s && (
          <div
            role="status"
            aria-label="Escribiendo"
            className="w-16 rounded-tile bg-surface-2 px-4 py-3 text-center tracking-widest text-muted"
          >
            ···
          </div>
        )}

        {s?.done && s.card && (
          <div ref={result} className="scroll-mt-2 space-y-4 pt-2">
            {earnsPayout(s.card.rubric ?? []) ? (
              <div className="rounded-tile bg-like/15 p-4 text-center">
                <p className="text-xl font-bold tracking-tight text-like">
                  Pre-entrevista completa
                </p>
                <p className="text-sm">Ya cuenta para tu tarjeta de talento</p>
              </div>
            ) : (
              <div className="rounded-tile bg-surface p-4 text-center">
                <p className="font-semibold">Respuestas poco completas: mejóralas y repite</p>
              </div>
            )}
            <TalentCard card={s.card} score={s.score} />
            {s.feedback && (
              <p className="rounded-tile bg-surface p-4 text-[15px] leading-relaxed text-pretty">
                {s.feedback}
              </p>
            )}
            <div className="space-y-2">
              {(s.score ?? 0) >= QUALIFY_BAR ? (
                <>
                  <ApplyLink roleId={roleId} href={role.url} size="md">
                    Postular
                    <ArrowUpRight size={18} strokeWidth={2.25} />
                  </ApplyLink>
                  <PillButton
                    variant="ghost"
                    size="sm"
                    onClick={() => run(() => start({ roleId }))}
                  >
                    Repetir
                  </PillButton>
                </>
              ) : (
                <>
                  <PillButton
                    size="md"
                    disabled={busy}
                    onClick={() => run(() => start({ roleId }))}
                  >
                    Repetir
                  </PillButton>
                  <ApplyLink roleId={roleId} href={role.url} variant="ghost" size="sm">
                    Postular de todos modos
                    <ArrowUpRight size={16} strokeWidth={2.25} />
                  </ApplyLink>
                </>
              )}
            </div>
            <p className="text-center text-xs text-muted">
              {s.source === "ia" ? "Preguntas generadas por Claude" : "Preguntas de práctica"}
            </p>
          </div>
        )}
        <div ref={end} />
      </section>

      {error && <ErrorNote className="mx-4 mb-2">{error}</ErrorNote>}

      {current && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            run(async () => {
              await answer({ roleId, answer: text });
              setDraft("");
            });
          }}
          className="flex shrink-0 items-end gap-2 border-t border-line bg-bg px-4 pt-3"
        >
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            rows={2}
            maxLength={2000}
            placeholder="Escribe tu respuesta… (o usa el micrófono del teclado)"
            className="flex-1 resize-none rounded-field border border-line bg-surface px-4 py-3 text-base outline-none focus:border-primary"
          />
          <button
            disabled={busy || !draft.trim()}
            className="bg-accent grid size-12 shrink-0 place-items-center rounded-full transition-[scale,opacity] duration-150 ease-out not-disabled:active:scale-[0.96] disabled:opacity-50"
            aria-label="Enviar"
          >
            <ArrowUp size={22} strokeWidth={2.5} />
          </button>
        </form>
      )}
    </main>
  );
}

export default function EntrevistaPage() {
  return (
    <RequireProfile>
      <Interview />
    </RequireProfile>
  );
}
