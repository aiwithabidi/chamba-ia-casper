// Display-time "posted" label in Spanish. Accepts curated relative strings ("3d ago", "1y+ ago")
// and live ISO dates ("2026-11-13"); returns null when there is no usable date.

const DAY_MS = 86_400_000;
const UNITS = {
  d: ["día", "días"],
  w: ["semana", "semanas"],
  mo: ["mes", "meses"],
  y: ["año", "años"],
} as const;
type Unit = keyof typeof UNITS;

const phrase = (n: number, unit: Unit, more = false) =>
  `hace ${more ? "más de " : ""}${n} ${UNITS[unit][n === 1 ? 0 : 1]}`;

export function postedEs(posted: string, now: Date = new Date()): string | null {
  const rel = /^(\d+)(d|w|mo|y)(\+)? ago$/.exec(posted.trim());
  if (rel) return phrase(Number(rel[1]), rel[2] as Unit, Boolean(rel[3]));
  const time = Date.parse(posted.slice(0, 10));
  if (Number.isNaN(time)) return null;
  const days = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
  if (days === 0) return "hoy";
  if (days < 7) return phrase(days, "d");
  if (days < 30) return phrase(Math.floor(days / 7), "w");
  if (days < 365) return phrase(Math.floor(days / 30), "mo");
  return phrase(Math.floor(days / 365), "y");
}
