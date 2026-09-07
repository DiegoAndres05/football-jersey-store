# Quickstart: Destacadas sin cristal

## Prerrequisitos

- `npm run dev`
- ≥1 foto en carrusel admin (009); ≥2 para peeks

## Checks

```bash
npx tsx --test tests/featured-coverflow-ui.test.ts
npx tsc --noEmit
```

## Pasada visual

1. Foto activa limpia: sin caja cristal ni título encima.
2. CTA “Ver camiseta” solo en la activa; peeks = solo foto.
3. Nombre/equipo bajo la activa; cambian al avanzar.
4. ~390 px: una card + pie debajo; sin tilt.
5. Desktop: tilt en activa; Pausar/dots/flechas OK.
6. Hero sin cambios.

## Fallos típicos

- `backdrop-blur` o caja blanca encima → fuera de spec.
- CTA en peeks → fuera de spec.
- Nombre encima de la foto → fuera de spec.
