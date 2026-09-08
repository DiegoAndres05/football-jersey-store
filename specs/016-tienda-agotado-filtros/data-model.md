# Data Model: Tienda — agotado visual y filtros

## Existing persistence (no migration)

| Entity | Fields used |
|--------|-------------|
| `Product` | `isActive`, relations |
| `ProductVariant` | `allowsBackorder`, size, version |
| `Size` | `code`, `name` |
| `InventoryMovement` | stock derivado (SUM) |

No new tables. Listing state is **derived**.

## Derived: ListingAvailability

| Value | Rule | Card treatment |
|-------|------|----------------|
| `IN_STOCK` | ∃ variant with stock > 0 | Full color; show in-stock sizes |
| `BACKORDER_ONLY` | no stock; ∃ variant with `allowsBackorder` | Not gray-dead; “Bajo pedido” cue |
| `SOLD_OUT` | no stock; no backorder | Gray/muted + “Agotada”; still linkable |

Mapping from current card fields:

- `availability === "AVAILABLE"` → contributes to `IN_STOCK`
- `availability === "OUT_OF_STOCK" && canBackorder` → `BACKORDER_ONLY`
- `availability === "OUT_OF_STOCK" && !canBackorder` → `SOLD_OUT`

Optional: expose `listingAvailability` on `ProductCardData` for clearer UI (or compute in card from existing fields).

## Filter params (URL)

| Param | Values | Meaning |
|-------|--------|---------|
| `disponibilidad` | `AVAILABLE` \| `OUT_OF_STOCK` | Comprable vs no comprable (redefined) |
| `modalidad` | `INMEDIATA` \| `BAJO_PEDIDO` | New; exclusive chip |
| `talla` | size `code` | Single size; purchasable rules |

Combine with existing: `q`, `liga`, `equipo`, `temporada`, `version`, `sort`, `page` — **intersection**.

## Filter predicates (product level)

Given variant infos `{ sizeCode, stock, allowsBackorder }[]`:

1. **Purchasable**: `stock > 0 || allowsBackorder` on any variant.
2. **disponibilidad=AVAILABLE**: purchasable.
3. **disponibilidad=OUT_OF_STOCK**: !purchasable (`SOLD_OUT`).
4. **modalidad=INMEDIATA**: ∃ `stock > 0` (optionally scoped to `talla` if set).
5. **modalidad=BAJO_PEDIDO**: ∃ `allowsBackorder` (scoped to `talla` if set).
6. **talla only**: ∃ variant with that code where `stock > 0 || allowsBackorder`.
7. **talla + INMEDIATA**: ∃ that size with `stock > 0`.
8. **talla + BAJO_PEDIDO**: ∃ that size with `allowsBackorder`.

## Validation

- Unknown `modalidad` / `disponibilidad` → ignore (zod optional enum).
- Empty results → existing empty state ES.
- Invalid size code → empty or ignore (current behavior).
