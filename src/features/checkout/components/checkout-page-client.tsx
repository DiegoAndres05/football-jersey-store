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
import { formatMoney } from "@/shared/money/format";
import { SALE_CURRENCY_COOKIE, type SaleCurrency } from "@/shared/currency/sale-currency";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { submitOrder } from "@/features/orders/server/order-actions";
import { getImmediateStockByVariantIds } from "@/features/cart/server/cart-stock-actions";
import { formatReconcileMessage } from "@/features/cart/domain/immediate-quantity";
import { toast } from "@/components/ui/toast";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
  type PaymentMethod,
} from "@/features/checkout/schemas/checkout-schema";
import { buildBoldCheckoutPayload } from "@/features/payments/domain/bold-checkout-attrs";

const BOLD_SCRIPT_SRC = "https://checkout.bold.co/library/boldPaymentButton.js";
const DESTINATION_COUNTRIES = [
  "Colombia",
  "Estados Unidos",
  "España",
  "México",
  "Ecuador",
  "Perú",
  "Chile",
  "Argentina",
  "Panamá",
  "Venezuela",
];

function normalizeCountry(country: string): string {
  return country.trim().toLocaleLowerCase("es-CO");
}

function checkoutCurrencyForCountry(
  country: string,
  currencyContext?: CurrencyContext,
): { currency: SaleCurrency; copPerUsd: number | null } {
  const isColombia = normalizeCountry(country) === normalizeCountry(SITE.country);
  if (isColombia) return { currency: "COP", copPerUsd: currencyContext?.copPerUsd ?? null };
  if (currencyContext?.copPerUsd && currencyContext.copPerUsd > 0) {
    return { currency: "USD", copPerUsd: currencyContext.copPerUsd };
  }
  return { currency: "COP", copPerUsd: currencyContext?.copPerUsd ?? null };
}

function hasBoldCheckout(): boolean {
  return Boolean((window as Window & { BoldCheckout?: unknown }).BoldCheckout);
}

function loadBoldCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (hasBoldCheckout()) {
      resolve();
      return;
    }

    const fail = () => reject(new Error("No se pudo cargar Bold."));
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${BOLD_SCRIPT_SRC}"]`);
    if (existing) {
      const timer = window.setTimeout(fail, 8000);
      const done = (ok: boolean) => {
        window.clearTimeout(timer);
        if (ok && hasBoldCheckout()) resolve();
        else fail();
      };
      existing.addEventListener("load", () => done(true), { once: true });
      existing.addEventListener("error", () => done(false), { once: true });
      queueMicrotask(() => {
        if (hasBoldCheckout()) done(true);
      });
      return;
    }

    const script = document.createElement("script");
    script.src = BOLD_SCRIPT_SRC;
    script.async = true;
    script.onload = () => (hasBoldCheckout() ? resolve() : fail());
    script.onerror = fail;
    document.head.appendChild(script);
  });
}

export function CheckoutPageClient({ currencyContext }: { currencyContext?: CurrencyContext }) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0));
  const clearCart = useCartStore((s) => s.clear);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [payError, setPayError] = useState("");
  const formRef = useRef<CheckoutFormValues | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || step !== "payment") return;
    void loadBoldCheckoutScript().catch((err) => {
      console.error("Bold script load failed:", err);
    });
  }, [mounted, step]);

  useEffect(() => {
    if (!mounted || items.length === 0) return;
    const ids = [...new Set(useCartStore.getState().items.map((item) => item.variantId))];
    if (ids.length === 0) return;
    let cancelled = false;
    getImmediateStockByVariantIds(ids).then((rows) => {
      if (cancelled) return;
      const map = new Map(rows.map((row) => [row.variantId, row.stock]));
      const adjustments = useCartStore.getState().reconcileWithStock(map);
      if (adjustments.length > 0) {
        toast({ title: formatReconcileMessage(adjustments), variant: "warning" });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mounted, items.length]);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm<CheckoutFormValues>({
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
      shippingCountry: SITE.country,
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
  const destinationCountry = watch("shippingCountry") || SITE.country;
  const checkoutCurrency = {
    currency: currencyContext?.currency ?? "COP",
    copPerUsd: currencyContext?.copPerUsd ?? null,
  };
  const moneyContext = {
    currency: checkoutCurrency.currency,
    copPerUsd: checkoutCurrency.copPerUsd ?? undefined,
  };
  const shippingScope = normalizeCountry(destinationCountry) === normalizeCountry(SITE.country)
    ? SHIPPING.methodName
    : "Destino internacional";

  const shippingCountryField = register("shippingCountry");

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

    const current = useCartStore.getState();
    const ids = [...new Set(current.items.map((item) => item.variantId))];
    const rows = await getImmediateStockByVariantIds(ids);
    const stockMap = new Map(rows.map((row) => [row.variantId, row.stock]));
    const adjustments = current.reconcileWithStock(stockMap);
    if (adjustments.length > 0) {
      toast({ title: formatReconcileMessage(adjustments), variant: "warning" });
      setPaymentStatus("idle");
      return;
    }

    const lines = useCartStore.getState().items;
    if (lines.length === 0) {
      setPaymentStatus("idle");
      return;
    }

    const result = await submitOrder({
      form: formRef.current,
      lines: lines.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        customizationType: i.customizationType,
        customizationName: i.customizationName,
        customizationNumber: i.customizationNumber,
        deliveryMode: i.deliveryMode,
      })),
      paymentMethod,
      paymentReference: `BOLD-${Date.now()}`,
      saleCurrency: checkoutCurrencyForCountry(formRef.current.shippingCountry, currencyContext).currency,
    });

    if (!result.ok) {
      setPayError(result.error);
      setPaymentStatus("failed");
      return;
    }

    try {
      await loadBoldCheckoutScript();

      const hashRes = await fetch("/api/bold/hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: result.code,
          amount: result.paymentAmount,
          currency: result.saleCurrency,
        }),
      });

      const payload = await hashRes.json();
      if (!hashRes.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Error al preparar el pago.");
      }

      const BoldCheckout = (window as Window & { BoldCheckout?: new (config: object) => { open: () => void } }).BoldCheckout;

      if (!BoldCheckout) {
        setPayError("El sistema de pago no está listo. Recarga la página e intenta de nuevo.");
        setPaymentStatus("idle");
        return;
      }

      const checkoutConfig = buildBoldCheckoutPayload({
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency,
        apiKey: payload.apiKey,
        integritySignature: payload.hash,
        description: `Pedido ${payload.orderId}`,
        redirectionUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/pedido/confirmado/${payload.orderId}`,
        customer: {
          email: formRef.current?.email,
          fullName: formRef.current?.fullName,
          phone: formRef.current?.phone,
        },
      });

      const checkout = new BoldCheckout(checkoutConfig);
      checkout.open();
      clearCart();
    } catch (err) {
      console.error("Bold checkout error:", err);
      setPayError(err instanceof Error ? err.message : "Error al conectar con el sistema de pago.");
      setPaymentStatus("failed");
    }
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
                  {destinationCountry} · {shippingScope} ·{" "}
                  {fee === 0 ? "Gratis en este pedido" : formatMoney({ amountCop: SHIPPING.flatFee, ...moneyContext })}
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
                    <Label htmlFor="shippingCountry">País de destino</Label>
                    <select
                      id="shippingCountry"
                      {...shippingCountryField}
                      onChange={(event) => {
                        void shippingCountryField.onChange(event);
                        const nextCurrency = checkoutCurrencyForCountry(event.target.value, currencyContext).currency;
                        document.cookie = `${SALE_CURRENCY_COOKIE}=${nextCurrency}; path=/; max-age=31536000; SameSite=Lax`;
                        router.refresh();
                      }}
                      autoComplete="country-name"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {DESTINATION_COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {errors.shippingCountry && <p className="text-xs text-destructive">{errors.shippingCountry.message}</p>}
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
                  <p className="mt-4 text-sm font-medium">Conectando con Bold…</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Abriendo la pasarela de pago segura. No cierres esta página.
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
                    Tu pago fue procesado exitosamente. Redirigiendo al resumen del pedido…
                  </p>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="rounded-xl border border-border bg-card p-6 text-center">
                  <p className="text-sm font-medium text-destructive">{payError || "No se pudo procesar el pago."}</p>
                  <Button className="mt-4" onClick={() => setPaymentStatus("idle")}>
                    Reintentar
                  </Button>
                </div>
              )}

              {paymentStatus === "idle" && (
                <Button onClick={payNow} className="w-full sm:w-auto">
                  Pagar {formatMoney({ amountCop: total, ...moneyContext })} <ShieldCheck className="h-4 w-4" />
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
                <p className="text-sm font-medium tabular-nums">{formatMoney({ amountCop: item.unitPrice * item.quantity, ...moneyContext })}</p>
              </div>
            ))}
          </div>

          <Separator />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatMoney({ amountCop: subtotal, ...moneyContext })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío ({shippingScope})</dt>
              <dd className="font-medium tabular-nums">{fee === 0 ? "Gratis" : formatMoney({ amountCop: fee, ...moneyContext })}</dd>
            </div>
            {remaining > 0 && (
              <p className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                Te faltan {formatMoney({ amountCop: remaining, ...moneyContext })} para envío gratis.
              </p>
            )}
          </dl>

          <Separator />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatMoney({ amountCop: total, ...moneyContext })}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}