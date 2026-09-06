# Data Model: Carrusel de destacadas

Sin migración Prisma. Se reutiliza el producto destacado existente.

## Producto (`ProductCardData`)

Campos leídos por el carrusel:

| Campo | Uso |
|-------|-----|
| `slug` | destino `/productos/{slug}` |
| `name` | título de la diapositiva |
| `team.name` | subtítulo opcional (equipo) |
| `primaryImage.url` / `altText` | foto; sin URL ⇒ no entra al carrusel |
| `minPrice` | **prohibido** en esta UI |

No se añade `carouselOrder` ni entidad Slide.

## Selección de diapositivas

```text
entrada: destacados activos (p. ej. getFeaturedProducts(8))
1. quedarse con primaryImage.url no vacío
2. tomar como máximo 5 (mismo orden que el listado actual, p. ej. createdAt desc)
3. si quedan < 2 → []  (el inicio no monta el bloque)
4. si quedan 2..5 → esas piezas
```

Admin sigue siendo `/admin/productos` (checkbox Destacado + Activo) e `/admin/productos/[slug]/imagenes` (foto principal).

## Estado de UI (solo cliente)

```text
currentIndex: 0 .. n-1
isHovered / isFocused → pausa autoplay
prefers-reduced-motion → sin intervalo
```

No Zustand. No persistencia.

## Relación con el resto del inicio

- Hero: `featured[0]` como hoy (aunque no tenga foto, el hero ya tiene hueco).
- Carrusel: `slidesForFeaturedCarousel(featured)` (independiente del hero).
- “Las más buscadas”: `featured.slice(0, 4)` como hoy, **con** precio.
