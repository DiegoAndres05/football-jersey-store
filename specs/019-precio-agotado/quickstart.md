# Quickstart: Precio válido para productos agotados

## Prerequisites

- `npm install`
- Catalog seeded with at least:
  - one product with stock > 0 and valid price
  - one product with all variants `stock <= 0` and a positive historical `salePrice`
  - one product with all variants `stock <= 0` and no valid price history

## Automated validation (planned)

```bash
npx tsx --test tests/product-price-sold-out.test.ts tests/product-card-price-policy.test.ts tests/product-detail-price-policy.test.ts
npx tsc --noEmit
```

Expected outcome:
- sold-out products never render `$0 COP`
- valid historical price is shown when available
- absent/invalid price resolves to hidden price + `Agotado`
- regular in-stock product prices remain unchanged

## Manual validation — cards (US1)

1. Open `/productos`, `/`, and featured/search grid sections containing sold-out products.
2. Check the product card for an exhausted product with prior valid price: it shows `Agotado` and the last valid price in COP.
3. Check the product card for an exhausted product without valid history: it shows only `Agotado` and no price string.
4. Check an in-stock product: it keeps the existing offer price and is not marked as `Agotado`.

## Manual validation — detail (US2)

1. Navigate directly to a sold-out product detail page.
2. Confirm the badge `Agotado` is visible.
3. Confirm `$0 COP` does not appear in the price block.
4. Confirm size/stock actions remain disabled or non-purchasable according to current UX.

## Regression validation (US3)

- Repeat with the same product after toggling stock between available and sold-out.
- Compare the same product in multiple list views: home, category, search, related items.
- Verify no cart line or total is generated with zero amount for sold-out product states.
