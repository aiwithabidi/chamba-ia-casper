"use client";

import { useConvexAuth } from "convex/react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ClipboardCheck,
  Gauge,
  Handshake,
  ShieldCheck,
  X,
} from "lucide-react";
import { Instrument_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/gate";
import { Logo } from "@/components/logo";
import { pillClass } from "@/components/ui";
import "./landing.css";
import { FAQ } from "./faq";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-landing-serif",
});

const SIGNUP = "/entrar?modo=registro";
const LOGIN = "/entrar";
const secondary =
  "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-(--l-line) bg-(--l-surface) px-6 text-[17px] font-semibold whitespace-nowrap transition-[scale] duration-150 active:scale-[0.96]";

const CARDS = [
  {
    img: "/img/landing/voz.jpg",
    alt: "Hombre con audífonos hablando frente a un micrófono",
    label: "Voz y audio",
    title: "Graba frases en tu acento",
    tilt: "-rotate-[7deg] -translate-x-[58%] translate-y-3",
  },
  {
    img: "/img/landing/transcripcion.jpg",
    alt: "Mujer escribiendo en su laptop desde casa",
    label: "Transcripción",
    title: "Transcribe audios cortos",
    tilt: "rotate-[7deg] translate-x-[58%] translate-y-3",
  },
  {
    img: "/img/landing/evaluacion.jpg",
    alt: "Hombre sonriendo frente a su laptop",
    label: "Evaluación de IA",
    title: "Califica respuestas de un chatbot",
    tilt: "z-10",
  },
];

const TESTIMONIALS = [
  {
    name: "Valeria",
    country: "Colombia",
    role: "Transcripción",
    quote:
      "La pre-entrevista fue corta y en español. Por fin entendí qué buscan en cada proyecto antes de postular.",
  },
  {
    name: "Diego",
    country: "México",
    role: "Evaluación de IA",
    quote:
      "Deslizo en el camión de regreso a casa. Guardo los que me encajan y paso los que no, sin llenar formularios eternos.",
  },
  {
    name: "Camila",
    country: "Perú",
    role: "Voz y audio",
    quote:
      "No sabía que mi acento servía para entrenar IA. La app me explicó por qué un proyecto me quedaba bien.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Desliza",
    text: "Ve proyectos de voz, transcripción y evaluación de IA. Derecha si te interesa, izquierda para pasar.",
  },
  {
    n: 2,
    title: "Responde unas preguntas",
    text: "Una pre-entrevista corta en español: opción múltiple y una tarea de escritura.",
  },
  {
    n: 3,
    title: "Te conectamos",
    text: "Si te va bien, te presentamos a los laboratorios y plataformas de IA que buscan hispanohablantes. Ellos te contratan y te pagan.",
  },
];

const GET = [
  {
    icon: Gauge,
    title: "Tu encaje con cada proyecto",
    note: "Un puntaje que te dice por qué te queda bien.",
  },
  {
    icon: ClipboardCheck,
    title: "Una pre-entrevista corta",
    note: "En español, para saber si estás listo(a) antes de postular.",
  },
  {
    icon: BadgeCheck,
    title: "Tu tarjeta de talento verificada",
    note: "Muestra a las empresas lo que ya demostraste.",
  },
  {
    icon: Handshake,
    title: "Te presentamos con empresas",
    note: "Ellas te contratan y te pagan directamente.",
  },
];

const FOR_YOU = [
  "Hablas español como lengua materna.",
  "Escribes con buena ortografía o tienes una voz clara.",
  "Tienes celular e internet estable.",
  "Quieres trabajo flexible, por proyecto, desde casa.",
];
const NOT_FOR_YOU = [
  "Buscas un empleo fijo con sueldo mensual.",
  "Quieres dinero rápido sin hacer las pruebas.",
  "No quieres hacer una pre-entrevista antes de postular.",
];

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-(--l-line) bg-(--l-surface) px-3.5 py-1.5 text-xs font-medium shadow-[0_0_0_4px_rgba(55,50,47,0.05)]">
      <span className="size-1.5 rounded-full bg-(--l-accent)" aria-hidden="true" />
      {children}
    </span>
  );
}

function SectionHead({ badge, title, text }: { badge: string; title: string; text?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
      <Badge>{badge}</Badge>
      <h2 className="serif text-[36px] leading-[1.1] text-balance sm:text-[48px]">{title}</h2>
      {text && <p className="text-[16px] leading-7 text-(--l-muted)">{text}</p>}
    </div>
  );
}

/** The template's diagonal hairline pattern, as flat SVG lines (no gradient). */
function Hatch() {
  return (
    <svg className="absolute inset-0 size-full text-[rgba(3,7,18,0.08)]" aria-hidden="true">
      <defs>
        <pattern
          id="hatch"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <line x1="0" y1="0" x2="0" y2="16" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hatch)" />
    </svg>
  );
}

function Ctas() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-md sm:flex-row">
      <Link href={SIGNUP} className={pillClass("primary")}>
        Crear cuenta
      </Link>
      <Link href={LOGIN} className={secondary}>
        Ya tengo cuenta
      </Link>
    </div>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`border-b border-(--l-line) px-5 py-16 sm:px-10 sm:py-24 ${className}`}
    >
      {children}
    </section>
  );
}

/** Signed-out visitors (and the prerender) get the page right away; signed-in users go to the deck. */
export function Landing({ platforms }: { platforms: string[] }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated) router.replace("/descubrir");
  }, [isAuthenticated, router]);
  if (isAuthenticated) return <Spinner />;
  return (
    <div className={`landing ${serif.variable} absolute inset-x-0 top-0 min-h-dvh font-sans`}>
      <div className="mx-auto max-w-[1060px] border-(--l-line) sm:border-x">
        <header className="pt-safe sticky top-0 z-30 border-b border-(--l-line) bg-(--l-bg)/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-5 sm:px-10">
            <Logo size={20} />
            <Link
              href={LOGIN}
              className="flex min-h-11 items-center rounded-full border border-(--l-line) bg-(--l-surface) px-4 text-sm font-medium"
            >
              Entrar
            </Link>
          </div>
        </header>

        <main>
          <section className="overflow-hidden border-b border-(--l-line) px-5 pt-12 pb-14 text-center sm:px-10 sm:pt-24">
            <div className="flex flex-col items-center gap-6">
              <Badge>Para hispanohablantes de Latinoamérica</Badge>
              <h1 className="serif max-w-[14ch] text-[46px] leading-[1.02] text-balance sm:text-[80px]">
                Encuentra trabajo{" "}
                <span className="whitespace-nowrap underline decoration-(--l-accent) decoration-[6px] underline-offset-[6px]">
                  entrenando IA
                </span>
                , en español.
              </h1>
              <p className="max-w-[36ch] text-[17px] leading-7 text-(--l-muted) sm:text-lg">
                Desliza proyectos de voz, transcripción y evaluación de IA. Haz una pre-entrevista
                corta y te recomendamos a los laboratorios que buscan testers en español.
              </p>
              <Ctas />
              <p className="text-sm text-(--l-muted)">Sin costo · Sin inglés · Desde tu celular</p>
            </div>

            <div className="relative mx-auto mt-12 h-[300px] max-w-[440px] sm:h-[380px]">
              {CARDS.map((c) => (
                <div
                  key={c.img}
                  className={`absolute top-0 left-1/2 ml-[-90px] h-[260px] w-[180px] overflow-hidden rounded-[20px] border border-(--l-line) bg-(--l-surface) shadow-[0_8px_24px_rgba(55,50,47,0.12)] sm:ml-[-115px] sm:h-[330px] sm:w-[230px] ${c.tilt}`}
                >
                  <Image
                    src={c.img}
                    alt={c.alt}
                    fill
                    sizes="230px"
                    className="object-cover"
                    priority={c.tilt === "z-10"}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/65 p-3 text-left text-white">
                    <p className="text-[11px] font-semibold tracking-[0.05em] uppercase opacity-80">
                      {c.label}
                    </p>
                    <p className="mt-0.5 text-[15px] leading-tight font-semibold">{c.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="numeros" aria-label="Plataformas" className="border-b border-(--l-line)">
            <div className="px-5 py-6 text-center sm:px-10">
              <p className="text-xs font-semibold tracking-[0.05em] text-(--l-muted) uppercase">
                Proyectos publicados en
              </p>
              <p className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[15px] font-semibold opacity-70">
                {platforms.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </p>
            </div>
          </section>

          <Section id="como-funciona">
            <SectionHead
              badge="Cómo funciona"
              title="No te contratamos. Te conectamos."
              text="Entrenar IA es enseñarle a hablar mejor español: calificas sus respuestas, grabas tu voz, transcribes audios o revisas textos."
            />
            <ol className="mt-12 grid overflow-hidden rounded-[20px] border border-(--l-line) bg-(--l-surface) md:grid-cols-3">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex flex-col gap-2 border-(--l-line) p-5 not-last:border-b sm:p-6 md:gap-3 md:not-last:border-r md:not-last:border-b-0"
                >
                  <div className="flex items-center gap-3 md:flex-col md:items-start">
                    <span className="bg-accent grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-bold tabular-nums">
                      {s.n}
                    </span>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="text-[15px] leading-6 text-(--l-muted)">{s.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-start gap-2.5 text-[15px] leading-6 text-(--l-muted)">
              <ShieldCheck size={20} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                Chamba es gratis. Nunca te cobraremos. No somos el empleador: te preparamos y te
                presentamos con empresas que buscan hispanohablantes para entrenar IA.
              </span>
            </p>
          </Section>

          <Section id="lo-que-recibes">
            <SectionHead
              badge="Lo que recibes"
              title="Gratis, de principio a fin"
              text="Chamba no te paga ni te cobra. Te prepara y te conecta: la empresa que te contrata es la que te paga."
            />
            <ul className="mx-auto mt-12 max-w-xl divide-y divide-(--l-line) overflow-hidden rounded-[20px] border border-(--l-line) bg-(--l-surface)">
              {GET.map((g) => (
                <li key={g.title} className="flex items-center gap-4 px-5 py-5">
                  <span className="bg-accent grid size-11 shrink-0 place-items-center rounded-full">
                    <g.icon size={22} strokeWidth={2} aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold">{g.title}</span>
                    <span className="block text-sm text-(--l-muted)">{g.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="testimonios">
            <SectionHead badge="Testimonios ilustrativos" title="Así se siente usar Chamba" />
            <ul className="mt-12 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <li
                  key={t.name}
                  className="flex flex-col justify-between gap-6 rounded-[20px] border border-(--l-line) bg-(--l-surface) p-6"
                >
                  <p className="text-[16px] leading-7">“{t.quote}”</p>
                  <div className="flex items-center gap-3">
                    <span
                      className="bg-accent grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold"
                      aria-hidden="true"
                    >
                      {t.name[0]}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold">
                        {t.name}, {t.country}
                      </span>
                      <span className="block text-sm text-(--l-muted)">{t.role}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="para-ti">
            <SectionHead
              badge="¿Es para ti?"
              title="Buscamos testers en serio"
              text="Los laboratorios quieren gente que cuide el detalle. Por eso precalificamos a todos."
            />
            <div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-(--l-line) bg-(--l-surface) p-6">
                <h3 className="text-lg font-semibold">Es para ti si</h3>
                <ul className="mt-4 space-y-3">
                  {FOR_YOU.map((t) => (
                    <li key={t} className="flex gap-3 text-[15px] leading-6">
                      <span className="bg-accent mt-0.5 grid size-5 shrink-0 place-items-center rounded-full">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[20px] border border-(--l-line) p-6">
                <h3 className="text-lg font-semibold">No es para ti si</h3>
                <ul className="mt-4 space-y-3">
                  {NOT_FOR_YOU.map((t) => (
                    <li key={t} className="flex gap-3 text-[15px] leading-6 text-(--l-muted)">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-(--l-line)">
                        <X size={12} strokeWidth={2.5} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="preguntas" className="lg:flex lg:gap-12">
            <div className="flex flex-col gap-4 lg:flex-1">
              <h2 className="serif text-[36px] leading-[1.1] sm:text-[48px]">
                Preguntas frecuentes
              </h2>
              <p className="text-[16px] leading-7 text-(--l-muted)">
                Lo que casi todos preguntan antes de crear su cuenta.
              </p>
            </div>
            <div className="mt-8 border-t border-(--l-line) lg:mt-0 lg:flex-1">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-(--l-line)">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 text-[16px] font-medium">
                    {f.q}
                    <ChevronDown
                      size={22}
                      className="shrink-0 text-(--l-muted) transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 text-[15px] leading-6 text-(--l-muted)">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>

          <section className="relative overflow-hidden border-b border-(--l-line) px-5 py-16 sm:py-24">
            <Hatch />
            <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 rounded-[20px] border border-(--l-line) bg-(--l-bg) px-5 py-10 text-center">
              <h2 className="serif text-[36px] leading-[1.1] text-balance sm:text-[48px]">
                Crea tu perfil y ve tus primeros proyectos
              </h2>
              <p className="text-[16px] leading-7 text-(--l-muted)">
                Es gratis y toma un par de minutos.
              </p>
              <Ctas />
            </div>
          </section>
        </main>

        <footer className="pb-safe mb-6 flex flex-col gap-6 px-5 pt-10 sm:flex-row sm:items-start sm:justify-between sm:px-10">
          <div className="space-y-2">
            <Logo size={20} />
            <p className="text-sm text-(--l-muted)">Proyectos de IA en español.</p>
          </div>
          <nav className="flex flex-col text-sm sm:items-end">
            <Link href="/talento" className="flex min-h-11 items-center">
              Ver la comunidad de testers →
            </Link>
            <Link href={LOGIN} className="flex min-h-11 items-center">
              Ya tengo cuenta
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
