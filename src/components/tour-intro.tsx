"use client";

import { useQuery } from "convex/react";
import {
  BadgeCheck,
  Hand,
  Handshake,
  type LucideIcon,
  Mic,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { BackButton, PillButton } from "./ui";

const SWIPE = 60;

interface Beat {
  Icon: LucideIcon;
  title: string;
  body: (live: number | null) => React.ReactNode;
}

const STEPS_3: { Icon: LucideIcon; name: string; text: string }[] = [
  { Icon: Hand, name: "Desliza", text: "Elige los trabajos que te interesan." },
  { Icon: Mic, name: "Demuestra", text: "3 preguntas y una entrevista corta con IA." },
  { Icon: BadgeCheck, name: "Conecta", text: "Postula, te aceptan y verificamos tu logro." },
];

const BEATS: Beat[] = [
  {
    Icon: Smartphone,
    title: "Trabajos reales entrenando IA",
    body: () =>
      "Te conectamos con trabajos reales entrenando IA, desde tu celular: voz, transcripción, evaluación y más, en tu español.",
  },
  {
    Icon: ShieldCheck,
    title: "No te contratamos. Te conectamos.",
    body: (live) => (
      <>
        {live ? (
          <>
            Hoy hay <b className="text-text tabular-nums">{live} vacantes</b> publicadas por
            empresas de IA.
          </>
        ) : (
          "Las vacantes son reales, publicadas por empresas de IA."
        )}{" "}
        Chamba es gratis, nunca te cobra y no es tu empleador: la empresa te contrata y te paga.
      </>
    ),
  },
  {
    Icon: Handshake,
    title: "¿Por qué pagan?",
    body: () =>
      "Las empresas de IA necesitan hablantes nativos de español para mejorar sus IAs, y pagan por ese trabajo. Chamba te pre-filtra: llegas como alguien que ya demostró que es bueno. Para eso sirve tu tarjeta de talento.",
  },
  {
    Icon: Sparkles,
    title: "Así funciona",
    body: () => (
      <ol className="mt-1 space-y-3">
        {STEPS_3.map(({ Icon, name, text }, i) => (
          <li key={name} className="flex items-center gap-3 rounded-tile bg-surface p-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
              <Icon size={20} strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[17px] font-bold text-text">
                {i + 1}. {name}
              </span>
              <span className="block text-[15px]">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
];

/** Full-screen story before the walkthrough: what Chamba is, why it's real, why companies pay, how it works. */
export function TourIntro({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const cats = useQuery(api.roles.categories);
  const live = cats ? Object.values(cats).reduce((n, c) => n + c.count, 0) : null;
  const reduce = useReducedMotion();
  const [[at, dir], setAt] = useState<[number, number]>([0, 1]);
  const primary = useRef<HTMLDivElement>(null);
  const last = at === BEATS.length - 1;
  const beat = BEATS[at];

  const go = (to: number) => {
    if (to < 0 || to >= BEATS.length) return;
    setAt([to, to > at ? 1 : -1]);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    primary.current?.querySelector("button")?.focus({ preventScroll: true });
  }, []);

  const onDragEnd = (_: unknown, i: PanInfo) => {
    if (i.offset.x < -SWIPE) go(at + 1);
    else if (i.offset.x > SWIPE) go(at - 1);
  };

  const shift = reduce ? 0 : 48;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-intro-title"
      className="pt-safe pb-safe fixed inset-0 z-[60] flex justify-center bg-bg"
    >
      <div className="flex w-full max-w-[430px] flex-col px-6">
        <div className="flex min-h-14 items-center justify-between">
          {at > 0 ? <BackButton onClick={() => go(at - 1)} label="Anterior" /> : <span />}
          <PillButton variant="secondary" size="sm" fit onClick={onSkip}>
            Saltar
          </PillButton>
        </div>

        <motion.div
          className="flex min-h-0 flex-1 touch-pan-y flex-col justify-center"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
        >
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.section
              key={at}
              custom={dir}
              initial={{ opacity: 0, x: dir * shift }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dir * shift }}
              transition={{ duration: reduce ? 0 : 0.22, ease: "easeOut" }}
              className="space-y-5"
              aria-live="polite"
            >
              <span className="grid size-16 place-items-center rounded-full bg-surface text-primary">
                <beat.Icon size={30} strokeWidth={2} aria-hidden />
              </span>
              <h2
                id="tour-intro-title"
                className="text-[30px] leading-[1.1] font-bold tracking-tight text-balance"
              >
                {beat.title}
              </h2>
              <div className="text-[17px] leading-relaxed text-muted">{beat.body(live)}</div>
            </motion.section>
          </AnimatePresence>
        </motion.div>

        <div className="space-y-5 pb-4">
          <div className="flex justify-center gap-2" aria-hidden>
            {BEATS.map((b, i) => (
              <span
                key={b.title}
                className={`h-2 rounded-full transition-[width,background-color] duration-200 ${i === at ? "w-6 bg-primary" : "w-2 bg-surface-2"}`}
              />
            ))}
          </div>
          <p className="sr-only">
            Paso {at + 1} de {BEATS.length}
          </p>
          <div ref={primary}>
            <PillButton onClick={last ? onStart : () => go(at + 1)}>
              {last ? "Empezar" : "Siguiente"}
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}
