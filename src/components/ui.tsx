"use client";

import { Check, ChevronLeft, ChevronRight, CircleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "lg" | "md" | "sm";

const SIZE: Record<Size, string> = {
  lg: "min-h-14 px-6 text-[17px]",
  md: "min-h-12 px-5 text-[15px]",
  sm: "min-h-11 px-4 text-sm",
};
const VARIANT: Record<Variant, string> = {
  primary: "bg-accent",
  secondary: "border border-line text-text",
  ghost: "bg-surface-2 text-text",
};

/** Shared pill shape: 44pt+ target, one-line semibold label, press to 0.96. Full width unless `fit`. */
export function pillClass(
  variant: Variant = "primary",
  size: Size = "lg",
  disabled = false,
  fit = false,
) {
  const tone = disabled && variant === "primary" ? "bg-surface-2 text-muted" : VARIANT[variant];
  const width = fit ? "shrink-0" : "w-full";
  return `inline-flex items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-[scale,opacity] duration-150 ease-out not-disabled:active:scale-[0.96] disabled:opacity-60 ${width} ${SIZE[size]} ${tone}`;
}

export function PillButton({
  disabled,
  children,
  onClick,
  variant = "primary",
  size = "lg",
  type = "button",
  fit = false,
  className = "",
}: {
  disabled?: boolean;
  fit?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${pillClass(variant, size, disabled, fit)} ${className}`}
    >
      {children}
    </button>
  );
}

export function PillLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  external,
  fit = false,
  className = "",
}: {
  href: string;
  fit?: boolean;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  external?: boolean;
  className?: string;
}) {
  const cls = `${pillClass(variant, size, false, fit)} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Chip({
  on,
  children,
  onClick,
  icon: Icon,
}: {
  on: boolean;
  children: React.ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-medium transition-colors duration-150 ${on ? "bg-accent border-transparent" : "border-line text-text"}`}
    >
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden className={on ? "" : "text-accent"} />}
      {children}
    </button>
  );
}

/** Category tile with its photo; selected shows a check, not just a color change. */
export function Tile({
  on,
  img,
  label,
  onClick,
  icon: Icon,
}: {
  on: boolean;
  img: string;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-tile border-2 bg-surface-2 text-left transition-colors duration-150 ${on ? "border-primary" : "border-transparent"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
      {on && (
        <span className="bg-accent absolute top-2 right-2 grid size-6 place-items-center rounded-full">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      <span className="relative flex flex-col items-start gap-1 bg-black/65 px-2.5 py-2 text-[13px] leading-tight font-semibold text-white">
        {Icon && (
          <Icon
            size={14}
            strokeWidth={2.25}
            aria-hidden
            className={`shrink-0 ${on ? "text-accent" : ""}`}
          />
        )}
        {label}
      </span>
    </button>
  );
}

/** Small uppercase heading for a group of fields or facts. */
export function SectionLabel({
  children,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  as?: "h2" | "h3" | "p";
}) {
  return (
    <Tag className="text-[13px] font-semibold tracking-[0.05em] text-muted uppercase">
      {children}
    </Tag>
  );
}

/** 44pt back control: a link when given href, a button otherwise. */
export function BackButton({
  href,
  onClick,
  label = "Volver",
}: {
  href?: string;
  onClick?: () => void;
  label?: string;
}) {
  const cls = "-ml-2 grid size-11 shrink-0 place-items-center rounded-full text-muted";
  const icon = <ChevronLeft size={26} strokeWidth={2.25} />;
  if (href)
    return (
      <Link href={href} aria-label={label} className={cls}>
        {icon}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {icon}
    </button>
  );
}

/** Inline error message: neutral surface, alert icon, readable text. */
export function ErrorNote({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={`flex items-start gap-2 rounded-field bg-surface-2 px-4 py-3 text-sm ${className}`}
    >
      <CircleAlert size={18} strokeWidth={2} className="mt-px shrink-0 text-pass" />
      <span>{children}</span>
    </p>
  );
}

/** Full-width action row (icon, label, optional hint, chevron), the shape of "Tu algoritmo" in Perfil. */
export function RowLink({
  href,
  icon: Icon,
  label,
  hint,
  onClick,
  tour,
}: {
  href?: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick?: () => void;
  tour?: string;
}) {
  const cls =
    "flex min-h-16 w-full items-center gap-3 rounded-card bg-surface p-4 text-left transition-[scale] duration-150 ease-out active:scale-[0.98]";
  const body = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold">{label}</span>
        {hint && <span className="block truncate text-sm text-muted">{hint}</span>}
      </span>
      <ChevronRight size={20} strokeWidth={2} aria-hidden className="shrink-0 text-muted" />
    </>
  );
  if (href)
    return (
      <Link href={href} onClick={onClick} data-tour={tour} className={cls}>
        {body}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} data-tour={tour} className={cls}>
      {body}
    </button>
  );
}
