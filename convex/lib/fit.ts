// Deterministic fit score: every point awarded comes with a Spanish reason shown on the card.
import { CATEGORY_INFO, type Category, VARIANT_LABEL, type Variant } from "./domain";

export type FitProfile = {
  variant: Variant;
  jobTypes: Category[];
  skills: string[];
  equipment: string[];
};

export type FitRole = { category: Category; variant: Variant };

export type Fit = { score: number; reasons: string[]; gaps: string[] };

const NEEDS_MIC: Category[] = ["voz", "transcripcion"];

export function computeFit(profile: FitProfile, role: FitRole): Fit {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  if (profile.jobTypes.includes(role.category)) {
    score += 40;
    reasons.push(`Buscas ${CATEGORY_INFO[role.category].label.toLowerCase()}`);
  } else if (profile.jobTypes.length === 0) {
    score += 20;
  } else {
    gaps.push(`No marcaste ${CATEGORY_INFO[role.category].label.toLowerCase()}`);
  }

  if (role.variant === profile.variant) {
    score += 30;
    reasons.push(`Piden tu variante: ${VARIANT_LABEL[role.variant].toLowerCase()}`);
  } else if (role.variant === "general" || role.variant === "latam") {
    score += 20;
    reasons.push("Aceptan cualquier variante latinoamericana");
  } else {
    gaps.push(`Piden ${VARIANT_LABEL[role.variant].toLowerCase()}`);
  }

  const wanted = CATEGORY_INFO[role.category].skills;
  const matched = wanted.filter((s) => profile.skills.includes(s));
  score += Math.round((matched.length / wanted.length) * 20);
  if (matched.length > 0)
    reasons.push(`Tienes ${matched.length} de ${wanted.length} habilidades clave`);
  else gaps.push("Te faltan habilidades clave de esta categoría");

  if (NEEDS_MIC.includes(role.category)) {
    if (profile.equipment.includes("microfono")) {
      score += 10;
      reasons.push("Tienes micrófono");
    } else {
      gaps.push("Necesitas micrófono");
    }
  } else {
    score += 10;
  }

  return { score: Math.min(100, score), reasons, gaps };
}
