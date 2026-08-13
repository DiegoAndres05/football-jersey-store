"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Truck, Shield, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "./product-gallery";
import { ProductVariantSelector } from "./product-variant-selector";
import { ProductCustomization } from "./product-customization";
import { ProductPrice } from "./product-price";
import { ProductAvailability } from "./product-availability";
import { AddToCartButton } from "./add-to-cart-button";
import type { ProductDetailData, VariantWithStock } from "@/features/products/types/product-types";

export function ProductDetailClient({ product }: { product: ProductDetailData }) {
  const [selectedVersion, setSelectedVersion] = useState(product.variants[0]?.version.slug ?? "");
  const [selectedSize, setSelectedSize] = useState(product.variants[0]?.size.code ?? "");
  const [customType, setCustomType] = useState<"NONE" | "CUSTOM" | "OFFICIAL_PLAYER">("NONE");
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customPlayer, setCustomPlayer] = useState("");

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

  const playerNames = useMemo(() => {
    return [{ name: "Vinicius Jr.", number: "7" }, { name: "Bellingham", number: "5" }, { name: "Modric", number: "10" }];
  }, []);

  const isDisabled = currentVariant?.availability === "OUT_OF_STOCK";

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
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
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
              salePrice={currentVariant.salePrice}
              compareAtPrice={currentVariant.compareAtPrice}
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
          />

          <Separator />

          {/* Customization */}
          <ProductCustomization
            enabled={product.customizationsEnabled}
            type={customType}
            hasPlayerPrint={product.hasPlayerPrint}
            playerNames={playerNames}
            name={customName}
            number={customNumber}
            playerName={customPlayer}
            onTypeChange={setCustomType}
            onNameChange={setCustomName}
            onNumberChange={setCustomNumber}
            onPlayerChange={setCustomPlayer}
          />

          <Separator />

          {/* Availability */}
          {currentVariant && (
            <ProductAvailability
              availability={currentVariant.availability}
              stock={currentVariant.stock}
            />
          )}

          {/* Add to cart */}
          {currentVariant && (
            <AddToCartButton
              variantId={currentVariant.id}
              productSlug={product.slug}
              productName={product.name}
              teamName={product.team.name}
              versionName={currentVariant.version.name}
              sizeName={currentVariant.size.name}
              imageUrl={product.images[0]?.url ?? ""}
              unitPrice={currentVariant.salePrice}
              customizationType={customType}
              customizationName={customType === "CUSTOM" ? customName : customType === "OFFICIAL_PLAYER" ? customPlayer : ""}
              customizationNumber={customType === "CUSTOM" ? customNumber : customType === "OFFICIAL_PLAYER" ? customPlayer.split(" - ")[1] ?? "" : ""}
              disabled={isDisabled}
            />
          )}

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
