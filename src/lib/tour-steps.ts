/** The walkthrough as data: one ordered list of pages, each with its steps. Pure, so it is unit-tested. */

export interface TourStep {
  /** CSS selector list; the first match on screen is highlighted (later entries are fallbacks). */
  element: string;
  title: string;
  text: string;
  /** Small target low on screen: put the popover just above it rather than below. */
  dockAbove?: boolean;
  /** Target taller than the room around it (the deck card): dock under the top bar, not over the tab bar. */
  dockTop?: boolean;
}

export interface TourPage {
  path: string;
  steps: TourStep[];
}

export const WALKTHROUGH: TourPage[] = [
  {
    path: "/descubrir",
    steps: [
      {
        element: '[data-tour="card"]',
        title: "Una vacante real",
        text: "Cada tarjeta es un trabajo publicado por una empresa de IA. Desliza a la derecha si te interesa, a la izquierda si no.",
        dockTop: true,
      },
      {
        element: '[data-tour="fit"]',
        title: "Tu encaje",
        text: "Este % dice qué tanto encaja contigo, según tu país, tu español y tus horas.",
        dockAbove: true,
      },
      {
        element: '[data-tour="pages"]',
        title: "Por qué encajas",
        text: "Toca el lado derecho de la tarjeta para ver por qué encajas, y otra vez para el pago y los detalles.",
      },
      {
        element: '[data-tour="actions"]',
        title: "Desliza o toca",
        text: "♥ guarda, ✕ pasa y ↺ deshace. Cada swipe afina lo que te mostramos.",
        dockAbove: true,
      },
      {
        element: '[data-tour="like"]',
        title: "3 preguntas rápidas",
        text: "Al guardar un trabajo te hacemos 3 preguntas para ver si calificas. Así no pierdes tiempo en lo que no es para ti.",
        dockAbove: true,
      },
    ],
  },
  {
    path: "/guardados",
    steps: [
      {
        element: '[data-tour="interview"], [data-tour="saved-empty"]',
        title: "Tu entrevista con IA",
        text: "Lo que guardas llega aquí. Haz una entrevista corta con IA para mostrar lo que sabes.",
      },
      {
        element: '[data-tour="apply"], [data-tour="saved-empty"]',
        title: "Postula y cuéntanos",
        text: "Postular abre el sitio de la empresa. Luego te preguntamos ¿Postulaste? y ¿Te aceptaron?, y subes una captura. Nosotros la verificamos.",
      },
    ],
  },
  {
    path: "/perfil",
    steps: [
      {
        element: '[data-tour="talent"]',
        title: "Tu tarjeta de talento",
        text: "Con 72 o más en la entrevista ganas tu tarjeta. Sale en la página pública de talento, para que las empresas vean que ya demostraste lo que sabes.",
      },
      {
        element: '[data-tour="progress"]',
        title: "Tu progreso",
        text: "Tus pre-calificaciones, entrevistas, postulaciones y aceptaciones. Chamba es gratis: la empresa que te contrata es la que te paga.",
      },
      {
        element: '[data-tour="algorithm"]',
        title: "Tu algoritmo",
        text: "Cada swipe nos enseña qué mostrarte. Aquí ves qué categorías te mostramos más, menos o nada, y puedes cambiarlo.",
      },
    ],
  },
  {
    path: "/instalar",
    steps: [
      {
        element: '[data-tour="install"]',
        title: "Tenla a un toque",
        text: "Agrega Chamba a tu pantalla de inicio y ábrela como una app. Eso es todo: ¡a buscar tu chamba!",
      },
    ],
  },
];

export const TOTAL_STEPS = WALKTHROUGH.reduce((n, p) => n + p.steps.length, 0);

export const pageIndex = (path: string) => WALKTHROUGH.findIndex((p) => p.path === path);

/** Steps before this page, for a progress count that runs across pages ("6 de 11"). */
export const stepOffset = (path: string) =>
  WALKTHROUGH.slice(0, Math.max(0, pageIndex(path))).reduce((n, p) => n + p.steps.length, 0);

/** The page after (dir 1) or before (dir -1) `path`, skipping pages `skip` rules out; null at either end. */
export function neighbor(path: string, dir: 1 | -1, skip: (path: string) => boolean = () => false) {
  const at = pageIndex(path);
  if (at < 0) return null;
  for (let i = at + dir; i >= 0 && i < WALKTHROUGH.length; i += dir) {
    if (!skip(WALKTHROUGH[i].path)) return WALKTHROUGH[i].path;
  }
  return null;
}
