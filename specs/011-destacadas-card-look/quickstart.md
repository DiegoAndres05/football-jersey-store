# Quickstart: Look de la tarjeta Destacadas

Validación de la cara Destacadas (011). No implementa código.

## Prerrequisitos

- Dev server (`npm run dev`).
- Al menos **2** fotos en el carrusel (admin Productos, 009) para peeks y autoplay; **1** basta para el look de una card.
- Contratos: [slide-face-look.md](contracts/slide-face-look.md), [data-model.md](data-model.md).

## Checks automáticos

```bash
npx tsx --test tests/featured-coverflow-ui.test.ts
npx tsc --noEmit
```

Esperado: suite del carrusel en verde (incluye asserts nuevos de cristal, overlay dual, sin precio/dots internos, tilt gated, sin scale de tilt).

## Pasada visual

1. `/` escritorio (≥ 1024 px): Destacadas — cristal **arriba**, prenda al **centro**, “Ver camiseta” **abajo**. Sin precio. Dots **fuera** de la card.
2. Cursor sobre la **activa**: inclinación leve, **no** crece; al salir, plana.
3. Cursor sobre un **peek**: no se inclina; sí se ve cristal + CTA de **esa** camiseta.
4. CTA activa → ficha de esa camiseta. Foto sola no es el requisito de navegación.
5. ~390 px: una card completa, **sin** inclinación; swipe y dots 010 siguen.
6. OS “reducir movimiento”: 0 inclinación; Pausar/autoplay según 010 (sin autoplay molesto).
7. Hero y resto de la home sin cambios. Fotos = selección admin, no stock Unsplash/Nike.

## Fallos típicos

- Overlay solo inferior → nombre ilegible.
- `scale` en el tilt → recorte / peeks tapados.
- Dots dentro de `SlideFace` → conflicto con 010.
- `card-7` + precio `$149` → fuera de spec.
