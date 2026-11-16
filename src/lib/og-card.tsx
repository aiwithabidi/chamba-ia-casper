import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/logo";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared og: fields. Next replaces a parent's openGraph object rather than merging it, so routes spread this. */
export const OG_BASE = { type: "website", locale: "es_419", siteName: "Chamba IA" } as const;

const BG = "#14120F";
const TEXT = "#F3EEE6";
const MUTED = "#A39B8E";
const PRIMARY = "#F2B544";

/** 1200x630 link preview: marigold mark, wordmark, a headline and one sub line on the dark brand background. */
export function ogCard({ headline, sub }: { headline: string; sub: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: BG,
        color: TEXT,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 24,
            background: PRIMARY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 100 100" width={84} height={84}>
            <path d={MARK_PATH} fill={BG} />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 700 }}>
          Chamba<span style={{ color: MUTED, marginLeft: 14 }}>IA</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05 }}>{headline}</div>
        <div style={{ display: "flex", fontSize: 38, color: MUTED }}>{sub}</div>
      </div>
      <div style={{ width: 160, height: 10, borderRadius: 5, background: PRIMARY }} />
    </div>,
    OG_SIZE,
  );
}
