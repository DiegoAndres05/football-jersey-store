# Implementation Plan: Experiencia de compra pública

**Branch**: `026-experiencia-compra` (setup no reportó branch activo) | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-experiencia-compra/spec.md`

## Summary

La tienda pública deja de frenar la compra y de mostrar totales que no cuadran. El checkout enlaza las páginas legales que ya existen (`/terminos`, `/privacidad`, `/tratamiento-datos`, `/cambios-devoluciones`). Si falta la configuración por entorno, usa esas mismas páginas, deja constancia en el log y no bloquea "Continuar al pago". Ninguna talla viene marcada; sin talla no entra nada al carrito. Carrito y checkout comparten un desglose en pesos enteros. La ficha muestra la galería que ya existe, con deslizamiento e indicador cuando hay más de una foto. Una liga sin productos ofrece WhatsApp. Un producto agotado abre su ficha, y solo ahí están "Avisarme" y "Pedir por encargo".

## Technical Context

**Language/Version**: TypeScript y Next.js App Router, según `package.json`.

**Primary Dependencies**: React, Tailwind CSS, Zod, react-hook-form, Zustand (`src/shared/stores/cart-store.ts`).

**Storage**: Sin tablas nuevas. El pedido sigue guardando el consentimiento con la URL y la versión del documento resuelto. El carrito sigue en `fjs-cart`.

**Testing**: `npm test` con `node --import tsx --test`. Pruebas puras del desglose, de la talla obligatoria y de los documentos legales presentes y ausentes. Recorrido manual en `quickstart.md`.

**Target Platform**: Tienda pública en escritorio y móvil, de 320 a 430 px en checkout, carrito y ficha.

**Project Type**: Tienda web. Sin panel admin nuevo y sin cambio en la firma ni en el cliente de pago.

**Performance Goals**: El desglose y la resolución legal son funciones en memoria. La galería no pide imágenes que el producto no tenga.

**Constraints**: Precios enteros en pesos. Envío actual: $15.000 por debajo de $200.000 y gratis desde $200.000, sobre el subtotal que ya usa la tienda (productos más personalización, antes del envío y del descuento). Destinos internacionales siguen sin pago en línea. No rediseñar la marca.

**Scale/Scope**: Checkout, carrito, ficha de producto, tarjetas de liga y listado de agotados. Seis correcciones de la prueba de usuario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Límites de dominio**: PASS. Los textos legales viven en configuración pública. El desglose vive en checkout y lo consume el carrito. La talla y la galería viven en productos. WhatsApp usa el enlace público que ya existe.
- **II. Integridad auditable**: PASS. Los montos siguen siendo enteros. El pedido guarda qué documento aceptó el cliente, incluido el de respaldo. No se cambia el ledger ni el estado del pago.
- **III. Contratos tipados**: PASS. El desglose, la talla requerida y los documentos resueltos son funciones puras con tipos explícitos. Las casillas se validan en el formulario y otra vez al crear el pedido.
- **IV. Menor privilegio**: PASS. No hay pantalla admin. El log del documento faltante no se muestra al cliente. El pago existente no recibe datos nuevos.
- **V. Entrega verificable**: PASS. Hay pruebas de talla, de totales y de documentos presentes y ausentes. El recorrido de 320 a 430 px queda en `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/026-experiencia-compra/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-purchase.md
└── tasks.md
```

### Source Code (repository root)

```text
src/shared/config/legal.ts
src/app/checkout/consents.tsx
src/features/checkout/components/checkout-page-client.tsx
src/features/checkout/domain/order-breakdown.ts
src/features/orders/repositories/order-repository.ts
src/features/cart/components/cart-page-client.tsx
src/features/products/domain/size-selection.ts
src/features/products/components/product-detail-client.tsx
src/features/products/components/product-gallery.tsx
src/features/products/components/product-card.tsx
src/features/products/components/mystery-box-picker.tsx
src/components/home/league-card.tsx
src/app/ligas/page.tsx
tests/purchase-experience.test.ts
```

**Structure Decision**: Un solo proyecto Next.js. No hay migración. El pago en `src/app/checkout/bold-client.tsx` no se toca. Las páginas legales existentes son el documento; la configuración por entorno solo las sustituye cuando trae una URL pública completa.

## Complexity Tracking

Sin violaciones. No hay pasarela ni catálogo nuevos. El respaldo legal evita bloquear la compra cuando las páginas ya están publicadas.

## Phase 0 — Research

Ver [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): documento legal resuelto, desglose, talla y salida de no disponible.
- [contracts/public-purchase.md](./contracts/public-purchase.md): checkout, carrito, ficha, listado y ligas.
- [quickstart.md](./quickstart.md): pruebas y recorrido manual.

## Post-design Constitution Check

PASS en los cinco principios. El diseño no cambia la firma del pago, no crea tablas y no muestra al cliente el registro interno de un documento faltante.
