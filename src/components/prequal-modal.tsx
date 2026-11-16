"use client";

import { useMutation, useQuery } from "convex/react";
import { Check, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PillButton, PillLink } from "./ui";

/** "It's a match": 3 quick multiple-choice questions to pre-qualify for the job. */
export function PrequalModal({
  roleId,
  title,
  onClose,
}: {
  roleId: Id<"roles">;
  title: string;
  onClose: () => void;
}) {
  const questions = useQuery(api.swipes.prequalQuestions, { roleId });
  const grade = useMutation(api.swipes.prequal);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{
    correct: number;
    total: number;
    repeat: boolean;
  } | null>(null);

  if (!questions) return null;
  const step = answers.length;
  const current = questions[step];

  async function pick(i: number) {
    const next = [...answers, i];
    setAnswers(next);
    if (next.length !== questions!.length) return;
    try {
      setResult(await grade({ roleId, answers: next }));
    } catch (err) {
      // Back to question 1 rather than a blank sheet; the server already logged the cause.
      console.error("prequal: grading failed", err);
      setAnswers([]);
    }
  }

  const passed = result && result.correct >= 2;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="¡Match!"
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] items-end bg-black/70"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="pb-safe w-full space-y-5 rounded-t-card bg-surface p-6"
      >
        {!result && current && (
          <>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-accent tabular-nums">
                ¡Match! · Pregunta {step + 1} de {questions.length}
              </p>
              <p className="text-sm text-muted">{title}</p>
            </div>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-2"}`}
                />
              ))}
            </div>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-3"
            >
              <p className="text-2xl leading-tight font-bold tracking-tight text-balance">
                {current.q}
              </p>
              {current.options.map((o, i) => (
                <button
                  key={o}
                  onClick={() => pick(i)}
                  className="min-h-14 w-full rounded-tile border border-line bg-surface-2 px-4 py-3 text-left text-base font-medium transition-[scale] duration-150 ease-out active:scale-[0.98]"
                >
                  {o}
                </button>
              ))}
            </motion.div>
            <PillButton variant="ghost" size="sm" onClick={onClose}>
              Después
            </PillButton>
          </>
        )}
        {result && (
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className={`mx-auto grid size-20 place-items-center rounded-full ${passed ? "bg-like text-black" : "bg-surface-2"}`}
            >
              {passed ? (
                <Check size={40} strokeWidth={3} />
              ) : (
                <RotateCcw size={34} strokeWidth={2.25} className="text-muted" />
              )}
            </motion.div>
            <p className="text-2xl font-bold">{passed ? "¡Precalificado(a)!" : "Casi lo logras"}</p>
            <p className="text-muted tabular-nums">
              {result.repeat && "Ya respondiste estas preguntas: cuenta tu primer intento. "}
              {result.correct} de {result.total} correctas.{" "}
              {passed
                ? "Sigue con la pre-entrevista IA para tu tarjeta de talento."
                : "Practica con la pre-entrevista IA."}
            </p>
            <PillLink href={`/entrevista/${roleId}`}>Pre-entrevista IA</PillLink>
            <PillButton variant="ghost" size="sm" onClick={onClose}>
              Seguir deslizando
            </PillButton>
          </div>
        )}
      </motion.div>
    </div>
  );
}
