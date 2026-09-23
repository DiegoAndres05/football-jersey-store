"use client";

import { useMemo, useState } from "react";
import { SizeGuideDialog } from "@/features/products/components/size-guide-dialog";
import { AddToCartButton } from "@/features/products/components/add-to-cart-button";
import type { MysteryBoxPageData } from "@/features/products/repositories/product-repository";
import { formatMoney } from "@/shared/money/format";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { MYSTERY_BOX_SLUG } from "@/features/products/domain/mystery-box";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/shared/ui/product-image";

export function MysteryBoxPicker({
  box,
  currency,
}: {
  box: MysteryBoxPageData;
  currency: CurrencyContext;
}) {
  const levels = useMemo(() => {
    const seen = new Map<string, { slug: string; level: string; quality: string }>();
    for (const variant of box.variants) {
      if (!seen.has(variant.versionSlug)) {
        seen.set(variant.versionSlug, {
          slug: variant.versionSlug,
          level: variant.level,
          quality: variant.quality,
        });
      }
    }
    return [...seen.values()];
  }, [box.variants]);
  const [levelSlug, setLevelSlug] = useState(levels[0]?.slug ?? "fan");
  const [sizeCode, setSizeCode] = useState("");
  const forLevel = box.variants.filter((variant) => variant.versionSlug === levelSlug);
  const selected = forLevel.find((variant) => variant.sizeCode === sizeCode) ?? null;
  const price = selected?.salePrice ?? forLevel[0]?.salePrice ?? 0;
  const canAdd = selected != null && selected.availability !== "OUT_OF_STOCK";

  return (
    <section className="container-page grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[28rem] overflow-hidden rounded-2xl border border-border bg-secondary">
        <ProductImage
          src={box.imageUrl}
          alt={box.name}
          fill
          sizes="(max-width: 1024px) 100vw, 28rem"
          className="object-cover"
          fallbackLabel="Sin imagen"
        />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sorpresa</p>
        <h1 className="mt-2 text-3xl font-bold">{box.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{box.description}</p>
        <p className="mt-4 text-2xl font-semibold tabular-nums">
          {formatMoney({
            amountCop: price,
            currency: currency.currency,
            copPerUsd: currency.copPerUsd ?? undefined,
          })}
        </p>
        <div className="mt-6">
          <p className="text-sm font-medium">Caja</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {levels.map((level) => (
              <button
                key={level.slug}
                type="button"
                onClick={() => {
                  setLevelSlug(level.slug);
                  setSizeCode("");
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
                  level.slug === levelSlug ? "border-foreground bg-foreground text-background" : "border-border",
                )}
              >
                {level.level}
                <span className="ml-1 text-xs opacity-80">{level.quality}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Talla</p>
            <SizeGuideDialog
              kind={levelSlug === "player" ? "PLAYER" : "FAN"}
              variants={forLevel.map((variant) => ({
                sizeCode: variant.sizeCode,
                availability: variant.availability,
              }))}
              onApply={setSizeCode}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {forLevel.map((variant) => {
              const unavailable = variant.availability === "OUT_OF_STOCK";
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={unavailable}
                  onClick={() => setSizeCode(variant.sizeCode)}
                  className={cn(
                    "h-10 min-w-10 rounded-md border px-3 text-sm",
                    variant.sizeCode === sizeCode && "border-foreground bg-foreground text-background",
                    unavailable && "cursor-not-allowed opacity-40",
                  )}
                >
                  {variant.sizeCode}
                </button>
              );
            })}
          </div>
          {selected?.availability === "ON_DEMAND" && (
            <p className="mt-2 text-xs text-muted-foreground">Esta talla sale bajo pedido.</p>
          )}
        </div>
        <AddToCartButton
          className="mt-6"
          variantId={selected?.id ?? ""}
          productSlug={MYSTERY_BOX_SLUG}
          productName={box.name}
          teamName=""
          versionName={selected?.quality ?? ""}
          sizeName={selected?.sizeName ?? ""}
          imageUrl={box.imageUrl ?? ""}
          unitPrice={selected?.salePrice ?? 0}
          customizationType="NONE"
          customizationName=""
          customizationNumber=""
          deliveryMode={selected && selected.stock > 0 ? "INMEDIATA" : "BAJO_PEDIDO"}
          immediateStock={selected?.stock}
          lineKind="MYSTERY_BOX"
          disabled={!canAdd}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          No eliges equipo, jugador, nombre ni número. La camiseta coincide con la calidad y la talla de la caja.
        </p>
      </div>
    </section>
  );
}
