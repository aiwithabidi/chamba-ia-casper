"use client";

// Static import: a lazy import("driver.js") chunk has 404'd on a deployed Vercel site before.
import { type Driver, type DriveStep, driver, type HookOpts, type PopoverDOM } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour.css";
import { useMutation, useQuery } from "convex/react";
import { GraduationCap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { neighbor, stepOffset, TOTAL_STEPS, type TourStep, WALKTHROUGH } from "@/lib/tour-steps";
import { api } from "../../convex/_generated/api";
import { TourIntro } from "./tour-intro";
import { RowLink } from "./ui";

/** First-run flag. Bump the suffix to show a changed tour again to this browser. */
const SEEN_KEY = "chamba-tour-v1";
/** `?tour` replays intro + walkthrough; `?tour=walk` / `?tour=back` continue it on the next / previous page. */
const PARAM = "tour";
const WAIT_MS = 5000;
const SETTLE_MS = 1500;
const STILL_FRAMES = 12; // ~200ms with no anchor moving
const GAP = 12;

type Mode = "intro" | "walk" | "back";

const seenLocally = () => {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true; // blocked storage = seen
  }
};
const markSeenLocally = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked */
  }
};

const visible = (el: Element | null) => !!el?.getClientRects().length;
/** First match of a selector list that is on screen (later selectors are fallbacks). */
const find = (sel: string) =>
  sel
    .split(",")
    .flatMap((s) => [...document.querySelectorAll(s.trim())])
    .find(visible) ?? null;
const isStandalone = () =>
  matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Resolves once every step of the page is on screen (or WAIT_MS passes), two frames later. */
function whenReady(steps: TourStep[]): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => {
      obs.disconnect();
      clearTimeout(cap);
      settleLayout(steps).then(resolve);
    };
    const check = () => steps.every((s) => find(s.element)) && settle();
    const obs = new MutationObserver(check);
    const cap = setTimeout(settle, WAIT_MS);
    obs.observe(document.body, { childList: true, subtree: true });
    check();
  });
}

/** Resolves once the anchors stop moving (late cards above them push them down), capped at SETTLE_MS. */
function settleLayout(steps: TourStep[]): Promise<void> {
  const sig = () =>
    steps
      .map((s) => find(s.element)?.getBoundingClientRect().top ?? -1)
      .concat(document.body.scrollHeight)
      .join();
  return new Promise((resolve) => {
    const end = performance.now() + SETTLE_MS;
    let last = sig();
    let still = 0;
    const tick = () => {
      const now = sig();
      still = now === last ? still + 1 : 0;
      last = now;
      if (still >= STILL_FRAMES || performance.now() > end) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** Safe-area insets, read once from a probe (env() is not readable from JS directly). */
function safeInsets() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
  document.body.append(probe);
  const cs = getComputedStyle(probe);
  const out = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  probe.remove();
  return out;
}

/** The band a popover may use: below the page header (or status bar), above the tab bar (or home indicator). */
function band() {
  const safe = safeInsets();
  // Next keeps the previous route mounted but hidden; a hidden bar measures 0x0, so skip it.
  const shown = (r?: DOMRect) => (r?.height ? r : undefined);
  const header = shown(document.querySelector("main header")?.getBoundingClientRect());
  const tabs = document.querySelector('[data-tour="perfil-tab"]')?.closest("nav");
  const tabTop = shown(tabs?.getBoundingClientRect())?.top;
  return {
    top: Math.max(header?.bottom ?? 0, safe.top) + 8,
    bottom: (tabTop ?? innerHeight - safe.bottom) - 8,
  };
}

function scrollParent(el: Element) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    // driver.js sets the active element's parents to overflow:hidden; scrollTop still works there.
    const o = getComputedStyle(p).overflowY;
    if (o !== "visible" && o !== "clip" && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

/** Glide first, then highlight: put a scrolled target's top just under the header, instantly. */
function bringIntoView(step: TourStep) {
  const el = find(step.element);
  const box = scrollParent(el ?? document.body);
  if (!el || !box) return;
  box.scrollTop += el.getBoundingClientRect().top - band().top;
}

/** Full-width popover in the 430px column, placed below, above, or docked inside the safe band. */
function placePopover(popover: PopoverDOM, { state }: HookOpts, steps: TourStep[]) {
  const s = popover.wrapper.style;
  s.left = "max(12px, calc(50vw - 203px))";
  s.right = "max(12px, calc(50vw - 203px))";
  s.width = "auto";
  s.maxWidth = "none";
  s.bottom = "auto";
  const el = state.activeElement;
  const step = steps.find((t) => el && find(t.element) === el);
  if (!el || !step) return;
  const { top, bottom } = band();
  const h = popover.wrapper.offsetHeight;
  const r = el.getBoundingClientRect();
  const below = r.bottom + GAP;
  const above = r.top - GAP - h;
  let y: number;
  if (step.dockAbove && above >= top) y = above;
  else if (below + h <= bottom) y = below;
  else if (above >= top) y = above;
  else y = step.dockTop ? top : bottom - h;
  s.top = `${Math.round(Math.min(Math.max(y, top), bottom - h))}px`;
}

/** A plain dim layer held over a page hop, so the walkthrough goes dim to dim instead of flashing. */
const VEIL_ID = "chamba-tour-veil";
function showVeil() {
  if (document.getElementById(VEIL_ID)) return;
  const v = document.createElement("div");
  v.id = VEIL_ID;
  v.className = "chamba-tour-veil";
  document.body.append(v);
  setTimeout(() => v.remove(), WAIT_MS + 1000); // never strand the page dimmed
}
const hideVeil = () => document.getElementById(VEIL_ID)?.remove();

let active: Driver | null = null;
let run = 0; // a newer walkPage call (or unmount) cancels one still waiting for its anchors

/** Walk this page's steps; the last Next hops to the next page, the first Back to the previous one. */
async function walkPage(path: string, from: "first" | "last", go: (href: string) => void) {
  const page = WALKTHROUGH.find((p) => p.path === path);
  if (!page) return hideVeil();
  const token = ++run;
  await whenReady(page.steps);
  if (token !== run || location.pathname !== path) return;
  const offset = stepOffset(path);
  const skip = (p: string) => p === "/instalar" && isStandalone();
  const next = neighbor(path, 1, skip);
  const prev = neighbor(path, -1, skip);
  const present = page.steps
    .map((s, i) => ({ s, n: offset + i + 1, el: find(s.element) }))
    .filter((x) => x.el);
  const hop = (href: string | null, mode: Mode) => {
    if (!href) return;
    showVeil();
    active?.destroy();
    go(`${href}?${PARAM}=${mode}`);
  };
  if (!present.length) {
    hideVeil();
    return hop(next, "walk"); // nothing to show here (data never arrived): go on, don't stall
  }

  const steps: DriveStep[] = present.map(({ s, n, el }, i) => ({
    element: el as Element,
    popover: {
      title: s.title,
      description: s.text,
      progressText: `${n} de ${TOTAL_STEPS}`,
      ...(i === present.length - 1 && next ? { doneBtnText: "Siguiente" } : {}),
      ...(i === 0 && prev ? { disableButtons: [] } : {}),
    },
  }));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const d = driver({
    steps,
    animate: !reduce,
    allowClose: true,
    showProgress: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Atrás",
    doneBtnText: "Listo",
    closeBtnLabel: "Cerrar",
    popoverClass: "chamba-tour",
    overlayColor: "#000",
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 24,
    disableActiveInteraction: true, // no swipe or tab change mid-tour
    scrollIntoView: false, // bringIntoView scrolls first, so the highlight never chases a scroll
    onPopoverPositioned: (p, o) =>
      placePopover(
        p,
        o,
        present.map((x) => x.s),
      ),
    onNextClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (i < steps.length - 1) {
        bringIntoView(present[i + 1].s);
        return d.moveNext();
      }
      if (next) return hop(next, "walk");
      d.destroy();
    },
    onPrevClick: () => {
      const i = d.getActiveIndex() ?? 0;
      if (i > 0) {
        bringIntoView(present[i - 1].s);
        return d.movePrevious();
      }
      hop(prev, "back");
    },
    onDestroyed: () => {
      if (active === d) active = null;
    },
  });
  active = d;
  const start = from === "last" ? steps.length - 1 : 0;
  bringIntoView(present[start].s);
  d.drive(start);
  hideVeil();
}

/** Mounted in the app shell and on /instalar: the first-run intro + walkthrough, and its page hops. */
export function Tour() {
  const path = usePathname();
  const router = useRouter();
  const profile = useQuery(api.profiles.me);
  const markSeen = useMutation(api.profiles.markTutorialSeen);
  const [intro, setIntro] = useState(false);
  const ready = profile !== undefined;
  const seenOnProfile = profile?.tutorialSeen ?? true;

  useEffect(() => {
    const url = new URL(location.href);
    const raw = url.searchParams.get(PARAM);
    if (raw !== null) {
      url.searchParams.delete(PARAM);
      history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    }
    if (raw === "walk" || raw === "back") {
      void walkPage(path, raw === "back" ? "last" : "first", router.push);
      return;
    }
    if (path !== "/descubrir") return;
    const replay = raw !== null; // "Ver tutorial" in Perfil
    if (!replay && (!ready || seenOnProfile || seenLocally())) return;
    if (!replay) {
      markSeenLocally(); // seen at start: closing early still counts
      void markSeen().catch(() => {
        /* localStorage still holds it */
      });
    }
    // After the deck's first paint. Not cancelled on re-run: `ready` flipping must not drop a replay.
    requestAnimationFrame(() => setIntro(true));
    // Once per page visit, after the profile loads; markSeen flipping tutorialSeen must not restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ready]);

  useEffect(
    () => () => {
      run += 1;
      active?.destroy(); // the veil stays: an unmount mid-hop (into /instalar) must not flash
    },
    [],
  );

  if (!intro) return null;
  return (
    <TourIntro
      onSkip={() => setIntro(false)}
      onStart={() => {
        setIntro(false);
        void walkPage("/descubrir", "first", router.push);
      }}
    />
  );
}

/** "Ver tutorial" row for Perfil: replays the intro, then the walkthrough. */
export function TourReplayLink() {
  return (
    <RowLink
      href={`/descubrir?${PARAM}`}
      icon={GraduationCap}
      label="Ver tutorial"
      hint="Cómo funciona Chamba, paso a paso"
    />
  );
}
