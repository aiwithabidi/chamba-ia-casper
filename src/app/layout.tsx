import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { OG_BASE } from "@/lib/og-card";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const title = "Chamba IA · Trabajos de IA en español";
const description =
  "Desliza, encuentra y prepárate para trabajos de entrenamiento de IA pagados en dólares. 100% en español.";

export const metadata: Metadata = {
  // Absolute og:image URLs for link previews (iMessage, WhatsApp, X, Slack).
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: { ...OG_BASE, title, description },
  twitter: { card: "summary_large_image", title, description },
  // "default", not "black-translucent": the installed iOS 27 app blurs whatever sits under a
  // translucent status bar, even inside a fixed shell. iOS saves this style when the app is added to the
  // home screen, so existing installs keep the old style until they are re-added.
  appleWebApp: { capable: true, title: "Chamba IA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#14120f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-dvh font-sans">
        <Providers>
          <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-bg">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
