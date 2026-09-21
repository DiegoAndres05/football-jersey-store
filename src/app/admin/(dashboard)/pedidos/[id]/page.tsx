import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminOrder } from "@/features/orders/repositories/admin-order-repository";
import { retryOrderNotification } from "@/features/orders/server/admin-order-actions";
import { formatPrice } from "@/lib/utils";
import { getTelegramConfig } from "@/features/notifications/config/telegram-config";
import { AdminErrorState, AdminNotFoundState } from "../../admin-page-states";
import { NotificationRetryControl } from "../notification-retry-control";

export default async function AdminOrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ modalidad?: string }> }) {
  const { id } = await params;
  const filter = (await searchParams)?.modalidad;
  const backHref = filter === "INMEDIATA" || filter === "BAJO_PEDIDO" ? `/admin/pedidos?modalidad=${filter}` : "/admin/pedidos";
  let order;
  try {
    order = await getAdminOrder(id);
  } catch {
    return (
      <AdminErrorState
        title="No pudimos cargar el pedido"
        description="La información de este pedido no está disponible en este momento. Puedes volver a la lista y reintentar."
        actionLabel="Volver a pedidos"
        actionHref={backHref}
      />
    );
  }

  if (!order) {
    return (
      <AdminNotFoundState
        title="Pedido no encontrado"
        description="No existe un pedido con este identificador o ya no está disponible."
        actionLabel="Volver a pedidos"
        actionHref={backHref}
      />
    );
  }

  const items = order.items.map((item) => ({ ...item, deliveryMode: item.deliveryMode === "INMEDIATA" || item.deliveryMode === "BAJO_PEDIDO" ? item.deliveryMode : "NO_DISPONIBLE" }));
  const immediateCount = items.filter((item) => item.deliveryMode === "INMEDIATA").length;
  const backorderCount = items.filter((item) => item.deliveryMode === "BAJO_PEDIDO").length;
  const telegramConfig = getTelegramConfig();
  const telegramAttempt = order.notificationAttempts.find((item) => item.channel === "TELEGRAM" && item.eventKey === "ORDER_CREATED_PAID");

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Volver a pedidos
        </Link>
        <h2 className="mt-2 font-display text-lg font-bold uppercase tracking-tight">Pedido {order.code}</h2>
        <p className="text-sm text-muted-foreground">{order.customerName} · {order.customerEmail}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Entrega inmediata</p>
          <p className="mt-1 text-xl font-semibold">{immediateCount} líneas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bajo pedido</p>
          <p className="mt-1 text-xl font-semibold">{backorderCount} líneas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-1 text-xl font-semibold">{formatPrice(order.total)}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Cupón</h3>
        {order.couponSnapshot ? (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-medium">{order.couponSnapshot.code}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo y valor</dt>
              <dd className="font-medium">{order.couponSnapshot.discountType === "PERCENTAGE" ? `${order.couponSnapshot.value ?? 0}%` : formatPrice(order.couponSnapshot.value ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Base elegible</dt>
              <dd>{formatPrice(order.couponSnapshot.eligibleBase ?? 0)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Descuento aplicado</dt>
              <dd className="font-medium text-green-700">-{formatPrice(order.couponSnapshot.discountAmount)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Sin cupón aplicado · Descuento: {formatPrice(0)}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Líneas del pedido</h3>
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col justify-between gap-2 border-b border-border/60 pb-3 last:border-0 sm:flex-row">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.versionName} · Talla {item.sizeName} · x{item.quantity}</p>
                {item.customizationName && <p className="text-xs text-muted-foreground">Personalización: {item.customizationName} {item.customizationNumber ?? ""}</p>}
                <p className="mt-1 text-xs font-medium">{item.deliveryMode === "BAJO_PEDIDO" ? "Bajo pedido" : item.deliveryMode === "INMEDIATA" ? "Entrega inmediata" : "No disponible"}</p>
              </div>
              <p className="font-medium">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </section>

      {telegramConfig && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold">Aviso Telegram</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Estado: {telegramAttempt?.status ?? "PENDIENTE"} · Intentos: {telegramAttempt?.attemptCount ?? 0}
          </p>
          {telegramAttempt?.status !== "SENT" && (
            <div className="mt-3">
              <NotificationRetryControl action={async () => { "use server"; await retryOrderNotification({ orderId: order.id }); }} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
