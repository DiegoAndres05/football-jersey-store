import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

describe("buildProductJsonLd", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SITE_URL = "https://flashsport.co";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function loadBuilder() {
    delete require.cache[require.resolve("@/features/seo/domain/product-json-ld")];
    return require("@/features/seo/domain/product-json-ld").buildProductJsonLd;
  }

  const baseProduct = {
    slug: "camiseta-colombia-2024",
    name: "Camiseta Colombia 2024",
    description: "Camiseta oficial de la selección colombiana",
    brand: "Adidas",
    kitType: "LOCAL",
    imageUrl: "https://example.com/image.jpg",
    teamName: "Colombia",
    seasonName: "2024",
  };

  it("builds Product with multiple variants as Offers", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [
        { sku: "COL-2024-M", salePrice: 180000, stock: "AVAILABLE" as const },
        { sku: "COL-2024-L", salePrice: 185000, stock: "ON_DEMAND" as const },
      ],
    });

    assert.equal(result["@type"], "Product");
    assert.equal(result.name, "Camiseta Colombia 2024");
    assert.ok(Array.isArray(result.offers));
    assert.equal(result.offers.length, 2);

    const offer1 = result.offers[0] as Record<string, unknown>;
    assert.equal(offer1["@type"], "Offer");
    assert.equal(offer1.sku, "COL-2024-M");
    assert.equal(offer1.price, 180000);
    assert.equal(offer1.priceCurrency, "COP");
    assert.equal(offer1.availability, "https://schema.org/InStock");
    assert.equal(offer1.itemCondition, "https://schema.org/NewCondition");
    assert.deepEqual(offer1.seller, { "@type": "Organization", name: "Flashsport" });

    const offer2 = result.offers[1] as Record<string, unknown>;
    assert.equal(offer2.sku, "COL-2024-L");
    assert.equal(offer2.price, 185000);
  });

  it("maps AVAILABLE to InStock", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 100000, stock: "AVAILABLE" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(offer.availability, "https://schema.org/InStock");
  });

  it("maps ON_DEMAND to PreOrder", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 100000, stock: "ON_DEMAND" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(offer.availability, "https://schema.org/PreOrder");
  });

  it("maps OUT_OF_STOCK to OutOfStock", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 100000, stock: "OUT_OF_STOCK" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(offer.availability, "https://schema.org/OutOfStock");
  });

  it("returns Product without offers when no variants", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [],
    });

    assert.equal(result["@type"], "Product");
    assert.equal(result.offers, undefined);
  });

  it("seller is Organization with name Flashsport", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 50000, stock: "AVAILABLE" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    const seller = offer.seller as Record<string, unknown>;
    assert.equal(seller["@type"], "Organization");
    assert.equal(seller.name, "Flashsport");
  });

  it("price is integer COP with no decimals", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 175000, stock: "AVAILABLE" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(typeof offer.price, "number");
    assert.equal(offer.price, 175000);
    assert.ok(Number.isInteger(offer.price as number));
  });

  it("rounds fractional prices to integer", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 175000.5, stock: "AVAILABLE" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(offer.price, 175001);
  });

  it("returns null for null product", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd(null);
    assert.equal(result, null);
  });

  it("includes product URL in offers", () => {
    const buildProductJsonLd = loadBuilder();
    const result = buildProductJsonLd({
      ...baseProduct,
      variants: [{ sku: "S1", salePrice: 100000, stock: "AVAILABLE" }],
    });

    const offer = result.offers[0] as Record<string, unknown>;
    assert.equal(offer.url, "https://flashsport.co/productos/camiseta-colombia-2024");
  });
});
