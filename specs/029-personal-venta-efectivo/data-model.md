# Data Model: Personal de tienda y venta en efectivo

## User

Cuenta de personal y de cliente ya existente. Esta feature la usa como autorización.

| Campo | Regla |
| --- | --- |
| email | Único. Se normaliza a minúsculas y sin espacios. |
| name | Obligatorio para un trabajador nuevo. |
| role | `ADMIN` o `SUPER_ADMIN` = administrador. `VENDOR` = vendedor. `CUSTOMER` no entra al panel. |
| isActive | `false` impide entrar y no borra pedidos ni movimientos. |
| authUserId | Identificador de Supabase Auth. Único, nulo solo en cuentas que aún no aceptan la invitación. |
| passwordHash | Deja de ser la credencial del personal nuevo. No se lee ni se muestra. |

### Transiciones

- Invitado: fila `User` activa, `authUserId` nulo, invitación enviada.
- Activo: `authUserId` presente, `isActive` verdadero, rol de personal.
- Desactivado: `isActive` falso. La cuenta de identidad queda bloqueada. El autor histórico de sus ventas no cambia.
- Último administrador: no se puede desactivar ni pasar a `VENDOR` si no queda otro `ADMIN` o `SUPER_ADMIN` activo.

## Order (venta en efectivo)

Se reutiliza `Order`. No hay una entidad de venta paralela.

| Campo | Valor de mostrador |
| --- | --- |
| status | `PAID` desde la creación. |
| paymentMethod | `CASH`. Los valores actuales `CARD`, `PSE`, `NEQUI` y `DAVIPLATA` no cambian. |
| paidAt | Momento de la confirmación. |
| paymentRef | Clave de idempotencia de esa confirmación. Única entre ventas en efectivo. |
| customerName | Nombre escrito por el personal. Obligatorio. |
| customerPhone | Opcional. Vacío si no lo dan. |
| customerEmail | Correo interno no entregable, derivado del código. No es el correo de un cliente. |
| subtotal, personalizationFee, total | Enteros en COP. `total = subtotal + personalizationFee`. |
| shippingFee | `0`. |
| discountAmount y campos de cupón | Vacíos o cero. No se crea `CouponUsage`. |
| shippingMethod | `Retiro en tienda`. |
| shippingFullName | El mismo nombre del comprador. |
| shippingLine1 | `Mostrador`. |
| shippingCity / shippingState | `Retiro en tienda`. |
| saleCurrency | `COP`. Sin tasa en dólares. |
| boldTransaction | No se crea. |
| createdBy de `OrderStatusHistory` | Correo del miembro del personal. |

### Líneas

Cada línea es un `OrderItem` de una variante activa, cantidad mayor que cero, modalidad `INMEDIATA` y personalización opcional. El precio unitario y el recargo se copian al momento de vender.

### Concurrencia

Antes de insertar, la transacción bloquea la variante y calcula el disponible como la suma del ledger. Si la cantidad supera ese disponible, no hay pedido ni movimiento.

## InventoryMovement

Un movimiento por línea:

| Campo | Valor |
| --- | --- |
| type | `SALE` |
| quantity | Cantidad vendida, positiva. |
| orderReference | `Order.code`, sin clave foránea. |
| userReference | Correo del personal. |
| reference | La misma clave de idempotencia. |

No se crea `RESERVATION` para esta venta. El cron de reservas no la toca.

## CashSaleReceipt

Registro mínimo para la idempotencia. Puede ser la unicidad de `Order.paymentRef` cuando `paymentMethod = CASH`, sin tabla nueva, si esa unicidad se puede expresar sin afectar los pagos en línea. Si no, una tabla con `key` única, `orderId` y `createdByEmail`.

Repetir la clave devuelve el pedido existente y no inserta otro movimiento.

## Visibilidad

- Administrador: todos los pedidos.
- Vendedor: pedidos con `paymentMethod = CASH` y el catálogo necesario para buscar una variante.
- Público: un pedido `CASH` se trata como inexistente en `/pedido/confirmado/[code]`. No genera correo al cliente ni aviso de pedido pagado.

## Validación

- Rol asignable al crear: `ADMIN` o `VENDOR`.
- Correo de personal duplicado: rechazo.
- Confirmación sin nombre, con total distinto del efectivo recibido, con cantidad no disponible o con cupón: rechazo y sin escritura.
- Un pedido en línea no puede cambiar su `paymentMethod` a `CASH`.
