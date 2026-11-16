"use client";

import { Logo } from "@/components/logo";

export function TopBar({ title }: { title?: string }) {
  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between bg-bg px-4 pb-3">
      {title ? <span className="text-xl font-bold tracking-tight">{title}</span> : <Logo />}
    </header>
  );
}
