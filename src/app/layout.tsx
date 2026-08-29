import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppLayout } from "@/components/layout/app-layout";
import { Tooltip } from "@/components/ui/tooltip";
import { SITE } from "@/shared/config/site";
import "./globals.css";

// Fuentes locales (self-hosted) para builds reproducibles sin red.
// El display condensado usa Arial Narrow / Impact vía fallback CSS
// (ver tailwind.config.ts y el :root en globals.css).
const inter = localFont({
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flashsport — Camisetas de fútbol",
    template: "%s · Flashsport",
  },
  description:
    "Camisetas de fútbol de calidad, réplicas de tus equipos favoritos, con personalización y envío a toda Colombia.",
  keywords: [
    "camisetas de fútbol",
    "camisetas de equipos",
    "réplicas de camisetas",
    "personalización de camisetas",
    "Flashsport",
    "Colombia",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Flashsport",
    title: "Flashsport — Camisetas de fútbol",
    description:
      "Camisetas de fútbol de calidad con personalización y envío a toda Colombia.",
  },
  twitter: {
    card: "summary",
    title: "Flashsport — Camisetas de fútbol",
    description:
      "Camisetas de fútbol de calidad con personalización y envío a toda Colombia.",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: siteUrl,
    description: SITE.tagline,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: SITE.email,
      availableLanguage: "Spanish",
    },
  };

  return (
    <html lang="es" className={`${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Tooltip.Provider delayDuration={300}>
          <AppLayout>{children}</AppLayout>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
