import {
  Captions,
  Code,
  GraduationCap,
  Languages,
  Laptop,
  type LucideIcon,
  Mic,
  Scale,
  VolumeX,
} from "lucide-react";
import type { Category } from "../../convex/lib/domain";

/** One icon per job category, shared by every screen that lists categories. */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  voz: Mic,
  transcripcion: Captions,
  evaluacion: Scale,
  expertos: GraduationCap,
  tecnico: Code,
};

export const EQUIPMENT_ICON: Record<string, LucideIcon> = {
  microfono: Mic,
  computador: Laptop,
  silencio: VolumeX,
};

/** Variants with no single country ("latam", "caribe") get a generic language icon. */
export const VARIANT_FALLBACK_ICON = Languages;

/** "MX" -> 🇲🇽: each ASCII letter maps to its Unicode regional indicator symbol. */
export function flag(code: string): string {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}
