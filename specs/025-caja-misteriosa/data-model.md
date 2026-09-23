# Data Model: Caja misteriosa

No hay un catálogo nuevo. Se extiende el producto y la línea de pedido que ya existen.

## Producto

`Product` gana `productKind`, con default `JERSEY`.

| Campo | Regla |
|---|---|
| `productKind` | `JERSEY` o `MYSTERY_BOX`. Solo hay una caja pública: slug `caja-misteriosa`. |
| `name` | Caja misteriosa. |
| `isActive` | Si es falso, sale de la navegación, del listado y de la búsqueda. |
| `customizationsEnabled` | Falso en la caja. |
| `hasPlayerPrint` | Falso en la caja. |
| `teamId`, `seasonId` | Obligatorios. En la caja apuntan a registros internos que ninguna vista pública muestra como club o temporada elegidos. |
| `kitType` | `ESPECIAL`. |

Las camisetas existentes quedan `JERSEY` sin cambio de datos.

## Variante y nivel

Se reutiliza `ProductVariant`: una fila por versión y talla. El mapa fijo es:

| `version.slug` | Nivel que ve el cliente | Calidad prometida |
|---|---|---|
| `fan` | Básica | Fan |
| `player` | Estándar | Player |
| `retro` | Premium | Retro |

| Campo | Regla |
|---|---|
| `salePrice` | Precio entero en pesos de ese nivel y talla. Es el precio que se cobra. |
| Stock | Suma del ledger de esa variante. |
| `allowsBackorder` | Si no hay stock, permite bajo pedido. Si tampoco, la talla no se vende. |

No se crean versiones nuevas. Una talla que no tenga variante para un nivel no se ofrece en ese nivel.

## Línea de carrito

Campos que la caja añade al ítem ya persistido en `fjs-cart`:

| Campo | Regla |
|---|---|
| `lineKind` | `MYSTERY_BOX`. Las líneas viejas sin el campo se leen como camiseta. |
| `productName` | Caja misteriosa. |
| `versionName` | Fan, Player o Retro. |
| `sizeName` | Talla elegida. |
| `unitPrice` | `salePrice` de la variante, en pesos enteros. |
| `customizationType` | `NONE`. |
| `teamName` | No se muestra. |

Identidad de línea: la misma variante y la misma modalidad de entrega se fusionan. Otro nivel u otra talla es otra variante y otra línea.

## Pedido

`OrderItem` gana `lineKind`, default `JERSEY`.

En una caja, el snapshot guarda producto, nivel implícito en el mapa, `versionName` como calidad, talla, precio entero, cantidad y modalidad de entrega. La confirmación no muestra un equipo. `customizationType` queda `NONE` y el recargo de personalización queda en 0.

Transiciones:

1. Producto inactivo o sin variantes comprables: no hay enlace, ni tarjeta, ni resultado de búsqueda.
2. Variante con stock: se puede agregar como entrega inmediata.
3. Variante sin stock y con bajo pedido: se puede agregar como bajo pedido.
4. Variante sin stock y sin bajo pedido: esa talla de ese nivel no se agrega.
5. Al confirmar, se revalida la variante. Si ya no está disponible, no se cobra esa línea.
6. La venta descuenta solo la variante de la caja.

## Migración

Aditiva: `productKind` y `lineKind` con default `JERSEY`. No se reescriben pedidos ni camisetas ya guardadas. El equipo y la temporada internos se crean al sembrar la caja, no como club visible.
