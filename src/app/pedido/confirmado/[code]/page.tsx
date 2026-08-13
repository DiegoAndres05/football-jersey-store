import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderByCode } from "@/features/orders/repositories/order-repository";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const metadata: Metadata = {
  title: "Pedido confirmado",
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { code } = await params;
  const order = await getOrderByCode(code);

  if (!order) notFound();

  return (
    <div className="container-page py-16 max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
          ¡Pedido recibido!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
          registrado. Te escribiremos a <span className="font-semibold text-foreground">{order.customerEmail}</span> con
          los detalles de entrega.
        </p>

        <p className="mt-4 rounded-lg bg-secondary/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed text-left">
          Nota: el pago se registró en modo simulación (aún no hay pasarela conectada). El pedido
          queda pendiente de pago hasta confirmarlo por WhatsApp o con la integración real.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-xl border border-border p-4">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Estado</dt>
            <dd className="mt-1 font-medium">Pendiente de pago</dd>
          </div>
          <div className="rounded-xl border border-border p-4">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Total</dt>
            <dd className="mt-1 font-semibold tabular-nums">{formatPrice(order.total)}</dd>
          </div>
          <div className="rounded-xl border border-border p-4 col-span-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Envío a</dt>
            <dd className="mt-1">
              {order.shippingFullName} · {order.shippingLine1}, {order.shippingCity},{" "}
              {order.shippingState}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-2 text-left">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.teamName} · {item.versionName} · Talla {item.sizeName} · x{item.quantity}
                </p>
              </div>
              <p className="font-medium tabular-nums shrink-0">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <Button className="mt-8" asChild>
          <Link href="/productos">
            Seguir comprando <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}