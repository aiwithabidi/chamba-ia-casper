---

name: Chamba IA
description: A dark, warm swipe app for Spanish-speaking AI work, phone first. Flat colors, one marigold accent, category photos. Spanish only.
colors:
bg: "#14120F"
surface: "#1C1A16"
surface-2: "#26231E"
line: "#38332C"
text: "#F3EEE6"
muted: "#A39B8E"
primary: "#F2B544"
on-primary: "#14120F"
like: "#5CC98A"
pass: "#E57A66"
typography:
family: "Geist, system-ui, sans-serif"
title: { size: 28px, weight: 700, tracking: tight }
body: { size: 15-16px, weight: 400 }
caption: { size: 13px, weight: 600 }
radius: { card: 24px, tile: 20px, pill: 999px }
spacing: { gutter: 16px, stack: 12px }
---

# Chamba IA design

**The feeling:** a calm, modern swipe app. Dark warm neutrals, one card at a time, and a single flat marigold accent. Tokens live in `src/app/globals.css`; this file mirrors them.

## Rules

- **No gradients.** Every surface is one flat color. The ring and gradient fills are gone.
- **One accent:** `bg-accent` (marigold `#F2B544` with dark `#14120F` text) marks the primary action on each screen; `text-accent` is for links and highlights.
- `like` green and `pass` coral are used only for swipe meaning (stamps, chips, algorithm status).
- Lucide icons; category photos from `public/img/<category>.jpg`.

## Layout

- Phone first at 390px; desktop centers a 430px column.
- Floating pill tab bar: Descubrir · Explorar · Guardados · Perfil. The active tab is `text-primary` on a `surface-2` pill.

## Swipe card

- The category photo fills the card; a flat black scrim (65%) carries the text at the bottom.
- Page 1 reads **title first**: category label, title, platform, then chips. Pay is a secondary chip next to the fit chip, not a headline.
- Tapping the right or left half changes the page: 1 summary, 2 why it fits (✓ reasons, • gaps), 3 details. A ↑ button or an upward swipe opens the detail sheet.
- Drag stamps: "GUARDAR" (like) and "PASAR" (pass). Action row: ↺ undo (muted), ✕ pass (outline), ♥ save (`bg-accent`).
- **A like opens the prequal modal:** a bottom sheet with "¡Match!" and 3 multiple-choice questions, one at a time, with "Después" to skip.
- First visit: a one-line tutorial ("Izquierda para pasar, derecha para guardar, arriba para ver detalles.") and an "Entendido" button.
- Empty deck: "Ya viste todo." + "Ver guardados".

## Tu algoritmo (visible learning)

- The deck learns from swipes: likes rank a category higher, passes rank it lower, and 3 net "no" hide it from Descubrir (Explorar still shows it).
- **Toast:** after a pass that drops a category, a small pill shows for 2.5s: "Te mostraremos menos {categoría}" or "Ocultamos {categoría} · Ver tu algoritmo" (links to `/perfil#algoritmo`).
- **Panel in Perfil** (`#algoritmo`): one row per category with a photo thumb, the label, "N sí · N no", and a chip: Más (like), Menos (pass), Normal, Oculto (muted). Hidden rows get "Mostrar de nuevo", which clears that category's passes.

## Explore

A 2-column grid of tall photo tiles with the label and count on a flat scrim.

## Light (landing)

The landing page (`/`) is light; the app stays dark. Tokens are scoped under `.landing` in `src/components/landing/landing.css`.

| Token         | Value                 | Use                                                                                       |
| ------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| `--l-bg`      | `#F7F5F3`             | page background                                                                           |
| `--l-surface` | `#FFFFFF`             | cards, secondary pill                                                                     |
| `--l-text`    | `#37322F`             | headings and body, focus ring                                                             |
| `--l-muted`   | `#605A57`             | secondary text                                                                            |
| `--l-line`    | `rgba(55,50,47,0.12)` | hairline borders, frame lines                                                             |
| `--l-accent`  | `#F2B544`             | marigold: fills only (primary pill, step numbers, checks, underline). Never text on light |

Headlines use Instrument Serif (`.serif`); body stays Geist. Flat diagonal hairline hatch (SVG) behind the final CTA; no gradients.

## Copy

Spanish only, using tú. Short and plain. Pay shows as "USD/h"; missing pay shows as "Pago no publicado".

## Motion

The card follows the finger with ±12° rotation at 200px; release past 110px or a fast flick flies it out. Sheets and the tab pill use springs. Respect `prefers-reduced-motion`.
