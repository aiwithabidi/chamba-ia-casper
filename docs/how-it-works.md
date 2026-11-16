# How Chamba IA works

A file map for reading the code. The README has the product, the algorithms and the status.

## The flow in one line

Sign up → onboarding → swipe jobs ranked by fit → 3-question pre-screen on a match → AI interview → talent card → apply on the platform → "¿Te aceptaron?" with a proof screenshot → verified placements feed the ranking.

## Stack, and why

| Piece | Choice | Why |
| --- | --- | --- |
| App | Next.js 16 (App Router), React 19, Tailwind 4 | One TypeScript codebase that installs as a phone app (PWA) with no App Store |
| Backend + DB | Convex | Live queries, auth, file storage and server functions in one place, with no API layer to write |
| Auth | Convex Auth, username and password | No email provider needed inside the timebox |
| Swipe gestures | `motion` | Drag, rotate and fly-out physics |
| AI | Claude (`claude-haiku-5-5`) via the AI SDK, 12 s timeout, $3/day spend cap | Writes and grades the interview. Templates and a heuristic grader take over with no key, on timeout or over budget |
| Tour | `driver.js` | First-run guided tour of the deck |
| Hosting | Vercel (Next.js) and Convex cloud | The Vercel build runs `convex deploy`, so both ship together |

## Backend (`convex/`)

| File | What it does |
| --- | --- |
| `schema.ts` | Tables and their indexes |
| `roles.ts` | The deck query: fit + swipe affinity + placement boosts − freshness penalty; categories; `seed` |
| `swipes.ts` | Record and undo swipes, saved list, the pre-qualifier questions (answer key stripped) and grading |
| `screenings.ts` | The AI interview: start, answer, follow-up, final grade and talent card, with the template fallback |
| `outcomes.ts` | Apply clicks, "¿Postulaste?" / "¿Te aceptaron?", proof upload (raster images only), the operator review queue and the verified-candidate list |
| `talent.ts` | Aggregate pool stats: no names or individual profiles leave the backend |
| `admin.ts` | Operator check and the admin funnel stats |
| `activity.ts` | Activity heatmap data |
| `aiUsage.ts` | Today's Anthropic spend, checked against the daily cap |
| `referrals.ts` | Invite codes, at most 3 per inviter |
| `profiles.ts`, `users.ts`, `auth.ts` | Onboarding profile, session checks, Convex Auth wiring |
| `wallet.ts` | Leftover from an earlier design; nothing in the UI reads it (see README, What is incomplete) |
| `lib/*.ts` | Pure, unit-tested logic: `fit`, `affinity`, `freshness`, `outcomes`, `rubric`, `effort`, `prequal`, `importJobs`, `referral`, `aiBudget`, `adminStats`, `domain` |

## Data

- `data/roles.csv`: 63 curated Spanish roles from aitraining.jobs, built into `convex/seedData.ts` by `scripts/build-seed.ts`.
- `convex/liveRoles.ts`: Spanish roles from the Apify scrape, built by `scripts/import-jobs.ts`.
- Every role links out to its original posting; full descriptions are never republished.

## Frontend (`src/`)

| Path | What it does |
| --- | --- |
| `app/page.tsx`, `components/landing/` | Landing, FAQ and its JSON-LD |
| `app/entrar/`, `app/onboarding/`, `app/instalar/` | Sign-in, onboarding, install steps |
| `app/(app)/descubrir`, `explorar`, `guardados`, `perfil` | The four tabs |
| `app/entrevista/[roleId]` | The AI interview screen |
| `app/talento` | Operator pool view and proof review |
| `app/i/[code]` | Invite link with a rich preview |
| `components/swipe-deck.tsx`, `role-sheet.tsx`, `prequal-modal.tsx` | Deck, job detail, pre-qualifier |
| `components/talent-card.tsx`, `progress-card.tsx`, `algorithm-panel.tsx` | Talent card, "Tu progreso", "Tu algoritmo" |
| `components/outcome-prompt.tsx`, `proof-review.tsx` | Placement follow-up and operator review |
| `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt` | Search and AI answer-engine discovery |
