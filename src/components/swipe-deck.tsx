"use client";

import { useMutation, useQuery } from "convex/react";
import { ChevronRight, ChevronUp, Heart, RotateCcw, X } from "lucide-react";
import { animate, motion, type PanInfo, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { type CategoryAffinity, demotion } from "../../convex/lib/affinity";
import { CATEGORY_INFO, type Category, formatPay, spanishLabel } from "../../convex/lib/domain";
import { postedEs } from "../lib/posted";
import { PrequalModal } from "./prequal-modal";
import { RoleSheet } from "./role-sheet";
import { PillLink } from "./ui";

const THRESHOLD = 110;
const FLICK = 600;
const TOAST_MS = 2500;

type DeckRole = NonNullable<ReturnType<typeof useDeck>>[number];
const useDeck = (category?: Category) => useQuery(api.roles.deck, category ? { category } : {});

export function SwipeDeck({ category }: { category?: Category }) {
  const deck = useDeck(category);
  const algo = useQuery(api.roles.algorithm);
  const record = useMutation(api.swipes.record);
  const undo = useMutation(api.swipes.undoLast);
  const [gone, setGone] = useState<Id<"roles">[]>([]);
  const [sheet, setSheet] = useState<DeckRole | null>(null);
  const [match, setMatch] = useState<DeckRole | null>(null);
  const x = useMotionValue(0);
  const prevAlgo = useRef<Record<Category, CategoryAffinity> | undefined>(undefined);
  const [toast, setToast] = useState<ReturnType<typeof demotion>>(null);

  // A pass that drops a category to "menos" or "oculto" gets a short toast, so the algorithm is visible.
  useEffect(() => {
    if (!algo) return;
    const change = demotion(prevAlgo.current, algo);
    prevAlgo.current = algo;
    if (!change) return;
    setToast(change);
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [algo]);

  if (deck === undefined || deck === null)
    return <div className="mx-4 mb-20 min-h-0 flex-1 animate-pulse rounded-card bg-surface" />;

  const visible = deck.filter((r) => !gone.includes(r._id));
  const top = visible[0];

  async function swipe(liked: boolean) {
    if (!top) return;
    await animate(x, liked ? 600 : -600, { duration: 0.25 });
    setGone((g) => [...g, top._id]);
    x.set(0);
    await record({ roleId: top._id, liked });
    if (liked) setMatch(top);
  }

  async function onUndo() {
    await undo();
    setGone((g) => g.slice(0, -1));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-4">
      {toast && (
        <div
          role="status"
          className="absolute top-7 left-1/2 z-30 flex w-max max-w-[calc(100%-3rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[13px]"
        >
          {toast.status === "menos" ? (
            <span>
              Te mostraremos menos <b>{CATEGORY_INFO[toast.category].label}</b>
            </span>
          ) : (
            <>
              <span>
                Ocultamos <b>{CATEGORY_INFO[toast.category].label}</b>
              </span>
              <Link
                href="/perfil/algoritmo"
                className="-my-1.5 -mr-2 inline-flex min-h-9 items-center gap-0.5 rounded-full bg-surface-2 pr-2 pl-3 font-semibold"
              >
                Ver
                <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
              </Link>
            </>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {!top && (
          <div className="flex h-full flex-col items-center justify-center gap-4 rounded-card bg-surface p-8 text-center">
            <p className="text-xl font-bold">Ya viste todo.</p>
            <PillLink href="/guardados" size="md" fit>
              Ver guardados
            </PillLink>
            <PillLink href="/perfil#invita" variant="secondary" size="sm" fit>
              Invita a tus amigos
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </PillLink>
          </div>
        )}
        {visible
          .slice(0, 2)
          .reverse()
          .map((role) => (
            <Card
              key={role._id}
              role={role}
              isTop={role._id === top?._id}
              x={x}
              onSwipe={swipe}
              onOpen={() => setSheet(role)}
            />
          ))}
      </div>

      <div data-tour="actions" className="flex shrink-0 items-center justify-center gap-5 pt-3">
        <button
          onClick={onUndo}
          aria-label="Deshacer"
          className="grid size-12 place-items-center rounded-full border border-line bg-surface text-muted transition-[scale] duration-150 ease-out active:scale-[0.96]"
        >
          <RotateCcw size={20} strokeWidth={2} />
        </button>
        <button
          onClick={() => swipe(false)}
          disabled={!top}
          aria-label="Pasar"
          className="grid size-16 place-items-center rounded-full border-2 border-line bg-surface text-text transition-[scale,opacity] duration-150 ease-out not-disabled:active:scale-[0.96] disabled:opacity-40"
        >
          <X size={28} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => swipe(true)}
          disabled={!top}
          aria-label="Guardar"
          data-tour="like"
          className="bg-accent grid size-16 place-items-center rounded-full transition-[scale,opacity] duration-150 ease-out not-disabled:active:scale-[0.96] disabled:opacity-40"
        >
          <Heart size={26} strokeWidth={2.5} fill="currentColor" />
        </button>
      </div>

      {sheet && <RoleSheet role={sheet} onClose={() => setSheet(null)} />}
      {match && (
        <PrequalModal roleId={match._id} title={match.titleEs} onClose={() => setMatch(null)} />
      )}
    </div>
  );
}

function Card({
  role,
  isTop,
  x,
  onSwipe,
  onOpen,
}: {
  role: DeckRole;
  isTop: boolean;
  x: ReturnType<typeof useMotionValue<number>>;
  onSwipe: (liked: boolean) => void;
  onOpen: () => void;
}) {
  const [page, setPage] = useState(0);
  const [dragged, setDragged] = useState(false);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const passOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const info = CATEGORY_INFO[role.category];
  const pages = 3;

  function onDragEnd(_: unknown, i: PanInfo) {
    if (i.offset.y < -THRESHOLD && Math.abs(i.offset.x) < THRESHOLD) return onOpen();
    if (i.offset.x > THRESHOLD || i.velocity.x > FLICK) return onSwipe(true);
    if (i.offset.x < -THRESHOLD || i.velocity.x < -FLICK) return onSwipe(false);
    animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
  }

  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    if (dragged) return setDragged(false);
    const rect = e.currentTarget.getBoundingClientRect();
    const right = e.clientX - rect.left > rect.width / 2;
    setPage((p) => Math.min(pages - 1, Math.max(0, p + (right ? 1 : -1))));
  }

  return (
    <motion.div
      data-tour={isTop ? "card" : undefined}
      className="absolute inset-0 touch-none overflow-hidden rounded-card bg-surface-2 shadow-[0_12px_32px_rgb(0_0_0/0.35)] select-none"
      style={isTop ? { x, rotate } : { scale: 0.95, y: 12 }}
      drag={isTop}
      dragSnapToOrigin={false}
      // The card only travels sideways; a swipe up still reads from the pointer offset but barely lifts it.
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ left: 0.9, right: 0.9, top: 0.08, bottom: 0 }}
      onDragStart={() => setDragged(true)}
      onDragEnd={onDragEnd}
      onClick={isTop ? onTap : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/img/${role.category}.jpg`}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 size-full object-cover"
      />

      <div
        data-tour={isTop ? "pages" : undefined}
        className="absolute inset-x-3 top-3 z-10 flex gap-1"
      >
        {Array.from({ length: pages }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i === page ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>

      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-10 left-6 z-10 -rotate-12 rounded-lg border-4 border-like px-3 py-1 text-3xl font-black text-like"
          >
            GUARDAR
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-10 right-6 z-10 rotate-12 rounded-lg border-4 border-pass px-3 py-1 text-3xl font-black text-pass"
          >
            PASAR
          </motion.div>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-black/65 p-5">
        {page === 0 && (
          <div className="space-y-2 pr-12">
            <p className="text-[13px] font-semibold tracking-[0.05em] text-white/70 uppercase">
              {info.label}
            </p>
            <p className="text-[28px] leading-[1.1] font-bold tracking-tight text-balance">
              {role.titleEs}
            </p>
            <p className="text-[15px] text-white/80">{role.platform}</p>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[13px] font-semibold tabular-nums">
              <span
                data-tour={isTop ? "fit" : undefined}
                className="rounded-full bg-like px-2.5 py-1 text-black"
              >
                {role.fit.score}% encaje
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">{formatPay(role)}</span>
              {role.remote && <span className="rounded-full bg-white/15 px-2.5 py-1">Remoto</span>}
            </div>
          </div>
        )}
        {page === 1 && (
          <div className="space-y-2 pr-12">
            <p className="text-xl font-bold">Por qué encajas</p>
            {role.fit.reasons.map((r) => (
              <p key={r} className="text-[15px]">
                ✓ {r}
              </p>
            ))}
            {role.fit.gaps.map((g) => (
              <p key={g} className="text-[15px] text-white/60">
                • {g}
              </p>
            ))}
          </div>
        )}
        {page === 2 && (
          <div className="space-y-1.5 pr-12 text-[15px] tabular-nums">
            <p className="text-xl font-bold">Detalles</p>
            <p>{spanishLabel(role.variant)}</p>
            <p>{role.remote ? "Remoto" : "Presencial"}</p>
            <p>Pago: {formatPay(role)}</p>
            {postedEs(role.posted) && (
              <p className="text-white/60">Publicado {postedEs(role.posted)}</p>
            )}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label="Ver detalles"
          className="absolute right-3 bottom-4 grid size-11 place-items-center rounded-full bg-white/20"
        >
          <ChevronUp size={22} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>
  );
}
