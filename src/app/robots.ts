import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Open to every crawler, AI answer engines included. Signed-in screens are kept out of indexes;
// invite links (/i/...) stay crawlable so social and chat apps can build their previews.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/descubrir",
        "/explorar",
        "/guardados",
        "/perfil",
        "/entrevista",
        "/onboarding",
        "/talento",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
