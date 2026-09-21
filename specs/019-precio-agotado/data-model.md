# Data Model: Precio válido para productos agotados

## Persistence existente (sin migración)

| Entity | Fields used |
|--------|-------------|
| `Product` | `id`, `slug`, `isActive`, `teamId`, `createdAt` |
| `ProductVariant` | `id`, `productId`, `salePrice`, `allowsBackorder`, `sizeId`, `versionId` |
| `InventoryMovement` | `variantId`, `quantity` |
| `Size` | `code`, `position` |
| `Version` | `name`, `priceAdjustment` |

No se crean tablas ni cambios de schema. La capa de presentación deriva el valor visible a partir de datos ya persistidos.

## Derived state: ProductPriceDisplayPolicy

| Field | Type | Rule |
|--------|------|------|
| `hasPurchasableVariant` | boolean | `true` si alguna variante tiene `stock > 0` |
| `hasBackorderVariant` | boolean | `true` si alguna variante tiene `allowsBackorder` y `stock <= 0` |
| `lastValidProductPrice` | number | null | máximo precio positivo persistido del producto, usando la última referencia válida disponible en la estructura de variantes/precios del catálogo |
| `displayPrice` | number | null | si hay compra disponible: precio actual del producto; si no: `lastValidProductPrice` si es mayor a cero; else `null` |
| `displayStatus` | `AVAILABLE` \| `ON_DEMAND` \| `OUT_OF_STOCK` | estado de disponibilidad existente |

## Policy rules

1. `hasPurchasableVariant = any variant.stock > 0`.
2. `displayStatus = AVAILABLE` if `hasPurchasableVariant`; else `ON_DEMAND` if any variant `allowsBackorder` and stock is not positive; else `OUT_OF_STOCK`.
3. If `displayStatus !== OUT_OF_STOCK`, render the regular price path (current offer price, min/max range).
4. If `displayStatus === OUT_OF_STOCK` and `lastValidProductPrice > 0`, render `Agotado` + `lastValidProductPrice` in COP.
5. If `displayStatus === OUT_OF_STOCK` and `lastValidProductPrice <= 0 || null`, render only `Agotado` and omit price.
6. Never render `$0 COP` or a price derived from an empty `availableVariants` array.

## Selection of price source

The repository already computes:

- `getPriceRangesByProductIds(productIds)`: min/max `salePrice` for a product.
- `getVariantInfosByProductIds(productIds)`: variant-level stock + size + version.

The fallback policy reuses these aggregates and reserves the “last valid product price” as the positive fallback for sold-out products, without creating a new persistence or normalization table.

## Validation

- Product with all variants `stock <= 0` and `allowsBackorder = false` + valid last price > 0 → render `Agotado` + price.
- Product with all variants sold out and no valid last price → render only `Agotado`.
- Product with at least one `stock > 0` → render pricing as usual and keep availability not sold out.
- Cart/selector actions remain disabled for sold-out or backorder-only states according to existing rules.
