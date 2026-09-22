# Quickstart: Navbar fijo y carrito flotante móvil

Validación de [spec.md](./spec.md) contra [contracts/public-navbar-cart.md](./contracts/public-navbar-cart.md). Sin código de implementación aquí.

## Prerrequisitos

- Dependencias instaladas (`npm install`).
- Tienda local en marcha (`npm run dev`).

## Automático

```bash
node --import tsx --test tests/navbar-desktop-ui.test.ts tests/mobile-cart-fab.test.ts
```

Resultado esperado:

- El header público usa anclaje fijo al viewport y un espaciador de la altura de la fila.
- El layout admin no monta ese header.
- `shouldShowMobileCartFab` cumple la tabla de [data-model.md](./data-model.md): unidades, ruta, ancho compacto y menú abierto.

## Manual

1. Portada en ancho ≥ 1024px. Desplazar más de una pantalla. La barra sigue arriba y se puede usar la búsqueda y el carrito. No hay botón flotante aunque el carrito tenga artículos.
2. Misma portada a 375px. Desplazar. La barra sigue arriba. Con el carrito vacío no hay botón flotante.
3. En una ficha, añadir una unidad. En teléfono aparece el botón con la cantidad, sin volver arriba. Activarlo abre `/carrito`. En esa pantalla el botón no está.
4. Volver al listado: el botón reaparece. Quitar todas las unidades: desaparece.
5. Abrir el menú móvil: el botón no queda por encima ni se puede pulsar a través del menú. Cerrar el menú: vuelve si hay unidades.
6. Entrar a `/checkout` con artículos: el botón no está. El admin no muestra esta barra ni el botón.

Anotar si un toast de la esquina inferior derecha tapa el botón un momento. Es el comportamiento previsto: el toast está en una capa superior.
