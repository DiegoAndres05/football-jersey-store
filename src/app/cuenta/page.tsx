import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Mi cuenta",
};

export default function CuentaPage() {
  return (
    <div className="container-page py-8 md:py-12 max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Mi cuenta</span>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Cuenta
      </p>
      <h1 className="mt-2 font-display text-5xl md:text-6xl font-bold uppercase tracking-tight">
        Mi cuenta
      </h1>
      <div className="mt-12 rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          La gestión de cuenta y pedidos estará disponible próximamente. Por ahora
          puedes comprar sin crear cuenta: tus pedidos se siguen por WhatsApp.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/productos">
            Explorar el catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}