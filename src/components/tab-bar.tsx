"use client";

import { Compass, Flame, Heart, type LucideIcon, User } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/descubrir", label: "Descubrir", Icon: Flame },
  { href: "/explorar", label: "Explorar", Icon: Compass },
  { href: "/guardados", label: "Guardados", Icon: Heart },
  { href: "/perfil", label: "Perfil", Icon: User },
];

export function TabBar() {
  const path = usePathname();
  return (
    <nav className="pb-safe relative z-30 shrink-0 px-4">
      <div className="flex items-center justify-around rounded-full border border-line bg-surface px-2 py-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              data-tour={href === "/perfil" ? "perfil-tab" : undefined}
              aria-current={active ? "page" : undefined}
              className="relative flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="tab"
                  className="absolute inset-0 rounded-full bg-surface-2"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={2}
                className={`relative ${active ? "text-primary" : "text-muted"}`}
                fill={active ? "currentColor" : "none"}
              />
              <span className={`relative ${active ? "text-primary" : "text-muted"}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
