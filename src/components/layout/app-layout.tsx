import { Header } from "./header";
import { Footer } from "./footer";
import { Toaster } from "@/components/ui/toaster";
import { CurrencySelectorServer } from "@/features/system/components/currency-selector-server";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header currencySlot={<CurrencySelectorServer />} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </>
  );
}
