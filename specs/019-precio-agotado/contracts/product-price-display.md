# Contract: Product price display for sold-out products

## Scope

This contract defines the render rule used by public product cards and product detail pages when a product has zero purchasable variants.

## Data contract

```ts
export type ProductPriceDisplayState = {
  availability: "AVAILABLE" | "ON_DEMAND" | "OUT_OF_STOCK";
  displayPrice: number | null;
  statusLabel: "En stock" | "Bajo pedido" | "Agotado";
  showPrice: boolean;
};
```

## Rules

1. If `availability === "AVAILABLE"`, `displayPrice` is the normal current offer price and `showPrice === true`.
2. If `availability === "ON_DEMAND"`, keep the existing backorder message and current pricing semantics.
3. If `availability === "OUT_OF_STOCK"` and `lastValidProductPrice > 0`, set `displayPrice` to that amount and `statusLabel` to `Agotado`.
4. If `availability === "OUT_OF_STOCK"` and no valid `lastValidProductPrice > 0`, set `displayPrice = null` and `showPrice = false`.
5. `displayPrice` MUST never be `0` or a derived value from an empty available-variants list.
6. `statusLabel` remains the existing sold-out badge (`Agotado`) without inventing a new visual state.

## Consumers

- `ProductCard` in public listing surfaces
- product detail price block
- any product summary component using catalog data

## Non-goals

- creating a new persistence field for `lastValidProductPrice`
- changing checkout or order totals
- altering visibility of inactive or archived products
