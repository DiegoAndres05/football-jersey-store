# Implementation Plan: Precio válido para productos agotados

**Branch**: `019-precio-agotado` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-precio-agotado/spec.md`

## Summary

Corregir la política de precio para productos sin variantes comprables: nunca se debe renderizar `$0 COP` ni derivar un precio desde un conjunto vacío de stock disponible. El flujo usa el estado de disponibilidad existente (`AVAILABLE` / `ON_DEMAND` / `OUT_OF_STOCK`) y añade una regla de fallback basada en el último precio válido positivo del producto para mostrar `Agotado` junto a un importe real, o bien ocultar el precio cuando ese valor no exista. La corrección aplica en tarjetas (destacadas, más buscadas, catálogo) y en la ficha de producto sin cambiar la lógica de stock ni la compra.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 16 App Router

**Primary Dependencies**: `ProductCardData`, `ProductDetailData`, `ProductAvailability`, `product-repository.ts`, `product-card.tsx`, `product-variant-selector.tsx`, `formatMoney`, stock ledger via `inventoryMovement` and `productVariant.salePrice`

**Storage**: Prisma / PostgreSQL — **sin migración**. Reutiliza el ledger existente y las columnas de precio por variante; no crea nueva persisencia ni reescribe inventario.

**Testing**: `node:test` + `tsx`; unit tests de dominio sobre `salePrice`/stock y asserts de render en product card/detail; `tsc --noEmit`

**Target Platform**: Web pública Flashsport (Colombia), experiencia de catálogo y detalle

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Reusar el mismo agregado de precio/stock de `getProducts` y `getProductBySlug`; evitar consultas extra costosas y No N+1 en cards.

**Constraints**: Moneda COP entera; no float; si no hay variante comprable, no se inventa precio; se respeta `Agotado` y acciones de compra deshabilitadas; no tocar visibilidad ni inventario de productos inactivos/archivados.

**Scale/Scope**: Cards de catálogo y home; detalle de producto; helpers de dominio y test coverage; sin cambios en checkout ni en administración.

## Constitution Check

*GATE: PASS (pre Phase 0 y post Phase 1).*

- **I. Domain boundaries**: PASS. Lógica de presentación y derivación de precio queda en `src/features/products` y reutiliza el repertorio de repositorio y UI existente; no se introduce acoplamiento a checkout.
- **II. Auditable integrity**: PASS. No se modifica ledger, ni stock ni pedidos; solo se deriva una política visual para mostrar precio del producto agotado. Los importes siguen siendo enteros COP.
- **III. Typed contracts**: PASS. Se define un contrato de estado de precio visible y de disponibilidad para product cards y detail con tipos explícitos y validación centralizada.
- **IV. Least privilege**: PASS. Es una corrección pública de presentación, sin secretos ni rutas protegidas.
- **V. Verified delivery**: PASS. Se requieren tests de dominio y asserts de UI para estados disponibles/agotados y quickstart manual de regresión.

Sin excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/019-precio-agotado/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── product-price-display.md
└── tasks.md                 # /speckit.tasks — no se crea en /speckit.plan
```

### Source Code

```text
src/features/products/
├── domain/
│   ├── listing-availability.ts        # estado derivado de stock
│   └── product-price-display.ts        # NEW: fallback price / sold-out policy
├── repositories/product-repository.ts  # getProducts/getProductBySlug + price ranges
├── components/product-card.tsx         # render de precio y badge agotado
├── components/product-detail.tsx       # detalle product price + stock state
├── components/product-variant-selector.tsx  # disabled options for sold out
├── types/product-types.ts              # ProductCardData / ProductDetailData fields
└── services/...

src/app/productos/[slug]/page.tsx
src/app/page.tsx / src/app/productos/page.tsx / product listings using ProductCard

tests/
├── product-price-sold-out.test.ts
├── product-card-price-policy.test.ts
└── product-detail-price-policy.test.ts
```

**Structure Decision**: Reusar la capa existente de `src/features/products` para derivar una única política de precio visible y evitar duplicar la lógica en cada página. La visualización y el detalle comparten el mismo helper de dominio; los repositorios siguen siendo la fuente de datos válidos.

## Phase 0: Research

Completada en [research.md](research.md).

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. **Norma de precio visible**: definir `deriveProductDisplayPrice` a partir de `hasPurchasableVariant`, `lastValidPrice`, y `isSoldOut` para devolver `null` o un entero COP positivo. Nunca derivar desde una lista vacía de variantes disponibles.
2. **Card-level display**: ajustar `ProductCard` para que, cuando `isSoldOut`, muestre `Agotado` y el último precio válido o omita el importe si no existe; mantener textos del estado tipo `Bajo pedido`/`En stock` sin `$0 COP`.
3. **Detail-level display**: aplicar la misma política en la ficha del producto, asegurando que el bloque de precio, badge y selector de talla respeten los mismos `OUT_OF_STOCK` / `ON_DEMAND` rules.
4. **Guardrail de compra**: mantener el selector y acciones de carrito deshabilitadas cuando no haya variantes comprables; no permitir total cero en carrito ni línea de pedido con oferta imposible.
5. **Regression tests**: validar al menos 3 casos: producto con todas variantes agotadas y precio histórico válido; agotado sin precio legado confiable; producto disponible con stock actual y precio vigente.

## Constitution Check (post-design)

*GATE: PASS.*

- **I–V** cumplen la regla contractual del catálogo y la integridad de precios. No hay violaciones ni excepciones a justificar.

## Complexity Tracking

> Sin violaciones constitucionales. No requiere una excepción ni diseño adicional por complejidad.
