# Quickstart: 007 carrito interactivo

Validar el patrón de panel vivo **en el carrito real**, no un playground.

## Prerrequisitos

- App local, al menos dos líneas en el carrito (variantes distintas o personalización distinta).
- Una línea con stock inmediato 1 para comprobar “+” deshabilitado.
- Tasa USD opcional para ver el total formateado.

## US1

1. Abrir `/carrito`: líneas reales (camiseta, talla, modalidad), resumen con recuento y total.
2. Subir/bajar cantidad: total y recuento cambian al instante; en cantidad 1, “−” no quita la línea.
3. Papelera: la línea sale; si era la última, vacío hacia el catálogo.
4. “Ir a pagar” → `/checkout` con las mismas líneas.
5. No hay Air Max, Ultra Boost ni `$129.99`.

```bash
npx tsx --test tests/cart-interactive-ui.test.ts
```

## US2

1. Ancho ~375 px: primero líneas, al bajar el resumen; no hay barra de pago fija.
2. Ancho ~1280 px: al hacer scroll del listado el resumen sigue visible.

## US3

1. Desde una ficha, Agregar al carrito (o aviso de tope).
2. Cabecera y `/carrito` muestran esa bolsa; no un listado de muestra.

## Gates

```bash
npx tsc --noEmit
npm test
npm run build
```

`npm run lint` puede fallar por `next lint` en Next 16 (conocido).
