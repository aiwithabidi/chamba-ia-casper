"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import type { Doc } from "../../convex/_generated/dataModel";
import { CATEGORY_INFO, formatPay, spanishLabel } from "../../convex/lib/domain";
import type { Fit } from "../../convex/lib/fit";
import { ApplyLink } from "./apply-link";
import { PillLink, SectionLabel } from "./ui";

type Role = Doc<"roles"> & { fit: Fit | null };

const WHAT: Record<Doc<"roles">["category"], string> = {
  voz: "Grabar frases o conversaciones con tu voz natural para entrenar modelos de voz.",
  transcripcion: "Escuchar audios en español y escribir exactamente lo que se dice.",
  evaluacion: "Leer respuestas de una IA, calificarlas y reescribirlas para que suenen naturales.",
  expertos: "Revisar y corregir respuestas de IA sobre tu área profesional.",
  tecnico: "Resolver y revisar problemas de código o matemáticas explicados en español.",
};

export function RoleSheet({ role, onClose }: { role: Role; onClose: () => void }) {
  const info = CATEGORY_INFO[role.category];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={role.titleEs}
      className="fixed inset-0 z-50 mx-auto max-w-[430px]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, i) => i.offset.y > 120 && onClose()}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-card bg-surface"
      >
        <div className="relative h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/img/${role.category}.jpg`}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute top-3 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/70" />
          <div className="absolute inset-x-0 bottom-0 bg-black/65 px-6 py-4">
            <p className="text-[13px] font-semibold tracking-[0.05em] text-white/70 uppercase">
              {info.label}
            </p>
            <p className="text-2xl leading-tight font-bold tracking-tight text-balance">
              {role.titleEs}
            </p>
            <p className="text-white/80">{role.platform}</p>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <Section title="Qué harás">
            <p>{WHAT[role.category]}</p>
          </Section>
          {role.fit && (
            <Section title={`Encaje con tu perfil · ${role.fit.score}%`}>
              {role.fit.reasons.map((r) => (
                <p key={r}>✓ {r}</p>
              ))}
              {role.fit.gaps.map((g) => (
                <p key={g} className="text-muted">
                  • {g}
                </p>
              ))}
            </Section>
          )}
          <Section title="Requisitos">
            <p>
              {spanishLabel(role.variant)} · {role.remote ? "Remoto" : "Presencial"}
            </p>
          </Section>
          <Section title="Pago">
            <p className="tabular-nums">
              {formatPay(role)}
              {role.payNote ? ` · ${role.payNote}` : ""}
            </p>
          </Section>
          <div className="space-y-2">
            <PillLink href={`/entrevista/${role._id}`} size="md">
              Pre-entrevista IA
            </PillLink>
            <ApplyLink roleId={role._id} href={role.url} variant="ghost" size="sm">
              Postular en {role.platform}
              <ArrowUpRight size={16} strokeWidth={2} />
            </ApplyLink>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <SectionLabel as="h3">{title}</SectionLabel>
      <div className="space-y-1 text-[15px]">{children}</div>
    </div>
  );
}
