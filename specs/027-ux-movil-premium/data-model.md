# Data Model: Compra móvil premium

No hay tablas ni columnas nuevas. Estos valores se calculan en la pantalla.

## Barra de compra

| Campo | Regla |
|-------|--------|
| Visible | Solo en la ficha y solo si el ancho es menor o igual a 430 px. |
| Precio | Precio de la variante más el recargo de personalización. Sin variante elegida, el precio base visible de la ficha. |
| Talla | El código elegido, o “Elige talla” si no hay selección. |
| Acción | “Agregar al carrito” si hay talla comprable. Si falta talla, no agrega y enfoca el selector. Si no se puede comprar, no agrega. |
| Oculta | Teclado abierto o un diálogo abierto encima de la ficha. |

## Botón flotante del carrito

| Condición | Visible |
|-----------|---------|
| Sin artículos, menú abierto, o ancho de escritorio | No |
| `/carrito`, `/checkout` y lo que cuelgue de checkout, `/pedido` y lo que cuelgue de pedido | No |
| Ficha `/productos/{slug}` con ancho de 430 px o menos | No |
| Resto de la tienda pública, con artículos y menú cerrado | Sí, con margen seguro y sin tapar el contenido |

La cantidad mostrada es la suma de unidades, con `99+` por encima de 99. El área del enlace mide al menos 44×44 px.

## Galería

La lista de imágenes que el producto ya publica. El índice activo empieza en la primera. Con menos de dos imágenes no hay indicador, miniaturas ni ampliación. Con dos o más, hay deslizamiento, texto de posición y una vista grande al tocar. Por debajo de 390 px no hay miniaturas.

## Resumen cerrado del checkout

En anchos de hasta 430 px el resumen empieza cerrado, junto al botón de continuar. Al abrirse muestra las mismas líneas que el desglose del pedido: artículos, subtotal, personalización si tiene precio, descuento si existe, envío y total. En anchos mayores se mantiene el resumen lateral.

## Filtros activos

`N` es la cantidad de filtros que el catálogo ya considera activos. Con `N = 0` el botón dice “Filtros”. Con `N > 0` dice “Filtros (N)” y el panel muestra “Limpiar todo”.

## Avance de envío gratis

La base es el subtotal que la tienda ya usa para el envío, antes del cargo. El umbral es $200.000. La barra representa `min(base / 200000, 1)`. En el umbral o por encima, el avance está completo y el envío es gratis.

## Foto y nombre

No hay una entidad nueva. La comparación usa el nombre del producto, la temporada y la imagen principal ya guardada, con su texto alternativo. La corrección solo reordena o reescribe esos datos.
