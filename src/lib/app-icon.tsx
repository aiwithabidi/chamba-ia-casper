import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/logo";

/**
 * light: dark mark on marigold (default everywhere).
 * mono: white mark on transparent; Android themed icons read only its alpha.
 * Full-bleed square, mark inside the 80% maskable safe zone. iOS rounds the corners itself.
 */
const VARIANTS = {
  light: { bg: "#F2B544", fg: "#14120F" },
  mono: { bg: "transparent", fg: "#FFFFFF" },
} as const;

export type IconVariant = keyof typeof VARIANTS;

export function appIcon(size: number, variant: IconVariant = "light") {
  const { bg, fg } = VARIANTS[variant];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <svg viewBox="0 0 100 100" width={size * 0.8} height={size * 0.8}>
        <path d={MARK_PATH} fill={fg} />
      </svg>
    </div>,
    { width: size, height: size },
  );
}
