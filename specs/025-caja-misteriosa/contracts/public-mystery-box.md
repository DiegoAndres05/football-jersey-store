# Contract: Caja misteriosa pública

Superficie de la tienda. No hay endpoint nuevo.

## Sección

- Ruta canónica: `/caja-misteriosa`.
- Muestra el nombre Caja misteriosa y explica que incluye una camiseta y que el cliente no elige equipo ni diseño.
- Ofrece solo tres niveles, con esta copia fija: Básica / Fan, Estándar / Player, Premium / Retro.
- Pide una talla entre las publicadas para el nivel elegido.
- Muestra el precio de esa variante antes de agregar.
- No muestra personalización, jugador, temporada ni el equipo interno.
- Una talla sin stock ni bajo pedido no se puede agregar.
- Si ningún nivel se puede comprar, la sección lo dice y no agrega al carrito.
- La guía de tallas existente sigue enlazada.

## Descubrimiento

- La navegación pública incluye "Caja misteriosa" hacia `/caja-misteriosa` solo cuando el producto está activo y tiene al menos una variante comprable.
- El listado `/productos` y la búsqueda muestran la caja activa y abren `/caja-misteriosa`.
- `/productos/caja-misteriosa` redirige a `/caja-misteriosa`.
- La caja no aparece en páginas de liga ni de equipo.

## Línea de compra

- Agregar exige nivel y talla.
- Carrito, resumen de pago y confirmación muestran Caja misteriosa, el nivel, la calidad, la talla y el precio.
- No muestran un equipo.
- No hay nombre, número ni jugador.
- Checkout y cobro son los actuales. Al confirmar se revalida stock y bajo pedido de esa variante.

## Admin

- No hay pantalla nueva.
- Publicar, ocultar, precio, tallas y stock se hacen con el producto, las variantes y el inventario que ya existen.
- El equipo interno no se ofrece como club de la tienda.

## Fuera de alcance

- Elegir o revelar el equipo antes del pago.
- Descontar automáticamente una camiseta concreta al vender la caja.
- Un cuarto nivel o precios distintos de `salePrice`.
