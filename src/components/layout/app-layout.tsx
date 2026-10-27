import { Header } from "./header";
import { Footer } from "./footer";
import { Toaster } from "@/components/ui/toaster";
import { CurrencySelectorServer } from "@/features/system/components/currency-selector-server";
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner";
import { headers } from "next/headers";

export async function AppLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const isAdminRoute = requestHeaders.get("x-admin-route") === "true";
  const pathname = requestHeaders.get("x-pathname") ?? "";

  if (pathname === "/design-system") {
    return <div className="min-h-screen bg-[#faf9f7] text-[#141414]">{children}</div>;
  }

  if (isAdminRoute) {
    return (
      <div className="h-screen overflow-hidden">
        <main className="h-full min-h-0">{children}</main>
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <Header currencySlot={<CurrencySelectorServer />} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
      <CookieConsentBanner />
    </>
  );
}
