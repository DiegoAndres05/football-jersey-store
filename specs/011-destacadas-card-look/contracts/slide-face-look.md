# Contract: Cara visual de Destacadas (SlideFace)

UI contract para la cara de cada slide en `/` (bloque Destacadas). No es API HTTP. Complementa [home-coverflow](../../008-carrusel-camisetas-inicio/contracts/home-coverflow.md) y 010; **no** los reemplaza.

## Superficie

- MUST aplicarse a cada `SlideFace` visible (activa y peeks en `lg+`; la única card bajo `lg`).
- MUST NOT crear `src/components/ui/card-7.tsx`, `demo.tsx`, ni página playground.
- MUST NOT cambiar hero, ligas, “Las más buscadas”, admin ni fuente de fotos.

## Datos

- Props de slide: `HomepageCarouselSlide` (`url`, `name`, `team`, `slug`, `altText`, `imageId`).
- MUST renderizar `item.url` con el componente de imagen de Next ya usado en el carrusel.
- MUST NOT `price`, `formatMoney`, `minPrice`, `logoUrl`, URLs `cdn.21st.dev`, copy Nike/sneaker.

## Layout de la cara

| Zona | MUST |
|------|------|
| Arriba | Cabecera cristal: `name`; si hay `team`, nombre de equipo y liga si aplica |
| Centro | Prenda más visible (velo más débil) |
| Abajo | CTA “Ver camiseta” → `/productos/{slug}` |
| Fuera de la card | Indicadores 44×44, flechas, Pausar/Reanudar (010) |

- MUST NOT dots de paginación **dentro** de la card.
- MUST NOT envolver toda la card en `Link` (CTA es el enlace a ficha).
- Nombre: no desbordar; `line-clamp` permitido si sigue legible.

## Overlay

- MUST oscurecer **arriba y abajo**.
- MUST NOT velo uniforme a opacidad constante en toda la foto.

## Tilt

| Condición | MUST |
|-----------|------|
| Activa + viewport ≥ `lg` (~1024) + no reduced-motion | Inclinación suave al cursor; volver a plano al salir |
| Peek, &lt; `lg`, o reduced-motion | MUST NOT inclinar |
| Agrandamiento | MUST NOT (`scale` de tilt = 1) |

- `transform-style: preserve-3d` MUST ser estilo inline si se usa 3D en hijos; MUST NOT depender de una clase Tailwind inexistente `transform-style-3d`.
- Si hay `group-hover`, el padre MUST tener `group`.

## Interacción heredada (010, no reabrir)

- Autoplay ~5 s, hover pause, Pausar/Reanudar, swipe, flechas, dots.
- Sincronía: foto + nombre + equipo + CTA = misma diapositiva.
- Peek no activo: clic acerca esa slide (coverflow); el CTA del peek abre **esa** ficha.
