# Modelo de datos BACK-01

## Entidades existentes

### Order

`id`, `code` (único), `status`, `createdAt`, `updatedAt`, relaciones a `items`,
`history` y `couponUsages`. La única transición de expiración es
`PENDING_PAYMENT → CANCELLED`.

### InventoryMovement

`variantId`, `type`, `quantity`, `reference`, `orderReference`, `reason`,
`createdAt`. Las reservas se crean con cantidad negativa; la expiración agrega
una fila positiva `CANCELLATION` por variante, sin editar ni borrar el pasado.

### CouponUsage

`orderId`, `state`, `reservedAt`, `expiresAt`, `releasedAt`, `releaseReason`,
`confirmedAt`. Solo `RESERVED` puede pasar a `RELEASED` por expiración.

### OrderStatusHistory

`orderId`, `fromStatus`, `toStatus`, `note`, `createdBy`, `createdAt`. La
cancelación registra estado anterior, nuevo estado, fecha y motivo.

### ProductVariant

`id` identifica la variante; la disponibilidad se deriva de la suma del ledger,
no de una columna de stock.

## Tipos lógicos del servicio

```text
ExpiredReservationCandidate {
  orderCode: string
  reservationIds: string[]
  earliestExpiredAt: Date
}

ExpirationOrderResult {
  orderCode: string
  outcome: "expired" | "skipped" | "resolved" | "failed"
  releasedVariants: number
  releasedUnits: number
  couponReleased: boolean
  error?: string
}
```

## Reglas

1. Candidato si existe `RESERVATION` con `createdAt + ttl <= now` y la orden
   sigue `PENDING_PAYMENT`.
2. La transacción vuelve a leer orden y reservas; `PAID`, `PAYMENT_FAILED` o
   `CANCELLED` no reciben escrituras.
3. Se agrupan `-quantity` por variante y se evita cualquier compensación ya
   existente para esa orden.
4. Estado, historial, inventario y cupón se confirman juntos; una excepción
   hace rollback y deja reintento.

No se requieren nuevas tablas en el diseño base.
