# Modelo de datos — Panel de administración

El remodel no introduce entidades persistidas. Los siguientes modelos existentes
son las fuentes de verdad y sus proyecciones para la UI.

## Entidades

| Entidad | Campos usados | Relaciones/validación |
|---|---|---|
| Sesión administrativa | `User.id`, `email`, `role`, `isActive` | `getSessionUser()` debe autorizar antes de leer/mutar |
| Order | `id`, `code`, `status`, cliente, importes COP, fechas, tracking | `createdAt` para ventana de 30 días; `total` entero |
| OrderItem | snapshots de producto/equipo/versión/talla, `quantity`, `subtotal`, `deliveryMode`, personalización | No unir con catálogo para reconstruir históricos |
| NotificationAttempt | `channel`, `eventKey`, `status`, `attemptCount`, `errorSummary` | Mostrar solo si Telegram está configurado; reintento por clave idempotente |
| Product | `slug`, `name`, `isActive`, relaciones | Ocultar si referencias impiden borrado |
| ProductVariant | SKU, `versionId`, `sizeId`, `lowStockAt`, `allowsBackorder`, precios | Estado de disponibilidad derivado, precios enteros |
| InventoryMovement | `variantId`, `type`, `quantity`, dirección de ajuste, referencia, fecha | Inmutable; stock = suma firmada de movimientos |
| Indicador operativo | proyección en memoria | No persistir; incluye alcance temporal y enlace fuente |

## Proyecciones

### Stock

`stock(variant) = Σ signed(quantity)` según tipo de movimiento. Un valor `<= 0`
se etiqueta “Agotada”; un valor positivo `<= lowStockAt`, “Stock bajo”; el resto,
“Disponible”. `allowsBackorder` se muestra como modalidad vendible adicional y
no modifica el ledger.

### Dashboard

- `ordersLast30Days`: pedidos con `createdAt` dentro de ventana.
- `paidRevenueLast30Days`: suma de `total` de estados pagados definidos por el
  dominio, nunca de importes recalculados en UI.
- `lowStockVariants`: variantes cuyo stock derivado está en/por debajo del
  umbral, incluyendo cero/negativo con explicación.
- `activeProducts`: conteo de `Product.isActive`.

### Estado de detalle de pedido

`loaded` contiene pedido y snapshots; `not-found`, `incomplete` y `read-error`
son estados seguros con recuperación. El detalle no debe asumir que
`customerId`, cupón, notificación o `deliveryMode` existen.

## Reglas de integridad

1. No editar ni borrar movimientos, snapshots, historial de estados o intentos de
   notificación desde el remodel.
2. Todo filtro/acción de servidor valida entrada y sesión.
3. Los importes se presentan como COP enteros; `discountAmount` y cupón se leen
   de snapshots.
4. Un error no puede dejar mutación parcial; las acciones deben ser idempotentes
   cuando reintentar sea posible.
