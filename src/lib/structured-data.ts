import { FAQ } from "@/components/landing/faq";
import { SITE_URL } from "@/lib/site";

// JSON-LD for the landing: who runs the site, what the app is, and the same FAQ the page shows.
// Answer engines read the visible Q&A first; this graph disambiguates the entity and mirrors it.
export function landingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Chamba IA",
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Chamba IA",
        url: SITE_URL,
        inLanguage: "es",
        applicationCategory: "BusinessApplication",
        operatingSystem: "iOS, Android, Web",
        description:
          "App gratuita en español que reúne trabajos de entrenamiento de IA (voz, transcripción, evaluación y revisión experta) para hispanohablantes de Latinoamérica, calcula tu encaje y te precalifica antes de postular.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${SITE_URL}/#org` },
      },
      {
        "@type": "FAQPage",
        inLanguage: "es",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
}
