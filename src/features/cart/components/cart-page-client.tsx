"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/shared/stores/cart-store";
import { DELIVERY_MODE_INFO } from "@/features/products/types/delivery-mode";
import { formatPrice } from "@/lib/utils";

export function CartPageClient() {
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));
  const subtotal = useCartStore((s) => s.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0));
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isEmpty = !mounted || items.length === 0;

  const freeShippingThreshold = 200000;
  const remaining = Math.max(0, freeShippingThreshold - subtotal);

  if (isEmpty) {
    return (
      <div className="container-page py-16">
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">
            Tu carrito está vacío
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
            Aún no has agregado camisetas. Explora el catálogo y viste tu pasión.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/productos">
              Ver catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold">Tu carrito</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Lines */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.lineId}
              className="flex gap-4 rounded-xl border border-border bg-card p-4"
            >
              <Link href={`/productos/${item.productSlug}`} className="shrink-0">
                {item.imageUrl ? (
                  <div className="relative h-24 w-20 rounded-lg overflow-hidden bg-secondary">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-24 w-20 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                    Sin imagen
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/productos/${item.productSlug}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.teamName} · {item.versionName} · Talla {item.sizeName}
                    </p>
                    {item.customizationType !== "NONE" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Personalización:{" "}
                        {item.customizationType === "CUSTOM"
                          ? `${item.customizationName || "Nombre"}${item.customizationNumber ? ` · ${item.customizationNumber}` : ""}`
                          : `${item.customizationName} · ${item.customizationNumber}`}
                      </p>
                    )}
                    <div className="mt-1">
                      <Badge
                        tone={item.deliveryMode === "BAJO_PEDIDO" ? "warning" : "default"}
                        className="text-[11px]"
                      >
                        {DELIVERY_MODE_INFO[item.deliveryMode].label} ·{" "}
                        {DELIVERY_MODE_INFO[item.deliveryMode].eta}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.lineId)}
                    aria-label={`Quitar ${item.productName} del carrito`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatPrice(item.unitPrice)} c/u
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/productos"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline mt-2"
          >
            ← Seguir comprando
          </Link>
        </div>

        {/* Summary */}
        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight mb-4">
            Resumen
          </h2>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="font-medium tabular-nums">
                {remaining === 0 ? "Gratis" : "Se calcula al pagar"}
              </dd>
            </div>
          </dl>

          {remaining > 0 ? (
            <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Te faltan {formatPrice(remaining)} para envío gratis desde{" "}
              {formatPrice(freeShippingThreshold)}.
            </p>
          ) : (
            <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              ¡Tienes envío gratis!
            </p>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatPrice(subtotal)}</span>
          </div>

          <Button className="w-full mt-4" asChild>
            <Link href="/checkout">
              Ir a pagar <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-3 text-[11px] text-muted-foreground text-center leading-relaxed">
            Aceptamos tarjeta, PSE y Nequi. Pago seguro procesado en el siguiente paso.
          </p>
        </aside>
      </div>
    </div>
  );
}