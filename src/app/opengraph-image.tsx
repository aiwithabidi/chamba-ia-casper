import { OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = "Chamba IA: No te contratamos. Te conectamos.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    headline: "No te contratamos. Te conectamos.",
    sub: "Trabajos reales entrenando IA, en español",
  });
}
