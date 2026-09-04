# Implementation Plan: Navegación y selección más rápidas

**Branch**: `005-navegacion-seleccion-rapida` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-navegacion-seleccion-rapida/spec.md`

## Summary

Acelerar la **interacción** en la tienda pública: filtros, orden, búsqueda confirmada y paginación deben responder al instante y dejar el listado anterior con “Actualizando…”; las secciones (Inicio/Tienda/Ligas) no deben tapar cabecera ni servir un catálogo obsoleto como final; versión/talla en ficha no esperan la foto. No se cambian reglas de catálogo, checkout ni inventario. El primer pintado sigue siendo de `004`.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Next `Link`/`useRouter`/`useTransition`/`Suspense`, Prisma lecturas existentes, `parseProductFiltersParams`, toast/UI actuales solo si hace falta región viva

**Storage**: Sin tablas nuevas. Cache de lectura de catálogo con etiqueta e invalidación al publicar. URL como fuente de verdad de filtros.

**Testing**: Node `tsx` para parseo/selección si se extrae lógica; comprobaciones de UI documentadas en quickstart; `tsc`, lint, build

**Target Platform**: Tienda pública web (no admin)

**Project Type**: Aplicación Next.js; Server Components para listado; Client Components para filtros, pending del grid, nav y ficha

**Performance Goals**: feedback del control &lt; 150 ms; sin blanco &gt; 200 ms si ya hay listado; listado definitivo habitual &lt; 1 s; revisita de sección &lt; 1 s con datos vigentes al terminar; versión/talla &lt; 150 ms sin esperar foto

**Constraints**: mismo conjunto/orden/paginación de productos; no deshabilitar controles por pending; no esqueleto sobre grid visible; no precargar todo el catálogo; no pasarela ni moneda

**Scale/Scope**: `/productos` (filtros + grid + paginación), cabecera `NAV_ITEMS`, `loading.tsx` de segmentos públicos, ficha `ProductDetailClient` / `ProductGallery`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Sigue en `features/products` y layout; no acopla Orders/Inventory.
- **II. Auditable integrity**: PASS. No toca ledger, precios persistidos ni pedidos.
- **III. Typed contracts**: PASS. Filtros siguen el esquema existente; estados de listado son presentación.
- **IV. Least privilege**: PASS. Sin nuevos secretos; invalidación solo tras actions admin ya autenticadas.
- **V. Verified delivery**: PASS. Quickstart + gates; complejidad limitada a pending UI y cache etiquetada.

No hay excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-navegacion-seleccion-rapida/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/catalog-pending-navigation.md
└── tasks.md
```

### Source Code

```text
src/app/productos/page.tsx
src/app/productos/loading.tsx
src/app/productos/catalog-results.tsx          # nuevo: solo getProducts
src/app/loading.tsx
src/app/ligas/loading.tsx
src/features/products/components/product-filters.tsx
src/features/products/components/catalog-pending-region.tsx  # nuevo
src/features/products/repositories/product-repository.ts
src/features/catalog/server/catalog-actions.ts  # revalidateTag al publicar
src/components/layout/nav-links.tsx
src/components/layout/header.tsx
src/features/products/components/product-detail-client.tsx
src/features/products/components/product-gallery.tsx
src/features/products/components/product-variant-selector.tsx
```

**Structure Decision**: Mismo monolito. Extraer el listado a un Server Component hijo para no bloquear facetas. Un Client Component envuelve el grid para conservar el hijo anterior durante `isPending`. Sin store de productos.

## Phase 0: Research

Completada en [research.md](research.md). Causas: `disabled={isPending}`, página que espera todas las queries, `loading.tsx` de página completa. Remedios: pending region, split de datos, loading solo en primera/segmento, cache con tag.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/catalog-pending-navigation.md](contracts/catalog-pending-navigation.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Extraer `CatalogResults` (solo `getProducts`) y dejar facetas en el padre; envolver grid + vacío + paginación en `CatalogPendingRegion` que conserva el último contenido comprometido mientras `useTransition`/`useSearchParams` indican pendiente, con `aria-busy` y texto “Actualizando catálogo”.
2. En `product-filters.tsx`: quitar `disabled={isPending}`; no bloquear chips; mantener `router.push` + `page=1` al cambiar filtro; búsqueda solo al confirmar.
3. Paginación: mismos `Link`/push cubiertos por la región pendiente (no skeleton).
4. Ajustar `productos/loading.tsx` y el `loading` raíz para no sustituir un grid ya montado; placeholders de segmento solo en `<main>` para cambio Inicio/Tienda/Ligas o primera visita.
5. Prefetch de `NAV_ITEMS` en `nav-links.tsx`; layout ya persistente.
6. Cache de `getProducts` / facetas con etiqueta `catalog`; `revalidateTag('catalog')` (o `revalidatePath` de rutas públicas) en actions de catálogo que cambian visibilidad pública.
7. Ficha: precio/disponibilidad síncronos; galería no bloquea ni espera `onLoad` para confirmar selección.
8. No tocar checkout, moneda, admin UI ni criterios de `buildProductWhere`.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I–II:** Sin nuevos bounded contexts ni cambios de dinero/inventario.
- **III:** URL + esquema de filtros intactos; pending es UI.
- **IV:** Invalidación desde actions ya protegidas.
- **V:** Quickstart cubre ráfagas, vacío, frescura admin y ficha.

La cache etiquetada no es una cuarta app: es el mínimo para revisitas rápidas con resultado final vigente.

## Complexity Tracking

No aplica: no hay violaciones. El wrapper cliente del grid se justifica por FR-003 (conservar listado anterior) frente a `loading.tsx` que hoy borra la página.
