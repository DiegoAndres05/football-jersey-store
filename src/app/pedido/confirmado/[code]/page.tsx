import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrderByCode } from "@/features/orders/repositories/order-repository";
import { reconcileBoldOrder } from "@/features/payments/services/bold-payment-reconcile";
import { ConfirmationPaymentStatus } from "./confirmation-payment-status";
import { DELIVERY_MODE_INFO, type DeliveryMode } from "@/features/products/types/delivery-mode";
import { formatMoney } from "@/shared/money/format";
import type { SaleCurrency } from "@/shared/currency/sale-currency";

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Pedido confirmado",
};

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const { code } = await params;
  const sp = await searchParams;
  const order = await getOrderByCode(code);

  if (!order) notFound();

  // If order is still pending and Bold return params are present, reconcile
  if (order.status === "PENDING_PAYMENT") {
    const boldTxStatus = typeof sp["bold-tx-status"] === "string" ? sp["bold-tx-status"] : null;
    const boldOrderId = typeof sp["bold-order-id"] === "string" ? sp["bold-order-id"] : null;

    if (boldTxStatus || boldOrderId) {
      await reconcileBoldOrder({
        orderCode: code,
        boldOrderId,
        returnTxStatus: boldTxStatus,
      });

      // Re-read order after reconciliation
      const refreshed = await getOrderByCode(code);
      if (refreshed) {
        Object.assign(order, refreshed);
      }
    }
  }

  const orderCurrency = (order.saleCurrency ?? "COP") as SaleCurrency;
  const orderRate = order.exchangeRateCopPerUsd ?? undefined;

  // Determine if Bold params were present (for confirming state)
  const hasBoldParams =
    typeof sp["bold-tx-status"] === "string" || typeof sp["bold-order-id"] === "string";

  // Determine UI mode
  const uiMode =
    order.status === "PAID"
      ? "paid"
      : order.status === "PAYMENT_FAILED"
        ? "failed"
        : hasBoldParams
          ? "confirming"
          : "pending";

  return (
    <div className="container-page py-16 max-w-2xl">
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {uiMode === "paid" && <CheckCircle2 className="h-7 w-7" />}
          {uiMode === "failed" && <XCircle className="h-7 w-7" />}
          {(uiMode === "confirming" || uiMode === "pending") && <Loader2 className="h-7 w-7 animate-spin" />}
        </div>

        {/* Title */}
        <h1 className="mt-5 font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
          {uiMode === "paid" && "Pago aprobado"}
          {uiMode === "failed" && "Pago rechazado"}
          {uiMode === "confirming" && "Confirmando pago…"}
          {uiMode === "pending" && "Pedido recibido"}
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {uiMode === "paid" && (
            <>
              Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
              pagado exitosamente. Te escribiremos a{" "}
              <span className="font-semibold text-foreground">{order.customerEmail}</span> con
              los detalles de entrega.
            </>
          )}
          {uiMode === "failed" && (
            <>
              El pago de tu pedido{" "}
              <span className="font-semibold text-foreground">{order.code}</span> no pudo ser
              procesado. Puedes intentar realizar un nuevo pedido.
            </>
          )}
          {uiMode === "confirming" && (
            <>
              Estamos confirmando el pago de tu pedido{" "}
              <span className="font-semibold text-foreground">{order.code}</span>. Esto puede
              tomar unos segundos.
            </>
          )}
          {uiMode === "pending" && (
            <>
              Tu pedido <span className="font-semibold text-foreground">{order.code}</span> fue
              registrado. Te escribiremos a{" "}
              <span className="font-semibold text-foreground">{order.customerEmail}</span> con
              los detalles de entrega.
            </>
          )}
        </p>

        {/* Status banner */}
        <div className="mt-4 rounded-lg bg-secondary/60 px-4 py-3 text-xs text-muted-foreground leading-relaxed text-left">
          {uiMode === "paid" && (
            <p>Pago confirmado. Tu pedido está siendo preparado para envío.</p>
          )}
          {uiMode === "failed" && (
            <p className="text-destructive">
              El pago no fue procesado. Por favor, intenta de nuevo desde la tienda.
            </p>
          )}
          {uiMode === "confirming" && (
            <ConfirmationPaymentStatus initialMode="confirming" orderCode={order.code} />
          )}
          {uiMode === "pending" && (
            <p>
              Pago pendiente. Te notificaremos cuando se confirme el pago.
            </p>
          )}
        </div>

        {/* Order details */}
        <dl className="mt-6 grid grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-xl border border-border p-4">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Estado</dt>
            <dd className="mt-1 font-medium">
              {uiMode === "paid" && "Pago aprobado"}
              {uiMode === "failed" && "Pago rechazado"}
              {uiMode === "confirming" && "Confirmando…"}
              {uiMode === "pending" && "Pendiente de pago"}
            </dd>
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
              {order.shippingState}
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
                    {item.teamName} · {item.versionName} · Talla {item.sizeName} · x{item.quantity}
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
          {uiMode === "failed" ? (
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
