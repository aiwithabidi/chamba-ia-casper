import { OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = "Te invitaron a Chamba IA";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    headline: "Te invitaron a Chamba IA",
    sub: "Trabajos reales entrenando IA, en español",
  });
}
