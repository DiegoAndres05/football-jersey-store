import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  remainingImmediate,
  type ImmediateCartLine,
} from "../src/features/cart/domain/immediate-quantity.ts";
import { buildLineId, useCartStore, type CartDraft } from "../src/shared/stores/cart-store.ts";

const draft = (overrides: Partial<CartDraft> = {}): CartDraft => ({
  variantId: "v1",
  productSlug: "camiseta",
  productName: "Camiseta",
  teamName: "Equipo",
  versionName: "Local",
  sizeName: "M",
  imageUrl: "",
  unitPrice: 89900,
  customizationType: "NONE",
  customizationName: "",
  customizationNumber: "",
  deliveryMode: "INMEDIATA",
  ...overrides,
});

beforeEach(() => {
  useCartStore.getState().clear();
});

describe("addItem / updateQuantity tope inmediato", () => {
  it("no deja subir INMEDIATA por encima del stock", () => {
    const first = useCartStore.getState().addItem(draft(), 1);
    assert.equal(first.ok, true);
    assert.equal(useCartStore.getState().items[0]?.quantity, 1);

    const second = useCartStore.getState().addItem(draft(), 1);
    assert.equal(second.ok, false);
    if (!second.ok) assert.equal(second.reason, "at_cap");
    assert.equal(useCartStore.getState().items[0]?.quantity, 1);

    const lineId = useCartStore.getState().items[0]?.lineId ?? "";
    const bump = useCartStore.getState().updateQuantity(lineId, 2, 1);
    assert.equal(bump.ok, false);
    assert.equal(useCartStore.getState().items[0]?.quantity, 1);
  });

  it("BAJO_PEDIDO no está limitado por stock físico", () => {
    const result = useCartStore.getState().addItem(draft({ deliveryMode: "BAJO_PEDIDO" }), 1);
    assert.equal(result.ok, true);
    const lineId = useCartStore.getState().items[0]?.lineId ?? "";
    const bump = useCartStore.getState().updateQuantity(lineId, 5, 1);
    assert.equal(bump.ok, true);
    assert.equal(useCartStore.getState().items[0]?.quantity, 5);
  });

  it("varias líneas inmediatas de la misma variante comparten el tope", () => {
    const plain = draft();
    const custom = draft({
      customizationType: "CUSTOM",
      customizationName: "Ana",
      customizationNumber: "10",
    });
    assert.equal(buildLineId(plain) === buildLineId(custom), false);
    assert.equal(useCartStore.getState().addItem(plain, 1).ok, true);
    assert.equal(useCartStore.getState().addItem(custom, 1).ok, false);
    const items = useCartStore.getState().items as ImmediateCartLine[];
    assert.equal(remainingImmediate(items, "v1", 1), 0);
  });
});
