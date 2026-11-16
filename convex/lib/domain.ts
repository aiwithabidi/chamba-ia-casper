// Shared domain vocabulary for Chamba IA (backend and frontend).

export const CATEGORIES = ["voz", "transcripcion", "evaluacion", "expertos", "tecnico"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_INFO: Record<Category, { label: string; emoji: string; skills: string[] }> = {
  voz: { label: "Voz y audio", emoji: "🎙️", skills: ["locucion", "grabacion", "actuacion"] },
  transcripcion: {
    label: "Transcripción",
    emoji: "🎧",
    skills: ["transcripcion", "ortografia", "mecanografia"],
  },
  evaluacion: {
    label: "Evaluación de IA",
    emoji: "🧠",
    skills: ["redaccion", "ortografia", "investigacion"],
  },
  expertos: { label: "Expertos", emoji: "💼", skills: ["finanzas", "derecho", "ciencias"] },
  tecnico: {
    label: "Código y matemáticas",
    emoji: "🧮",
    skills: ["programacion", "matematicas", "latex"],
  },
};

export const VARIANTS = [
  "mx",
  "co",
  "ar",
  "cl",
  "pe",
  "es",
  "caribe",
  "cr",
  "us",
  "latam",
  "general",
] as const;
export type Variant = (typeof VARIANTS)[number];

export const VARIANT_LABEL: Record<Variant, string> = {
  mx: "Español de México",
  co: "Español de Colombia",
  ar: "Español rioplatense",
  cl: "Español de Chile",
  pe: "Español andino (Perú)",
  es: "Español de España",
  caribe: "Español caribeño",
  cr: "Español de Costa Rica",
  us: "Español de EE. UU.",
  latam: "Español latinoamericano",
  general: "Cualquier variante",
};

/** The role's Spanish requirement as one label ("Español de Colombia", never "Español Español…"). */
export function spanishLabel(v: Variant): string {
  return v === "general" ? "Español (cualquier variante)" : VARIANT_LABEL[v];
}

export const COUNTRIES: { code: string; label: string; variant: Variant }[] = [
  { code: "MX", label: "México", variant: "mx" },
  { code: "CO", label: "Colombia", variant: "co" },
  { code: "AR", label: "Argentina", variant: "ar" },
  { code: "PE", label: "Perú", variant: "pe" },
  { code: "CL", label: "Chile", variant: "cl" },
  { code: "VE", label: "Venezuela", variant: "caribe" },
  { code: "EC", label: "Ecuador", variant: "pe" },
  { code: "CR", label: "Costa Rica", variant: "cr" },
  { code: "DO", label: "República Dominicana", variant: "caribe" },
  { code: "UY", label: "Uruguay", variant: "ar" },
];

export const SKILL_GROUPS: { title: string; skills: { id: string; label: string }[] }[] = [
  {
    title: "Idioma",
    skills: [
      { id: "redaccion", label: "Redacción" },
      { id: "ortografia", label: "Ortografía" },
      { id: "investigacion", label: "Investigación" },
    ],
  },
  {
    title: "Audio",
    skills: [
      { id: "locucion", label: "Locución" },
      { id: "grabacion", label: "Grabación" },
      { id: "actuacion", label: "Actuación" },
      { id: "transcripcion", label: "Transcripción" },
      { id: "mecanografia", label: "Mecanografía rápida" },
    ],
  },
  {
    title: "Profesión",
    skills: [
      { id: "finanzas", label: "Finanzas" },
      { id: "derecho", label: "Derecho" },
      { id: "ciencias", label: "Ciencias" },
    ],
  },
  {
    title: "Técnico",
    skills: [
      { id: "programacion", label: "Programación" },
      { id: "matematicas", label: "Matemáticas" },
      { id: "latex", label: "LaTeX" },
    ],
  },
];

export const EQUIPMENT = [
  { id: "microfono", label: "Micrófono decente" },
  { id: "computador", label: "Computador" },
  { id: "silencio", label: "Lugar silencioso" },
] as const;

export type SeedRole = {
  slug: string;
  platform: string;
  titleEs: string;
  titleOriginal: string;
  category: Category;
  variant: Variant;
  remote: boolean;
  posted: string;
  url: string;
  payMin?: number;
  payMax?: number;
  payNote?: string;
};

export function formatPay(r: Pick<SeedRole, "payMin" | "payMax" | "payNote">): string {
  if (r.payMax === undefined) return "Pago no publicado";
  const range =
    r.payMin !== undefined && r.payMin !== r.payMax ? `$${r.payMin}–$${r.payMax}` : `$${r.payMax}`;
  const unit = r.payNote === "por hora de audio" ? " por hora de audio" : " USD/h";
  const prefix = r.payNote === "hasta" ? "Hasta " : "";
  const suffix = r.payNote === "típico" ? " (típico)" : "";
  return `${prefix}${range}${unit}${suffix}`;
}
