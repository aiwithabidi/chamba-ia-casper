"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { TopBar } from "@/components/wallet-pill";
import { api } from "../../../../convex/_generated/api";
import { CATEGORIES, CATEGORY_INFO } from "../../../../convex/lib/domain";

export default function Explorar() {
  const cats = useQuery(api.roles.categories);
  return (
    <>
      <TopBar title="Explorar" />
      <div className="scroll-body grid grid-cols-2 content-start gap-3 px-4">
        {CATEGORIES.map((c) => {
          const info = CATEGORY_INFO[c];
          const stat = cats?.[c];
          return (
            <Link
              key={c}
              href={`/explorar/${c}`}
              className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-tile bg-surface-2 odd:last:col-span-2 odd:last:aspect-[2/1]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/img/${c}.jpg`}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <span className="relative flex flex-col gap-0.5 bg-black/65 px-4 py-3">
                <span className="text-[17px] leading-tight font-bold">{info.label}</span>
                <span className="text-sm leading-snug text-white/80 tabular-nums">
                  {stat ? `${stat.count} trabajos` : "…"}
                  {stat?.topPay ? <span className="block">hasta ${stat.topPay}/h</span> : null}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
