import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderByCode } from "@/features/orders/repositories/order-repository";
import {
  ORDER_CONFIRMATION_COPY,
  orderConfirmationView,
  shouldReconcileOnConfirmation,
} from "@/features/orders/domain/order-confirmation-view";
import { ConfirmationPaymentStatus } from "./confirmation-payment-status";
import { DELIVERY_MODE_INFO, type DeliveryMode } from "@/features/products/types/delivery-mode";
import { formatPurchaseLineDetail } from "@/features/products/domain/mystery-box";
import { formatMoney } from "@/shared/money/format";
import type { SaleCurrency } from "@/shared/currency/sale-currency";
import { NOINDEX_NOFOLLOW } from "@/features/seo/domain/robots-policy";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: NOINDEX_NOFOLLOW,
};

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const sp = await searchParams;
  const order = await getOrderByCode(code);

  if (!order) notFound();

  const orderCurrency = (order.saleCurrency ?? "COP") as SaleCurrency;
  const orderRate = order.exchangeRateCopPerUsd ?? undefined;

  // Bold's redirect params only tell us the shopper came back from Bold; the
  // displayed result always comes from the persisted Order status.
  const returnedFromBold =
    typeof sp["bold-tx-status"] === "string" || typeof sp["bold-order-id"] === "string";
  const boldOrderId = typeof sp["bold-order-id"] === "string" ? sp["bold-order-id"] : null;

  const uiMode = orderConfirmationView(order.status);
  const copy = ORDER_CONFIRMATION_COPY[uiMode];

  return (
    <div className="container-page py-16 max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {uiMode === "paid" && <CheckCircle2 className="h-7 w-7" />}
          {(uiMode === "failed" || uiMode === "cancelled") && <XCircle className="h-7 w-7" />}
          {uiMode === "pending" && <Clock className="h-7 w-7" />}
        </div>

        {/* Title */}
        <h1 className="mt-5 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
          {copy.title}
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {uiMode === "paid" && (
            <>
              Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
              pagado exitosamente. Te notificaremos por correo con los detalles de entrega.
            </>
          )}
          {uiMode === "failed" && (
            <>
              El pago de tu pedido{" "}
              <span className="font-semibold text-foreground">{order.code}</span> no pudo ser
              procesado. Puedes intentar realizar un nuevo pedido.
            </>
          )}
          {uiMode === "cancelled" && (
            <>
              Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
              cancelado.
            </>
          )}
          {uiMode === "pending" && (
            <>
              Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
              registrado. Te avisaremos por correo cuando el pago quede confirmado.
            </>
          )}
        </p>

        {/* Status banner */}
        <div className="mt-4 rounded-lg bg-secondary/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed text-left">
          <p className={uiMode === "failed" ? "text-destructive" : undefined}>{copy.banner}</p>
          {shouldReconcileOnConfirmation(uiMode, returnedFromBold) && (
            <ConfirmationPaymentStatus orderCode={order.code} boldOrderId={boldOrderId} />
          )}
        </div>

        {/* Order details */}
        <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-xl border border-border p-4">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Estado</dt>
            <dd className="mt-1 font-medium">{copy.statusLabel}</dd>
          </div>
          <div className="rounded-xl border border-border p-4">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Total</dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatMoney({ amountCop: order.total, currency: orderCurrency, copPerUsd: orderRate })}
            </dd>
          </div>
          {orderCurrency === "USD" && orderRate && (
            <div className="rounded-xl border border-border p-4 col-span-2">
              <dt className="text-xs text-muted-foreground uppercase tracking-wide">Tipo de cambio</dt>
              <dd className="mt-1 font-medium">1 USD = {orderRate.toLocaleString("es-CO")} COP (congelado al confirmar)</dd>
            </div>
          )}
          <div className="rounded-xl border border-border p-4 col-span-2">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Envío a</dt>
            <dd className="mt-1">
              {order.shippingFullName} · {order.shippingLine1}, {order.shippingCity},{" "}
              {order.shippingState}, {order.shippingCountry}
            </dd>
          </div>
        </dl>

        {/* Items */}
        <div className="mt-6 space-y-2 text-left">
          {order.items.map((item) => {
            const deliveryMode = item.deliveryMode as DeliveryMode;
            return (
              <div key={item.id} className="flex justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPurchaseLineDetail({
                      lineKind: item.lineKind,
                      teamName: item.teamName,
                      versionName: item.versionName,
                      sizeName: item.sizeName,
                      quantity: item.quantity,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {deliveryMode === "BAJO_PEDIDO" ? "Bajo pedido" : "Entrega inmediata"} ·{" "}
                    {DELIVERY_MODE_INFO[deliveryMode].eta}
                  </p>
                </div>
                <p className="font-medium tabular-nums shrink-0">
                  {formatMoney({ amountCop: item.subtotal, currency: orderCurrency, copPerUsd: orderRate })}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {uiMode === "failed" || uiMode === "cancelled" ? (
            <Button asChild>
              <Link href="/productos">
                Volver a comprar <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/productos">
                Seguir comprando <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
