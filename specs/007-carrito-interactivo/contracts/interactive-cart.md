# Contract: Página de carrito interactivo

UI contract para `/carrito`. No es una API HTTP.

## Superficie

- Ruta pública existente. MUST NOT crear `/demo`, `/ui/interactive-checkout` ni equivalentes.
- Textos en español: carrito, artículos, Ir a pagar, vacíos actuales.
- Controles primarios: `Button` de `src/components/ui/button.tsx` (`variant`, `size`, `icon` actuales). MUST NOT sustituir por el `button` CVA del snippet shadcn de referencia.

## Layout

| Viewport | Comportamiento |
|----------|----------------|
| &lt; `lg` | Una columna. Orden DOM: listado de líneas, **después** resumen (total + pagar). Sin `fixed`/`sticky` del resumen que tape líneas. |
| ≥ `lg` | Dos columnas; resumen `sticky` bajo la cabecera, sin tapar “−” / “+” / papelera. |

## Cantidades

- “−”: `disabled` cuando `quantity <= 1`; `aria-label` de disminuir.
- “+”: `disabled` cuando la línea es `INMEDIATA` y `remainingImmediate === 0`.
- Quitar: control distinto (papelera), `aria-label` con el nombre del producto.
- MUST NOT: `updateQuantity(..., 0)` ni borrar al pulsar “−”.

## Dinero y bolsa

- Todos los importes visibles: `formatMoney` / contexto de moneda de la página.
- MUST NOT: `.toFixed(2)` sobre precios, `$129.99`, NumberFlow sobre floats, ni aritmética flotante de totales.
- Estado: solo `useCartStore`. Pagar: `Link` a `/checkout` con las mismas líneas.

## Movimiento

- Transiciones ≤ ~200–300 ms; con `prefers-reduced-motion` las acciones siguen disponibles.
- Imagen: `next/image` con `imageUrl` de la línea o hueco “Sin imagen”. MUST NOT URLs del demo de zapatos.

## Vacío

El vacío actual (mensaje + Ver catálogo) cuando no hay líneas. MUST NOT un panel Total $0 con Checkout.
