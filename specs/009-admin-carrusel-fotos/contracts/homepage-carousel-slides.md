# Contract: Fuente de slides del coverflow en el inicio

Extiende el contrato visual de 008 (`specs/008-carrusel-camisetas-inicio/contracts/home-coverflow.md`). Cambia **solo** de dónde salen las fotos y el mínimo.

## Fuente

- MUST usar la lista persistida `homepage_carousel_image_ids`, resuelta a fotos usables.
- MUST NOT usar `getFeaturedProducts` / `isFeatured` / foto principal / `slidesForFeaturedCarousel` como fuente del coverflow.
- Orden MUST ser el de la lista guardada (omisiones no reordenan el resto).
- Cada slide MUST mostrar la URL de **esa** `ProductImage`, aunque no sea `isPrimary`.
- Dos slides MAY compartir `productId`; MUST tener `imageId` distintos.

## Visibilidad del bloque

| Slides usables | Inicio |
|----------------|--------|
| 0 | MUST NOT montar el carrusel |
| 1 | MUST mostrar el bloque (sin exigir 2). Flechas/autoplay MAY ocultarse. |
| 2–5 | Coverflow 008 (español, sin precio, CTA “Ver camiseta”) |

Home hoy tiene `coverflowSlides.length >= 2` y el cliente `if (total < 2) return null`. Ambos MUST alinearse a **≥ 1**.

## Colocación e interacción (sin cambio)

- Después de la barra de confianza, antes de “Las grandes ligas”.
- Hero y “Las más buscadas” intactos.
- Sin precio, sin demo de restaurante, `next/image`, CTA a `/productos/{slug}`.

## Keys

Lista React MUST usar `imageId`, no `product.id`.
