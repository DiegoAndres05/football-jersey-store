# Data Model: Selección de fotos del carrusel

Sin modelo Prisma nuevo. Se reutiliza `Setting` y `ProductImage`.

## Setting (selección persistida)

| Campo | Uso |
|-------|-----|
| `key` | `homepage_carousel_image_ids` |
| `value` | JSON array de IDs de `ProductImage`, 0–5, únicos, orden = orden de selección |

Vacío o key ausente ≡ ninguna foto elegida.

## Foto de catálogo (elegible en admin)

Fila de `ProductImage` + su `Product`:

| Campo | Uso |
|-------|-----|
| `id` | identidad de la diapositiva y de la marca en el picker |
| `url` | foto mostrada (admin e inicio); sin URL usable → no es elegible / se omite |
| `altText` | accesible |
| `productId` / `product.slug` / `product.name` | ficha destino y título |
| `product.isActive` | visible en tienda: entra al picker; si luego se oculta, se omite en el inicio |
| `product.team.name` | overlay (como 008) |

MUST NOT filtrar por `isPrimary` ni `isFeatured`.

## Diapositiva de inicio (`HomepageCarouselSlide`)

DTO de lectura, no tabla:

| Campo | Uso |
|-------|-----|
| `imageId` | key React; no `product.id` (el mismo producto puede repetirse) |
| `url` / `altText` | la foto **elegida**, no necesariamente la principal |
| `slug` / `name` / `team` | overlay y CTA `/productos/{slug}` |

Sin `minPrice`.

## Resolución inicio

```text
1. Leer orderedIds desde Setting (JSON; si inválido o ausente → [])
2. Cargar fotos por id + producto
3. Recorrer orderedIds:
   - omitir si no existe, sin url, o producto no visible
   - conservar el orden guardado
4. Si 0 usables → no montar carrusel
5. Si 1..5 usables → mostrar esas (mínimo 1, no 2)
```

## Toggle (estado de UI + misma regla al guardar)

```text
entrada: ids actuales (0–5), imageId clicado
si imageId ∈ ids → quitar (orden de los que quedan)
si no ∈ ids y len < 5 → añadir al final
si no ∈ ids y len = 5 → no cambiar; reason = "max"
```

El servidor persiste **exactamente** el array validado (0–5), no recorta en silencio.

## Relación con el resto

- Hero y “Las más buscadas”: siguen `getFeaturedProducts` / Destacado. No se tocan.
- Ocultar producto o borrar imagen: no borra Setting; la resolución omite esa diapositiva.
- Guardar de nuevo sin esa foto (ya no está en el picker) la saca de la lista persistida.
