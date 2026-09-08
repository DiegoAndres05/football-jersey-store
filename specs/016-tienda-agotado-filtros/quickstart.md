# Quickstart: Tienda — agotado visual y filtros

## Prerequisites

- `npm run dev` with catalog data that includes: producto con stock, solo bajo pedido, y agotado total (`allowsBackorder=false` y stock 0).

## Automated

```bash
npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts
# or npm test filtered if named that way
npx tsc --noEmit
```

Esperado: predicados de estado de listado y match de filtros (disponibilidad redefinida, modalidad, talla±modalidad).

## Manual — visual (US1)

1. Abrir `/productos`.
2. Card con stock: colores normales.
3. Card solo bajo pedido: no gris muerto; texto bajo pedido.
4. Card agotada total: gris/atenuada + Agotada; click abre ficha.

## Manual — filtros (US2/US3)

1. `disponibilidad=OUT_OF_STOCK` → solo no comprables (no “solo bajo pedido”).
2. `disponibilidad=AVAILABLE` → comprables (stock y/o bajo pedido).
3. `modalidad=INMEDIATA` → todos con alguna talla en stock.
4. `modalidad=BAJO_PEDIDO` → todos con backorder (pueden tener también stock).
5. `talla=M` → solo M comprable.
6. `talla=M&modalidad=INMEDIATA` → M con stock.
7. Combinar con `liga=` → intersección; empty state si no hay matches.

## Regression

- Favoritos custom sin `ProductCard` no requieren gris.
- Checkout / carrito intactos.
- Chips existentes (liga, equipo, sort) siguen funcionando.

## Contracts

- [catalog-filters.md](contracts/catalog-filters.md)
- [product-card-availability.md](contracts/product-card-availability.md)
