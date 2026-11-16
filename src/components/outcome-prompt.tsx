"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ImageUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CATEGORY_INFO } from "../../convex/lib/domain";
import { type Answer, due } from "../../convex/lib/outcomes";
import { ErrorNote } from "./ui";

type Row = FunctionReturnType<typeof api.outcomes.pending>[number];
type Step = "applied" | "accepted" | "proof" | "sent" | "later" | "thanks";

// One follow-up question per browser session, so the app never opens on a stack of prompts.
const SESSION_KEY = "chamba.outcomeAsked";
const MAX_PROOF_BYTES = 10 * 1024 * 1024;

const firstStep = (r: Row): Step =>
  r.accepted === true ? "proof" : r.applied === true ? "accepted" : "applied";

/** "¿Postulaste?" then, in the same sheet, "¿Te aceptaron?", then an optional screenshot as proof.
 * Mounted once in the app shell. */
export function OutcomePrompt() {
  const pending = useQuery(api.outcomes.pending);
  const send = useMutation(api.outcomes.answer);
  const skip = useMutation(api.outcomes.skipProofUpload);
  const uploadUrl = useMutation(api.outcomes.generateUploadUrl);
  const submitProof = useMutation(api.outcomes.submitProof);
  // Snapshot the row: answering resolves it, and the sheet must not vanish under the user's finger.
  const [row, setRow] = useState<Row | null>(null);
  const [step, setStep] = useState<Step>("applied");
  const [picked, setPicked] = useState<Answer | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decide once, on the first load of pending rows (React's "adjust state while rendering" pattern).
  const [checked, setChecked] = useState(false);
  const [openedAt] = useState(() => Date.now());
  if (pending && !checked) {
    setChecked(true);
    const next = sessionStorage.getItem(SESSION_KEY) ? null : due(pending, openedAt);
    if (next) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setRow(next);
      setStep(firstStep(next));
    }
  }

  const warn = (what: string) => (err: unknown) => console.warn(what, err);
  const reply = (id: Id<"applications">, answer: Answer) => {
    send({ id, answer }).catch(warn("No se pudo guardar la respuesta"));
  };
  const close = () => {
    if (row && (step === "applied" || step === "accepted")) reply(row._id, "dismiss");
    if (row && step === "proof" && !uploading)
      skip({ id: row._id }).catch(warn("No se pudo posponer la captura"));
    setRow(null);
  };

  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!row) return null;
  const proofOnly = firstStep(row) === "proof";
  const reask = firstStep(row) === "accepted";

  const pick = (answer: Answer, nextStep: Step) => {
    reply(row._id, answer);
    setPicked(answer);
    setStep(nextStep);
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > MAX_PROOF_BYTES) {
      setError("Sube una imagen (captura) de hasta 10 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(await uploadUrl({ id: row._id }), {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const out = await submitProof({ id: row._id, storageId });
      if (out.ok) setStep("sent");
      else setError(out.error);
    } catch (err) {
      console.warn("No se pudo subir la captura", err);
      setError("No se pudo subir la captura. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-q"
      className="fixed inset-0 z-50 mx-auto max-w-[430px]"
      onClick={close}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe absolute inset-x-0 bottom-0 max-h-[88dvh] space-y-5 overflow-y-auto overscroll-contain rounded-t-card bg-surface p-6"
      >
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/img/${row.role.category}.jpg`}
            alt=""
            className="size-14 shrink-0 rounded-[12px] object-cover"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-[0.05em] text-muted uppercase">
              {CATEGORY_INFO[row.role.category].label}
            </p>
            <p className="truncate font-bold">{row.role.titleEs}</p>
            <p className="text-sm text-muted">{row.role.platform}</p>
          </div>
        </div>

        {!proofOnly && !reask && (
          <Question id="outcome-q" text="¿Postulaste a este proyecto?">
            <Choice
              on={step !== "applied" && step !== "thanks"}
              disabled={step !== "applied"}
              onClick={() => pick("applied_yes", "accepted")}
            >
              Sí
            </Choice>
            <Choice
              on={step === "thanks"}
              disabled={step !== "applied"}
              onClick={() => pick("applied_no", "thanks")}
            >
              No
            </Choice>
          </Question>
        )}

        {!proofOnly && step !== "applied" && step !== "thanks" && (
          <Question
            id={reask ? "outcome-q" : undefined}
            text={reask ? "¿Ya te respondieron? ¿Te aceptaron?" : "¿Te aceptaron?"}
            hint="Si te aceptan, súbelo: te mostramos primero más proyectos como este."
          >
            <Choice
              on={picked === "accepted_si"}
              disabled={step !== "accepted"}
              onClick={() => pick("accepted_si", "proof")}
            >
              Sí
            </Choice>
            <Choice
              on={picked === "accepted_no"}
              disabled={step !== "accepted"}
              onClick={() => pick("accepted_no", "later")}
            >
              No
            </Choice>
            <Choice
              on={picked === "accepted_no_se"}
              disabled={step !== "accepted"}
              onClick={() => pick("accepted_no_se", "later")}
            >
              Todavía no sé
            </Choice>
          </Question>
        )}

        {step === "proof" && (
          <div className="space-y-3" aria-live="polite">
            {!proofOnly && (
              <p className="font-semibold text-like">
                ¡Felicidades! Esto nos ayuda a recomendarte mejor.
              </p>
            )}
            <p
              id={proofOnly ? "outcome-q" : undefined}
              className={proofOnly ? "text-lg font-bold text-balance" : "text-[15px]"}
            >
              Sube una captura del correo de aceptación
            </p>
            <p className="text-sm text-muted">
              Opcional. Solo el equipo de Chamba la ve, para confirmar la colocación.
            </p>
            <label
              className={`bg-accent flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full font-semibold ${uploading ? "opacity-60" : ""}`}
            >
              <ImageUp size={18} strokeWidth={2.25} />
              {uploading ? "Subiendo…" : "Subir captura"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                }}
              />
            </label>
            {error && <ErrorNote>{error}</ErrorNote>}
            <button
              type="button"
              onClick={close}
              disabled={uploading}
              className="min-h-11 w-full rounded-full text-sm font-semibold text-muted"
            >
              Subir después
            </button>
          </div>
        )}

        {(step === "sent" || step === "later" || step === "thanks") && (
          <div className="space-y-3" aria-live="polite">
            <p className={step === "sent" ? "font-semibold text-like" : "text-muted"}>
              {step === "sent" && "¡Felicidades! Lo verificamos y te ponemos primero en la fila."}
              {step === "later" && "Gracias. Te preguntamos de nuevo en unas semanas."}
              {step === "thanks" && "Gracias. No te preguntaremos más por este proyecto."}
            </p>
            <button
              type="button"
              onClick={close}
              className="bg-accent min-h-12 w-full rounded-full font-semibold"
            >
              Listo
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function Question({
  id,
  text,
  hint,
  children,
}: {
  id?: string;
  text: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <p id={id} className="text-lg font-bold text-balance">
        {text}
      </p>
      {hint && <p className="text-sm text-muted text-pretty">{hint}</p>}
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function Choice({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-full border px-3 text-[15px] font-semibold transition-[scale,opacity] duration-150 not-disabled:active:scale-[0.96] ${on ? "bg-accent border-transparent" : "border-line text-text disabled:opacity-50"}`}
    >
      {children}
    </button>
  );
}
