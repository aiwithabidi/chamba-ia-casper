"use client";

import { AlgorithmPanel } from "@/components/algorithm-panel";
import { BackButton } from "@/components/ui";

export default function Algoritmo() {
  return (
    <>
      <header className="flex shrink-0 items-center gap-1 px-4 pb-3">
        <BackButton href="/perfil" label="Volver a Perfil" />
        <h1 className="text-xl font-bold tracking-tight">Tu algoritmo</h1>
      </header>
      <div className="scroll-body px-4">
        <AlgorithmPanel />
      </div>
    </>
  );
}
