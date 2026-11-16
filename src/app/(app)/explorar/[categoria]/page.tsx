"use client";

import { useParams } from "next/navigation";
import { SwipeDeck } from "@/components/swipe-deck";
import { BackButton } from "@/components/ui";
import { CATEGORIES, CATEGORY_INFO, type Category } from "../../../../../convex/lib/domain";

export default function CategoriaDeck() {
  const { categoria } = useParams<{ categoria: string }>();
  const category = (CATEGORIES as readonly string[]).includes(categoria)
    ? (categoria as Category)
    : undefined;
  if (!category) return <p className="p-6">Categoría no encontrada.</p>;
  return (
    <>
      <header className="flex shrink-0 items-center gap-1 px-4 pb-3">
        <BackButton href="/explorar" />
        <h1 className="text-xl font-bold tracking-tight">{CATEGORY_INFO[category].label}</h1>
      </header>
      <SwipeDeck category={category} />
    </>
  );
}
