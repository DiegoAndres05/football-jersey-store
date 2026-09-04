# Research: Navegación y selección más rápidas

## Decision: no deshabilitar filtros; selección inmediata y listado previo con `aria-busy`

**Rationale:** `ProductFilters` ya usa `useTransition` + `router.push`, pero `disabled={isPending}` bloquea todos los chips y el Server Component de `/productos` espera `getProducts` más facetas antes de pintar. Eso congela la selección. Quitar el disable, pintar el chip desde la URL de destino de inmediato y dejar el grid anterior visible con aviso “Actualizando…” y `aria-busy` cumple FR-001 a FR-003 y FR-012 sin cambiar las reglas de filtro.

**Alternatives considered:** esqueleto en `loading.tsx` (prohibido cuando ya hay listado); copiar productos a Zustand (duplica el catálogo y puede quedar obsoleto como final). Se descartan.

## Decision: separar facetas del listado; solo el grid depende de searchParams

**Rationale:** Cada cambio de query vuelve a pedir ligas, temporadas, versiones, tallas y productos. Las facetas no dependen del filtro (salvo equipos por liga). Un hijo de servidor `CatalogResults` que solo llama `getProducts`, con facetas cacheadas, acorta la espera sin cambiar el conjunto de resultados.

**Alternatives considered:** filtrar el grid en el cliente con un dump completo del catálogo. Se descarta: contradice “no precargar todo” y puede mostrar productos que ya no aplican.

## Decision: `loading.tsx` no debe sustituir un catálogo ya visible

**Rationale:** `src/app/productos/loading.tsx` y `src/app/loading.tsx` pintan un esqueleto de página completa (sidebar + grid). Eso viola el patrón acordado cuando el listado ya está en pantalla y agrava el “cambio de pestaña”. El placeholder de ruta se limita a la **primera** llegada o a un recambio de **segmento** (Inicio ↔ Tienda ↔ Ligas), y solo en `<main>`, nunca la cabecera/pie del `AppLayout`.

**Alternatives considered:** eliminar todos los `loading.tsx`. Se descarta: la primera visita y el cambio de sección aún necesitan un indicador; FR-003 solo prohíbe esqueleto **encima de un listado ya visible**.

## Decision: última URL gana; sin fetch cliente paralelo del listado

**Rationale:** La fuente de verdad sigue siendo la URL (FR-009). `router.push` + transición ya serializa la navegación de Next; no se añade un segundo canal de datos. Las actualizaciones intermedias no se pintan como finales (FR-005).

**Alternatives considered:** debounce de 300 ms en chips. Se descarta: retrasaría SC-001 (150 ms de feedback del control).

## Decision: cache de lectura con etiqueta de catálogo, invalidación al publicar

**Rationale:** FR-008 pide revisitas más rápidas; FR-013 exige que el resultado **terminado** sea el catálogo público vigente. `cache()` por request no ayuda entre navegaciones. Una cache de lectura etiquetada (`catalog`) invalidada cuando admin crea/edita/desactiva productos da espera corta y frescura al completar. Sin TTL largo que deje a la venta un producto oculto.

**Alternatives considered:** TTL de 5 minutos (rechazado en clarify). ISR sin invalidar en guardado admin.

## Decision: prefetch de secciones en cabecera; layout persistente

**Rationale:** `AppLayout` ya conserva header/footer. El blanco está en `<main>` por `loading.tsx` raíz y páginas lentas. Prefetch de `NAV_ITEMS` al visibilidad/hover y `loading` de segmento que no tape la cabecera cumplen US2. No se precarga el catálogo entero.

**Alternatives considered:** service worker o cache HTTP agresiva de HTML. Sobreingeniería para el alcance.

## Decision: ficha — no bloquear en la galería

**Rationale:** Versión/talla ya son estado local. `ProductGallery` usa un índice propio y `next/image`; no debe resetear ni esperar `onLoad` para actualizar precio. Si la foto cambia, se deja la anterior o el hueco `aspect-[3/4]` hasta la nueva.

**Alternatives considered:** recargar la ficha al cambiar versión. Se descarta: es el síntoma que hay que evitar.

## Incógnitas resueltas

- No hay modelo Prisma nuevo.
- Coordinación con `004`: primer pintado y `cache()` por request no se reabren; esta feature cubre pending de interacción e invalidación al publicar.
