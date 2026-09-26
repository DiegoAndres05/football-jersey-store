# Implementation Plan: Compra móvil premium

**Branch**: `027-ux-movil-premium` (setup no reportó branch activo) | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-ux-movil-premium/spec.md`

## Summary

La compra en teléfono, entre 320 y 430 px, deja de esconder el botón de agregar y de tapar el contenido con el carrito flotante. La ficha gana una barra inferior con precio, talla y “Agregar al carrito”. El botón flotante se oculta en carrito, checkout, pedido y en la ficha mientras esa barra está visible. La galería que ya desliza añade ampliación y deja las miniaturas fuera de los 390 px. Nombres, áreas de toque, filtros, menú, portada, envío gratis y el resumen cerrado del checkout se ajustan sin tocar el pago ni el admin.

## Technical Context

**Language/Version**: TypeScript y Next.js App Router, según `package.json`.

**Primary Dependencies**: React, Tailwind CSS, Zustand (`src/shared/stores/cart-store.ts`). El diálogo de ampliación reutiliza el diálogo que ya existe.

**Storage**: Sin tablas ni columnas nuevas. El desajuste foto/nombre se corrige con el nombre, la temporada o la imagen ya guardados.

**Testing**: `npm test` con `node --import tsx --test`. Pruebas puras de la barra y del botón flotante, más contratos de fuente para el nombre en dos líneas, el área de toque de la talla y el checkout sin desborde horizontal. Recorrido manual en `quickstart.md`.

**Target Platform**: Tienda pública en 320–430 px, con prioridad cerca de 390×844. Desde 768 px la barra de compra no es obligatoria.

**Project Type**: Tienda web. Sin cambios en `src/app/checkout/bold-client.tsx`, webhooks ni firma de pago.

**Performance Goals**: La barra y el botón flotante no piden datos nuevos. La ampliación usa la URL de imagen que la ficha ya tiene.

**Constraints**: Precios enteros en pesos. Envío actual: $15.000 bajo $200.000 y gratis desde $200.000. No rediseñar la marca. No cambiar SEO salvo el layout. La caja misteriosa no recibe la barra.

**Scale/Scope**: Inicio, menú, catálogo, liga, equipo, ficha, carrito, checkout y contacto.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Límites de dominio**: PASS. La barra y la galería viven en productos. El botón flotante y el avance de envío viven en carrito. El resumen cerrado vive en checkout y reutiliza el desglose que ya existe.
- **II. Integridad auditable**: PASS. No hay precios nuevos ni movimientos de inventario. El total de la barra sale del mismo precio de variante más el recargo ya calculado.
- **III. Contratos tipados**: PASS. Mostrar la barra y ocultar el botón flotante son funciones puras. El formulario de checkout sigue validándose con el esquema actual.
- **IV. Menor privilegio**: PASS. No hay pantallas admin ni datos nuevos de pago.
- **V. Entrega verificable**: PASS. Hay pruebas de visibilidad y contratos de layout. El recorrido de 390×844 queda en `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/027-ux-movil-premium/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-mobile-purchase.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/products/domain/purchase-bar.ts
src/features/products/components/product-purchase-bar.tsx
src/features/products/components/product-detail-client.tsx
src/features/products/components/product-gallery.tsx
src/features/products/components/product-variant-selector.tsx
src/features/products/components/product-card.tsx
src/features/cart/domain/mobile-cart-fab.ts
src/features/cart/components/mobile-cart-fab.tsx
src/features/cart/components/cart-page-client.tsx
src/features/checkout/components/checkout-page-client.tsx
src/app/productos/page.tsx
src/app/page.tsx
src/components/layout/header.tsx
src/components/layout/nav-links.tsx
src/app/contacto/page.tsx
tests/mobile-purchase-ux.test.ts
```

**Structure Decision**: Un solo proyecto Next.js. La barra solo se monta en la ficha de producto. El botón flotante sigue en el encabezado público y decide ocultarse con la ruta y el ancho. El checkout de escritorio conserva el resumen lateral. En 430 px o menos ese resumen pasa a un bloque cerrado junto al botón.

## Complexity Tracking

Sin violaciones. No hay pasarela, catálogo ni barra de navegación nuevos. La barra de compra es un control de la ficha, no un segundo carrito.

## Phase 0 — Research

Ver [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): barra, botón flotante, galería, filtros y avance de envío.
- [contracts/public-mobile-purchase.md](./contracts/public-mobile-purchase.md): lo que el cliente ve en cada página del alcance.
- [quickstart.md](./quickstart.md): pruebas y recorrido a 390×844.

## Post-design Constitution Check

PASS en los cinco principios. El diseño no cambia el pago, no crea tablas y no mueve la regla de talla que ya exige una elección antes de agregar.
