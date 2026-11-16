import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chamba IA",
    short_name: "Chamba",
    description: "Trabajos de entrenamiento de IA en español, pagados en dólares.",
    lang: "es",
    start_url: "/descubrir",
    display: "standalone",
    background_color: "#14120F",
    theme_color: "#14120F",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-mono-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
  };
}
