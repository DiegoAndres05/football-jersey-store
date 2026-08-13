import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import { AppLayout } from "@/components/layout/app-layout";
import { Tooltip } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Flashsport",
    template: "%s · Flashsport",
  },
  description: "Camisetas de fútbol de calidad con envío a toda Colombia",
};

export const viewport: Viewport = {
  themeColor: "#faf9f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Tooltip.Provider delayDuration={300}>
          <AppLayout>{children}</AppLayout>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
