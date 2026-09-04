"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Heart, MessageCircle, RefreshCw, Shield, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { whatsappLink } from "@/shared/config/site";
import { getAvailableDeliveryModes, type DeliveryMode } from "@/features/products/types/delivery-mode";
import { ProductGallery } from "./product-gallery";
import { ProductVariantSelector } from "./product-variant-selector";
import { ProductCustomization } from "./product-customization";
import { ProductPrice } from "./product-price";
import { ProductDeliveryMode } from "./product-delivery-mode";
import { AddToCartButton } from "./add-to-cart-button";
import type { ProductDetailData, VariantWithStock } from "@/features/products/types/product-types";
import { SizeGuideDialog } from "./size-guide-dialog";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { useRecentlyViewedStore } from "@/shared/stores/recently-viewed-store";
import { toast } from "@/components/ui/toast";
import type { CurrencyContext } from "@/shared/money/server-helpers";

type CustomType = "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";

export function ProductDetailClient({ product, currencyContext }: { product: ProductDetailData; currencyContext?: CurrencyContext }) {
  const [selectedVersion, setSelectedVersion] = useState(product.variants[0]?.version.slug ?? "");
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size.code ?? "");
  const [customType, setCustomType] = useState<CustomType>("NONE");
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPlayerId, setCustomPlayerId] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("INMEDIATA");
  const favorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const recordViewed = useRecentlyViewedStore((state) => state.recordViewed);
  const hydrateFavorites = useFavoritesStore((state) => state.hydrate);
  const hydrateViewed = useRecentlyViewedStore((state) => state.hydrate);

  useEffect(() => { hydrateFavorites(); hydrateViewed(); if (product.isActive) recordViewed({ productId: product.id, slug: product.slug }); }, [hydrateFavorites, hydrateViewed, product.id, product.isActive, product.slug, recordViewed]);

  const variantMap = useMemo(() => {
    const map = new Map<string, VariantWithStock>();
    for (const v of product.variants) {
      map.set(`${v.version.slug}_${v.size.code}`, v);
    }
    return map;
  }, [product.variants]);

  const currentVariant = variantMap.get(`${selectedVersion}_${selectedSize}`);

  const getVariantAvailability = useCallback(
    (versionSlug: string, sizeCode: string): "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" => {
      const v = variantMap.get(`${versionSlug}_${sizeCode}`);
      return v?.availability ?? "OUT_OF_STOCK";
    },
    [variantMap],
  );

  const getVariantPrice = useCallback(
    (versionSlug: string): { salePrice: number; compareAtPrice: number | null } => {
      const sizeCode = selectedSize;
      const v = variantMap.get(`${versionSlug}_${sizeCode}`);
      if (v) return { salePrice: v.salePrice, compareAtPrice: v.compareAtPrice };
      const anyV = product.variants.find((pv) => pv.version.slug === versionSlug);
      if (anyV) return { salePrice: anyV.salePrice, compareAtPrice: anyV.compareAtPrice };
      return { salePrice: 0, compareAtPrice: null };
    },
    [variantMap, selectedSize, product.variants],
  );

  const uniqueVersions = useMemo(() => {
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (seen.has(v.version.slug)) return false;
      seen.add(v.version.slug);
      return true;
    }).map((v) => v.version);
  }, [product.variants]);

  const uniqueSizes = useMemo(() => {
    const seen = new Set<string>();
    return product.variants.filter((v) => {
      if (seen.has(v.size.code)) return false;
      seen.add(v.size.code);
      return true;
    }).map((v) => v.size);
  }, [product.variants]);

  const selectedPlayer = useMemo(
    () => product.players.find((p) => p.id === customPlayerId) ?? null,
    [product.players, customPlayerId],
  );

  const surcharge = customType !== "NONE" ? product.customizationSurcharge : 0;
  const customizationName =
    customType === "CUSTOM" ? customName : customType === "OFFICIAL_PLAYER" ? selectedPlayer?.name ?? "" : "";
  const customizationNumber =
    customType === "CUSTOM" ? customNumber : customType === "OFFICIAL_PLAYER" ? selectedPlayer?.number ?? "" : "";

  const availableModes = currentVariant
    ? getAvailableDeliveryModes(currentVariant.stock, currentVariant.allowsBackorder)
    : [];

  useEffect(() => {
    if (!currentVariant) return;
    const [first] = getAvailableDeliveryModes(currentVariant.stock, currentVariant.allowsBackorder);
    if (first) setDeliveryMode(first);
  }, [currentVariant]);

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href="/productos" className="hover:text-foreground transition-colors">Catálogo</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Gallery */}
        <ProductGallery images={product.images} />

        {/* Right: Product info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
              <span>{product.team.name}</span>
              <span>·</span>
              <span>{product.brand}</span>
              {product.team.league && (
                <>
                  <span>·</span>
                  <span>{product.team.league.name}</span>
                </>
              )}
              <span>·</span>
              <span>{product.season.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} aria-pressed={favorite} onClick={() => { toggleFavorite({ productId: product.id, slug: product.slug }); toast({ title: favorite ? "Quitado de favoritos" : "Guardado en favoritos", variant: "success" }); }} className="mt-3 inline-flex items-center gap-2 text-sm underline underline-offset-4"><Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-600" : ""}`} /> {favorite ? "Guardado en favoritos" : "Guardar en favoritos"}</button>
            {product.shortName && (
              <p className="text-sm text-muted-foreground mt-1">{product.shortName}</p>
            )}
            {product.season.isRetro && (
              <Badge tone="warning" className="mt-2">Edición retro</Badge>
            )}
          </div>

          {/* Price */}
          {currentVariant && (
            <ProductPrice
              salePrice={currentVariant.salePrice + surcharge}
              compareAtPrice={currentVariant.compareAtPrice
                ? currentVariant.compareAtPrice + surcharge
                : null}
              currencyContext={currencyContext}
            />
          )}

          <Separator />

          {/* Variant Selector */}
          <ProductVariantSelector
            versions={uniqueVersions}
            sizes={uniqueSizes}
            selectedVersion={selectedVersion}
            selectedSize={selectedSize}
            onVersionChange={setSelectedVersion}
            onSizeChange={setSelectedSize}
            getVariantAvailability={getVariantAvailability}
            getVariantPrice={getVariantPrice}
            currencyContext={currencyContext}
          />
          <SizeGuideDialog kind={selectedVersion.toLowerCase().includes("player") ? "PLAYER" : "FAN"} variants={product.variants.filter((variant) => variant.version.slug === selectedVersion).map((variant) => ({ sizeCode: variant.size.code, availability: variant.availability }))} onApply={setSelectedSize} />

          {/* Customization */}
          {product.customizationsEnabled && <Separator />}
          <ProductCustomization
            enabled={product.customizationsEnabled}
            type={customType}
            hasPlayerPrint={product.hasPlayerPrint}
            players={product.players}
            surcharge={product.customizationSurcharge}
            name={customName}
            number={customNumber}
            selectedPlayerId={customPlayerId}
            onTypeChange={setCustomType}
            onNameChange={setCustomName}
            onNumberChange={setCustomNumber}
            onPlayerChange={setCustomPlayerId}
          />
          {product.customizationsEnabled && <Separator />}

          {/* Delivery mode + Add to cart */}
          {currentVariant &&
            (availableModes.length > 0 ? (
              <>
                <ProductDeliveryMode
                  stock={currentVariant.stock}
                  allowsBackorder={currentVariant.allowsBackorder}
                  selected={deliveryMode}
                  onSelect={setDeliveryMode}
                />

                <AddToCartButton
                  variantId={currentVariant.id}
                  productSlug={product.slug}
                  productName={product.name}
                  teamName={product.team.name}
                  versionName={currentVariant.version.name}
                  sizeName={currentVariant.size.name}
                  imageUrl={product.images[0]?.url ?? ""}
                  unitPrice={currentVariant.salePrice + surcharge}
                  customizationType={customType}
                  customizationName={customizationName}
                  customizationNumber={customizationNumber}
                  deliveryMode={deliveryMode}
                />
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Esta talla está agotada y no se puede pedir bajo encargo.
                </p>
                <Button size="xl" variant="outline" className="w-full" asChild>
                  <a
                    href={whatsappLink(
                      `Hola Flashsport, me interesa la camiseta ${product.name} (${product.team.name}, ${currentVariant.version.name}, talla ${currentVariant.size.name}). Está agotada. ¿Cómo puedo conseguirla?`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Consultar por WhatsApp
                  </a>
                </Button>
              </div>
            ))}

          {/* Trust badges */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, label: "Envío gratis", sub: "desde $200.000" },
              { icon: Shield, label: "Pago seguro", sub: "Tarjeta, PSE, Nequi" },
              { icon: RefreshCw, label: "Cambios", sub: "hasta 30 días" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1 text-center rounded-xl bg-secondary/50 p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.sub}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}