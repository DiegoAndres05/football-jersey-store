# Implementation Plan: Caja misteriosa

**Branch**: `025-caja-misteriosa` (setup no reportó branch activo) | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-caja-misteriosa/spec.md`

## Summary

Caja misteriosa es un producto del catálogo, no un checkout nuevo. Tiene sección propia en `/caja-misteriosa`, entra en la navegación solo si está publicada y con alguna opción disponible, y también sale en el listado y la búsqueda de la tienda. Esas tres entradas abren la misma sección. El cliente elige un nivel y una talla: Básica promete Fan, Estándar promete Player y Premium promete Retro. No elige equipo, temporada ni personalización. El precio de cada nivel es el `salePrice` entero en pesos de la variante. El carrito, el pago y el pedido guardan nivel, calidad y talla, y no presentan un club como si lo hubiera elegido. El stock de la caja es propio de cada variante nivel+talla y usa el ledger que ya existe.

## Technical Context

**Language/Version**: TypeScript y Next.js App Router, según `package.json`.

**Primary Dependencies**: Prisma, React, Tailwind CSS, Zustand (`src/shared/stores/cart-store.ts`).

**Storage**: PostgreSQL/Supabase vía Prisma. Una columna nueva en `Product` y otra en `OrderItem`. El carrito sigue en `fjs-cart`.

**Testing**: `npm test` con `node --import tsx --test`. Pruebas de dominio para el mapa de niveles y para que la línea no lleve equipo ni personalización. Revisión manual de la sección, la tienda y el checkout.

**Target Platform**: Tienda pública web y el editor de catálogo que ya existe. Sin pantalla admin nueva.

**Performance Goals**: La sección carga un solo producto y sus variantes. El listado no hace una consulta aparte por la caja.

**Constraints**: Precios enteros en pesos. No personalización. No reservar una camiseta concreta al agregar al carrito. No rediseñar el admin. No cambiar el flujo de pago.

**Scale/Scope**: Un producto, tres versiones ya sembradas (`fan`, `player`, `retro`) por las tallas publicadas, una ruta pública y el encaje en listado, búsqueda, carrito y pedido.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Límites de dominio**: PASS. El producto y la disponibilidad viven en catálogo e inventario. El carrito y el pedido solo guardan la línea. No se acopla el id de una camiseta concreta a la caja.
- **II. Integridad auditable**: PASS. El stock de cada variante de caja sale del ledger. El pedido guarda precio entero, nivel, calidad y talla. No se descuenta una camiseta al azar en la misma venta.
- **III. Contratos tipados**: PASS. El mapa de niveles es una función pura. `productKind` y `lineKind` son strings cerrados y validados al crear el pedido.
- **IV. Menor privilegio**: PASS. Publicar y editar sigue exigiendo el admin actual. La página pública no revela equipo ni diseño.
- **V. Entrega verificable**: PASS. El mapa y la línea tienen prueba unitaria. El recorrido de sección, tienda y pago queda en `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/025-caja-misteriosa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-mystery-box.md
└── tasks.md
```

### Source Code (repository root)

```text
prisma/schema.prisma
src/app/caja-misteriosa/page.tsx
src/features/products/domain/mystery-box.ts
src/features/products/components/mystery-box-picker.tsx
src/features/products/repositories/product-repository.ts
src/components/layout/nav-links.tsx
src/components/layout/header.tsx
src/shared/stores/cart-store.ts
src/features/orders/
tests/mystery-box.test.ts
```

**Structure Decision**: Un solo producto Next.js. La regla de niveles vive en `src/features/products/domain`. La sección es una ruta pública. El admin, el ledger y el checkout se reutilizan. `teamId` y `seasonId` siguen siendo obligatorios en Prisma para no reescribir las lecturas de camisetas; la caja usa un equipo y una temporada internos que la tienda no muestra.

## Complexity Tracking

Sin violaciones. No hay proyecto ni pasarela nuevos. La columna `productKind` evita hacer opcionales el equipo y la temporada de todas las camisetas.

## Phase 0 — Research

Ver [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): producto, variantes, línea de carrito y snapshot de pedido.
- [contracts/public-mystery-box.md](./contracts/public-mystery-box.md): sección, navegación, listado y línea de compra.
- [quickstart.md](./quickstart.md): pruebas y recorrido manual.

## Post-design Constitution Check

PASS en los cinco principios. El diseño no abre un segundo catálogo ni un segundo stock. La excepción de modelado (equipo interno invisible) está en research y no cambia el ledger ni los precios enteros.
