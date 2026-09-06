# Contract: Carrusel coverflow en el inicio

UI contract para `/` (home). No es una API HTTP.

## Superficie

- MUST vivir en la home pública, **después** de la barra de confianza y **antes** de “Las grandes ligas”.
- MUST NOT crear `/demo`, `/ui/3-d-coverflow-carousel` ni copiar `defaultDishes`.
- MUST NOT reemplazar el hero ni “Las más buscadas”.

## Datos

- Props de slides: productos reales (`slug`, `name`, `primaryImage`). MUST NOT platos, “View Menu”, `$129.99`, Butter Chicken, Paneer Tikka, URLs `cdn.21st.dev`.
- MUST NOT renderizar `minPrice` / `formatMoney` en este bloque.
- Si el selector devuelve `[]`, el bloque MUST NOT existir en el DOM.

## Interacción

- Flechas: `aria-label` en español (Anterior / Siguiente), iconos lucide.
- Puntos: ir a la diapositiva *n*.
- CTA frente: “Ver camiseta” → `/productos/{slug}` (mismo origen, no `#`).
- Lateral no centrado: al pulsar, esa pieza pasa al frente (no navega todavía).
- Autoplay ~5 s si hay ≥ 2 slides; pausa en hover/focus; off si `prefers-reduced-motion`.
- Teclado flechas: solo con el sección enfocado.

## Layout

| Viewport | Comportamiento |
|----------|----------------|
| ≥ `lg` | Coverflow: pieza central + vecinas con profundidad. No tapa de forma permanente “Comprar ahora” (el hero está **arriba**). |
| &lt; `lg` | Frente claro; no exigir 5 tarjetas laterales. Swipe. Altura contenida (no forzar 760 px). |

## Visual

- Escenario propio (fondo oscuro / blur de la foto actual) **solo** en esta sección.
- CTA: `Button` de `src/components/ui/button.tsx` (o `asChild` + `Link`). MUST NOT el botón CVA del snippet de restaurante.
- Copy: “Destacadas” (o equivalente español), no “BEST SELLERS”.
