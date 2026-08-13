import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppLayout } from "@/components/layout/app-layout";
import { Tooltip } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Football Jersey Store",
    template: "%s · Football Jersey Store",
  },
  description: "Camisetas de fútbol con personalización y envío a Colombia",
};

export const viewport: Viewport = {
  themeColor: "#0a7a3b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <Tooltip.Provider delayDuration={300}>
          <AppLayout>{children}</AppLayout>
        </Tooltip.Provider>
      </body>
    </html>
  );
}
