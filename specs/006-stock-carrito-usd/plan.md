# Implementation Plan: Tope de stock en entrega inmediata y precios coherentes en USD

**Branch**: `006-stock-carrito-usd` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-stock-carrito-usd/spec.md`

## Summary

Corregir dos defectos de la tienda pública: (1) la cantidad de entrega inmediata no puede superar el stock físico de la **variante** (camiseta + versión + talla), ni en ficha ni en carrito, y un carrito obsoleto se corrige solo al reabrirlo o al pagar; (2) si USD está marcado, los importes de decisión en la **página actual** se muestran convertidos y con formato de dólares, nunca como `$89.900` COP. Sin segundo catálogo, sin pasarela USD, sin cambiar el ledger ni el panel admin.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Prisma 5, Zustand 5 (carrito persistido), Server Actions, `formatMoney` / `toUsdCents` existentes, cookie `sale_currency`, toast UI existente

**Storage**: PostgreSQL vía Prisma (solo lectura del ledger para stock vigente). Sin migración. Cookie de moneda ya existente.

**Testing**: Node test runner vía `tsx` para tope inmediato, corrección de carrito y formato/coerción de moneda; `tsc --noEmit`, lint y build

**Target Platform**: Web (tienda pública + checkout invitado)

**Project Type**: Aplicación web e-commerce Next.js (Server Components por defecto; client para carrito, ficha, selector)

**Performance Goals**: El tope y la corrección de carrito no añaden una recarga de catálogo; la consulta de stock es por los `variantId` del carrito. El cambio COP/USD se refleja en la página actual tras el refresh de esa ruta.

**Constraints**: importes persistidos en COP enteros; sin flotantes en dinero; tope solo para `INMEDIATA`; no convertir excedente a `BAJO_PEDIDO` en silencio; selector y precios no pueden divergir

**Scale/Scope**: ficha, carrito, checkout; grids públicos que hoy omiten `currencyContext` (`/productos`, relacionados); recargo de personalización; selector de cabecera

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Tope y corrección viven en Cart; stock vigente se lee del ledger ya usado por Products/Orders; moneda sigue en System + `shared/money`.
- **II. Auditable integrity**: PASS. No se escriben movimientos al cambiar cantidad en el carrito; la reserva sigue ocurriendo al confirmar. Totales de pedido siguen en COP enteros.
- **III. Typed contracts**: PASS. Cap puro + action de stock + `CurrencyContext` coercido (USD solo con tasa válida).
- **IV. Least privilege**: PASS. Lectura pública de stock por ids del propio carrito; sin datos admin ni secretos.
- **V. Verified delivery**: PASS. Pruebas de dominio del tope, corrección, formato USD y gates de typecheck/lint/build.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/006-stock-carrito-usd/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cart-stock-currency.md
└── tasks.md                 # se generará con /speckit.tasks
```

### Source Code

```text
src/
├── app/
│   ├── productos/page.tsx                 # pasar currencyContext al grid
│   ├── productos/[slug]/page.tsx          # relacionados + contexto
│   ├── carrito/page.tsx                   # stock vigente + contexto
│   └── checkout/page.tsx                  # reconciliar antes de pagar
├── features/cart/
│   ├── domain/immediate-quantity.ts       # NUEVO: tope y corrección puros
│   ├── server/cart-stock-actions.ts       # NUEVO: stock por variantIds
│   └── components/cart-page-client.tsx    # deshabilitar +, reconciliar
├── features/products/
│   ├── repositories/product-repository.ts # exportar lectura de stock
│   ├── components/add-to-cart-button.tsx
│   ├── components/product-detail-client.tsx
│   ├── components/product-card.tsx        # sin fallback COP corto
│   ├── components/product-customization.tsx
│   └── components/product-grid.tsx
├── features/system/components/
│   ├── currency-selector.tsx
│   └── currency-selector-server.tsx       # current = contexto coercido
├── features/checkout/components/checkout-page-client.tsx
├── shared/money/
│   ├── format.ts                          # USD sin tasa no se pinta como COP
│   └── server-helpers.ts                  # USD cookie + sin tasa → COP
└── shared/stores/cart-store.ts            # add/update respetan tope inmediato

tests/
├── immediate-quantity.test.ts
├── cart-immediate-cap.test.ts
└── currency-display-coherence.test.ts
```

**Structure Decision**: Monolito Next.js por bounded context. Sin API REST nueva. Matemática de tope y de dinero pura y testeable fuera de Prisma. Sin migración.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: tope por `variantId`; función pura de cap/reconcile; “+” deshabilitado; action de stock; `getCurrencyContext` coerción a COP; grids públicos con contexto; `formatMoney` no disfraza USD como COP.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/cart-stock-currency.md](contracts/cart-stock-currency.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Extraer `immediateRemaining` / `reconcileImmediateCart` (suma de líneas `INMEDIATA` por `variantId` ≤ stock; stock 0 elimina esas líneas; `BAJO_PEDIDO` intacto).
2. Exportar lectura de stock por ids; Server Action pública que devuelve `{ variantId, stock }[]`.
3. `addItem` / `updateQuantity` no superan el tope inmediato; el botón “+” se deshabilita al máximo; un segundo “añadir” en ficha muestra toast y no incrementa.
4. Al montar carrito y al intentar pagar: pedir stock vigente, aplicar reconcile, toast si hubo recorte o baja.
5. `getCurrencyContext` y el selector: si la cookie es USD y no hay tasa, `current` es COP. Pasar contexto a `/productos`, relacionados y cualquier grid público. Quitar `formatPriceShort` como fallback de cards públicas. Recargo de personalización usa `formatMoney`.
6. `formatMoney({ currency: "USD" })` sin tasa válida no devuelve un string estilo COP; el caller usa COP solo cuando el contexto ya coercido es COP.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** Cart posee el tope; Products el ledger; System la moneda; Orders el rechazo final al confirmar.
- **II.** Sin movimientos de inventario en el carrito; importes de pedido siguen COP.
- **III.** Contratos de stock, reconcile y contexto de moneda explícitos.
- **IV.** Action de stock no expone datos ajenos al carrito del visitante.
- **V.** Tests de dominio + coherencia de formato; typecheck/lint/build.

## Complexity Tracking

> Sin violaciones constitucionales.
