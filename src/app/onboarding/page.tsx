"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/gate";
import { Mark } from "@/components/logo";
import {
  CATEGORY_ICON,
  EQUIPMENT_ICON,
  flag,
  VARIANT_FALLBACK_ICON,
} from "@/components/option-icons";
import { BackButton, Chip, PillButton, SectionLabel, Tile } from "@/components/ui";
import { api } from "../../../convex/_generated/api";
import {
  CATEGORIES,
  CATEGORY_INFO,
  type Category,
  COUNTRIES,
  EQUIPMENT,
  SKILL_GROUPS,
  VARIANT_LABEL,
  VARIANTS,
  type Variant,
} from "../../../convex/lib/domain";

const STEPS = 4;
const HOURS = [5, 10, 20, 30, 40];
const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);

type Profile = FunctionReturnType<typeof api.profiles.me>;

export default function Onboarding() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const existing = useQuery(api.profiles.me, isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/entrar");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || existing === undefined) return <Spinner />;
  // Mounted once the profile query resolves; not keyed, so creating the profile doesn't remount it.
  return <OnboardingForm existing={existing} />;
}

function OnboardingForm({ existing }: { existing: Profile }) {
  const save = useMutation(api.profiles.save);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name ?? "");
  const [country, setCountry] = useState(existing?.country ?? "");
  const [variant, setVariant] = useState<Variant>(existing?.variant ?? "latam");
  const [jobTypes, setJobTypes] = useState<Category[]>(existing?.jobTypes ?? []);
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [equipment, setEquipment] = useState<string[]>(existing?.equipment ?? []);
  const [hours, setHours] = useState(existing?.hoursPerWeek ?? 10);
  const [saving, setSaving] = useState(false);

  const valid = [name.trim().length >= 2, !!country && !!variant, jobTypes.length > 0, true][step];

  async function next() {
    if (step < STEPS - 1) return setStep(step + 1);
    setSaving(true);
    try {
      await save({
        name,
        country,
        variant,
        jobTypes,
        skills,
        equipment,
        hoursPerWeek: hours,
        ref: sessionStorage.getItem("chamba_ref") ?? undefined,
      });
      router.replace(existing ? "/perfil" : "/instalar");
    } catch (err) {
      // Stay in "Guardando…" on success until the route changes; re-enable only on failure.
      setSaving(false);
      throw err;
    }
  }

  return (
    <main className="pt-safe pb-safe screen flex flex-col overflow-hidden px-5">
      <div className="flex shrink-0 items-center gap-2 pb-4">
        <BackButton onClick={() => (step ? setStep(step - 1) : router.back())} label="Atrás" />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="bg-accent h-full transition-[width] duration-300 ease-out"
            style={{ width: `${((step + 1) / STEPS) * 100}%` }}
          />
        </div>
      </div>

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-5 pt-2 pb-6">
        {step === 0 && (
          <>
            <Mark size={40} className="block text-accent" />
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-balance">
              ¿Cómo te llamas?
            </h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Tu nombre"
              className="w-full border-b-2 border-line bg-transparent py-3 text-2xl outline-none focus:border-primary"
            />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-balance">
              ¿De qué país eres?
            </h1>
            <p className="text-muted">Algunas empresas buscan acentos específicos.</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <Chip
                  key={c.code}
                  on={country === c.code}
                  onClick={() => {
                    setCountry(c.code);
                    setVariant(c.variant);
                  }}
                >
                  {flag(c.code)} {c.label}
                </Chip>
              ))}
            </div>
            {country && (
              <div className="space-y-2">
                <SectionLabel>Variante</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {VARIANTS.filter((x) => x !== "general").map((x) => (
                    <Chip
                      key={x}
                      on={variant === x}
                      onClick={() => setVariant(x)}
                      icon={x.length === 2 ? undefined : VARIANT_FALLBACK_ICON}
                    >
                      {x.length === 2 && `${flag(x)} `}
                      {VARIANT_LABEL[x]}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-balance">
              ¿En qué eres bueno(a)?
            </h1>
            <p className="text-muted">
              Elige tus especialidades. Te mostramos proyectos de IA que encajan.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((c) => (
                <Tile
                  key={c}
                  on={jobTypes.includes(c)}
                  img={`/img/${c}.jpg`}
                  label={CATEGORY_INFO[c].label}
                  icon={CATEGORY_ICON[c]}
                  onClick={() => setJobTypes(toggle(jobTypes, c))}
                />
              ))}
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-balance">
              Afinemos tu perfil
            </h1>
            <p className="text-muted">
              Habilidades, equipo y horas. Así calculamos mejor tu encaje.
            </p>
            {SKILL_GROUPS.map((g) => (
              <div key={g.title} className="space-y-2">
                <SectionLabel>{g.title}</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {g.skills.map((s) => (
                    <Chip
                      key={s.id}
                      on={skills.includes(s.id)}
                      onClick={() => setSkills(toggle(skills, s.id))}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
            <div className="space-y-2">
              <SectionLabel>Equipo</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT.map((e) => (
                  <Chip
                    key={e.id}
                    on={equipment.includes(e.id)}
                    icon={EQUIPMENT_ICON[e.id]}
                    onClick={() => setEquipment(toggle(equipment, e.id))}
                  >
                    {e.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <SectionLabel>Horas por semana</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {HOURS.map((h) => (
                  <Chip key={h} on={hours === h} onClick={() => setHours(h)} icon={Clock}>
                    {h}h
                  </Chip>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <div className="shrink-0 pt-3">
        <PillButton disabled={!valid || saving} onClick={next}>
          {saving
            ? "Guardando…"
            : step === STEPS - 1
              ? existing
                ? "Guardar"
                : "¡Listo! Seguir"
              : "Siguiente"}
        </PillButton>
      </div>
    </main>
  );
}
