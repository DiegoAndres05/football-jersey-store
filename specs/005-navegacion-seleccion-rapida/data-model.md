# Data Model: estado de listado y selección (sin migración)

Esta feature no añade tablas. El catálogo, filtros y variantes siguen en Prisma como hoy.

## CatalogSelection

Proyección de la URL de `/productos` (ya parseada por `parseProductFiltersParams`):

| Campo | Origen | Notas |
|-------|--------|--------|
| liga, equipo, temporada, version, talla, disponibilidad, q, sort, page | query | Misma semántica actual; page vuelve a 1 al cambiar filtro (hoy) |

Validación: el esquema existente; valores inválidos se ignoran como ahora.

## ListadoVisible

Estado de presentación, no persistido:

| Estado | Cuándo | Qué se muestra |
|--------|--------|----------------|
| `primera_carga` | No hay grid previo | Primer pintado existente (`loading` de ruta / skeleton de primera visita) |
| `pendiente` | Había grid y cambió la selección | Grid **anterior** + aviso “Actualizando…” + `aria-busy=true` |
| `vigente` | Llegó el RSC de la URL actual | Grid/vacío/error de `getProducts` para esa selección |
| `vacio_vigente` | Resultado vacío de la URL actual | EmptyState actual; no el grid anterior |

Transición: cualquier `pendiente` cuya URL ya no es la última se descarta (no se pinta como `vigente`).

## SeccionPublica

Destinos de `NAV_ITEMS`: `/`, `/productos`, `/ligas`, `/sobre-nosotros`, `/contacto`, más fichas `/productos/[slug]`.

No hay entidad nueva; la “revisita” es cache de lectura + layout persistente.

## SeleccionFicha

Estado de cliente ya existente: `selectedVersion`, `selectedSize` en `ProductDetailClient`. Precio y disponibilidad se derivan del mapa de variantes en memoria. La galería no es fuente de verdad de la variante.

## Invalidación

Etiqueta lógica `catalog`: al persistir cambios públicos de producto (activar/desactivar, visibilidad de listado) se invalida para que la **siguiente** navegación o filtro terminada vea datos vigentes.
