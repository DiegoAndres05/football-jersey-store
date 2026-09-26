# Quickstart: Compra móvil premium

Validación de [spec.md](./spec.md) contra [contracts/public-mobile-purchase.md](./contracts/public-mobile-purchase.md). Sin código de implementación aquí.

## Prerrequisitos

- Dependencias instaladas (`npm install`).
- Tienda local en marcha (`npm run dev`).
- Un producto con varias fotos y varias tallas, otro con una sola foto, y al menos un artículo agregado al carrito.

## Automático

```bash
node --import tsx --test tests/mobile-purchase-ux.test.ts
```

Resultado esperado:

- La barra de compra se muestra a 390 px y no se exige a 768 px.
- El botón flotante no aparece en `/carrito`, `/checkout`, `/pedido` ni en una ficha cuando el ancho es de 430 px o menos.
- El nombre de la línea de carrito admite dos líneas.
- El control de talla declara un área de al menos 44 px.
- El checkout a 390 px no depende de un ancho fijo que fuerce scroll horizontal.

## Manual

1. A 390×844, abrir una ficha. La barra inferior muestra precio y “Elige talla”. Pulsar agregar sin talla no cambia el carrito y enfoca las tallas. Elegir una talla y agregar desde la barra.
2. Con artículos en el carrito, abrir la ficha, contacto, carrito, checkout y un pedido. El botón flotante no tapa “Agregar al carrito” ni el correo. En el catálogo sí aparece y se puede pulsar.
3. Deslizar una ficha con varias fotos y abrir la ampliación. En una ficha de una sola foto no hay puntos vacíos ni miniaturas.
4. Leer una tarjeta del catálogo y una línea del carrito. El nombre se entiende en dos líneas.
5. A 320, 390 y 430 px, recorrer el checkout. No hay scroll horizontal. Salir de un campo inválido muestra el error junto a él. El resumen junto al botón abre artículos, subtotal, envío y total.
6. Activar un filtro de liga. El botón dice “Filtros (N)”. “Limpiar todo”, dentro del panel, vuelve a la grilla completa.
7. Abrir el menú y el inicio a 390 px. Las utilidades quedan cerca de los destinos y el primer producto asoma. En el carrito, la barra de envío gratis avanza al cambiar la cantidad.
