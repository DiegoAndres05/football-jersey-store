# Contracts: catálogo pendiente y navegación de secciones

## 1. Controles de listado (`ProductFilters` + paginación + búsqueda)

**Entrada:** clic en chip, cambio de orden, Enter/enviar en búsqueda, clic en página.

**Comportamiento:**

1. El control refleja la selección de inmediato (`aria-pressed` / valor del select / página activa prevista).
2. Los demás controles permanecen habilitados.
3. Se navega a la misma ruta `/productos` con la query actualizada (`page=1` al cambiar filtro, como hoy).
4. Mientras la transición no termina y **ya había un grid**: el grid anterior sigue montado, `aria-busy="true"`, región viva “Actualizando catálogo”.
5. Al terminar: `aria-busy="false"`, se anuncia el fin, se muestra el resultado de `getProducts` para esa URL (incl. vacío).
6. Si llega un resultado de una URL que ya no es la vigente, se ignora.

**Prohibido:** `disabled` global por pending; sustituir el grid existente por `CatalogSkeleton` o por `productos/loading.tsx`.

**Búsqueda:** sin debounce en vivo; solo al confirmar (Enter/enviar).

## 2. Resultados de catálogo (servidor)

**Query:** `getProducts(filters)` — mismos filtros y mismo conjunto/orden/paginación que hoy.

**Facets:** ligas, temporadas, versiones, tallas independientes del listado; equipos solo si hay `liga`. No se vuelven a bloquear el grid.

Contrato de frescura: el payload que se **compromete** como vigente es el catálogo público actual (cache invalidada tras publicación admin).

## 3. Navegación de secciones

**Entrada:** `Link` de `NAV_ITEMS` y enlaces internos de tienda.

**Comportamiento:**

- Prefetch permitido de esas rutas, no de todo el inventario.
- Cabecera y pie (`AppLayout`) no se desmontan.
- Un `loading` de segmento, si existe, solo sustituye `<main>` en **cambio de ruta** o **primera** llegada, nunca un grid de catálogo ya visible por cambio de query.
- Al completar, el HTML/RSC es el de las reglas públicas vigentes.

**Atrás/adelante:** misma query y mismo significado que hoy.

## 4. Ficha (versión / talla)

**Entrada:** clic en versión o talla en `ProductVariantSelector`.

**Comportamiento:** estado local; precio, disponibilidad y CTA se derivan de la variante en memoria en el mismo tick. No `router.refresh` ni fetch por clic. Galería: no espera `onLoad`; conserva foto anterior o hueco `aspect-[3/4]`.

**Inalterado:** personalización, modalidad, cantidades, carrito hasta “Agregar”.

## 5. Invalidación admin → tienda

Tras una persistencia que cambie visibilidad o datos de listado público, invalidar la etiqueta `catalog` (o equivalente). No se exige invalidar en cada tecleo; sí en guardar/activar/desactivar producto que afecta el catálogo público.
