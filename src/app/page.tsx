import type { Metadata, Viewport } from "next";
import { Landing } from "@/components/landing/landing";
import { landingJsonLd } from "@/lib/structured-data";
import { SEED_ROLES } from "../../convex/seedData";

// The landing is light; match the iOS status bar to its background.
export const viewport: Viewport = { themeColor: "#f7f5f3" };

export const metadata: Metadata = { alternates: { canonical: "/" } };

// The platforms with the most roles in the seed, by plain-text name (no logos).
const counts = SEED_ROLES.reduce<Record<string, number>>(
  (acc, r) => ({ ...acc, [r.platform]: (acc[r.platform] ?? 0) + 1 }),
  {},
);
const PLATFORMS = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 7)
  .map(([name]) => name);

// "<" is escaped so no string in the graph can close the script tag.
const JSON_LD = JSON.stringify(landingJsonLd()).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD built from our own constants */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD }} />
      <Landing platforms={PLATFORMS} />
    </>
  );
}
