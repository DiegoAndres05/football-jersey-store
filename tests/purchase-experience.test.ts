import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getLegalConfig } from "../src/shared/config/legal.ts";
import { createSizeSelectionState, resolveSelectedSize } from "../src/features/products/domain/size-selection.ts";
import { calculateOrderBreakdown } from "../src/features/checkout/domain/order-breakdown.ts";

describe("purchase experience", () => {
  it("usa rutas públicas cuando faltan documentos legales en el entorno", () => {
    const legal = getLegalConfig(process.env);
    assert.deepEqual(legal, {
      terms: { documentKey: "terms", documentVersion: "publica", url: "/terminos" },
      privacy: { documentKey: "privacy", documentVersion: "publica", url: "/privacidad" },
      dataProcessing: { documentKey: "dataProcessing", documentVersion: "publica", url: "/tratamiento-datos" },
      returns: { documentKey: "returns", documentVersion: "publica", url: "/cambios-devoluciones" },
    });
  });

  it("sin talla elegida no se acepta la compra y al cambiar de versión se limpia la talla inválida", () => {
    assert.equal(resolveSelectedSize({ currentSize: "", allowedSizes: ["S", "M"], nextVersionSizes: ["S", "M"] }).selectedSize, "");
    assert.equal(resolveSelectedSize({ currentSize: "M", allowedSizes: ["S", "L"], nextVersionSizes: ["S", "L"] }).selectedSize, "");
    assert.equal(createSizeSelectionState("S").selectedSize, "S");
  });

  it("el desglose usa envio fijo y el total suma las líneas visibles", () => {
    const under = calculateOrderBreakdown({ productSubtotal: 120000, personalizationFee: 5000, discount: 0, country: "Colombia" });
    assert.equal(under.shipping, 15000);
    assert.equal(under.total, 140000);

    const over = calculateOrderBreakdown({ productSubtotal: 200000, personalizationFee: 0, discount: 0, country: "Colombia" });
    assert.equal(over.shipping, 0);
    assert.equal(over.total, 200000);

    const withCustom = calculateOrderBreakdown({ productSubtotal: 120000, personalizationFee: 15000, discount: 5000, country: "Colombia" });
    assert.equal(withCustom.personalizationFee, 15000);
    assert.equal(withCustom.total, 145000);
  });
});
