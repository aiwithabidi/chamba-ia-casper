// Learns from swipes: likes push a category up, passes push it down, repeated passes hide it.
import { CATEGORIES, type Category } from "./domain";

export const HIDE_AFTER_NET_PASSES = 3;
const LIKE_POINTS = 6;
const PASS_POINTS = 8;
const MAX_BOOST = 30;

export type AffinityStatus = "mas" | "menos" | "oculto" | "normal";
export type CategoryAffinity = {
  likes: number;
  passes: number;
  boost: number;
  status: AffinityStatus;
};

export function affinity(
  swipes: { category: string; liked: boolean }[],
): Record<Category, CategoryAffinity> {
  return Object.fromEntries(
    CATEGORIES.map((c) => {
      const mine = swipes.filter((s) => s.category === c);
      const likes = mine.filter((s) => s.liked).length;
      const passes = mine.length - likes;
      const boost = Math.max(
        -MAX_BOOST,
        Math.min(MAX_BOOST, likes * LIKE_POINTS - passes * PASS_POINTS),
      );
      const status: AffinityStatus =
        passes - likes >= HIDE_AFTER_NET_PASSES
          ? "oculto"
          : boost > 0
            ? "mas"
            : boost < 0
              ? "menos"
              : "normal";
      return [c, { likes, passes, boost, status }];
    }),
  ) as Record<Category, CategoryAffinity>;
}

const RANK: Record<AffinityStatus, number> = { mas: 3, normal: 2, menos: 1, oculto: 0 };

/** The category a new swipe pushed down to "menos" or "oculto", for the deck's feedback toast. */
export function demotion(
  prev: Record<Category, CategoryAffinity> | undefined,
  next: Record<Category, CategoryAffinity>,
): { category: Category; status: "menos" | "oculto" } | null {
  if (!prev) return null;
  for (const c of CATEGORIES) {
    const status = next[c].status;
    if ((status === "menos" || status === "oculto") && RANK[status] < RANK[prev[c].status])
      return { category: c, status };
  }
  return null;
}
