"use client";

import { useQuery } from "convex/react";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

/** Perfil entry to /perfil/admin, rendered only for operators (OPERATOR_USER_IDS). */
export function AdminRow() {
  const operator = useQuery(api.admin.amOperator);
  if (!operator) return null;
  return (
    <Link
      href="/perfil/admin"
      className="flex min-h-16 items-center gap-3 rounded-card bg-surface p-4"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
        <LayoutDashboard size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1 text-[17px] font-bold">Panel de admin</span>
      <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-muted" />
    </Link>
  );
}
