import { notFound } from "next/navigation";
import { getAdminOrder, normalizeAdminDeliveryMode } from "@/features/orders/repositories/admin-order-repository";
import { retryOrderNotification } from "@/features/orders/server/admin-order-actions";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const items = order.items.map((item) => ({ ...item, deliveryMode: normalizeAdminDeliveryMode(item.deliveryMode) }));
  const immediate = items.filter((item) => item.deliveryMode === "INMEDIATA").length;
  const backorder = items.filter((item) => item.deliveryMode === "BAJO_PEDIDO").length;
  const attempt = order.notificationAttempts.find((item) => item.channel === "TELEGRAM" && item.eventKey === "ORDER_CREATED_PAID");
  return (
    <div className="space-y-6">
      <div><h2 className="font-display text-lg font-bold uppercase tracking-tight">Pedido {order.code}</h2><p className="text-sm text-muted-foreground">{order.customerName} · {order.customerEmail}</p></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Entrega inmediata</p><p className="text-xl font-semibold">{immediate} líneas</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Bajo pedido</p><p className="text-xl font-semibold">{backorder} líneas</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-semibold">{formatPrice(order.total)}</p></div></div>
      <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Líneas del pedido</h3><div className="mt-4 space-y-3">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-border/60 pb-3 last:border-0"><div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted-foreground">{item.versionName} · Talla {item.sizeName} · x{item.quantity}</p>{item.customizationName && <p className="text-xs text-muted-foreground">Personalización: {item.customizationName} {item.customizationNumber ?? ""}</p>}<p className="mt-1 text-xs font-medium">{item.deliveryMode === "BAJO_PEDIDO" ? "Bajo pedido" : item.deliveryMode === "INMEDIATA" ? "Entrega inmediata" : "No disponible"}</p></div><p className="font-medium">{formatPrice(item.subtotal)}</p></div>)}</div></section>
      <section className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">Aviso Telegram</h3><p className="mt-2 text-sm text-muted-foreground">Estado: {attempt?.status ?? "No configurado"} · Intentos: {attempt?.attemptCount ?? 0}</p>{attempt?.status !== "SENT" && <form className="mt-3" action={async () => { await retryOrderNotification(order.id); }}><button className="rounded-md border border-border px-3 py-1.5 text-sm" type="submit">Reintentar aviso</button></form>}</section>
    </div>
  );
}