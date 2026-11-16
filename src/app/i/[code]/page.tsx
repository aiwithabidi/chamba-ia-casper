import type { Metadata } from "next";
import { Suspense } from "react";
import { OG_BASE } from "@/lib/og-card";
import { InviteRedirect } from "./invite-redirect";

const title = "Te invitaron a Chamba IA";
const description = "Crea tu perfil y encuentra trabajos reales entrenando IA, pagados en dólares.";

// Static metadata: link previews (iMessage, WhatsApp) read this 200 page. A server redirect
// would send crawlers to /entrar and they would show the generic card instead.
export const metadata: Metadata = {
  title,
  description,
  openGraph: { ...OG_BASE, title, description },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: false },
};

export default function InvitePage() {
  return (
    <Suspense>
      <InviteRedirect />
    </Suspense>
  );
}
