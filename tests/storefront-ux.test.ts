import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compareRelatedProducts } from "../src/features/products/domain/catalog-listing-order.ts";
import { fanPlayerDifferenceCopy, sharedFanPlayerPrice } from "../src/features/products/domain/version-difference.ts";
import { restockAlertHref } from "../src/features/products/domain/restock-alert.ts";
import { withRecipientContact } from "../src/features/checkout/domain/recipient-contact.ts";

const read = (path: string) => readFileSync(path, "utf8");

test("fan y player con el mismo precio solo se explican", () => {
  const versions = [
    { slug: "fan", name: "Fan", salePrice: 85000 },
    { slug: "player", name: "Player", salePrice: 85000 },
  ];
  assert.equal(sharedFanPlayerPrice(versions), 85000);
  const copy = fanPlayerDifferenceCopy(versions);
  assert.equal(copy?.includes("Fan"), true);
  assert.equal(copy?.includes("Player"), true);
  assert.equal(copy?.toLowerCase().includes("precio"), false);
});

test("fan y player con precios distintos conservan el precio en los datos", () => {
  const versions = [
    { slug: "fan", name: "Fan", salePrice: 85000 },
    { slug: "player", name: "Player", salePrice: 140000 },
  ];
  assert.equal(sharedFanPlayerPrice(versions), null);
  assert.ok(fanPlayerDifferenceCopy(versions));
});

test("sin las dos versiones no hay explicación", () => {
  assert.equal(fanPlayerDifferenceCopy([{ slug: "fan", name: "Fan" }]), null);
  assert.equal(sharedFanPlayerPrice([{ slug: "retro", name: "Retro", salePrice: 90000 }]), null);
});

test("el aviso de WhatsApp lleva el nombre del producto y no crea un backend", () => {
  const href = restockAlertHref("Camiseta Visitante FC Barcelona");
  assert.match(href, /^https:\/\/wa\.me\/\d+\?text=/);
  assert.match(decodeURIComponent(href), /Camiseta Visitante FC Barcelona/);
  const sized = restockAlertHref("Camiseta Local", "M");
  assert.match(decodeURIComponent(sized), /talla M/);
  assert.match(decodeURIComponent(sized), /Camiseta Local/);
});

test("el destinatario soy yo copia nombre y teléfono", () => {
  const same = withRecipientContact({
    fullName: "Ana Pérez",
    phone: "3001112233",
    shippingFullName: "",
    shippingPhone: "",
  }, true);
  assert.equal(same.shippingFullName, "Ana Pérez");
  assert.equal(same.shippingPhone, "3001112233");

  const other = withRecipientContact({
    fullName: "Ana Pérez",
    phone: "3001112233",
    shippingFullName: "Luis Gómez",
    shippingPhone: "3010000000",
  }, false);
  assert.equal(other.shippingFullName, "Luis Gómez");
  assert.equal(other.shippingPhone, "3010000000");
});

test("relacionados ponen disponibles antes que agotados", () => {
  const items = [
    { id: "agotada-equipo", soldOut: true, sameTeam: true, index: 0 },
    { id: "disponible-liga", soldOut: false, sameTeam: false, index: 1 },
    { id: "disponible-equipo", soldOut: false, sameTeam: true, index: 2 },
    { id: "agotada-liga", soldOut: true, sameTeam: false, index: 3 },
  ];
  const ordered = [...items].sort(compareRelatedProducts).map((item) => item.id);
  assert.deepEqual(ordered, ["disponible-equipo", "disponible-liga", "agotada-equipo", "agotada-liga"]);
});

test("catálogo y búsqueda dejan los agotados al final sin ocultarlos", () => {
  const repo = read("src/features/products/repositories/product-repository.ts");
  const page = read("src/app/productos/page.tsx");
  const load = repo.slice(repo.indexOf("async function loadProducts"), repo.indexOf("export const getProducts"));
  assert.match(page, /search: raw\.q/);
  assert.match(page, /getProducts\(filters\)/);
  assert.match(load, /sortPurchasableFirst\(allowedIds/);
  assert.match(repo, /compareRelatedProducts\(/);
  assert.doesNotMatch(load, /availability:\s*"OUT_OF_STOCK"/);
});

test("checkout pide teclado de teléfono y de código postal", () => {
  const checkout = read("src/features/checkout/components/checkout-page-client.tsx");
  assert.match(checkout, /id="phone"[\s\S]{0,180}inputMode="tel"/);
  assert.match(checkout, /id="shippingPhone"[\s\S]{0,180}inputMode="tel"/);
  assert.match(checkout, /id="shippingZipCode"[\s\S]{0,180}inputMode="numeric"/);
});

test("la fila de consentimiento es el objetivo táctil y términos más privacidad siguen separados en el pedido", () => {
  const consents = read("src/app/checkout/consents.tsx");
  const orders = read("src/features/orders/repositories/order-repository.ts");
  assert.match(consents, /min-h-11 w-full cursor-pointer/);
  assert.match(consents, /setValue\("consentTerms"/);
  assert.match(consents, /setValue\("consentPrivacy"/);
  assert.match(consents, /consentDataProcessing/);
  assert.match(orders, /consentType: "TERMS"/);
  assert.match(orders, /consentType: "PRIVACY"/);
  assert.match(orders, /consentType: "DATA_PROCESSING"/);
  assert.match(orders, /documentVersion: legal\.terms\.documentVersion/);
  assert.match(orders, /documentVersion: legal\.privacy\.documentVersion/);
});

test("el paso 2 del checkout vuelve arriba y la ficha reserva la modalidad", () => {
  const checkout = read("src/features/checkout/components/checkout-page-client.tsx");
  const delivery = read("src/features/products/components/product-delivery-mode.tsx");
  assert.match(checkout, /window\.scrollTo\(0, 0\);\s*\}, \[mounted, step\]\)/);
  assert.match(checkout, /El destinatario soy yo/);
  assert.match(delivery, /min-h-\[5\.5rem\]/);
  assert.match(delivery, /invisible/);
});

test("agregar al carrito confirma y no tapa la compra con un toast abajo", () => {
  const button = read("src/features/products/components/add-to-cart-button.tsx");
  const toaster = read("src/components/ui/toaster.tsx");
  assert.match(button, /Ver carrito/);
  assert.match(button, /href: "\/carrito"/);
  assert.match(toaster, /top-\[4\.75rem\]/);
  assert.doesNotMatch(toaster, /bottom-4/);
});

test("la búsqueda conserva el término", () => {
  const header = read("src/components/layout/header.tsx");
  assert.doesNotMatch(header, /setQuery\(""\)/);
  assert.match(header, /useSearchParams\(\)/);
  assert.match(header, /\.get\("q"\)/);
  assert.match(header, /setQuery\(q\)/);
});

test("carrito y checkout muestran señales de confianza", () => {
  const cart = read("src/features/cart/components/cart-page-client.tsx");
  const checkout = read("src/features/checkout/components/checkout-page-client.tsx");
  const links = read("src/features/checkout/components/purchase-trust-links.tsx");
  assert.match(cart, /<PurchaseTrustLinks/);
  assert.match(checkout, /<PurchaseTrustLinks/);
  assert.match(links, /Cambios y devoluciones/);
  assert.match(links, /href="\/envios"/);
  assert.match(links, /whatsappLink\(/);
  assert.match(links, /Pagos seguros con Bold/);
});

test("la ficha agotada enlaza el aviso y explica fan y player", () => {
  const detail = read("src/features/products/components/product-detail-client.tsx");
  const selector = read("src/features/products/components/product-variant-selector.tsx");
  assert.match(detail, /Avísame por WhatsApp/);
  assert.match(detail, /restockAlertHref\(product\.name\)/);
  assert.match(selector, /fanPlayerDifferenceCopy/);
  assert.match(selector, /h-11 min-h-11 min-w-11/);
  assert.doesNotMatch(selector, />Pedido</);
});
