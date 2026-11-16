"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { pillClass } from "./ui";

/** An outbound "Postular" link that records the click for the placement follow-up. The record is fire and
 * forget: the link opens in a new tab whether or not the mutation lands. */
export function ApplyLink({
  roleId,
  href,
  children,
  variant = "primary",
  size = "lg",
  fit = false,
  className = "",
  tour,
}: {
  roleId: Id<"roles">;
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md" | "sm";
  fit?: boolean;
  className?: string;
  tour?: string;
}) {
  const click = useMutation(api.outcomes.click);
  const track = () => {
    click({ roleId }).catch((err: unknown) =>
      console.warn("No se pudo registrar la postulación", err),
    );
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={track}
      onAuxClick={track}
      data-tour={tour}
      className={`${pillClass(variant, size, false, fit)} ${className}`}
    >
      {children}
    </a>
  );
}
