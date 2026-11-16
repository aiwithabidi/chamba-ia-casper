/** Chamba mark: an open "c" with a dot in its mouth (c + point, the match). 100x100 box. */
export const MARK_PATH =
  "M69.55 71.85A34 34 0 1 1 69.55 28.15L56.52 39.07A17 17 0 1 0 56.52 60.93ZM72.5 50a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z";

export function Mark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="8 14 84 72"
      width={size * (84 / 72)}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}

/** Wordmark: marigold mark + "Chamba", with a muted "IA". */
export function Logo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}
      style={{ fontSize: size }}
      aria-label="Chamba IA"
    >
      <Mark size={size * 0.9} className="text-accent" />
      <span aria-hidden="true">
        Chamba <span className="font-semibold text-muted">IA</span>
      </span>
    </span>
  );
}
