"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Heart, Truck, ShieldCheck, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { whatsappLink, SHIPPING } from "@/shared/config/site";
import { ProductGallery } from "./product-gallery";
import { ProductVariantSelector } from "./product-variant-selector";
import { ProductCustomization } from "./product-customization";
import { ProductPrice } from "./product-price";
import { ProductDeliveryMode } from "./product-delivery-mode";
import { ProductAvailability } from "./product-availability";
import { AddToCartButton } from "./add-to-cart-button";
import type { ProductDetailData, VariantWithStock } from "@/features/products/types/product-types";
import { SizeGuideDialog } from "./size-guide-dialog";
import { useFavoritesStore } from "@/shared/stores/favorites-store";
import { useRecentlyViewedStore } from "@/shared/stores/recently-viewed-store";
import { useCartStore } from "@/shared/stores/cart-store";
import { remainingImmediate } from "@/features/cart/domain/immediate-quantity";
import { toast } from "@/components/ui/toast";
import {
  getAvailableDeliveryModes,
  resolveDeliveryModeSelection,
  type DeliveryMode,
} from "@/features/products/types/delivery-mode";
import { validatePersonalization } from "@/features/products/personalization";
import type { CurrencyContext } from "@/shared/money/server-helpers";
import { deriveProductDisplayPrice } from "../domain/product-price-display";
import { resolveSelectedSize } from "../domain/size-selection";

type CustomType = "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 2a9.9 9.9 0 0 0-8.55 14.9L2 22l5.27-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.13.82.84-3.05-.19-.31A8 8 0 1 1 12 20Zm4.39-5.87c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.55.12-.16.24-.63.78-.77.94-.14.16-.28.18-.52.06a6.57 6.57 0 0 1-1.93-1.19 7.28 7.28 0 0 1-1.34-1.66c-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.31-.75-1.8-.2-.47-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.11.16 1.53.1.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

export function ProductDetailClient({ product, currencyContext }: { product: ProductDetailData; currencyContext?: CurrencyContext }) {
  const [selectedVersion, setSelectedVersion] = useState(product.variants[0]?.version.slug ?? "");
  const [selectedSize, setSelectedSize] = useState("");
  const [customType, setCustomType] = useState<CustomType>("NONE");
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPlayerId, setCustomPlayerId] = useState("");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("INMEDIATA");
  const [sizeError, setSizeError] = useState("");
  const favorite = useFavoritesStore((state) => state.isFavorite(product.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const recordViewed = useRecentlyViewedStore((state) => state.recordViewed);
  const hydrateFavorites = useFavoritesStore((state) => state.hydrate);
  const hydrateViewed = useRecentlyViewedStore((state) => state.hydrate);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => { hydrateFavorites(); hydrateViewed(); if (product.isActive) recordViewed({ productId: product.id, slug: product.slug }); }, [hydrateFavorites, hydrateViewed, product.id, product.isActive, product.slug, recordViewed]);

  const variantMap = useMemo(() => {
    const map = new Map<string, VariantWithStock>();
    for (const v of product.variants) {
      map.set(`${v.version.slug}_${v.size.code}`, v);
    }
    return map;
  }, [product.variants]);

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

  const currentVariant = variantMap.get(`${selectedVersion}_${selectedSize}`);
  const priceDisplay = deriveProductDisplayPrice({
    availability: product.availability,
    currentPrice: currentVariant?.salePrice,
    lastValidProductPrice: product.lastValidProductPrice,
  });

  const getVariantAvailability = useCallback(
    (versionSlug: string, sizeCode: string): "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK" => {
      const v = variantMap.get(`${versionSlug}_${sizeCode}`);
      return v?.availability ?? "OUT_OF_STOCK";
    },
    [variantMap],
  );

  const getVariantPrice = useCallback(
    (versionSlug: string): { salePrice: number | null; compareAtPrice: number | null } => {
      const sizeCode = selectedSize;
      const v = variantMap.get(`${versionSlug}_${sizeCode}`);
      if (v) {
        return {
          salePrice: v.salePrice > 0 ? v.salePrice : null,
          compareAtPrice: v.compareAtPrice,
        };
      }
      const anyV = product.variants.find((pv) => pv.version.slug === versionSlug);
      if (anyV) {
        return {
          salePrice: anyV.salePrice > 0 ? anyV.salePrice : null,
          compareAtPrice: anyV.compareAtPrice,
        };
      }
      return { salePrice: null, compareAtPrice: null };
    },
    [variantMap, selectedSize, product.variants],
  );

  const selectedPlayer = useMemo(
    () => product.players.find((p) => p.id === customPlayerId) ?? null,
    [product.players, customPlayerId],
  );

  const surcharge = customType !== "NONE" ? product.customizationSurcharge : 0;
  const customizationName =
    customType === "CUSTOM" ? customName : customType === "OFFICIAL_PLAYER" ? selectedPlayer?.name ?? "" : "";
  const customizationNumber =
    customType === "CUSTOM" ? customNumber : customType === "OFFICIAL_PLAYER" ? selectedPlayer?.number ?? "" : "";

  const availableModes = currentVariant ? getAvailableDeliveryModes(currentVariant.stock, currentVariant.allowsBackorder) : [];
  const personalizationValidation = validatePersonalization(
    { type: customType, name: customName, number: customNumber, playerId: customPlayerId },
    { enabled: product.customizationsEnabled, officialPlayer: selectedPlayer ?? undefined },
  );

  const immediateRemaining = currentVariant ? remainingImmediate(cartItems, currentVariant.id, currentVariant.stock ?? 0) : 0;

  const handleVersionChange = useCallback((nextVersion: string) => {
    setSelectedVersion(nextVersion);
    const availableSizesForVersion = product.variants
      .filter((variant) => variant.version.slug === nextVersion)
      .map((variant) => variant.size.code);
    const nextSelection = resolveSelectedSize({
      currentSize: selectedSize,
      allowedSizes: uniqueSizes.map((size) => size.code),
      nextVersionSizes: availableSizesForVersion,
    });
    setSelectedSize(nextSelection.selectedSize);
    setSizeError(nextSelection.isSelected ? "" : "Elige una talla");
  }, [product.variants, selectedSize, uniqueSizes]);

  const handleMissingSize = useCallback(() => {
    setSizeError("Elige una talla");
    const target = document.getElementById("product-size-selector");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.focus();
  }, []);

  useEffect(() => {
    if (!currentVariant) return;
    const modes = getAvailableDeliveryModes(currentVariant.stock, currentVariant.allowsBackorder);
    setDeliveryMode((selected) => resolveDeliveryModeSelection(selected, modes) ?? selected);
  }, [currentVariant]);

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href="/productos" className="hover:text-foreground transition-colors">Catálogo</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="text-foreground font-medium">{product.name}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12 min-w-0">
        <ProductGallery images={product.images} product={product} />

        <div className="space-y-6 min-w-0">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
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
            <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
            <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} aria-pressed={favorite} onClick={() => { toggleFavorite({ productId: product.id, slug: product.slug }); toast({ title: favorite ? "Quitado de favoritos" : "Guardado en favoritos", variant: "success" }); }} className="mt-3 inline-flex items-center gap-2 text-sm underline underline-offset-4"><Heart className={`h-4 w-4 ${favorite ? "fill-current text-red-600" : ""}`} /> {favorite ? "Guardado en favoritos" : "Guardar en favoritos"}</button>
            {product.shortName && <p className="mt-1 text-sm text-muted-foreground">{product.shortName}</p>}
            {product.season.isRetro && <Badge tone="warning" className="mt-2">Edición retro</Badge>}
          </div>

          {priceDisplay.showPrice && priceDisplay.displayPrice !== null && (
            <ProductPrice salePrice={priceDisplay.displayPrice + surcharge} compareAtPrice={currentVariant?.compareAtPrice ? currentVariant.compareAtPrice + surcharge : null} currencyContext={currencyContext} />
          )}

          {product.availability === "OUT_OF_STOCK" && <ProductAvailability availability="OUT_OF_STOCK" stock={0} />}

          <Separator />

          <div id="product-size-selector" tabIndex={-1} className="space-y-2 outline-none">
            <ProductVariantSelector
              versions={uniqueVersions}
              sizes={uniqueSizes}
              selectedVersion={selectedVersion}
              selectedSize={selectedSize}
              onVersionChange={handleVersionChange}
              onSizeChange={(nextSize) => { setSelectedSize(nextSize); setSizeError(""); }}
              getVariantAvailability={getVariantAvailability}
              getVariantPrice={getVariantPrice}
              currencyContext={currencyContext}
            />
            <SizeGuideDialog kind={selectedVersion.toLowerCase().includes("player") ? "PLAYER" : "FAN"} variants={product.variants.filter((variant) => variant.version.slug === selectedVersion).map((variant) => ({ sizeCode: variant.size.code, availability: variant.availability }))} onApply={(nextSize) => { setSelectedSize(nextSize); setSizeError(""); }} />
            {sizeError && <p role="alert" aria-live="assertive" className="text-sm text-destructive">{sizeError}</p>}
          </div>

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
            currencyContext={currencyContext}
          />
          {product.customizationsEnabled && <Separator />}

          {product.availability === "OUT_OF_STOCK" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Este producto está agotado y no se puede reservar.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="xl" variant="outline" className="w-full" asChild>
                  <a href={whatsappLink(`Hola Flashsport, quiero avisarme cuando vuelva a estar disponible ${product.name}.`)} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon />
                    Avisarme
                  </a>
                </Button>
                <Button size="xl" variant="outline" className="w-full" asChild>
                  <a href={whatsappLink(`Hola Flashsport, quiero pedir por encargo ${product.name}.`)} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon />
                    Pedir por encargo
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ProductDeliveryMode
                stock={currentVariant?.stock ?? null}
                allowsBackorder={currentVariant?.allowsBackorder ?? true}
                selected={deliveryMode}
                onSelect={setDeliveryMode}
              />

              {currentVariant && availableModes.length > 0 ? (
                <>
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
                    immediateStock={currentVariant.stock ?? 0}
                    remainingImmediate={immediateRemaining}
                    disabled={!personalizationValidation.ok || !selectedSize}
                    sizeRequired={!selectedSize}
                    onMissingSize={handleMissingSize}
                  />
                  {!personalizationValidation.ok && <p role="alert" className="text-sm text-destructive">{personalizationValidation.message}</p>}
                </>
              ) : currentVariant && currentVariant.availability === "OUT_OF_STOCK" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Esta talla está agotada.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="xl" variant="outline" className="w-full" asChild>
                  <a href={whatsappLink(`Hola Flashsport, quiero avisarme cuando esté disponible la talla ${currentVariant.size.name} de ${product.name}.`)} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon />
                    Avisarme
                  </a>
                </Button>
                <Button size="xl" variant="outline" className="w-full" asChild>
                  <a href={whatsappLink(`Hola Flashsport, quiero pedir por encargo ${product.name} en talla ${currentVariant.size.name}.`)} target="_blank" rel="noopener noreferrer">
                    <WhatsappIcon />
                    Pedir por encargo
                  </a>
                </Button>
              </div>
            </div>
              ) : (
                <AddToCartButton
                  variantId={currentVariant?.id ?? ""}
                  productSlug={product.slug}
                  productName={product.name}
                  teamName={product.team.name}
                  versionName={selectedVersion ? product.variants.find((variant) => variant.version.slug === selectedVersion)?.version.name ?? "" : ""}
                  sizeName={selectedSize || ""}
                  imageUrl={product.images[0]?.url ?? ""}
                  unitPrice={currentVariant?.salePrice ?? 0}
                  customizationType={customType}
                  customizationName={customizationName}
                  customizationNumber={customizationNumber}
                  deliveryMode={deliveryMode}
                  immediateStock={currentVariant?.stock ?? 0}
                  remainingImmediate={immediateRemaining}
                  disabled={!personalizationValidation.ok || !selectedSize || !currentVariant}
                  sizeRequired={!selectedSize || !currentVariant}
                  onMissingSize={handleMissingSize}
                />
              )}
            </>
          )}

          {product.description && <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>}

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, label: "Envío gratis", sub: `desde ${SHIPPING.freeThreshold.toLocaleString("es-CO")}` },
              { icon: ShieldCheck, label: "Pago seguro", sub: "En línea" },
              { icon: ArrowRight, label: "1–2 días", sub: "de despacho" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                <Icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-medium">{label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
