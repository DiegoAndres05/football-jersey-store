import Link from "next/link";
import { listAdminOrders } from "@/features/orders/repositories/admin-order-repository";
import { formatPrice } from "@/lib/utils";

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ modalidad?: string }> }) {
  const params = await searchParams;
  const mode = params.modalidad === "INMEDIATA" || params.modalidad === "BAJO_PEDIDO" ? params.modalidad : undefined;
  const orders = await listAdminOrders(mode);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Pedidos</h2>
        <p className="text-sm text-muted-foreground">Modalidad elegida por línea y estado de aviso Telegram.</p>
      </div>
      <div className="flex gap-2 text-sm">
        <Link href="/admin/pedidos" className="rounded-md border border-border px-3 py-1.5">Todos</Link>
        <Link href="/admin/pedidos?modalidad=INMEDIATA" className="rounded-md border border-border px-3 py-1.5">Entrega inmediata</Link>
        <Link href="/admin/pedidos?modalidad=BAJO_PEDIDO" className="rounded-md border border-border px-3 py-1.5">Bajo pedido</Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="p-3">Código</th><th className="p-3">Cliente</th><th className="p-3">Modalidad</th><th className="p-3">Total</th><th className="p-3">Aviso</th></tr></thead>
          <tbody>
            {orders.map((order) => <tr key={order.id} className="border-b border-border/60 last:border-0">
              <td className="p-3"><Link className="font-mono hover:underline" href={`/admin/pedidos/${order.id}`}>{order.code}</Link></td>
              <td className="p-3"><p>{order.customerName}</p><p className="text-xs text-muted-foreground">{order.customerEmail}</p></td>
              <td className="p-3"><div className="flex flex-wrap gap-1">{order.deliverySummary.hasImmediate && <span className="rounded-full bg-secondary px-2 py-1 text-xs">Entrega inmediata</span>}{order.deliverySummary.hasBackorder && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs">Bajo pedido</span>}</div></td>
              <td className="p-3 font-medium">{formatPrice(order.total)}</td>
              <td className="p-3 text-xs">{order.notificationAttempt?.status ?? "No configurado"}</td>
            </tr>)}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No hay pedidos para este filtro.</p>}
      </div>
    </div>
  );
}