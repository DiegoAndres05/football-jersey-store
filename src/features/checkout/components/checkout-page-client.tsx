"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CreditCard, Landmark, Smartphone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/shared/stores/cart-store";
import { SHIPPING, shippingFee, SITE } from "@/shared/config/site";
import { DELIVERY_MODE_INFO } from "@/features/products/types/delivery-mode";
import { formatPrice } from "@/lib/utils";
import { processMockPayment } from "@/features/payments/services/mock-payment";
import { submitOrder } from "@/features/orders/server/order-actions";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
  type PaymentMethod,
} from "@/features/checkout/schemas/checkout-schema";

export function CheckoutPageClient() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0));
  const clearCart = useCartStore((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [payReference, setPayReference] = useState("");
  const [payError, setPayError] = useState("");
  const formRef = useRef<CheckoutFormValues | null>(null);

  useEffect(() => setMounted(true), []);

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      shippingFullName: "",
      shippingPhone: "",
      shippingLine1: "",
      shippingLine2: "",
      shippingCity: "",
      shippingState: "",
      shippingZipCode: "",
      notes: "",
    },
  });

  const fee = useMemo(
    () => (mounted ? shippingFee(subtotal) : 0),
    [mounted, subtotal],
  );
  const total = subtotal + fee;
  const remaining = SHIPPING.freeThreshold - subtotal;

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border bg-card">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
            No hay nada que pagar
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
            Tu carrito está vacío. Agrega camisetas antes de continuar.
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

  const onValid = (values: CheckoutFormValues) => {
    formRef.current = values;
    setStep("payment");
  };

  const payNow = async () => {
    if (paymentStatus !== "idle" || !formRef.current) return;
    setPaymentStatus("processing");
    setPayError("");
    const payment = await processMockPayment({ method: paymentMethod, amount: total });

    if (!payment.ok) {
      setPayError(payment.reason);
      setPaymentStatus("failed");
      return;
    }

    const result = await submitOrder({
      form: formRef.current,
      lines: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        customizationType: i.customizationType,
        customizationName: i.customizationName,
        customizationNumber: i.customizationNumber,
        deliveryMode: i.deliveryMode,
      })),
      paymentMethod,
      paymentReference: payment.reference,
    });

    if (!result.ok) {
      setPayError(result.error);
      setPaymentStatus("failed");
      return;
    }

    setPayReference(payment.reference);
    setPaymentStatus("success");
    clearCart();
    router.replace(`/pedido/confirmado/${result.code}`);
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <Link href="/carrito" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al carrito
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Pago</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paso {step === "form" ? "1 de 2" : "2 de 2"} · {items.length} {items.length === 1 ? "artículo" : "artículos"}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6">
          {step === "form" ? (
            <form onSubmit={handleSubmit(onValid)} className="space-y-6" noValidate>
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight mb-4">Contacto</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <Input id="fullName" {...register("fullName")} placeholder="Tu nombre" autoComplete="name" />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="tucorreo@ejemplo.com" autoComplete="email" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" type="tel" {...register("phone")} placeholder="300 000 0000" autoComplete="tel" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight mb-1">Envío</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {SITE.country} · {SHIPPING.methodName} ·{" "}
                  {fee === 0 ? "Gratis en este pedido" : formatPrice(SHIPPING.flatFee)}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingFullName">Destinatario</Label>
                    <Input id="shippingFullName" {...register("shippingFullName")} placeholder="Quién recibe el pedido" autoComplete="name" />
                    {errors.shippingFullName && <p className="text-xs text-destructive">{errors.shippingFullName.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingPhone">Teléfono de contacto</Label>
                    <Input id="shippingPhone" type="tel" {...register("shippingPhone")} placeholder="300 000 0000" autoComplete="tel" />
                    {errors.shippingPhone && <p className="text-xs text-destructive">{errors.shippingPhone.message}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="shippingLine1">Dirección</Label>
                    <Input id="shippingLine1" {...register("shippingLine1")} placeholder="Calle 1 # 2-3, apartamento 4" autoComplete="street-address" />
                    {errors.shippingLine1 && <p className="text-xs text-destructive">{errors.shippingLine1.message}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="shippingLine2">Complemento (opcional)</Label>
                    <Input id="shippingLine2" {...register("shippingLine2")} placeholder="Torre, bloque, unidad..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingCity">Ciudad</Label>
                    <Input id="shippingCity" {...register("shippingCity")} placeholder="Bogotá" autoComplete="address-level2" />
                    {errors.shippingCity && <p className="text-xs text-destructive">{errors.shippingCity.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingState">Departamento</Label>
                    <Input id="shippingState" {...register("shippingState")} placeholder="Cundinamarca" autoComplete="address-level1" />
                    {errors.shippingState && <p className="text-xs text-destructive">{errors.shippingState.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shippingZipCode">Código postal (opcional)</Label>
                    <Input id="shippingZipCode" {...register("shippingZipCode")} placeholder="110111" autoComplete="postal-code" />
                    {errors.shippingZipCode && <p className="text-xs text-destructive">{errors.shippingZipCode.message}</p>}
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="notes">Notas (opcional)</Label>
                    <Input id="notes" {...register("notes")} placeholder="Instrucciones de entrega, indicaciones..." />
                    {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
                  </div>
                </div>
              </section>

              <Button type="submit" className="w-full sm:w-auto" disabled={!isValid}>
                Continuar al pago <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight mb-4">Medio de pago</h2>
                <div className="space-y-2">
                  {([
                    { id: "CARD", label: "Tarjeta débito o crédito", icon: CreditCard, note: "Visa, Mastercard" },
                    { id: "PSE", label: "PSE", icon: Landmark, note: "Débito desde tu banco" },
                    { id: "NEQUI", label: "Nequi", icon: Smartphone, note: "Pago desde la app" },
                  ] as const).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={paymentMethod === m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        paymentMethod === m.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <m.icon className="h-5 w-5 text-primary shrink-0" />
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.note}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {paymentStatus === "processing" && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                  <p className="mt-4 text-sm font-medium">Procesando pago simulado…</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Modo demo: no se realiza ningún cobro real ni se solicitan datos de tarjeta.
                  </p>
                </div>
              )}

              {paymentStatus === "success" && (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">
                    Pago aprobado
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Simulación aprobada por {formatPrice(total)} con{" "}
                    {paymentMethod === "CARD" ? "tarjeta" : paymentMethod === "PSE" ? "PSE" : "Nequi"}.
                    Referencia {payReference}. Creando tu pedido…
                  </p>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-sm font-medium">{payError || "No se pudo procesar la simulación."}</p>
                  <Button className="mt-4" onClick={() => setPaymentStatus("idle")}>
                    Reintentar
                  </Button>
                </div>
              )}

              {paymentStatus === "idle" && (
                <Button onClick={payNow} className="w-full sm:w-auto">
                  Pagar {formatPrice(total)} <ShieldCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 space-y-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">Resumen</h2>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.lineId} className="flex gap-3">
                {item.imageUrl ? (
                  <div className="relative h-16 w-13 shrink-0 rounded-md overflow-hidden bg-secondary">
                    <Image src={item.imageUrl} alt={item.productName} fill sizes="52px" className="object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-13 shrink-0 rounded-md bg-secondary" />
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.teamName} · {item.versionName} · Talla {item.sizeName} · x{item.quantity}
                  </p>
                  {item.customizationType !== "NONE" && (
                    <p className="text-xs text-muted-foreground">
                      Personalización ({item.customizationName || "—"}
                      {item.customizationNumber ? ` · ${item.customizationNumber}` : ""})
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {DELIVERY_MODE_INFO[item.deliveryMode].label} ·{" "}
                    {DELIVERY_MODE_INFO[item.deliveryMode].eta}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío ({SHIPPING.methodName})</dt>
              <dd className="font-medium tabular-nums">{fee === 0 ? "Gratis" : formatPrice(fee)}</dd>
            </div>
            {remaining > 0 && (
              <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                Te faltan {formatPrice(remaining)} para envío gratis.
              </p>
            )}
          </dl>

          <Separator />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}