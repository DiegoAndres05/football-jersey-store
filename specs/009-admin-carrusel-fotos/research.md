# Research: Elegir fotos del carrusel desde el admin

## Decision: persistir IDs de foto en `Setting`, sin tabla nueva

**Rationale:** Ya existe `Setting { key, value }` (USD). La selección del carrusel es configuración de portada (lista ordenada de hasta 5 IDs de `ProductImage`), no un atributo del producto ni Destacado. Un JSON `["img1","img2"]` guarda orden, permite dos fotos del mismo producto y no pide migración. Al resolver, se omiten IDs huérfanos u ocultos (FR-004).

**Alternatives considered:**
- Tabla `HomepageCarouselSlide` con FK: más integridad, más migración y CRUD. Rechazada para este MVP (principio V).
- Flags `isCarousel` + `order` en `ProductImage`: orden global incómodo y mezcla merchandising con el archivo de fotos. Rechazada.
- Seguir usando `isFeatured` + primaria: es el complique que 009 elimina.

**Key:** `homepage_carousel_image_ids`. Valor: JSON de string IDs, 0–5, únicos, orden = orden de clic.

## Decision: Products posee reglas y persistencia; Catalog solo hospeda el bloque

**Rationale:** El carrusel es merchandising de inicio (008 ya vive en `src/features/products`). El spec coloca el picker **arriba de Productos**, no un ítem de menú. Constitution I: dominio en Products; la página admin de catálogo **compone** el bloque.

**Alternatives considered:** meter save + dominio en `catalog-actions.ts` (archivo ya grande); menú “Carrusel”. Rechazadas por FR-001 y por no duplicar bounded contexts.

## Decision: selector puro + toggle puro (testeable)

**Rationale:** FR-005/011 y SC-003 son reglas de negocio. Van fuera del JSX.

- `toggleCarouselImageId(ids, imageId)` → quita si ya está; si no, añade al final; si ya hay 5 y el id es nuevo → `{ ok: false, reason: "max", ids }` sin mutar.
- `slidesForHomepageCarousel(orderedIds, photos)` → respeta orden; omite sin URL, producto no visible o ID inexistente; 0 → `[]` (home no monta); **1 o más se muestran** (deja de aplicar el mínimo 2 de 008).

**Alternatives considered:** tope solo en el cliente; recortar al guardar. Rechazadas (FR-011: el sexto clic no entra; el servidor MUST validar igual).

## Decision: el coverflow usa la foto elegida, no `primaryImage`

**Rationale:** FR-002/010. `FeaturedCoverflowCarousel` hoy lee `ProductCardData.primaryImage` y hace `return null` si hay &lt; 2 ítems, y usa `item.id` como key (rompe dos fotos del mismo producto).

Hay que: DTO de slide con `imageId` + `url` de esa foto; key = `imageId`; renderizar con 1 slide; flechas/puntos/autoplay solo si ≥ 2 (la UI de 008 ya pausa autoplay con &lt; 2).

**Alternatives considered:** inyectar la URL en `primaryImage` y reusar el tipo. Frágil (colisión de `id`, min 2). Rechazada.

## Decision: home deja de usar `getFeaturedProducts` para el coverflow

**Rationale:** FR-003/007. Destacado sigue alimentando hero y “Las más buscadas”. Nueva lectura: IDs en Setting → imágenes + producto activo → slides.

**Alternatives considered:** unión featured ∪ selección. Rechazada.

## Decision: acción admin `AdminSaveResult`, sin throw

**Rationale:** Constitution III/IV. El delete de producto ya enseñó que `throw` en server action da 500. Mismo patrón que visibilidad: `requireAdmin`, zod (array ≤ 5, únicos, IDs existentes y de producto visible), `revalidatePath("/")` y `revalidatePath("/admin/productos")`. Visitante no autenticado → error, no persistir (SC-004).

## Decision: toast al máximo y al guardar; sin upload en el bloque

**Rationale:** FR-011 y US1. El cliente usa el mismo `toggleCarouselImageId`. El servidor vuelve a validar. Sin recorte, filtros ni Storage nuevo: URLs ya de catálogo (constitution: media existente).

## Decision: implementación vía OpenCode

**Rationale:** Tras `/speckit.tasks`, Cursor escribe `.ai/tasks/`. No implementar 009 en Cursor salvo que se pida. No pegar demos de restaurante.
