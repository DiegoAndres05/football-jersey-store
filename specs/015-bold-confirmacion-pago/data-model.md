# Data Model: Confirmación Bold refleja pago aprobado

## Entities (existing — no Prisma migration required)

### Order

| Field | Role for this feature |
|-------|------------------------|
| `id` | UUID interno; notificación Telegram |
| `code` | Referencia pública = Bold `order-id` / `reference_id` |
| `status` | Ciclo de pago: ver transiciones |
| `paidAt` | Se setea al pasar a `PAID` |

Estados relevantes:

- `PENDING_PAYMENT` — pedido creado, cobro no confirmado
- `PAID` — cobro confirmado (API Bold o webhook)
- `PAYMENT_FAILED` — cobro rechazado/fallido confirmado

Otros estados (`VALIDATING`, `SHIPPED`, …) no los introduce esta feature; la reconciliación **no** debe degradarlos.

### OrderStatusHistory

| Field | Uso |
|-------|-----|
| `fromStatus` / `toStatus` | Auditoría de transición |
| `createdBy` | `bold-webhook:…` o `bold-reconcile:api` (o similar) |
| `note` | Texto corto del origen del evento |

### NotificationAttempt

| Field | Uso |
|-------|-----|
| `idempotencyKey` | `{orderId}:TELEGRAM:ORDER_CREATED_PAID` |
| `status` | Impide doble envío cuando webhook y reconcile compiten |

Sin cambios de esquema: el flujo idempotente ya existe.

## Derived / non-persisted

### BoldReturnParams (URL)

- `bold-tx-status` — hint (`approved`, `rejected`, …); **no** autoridad
- `bold-order-id` — id Bold opcional para lookup secundario

### BoldPaymentOutcome (dominio)

Normalización tras API:

| Outcome | Significado | Acción en Order |
|---------|-------------|-----------------|
| `APPROVED` | Bold confirma venta | `PENDING_PAYMENT` → `PAID` |
| `REJECTED` | Rechazo/fallo definitivo | `PENDING_PAYMENT` → `PAYMENT_FAILED` |
| `PENDING` | Sin resultado final / no encontrado aún | No cambiar status |
| `UNAVAILABLE` | Error de red/API | No cambiar status |

### ConfirmationUiMode (vista)

| Mode | Condición | Copy |
|------|-----------|------|
| `paid` | `status === PAID` | Pago confirmado |
| `failed` | `status === PAYMENT_FAILED` | Pago rechazado + CTA `/productos` |
| `confirming` | `PENDING_PAYMENT` + retorno Bold reciente / reconcile en curso | Confirmando pago… |
| `pending` | `PENDING_PAYMENT` sin señal Bold | Pendiente de pago (caso legítimo) |

## State transitions

```text
PENDING_PAYMENT ──(Bold APPROVED, API o webhook)──► PAID
       │                                              │
       │                                              └── notifyOrderPaid (idempotente)
       │
       └──(Bold REJECTED|FAILED, API o webhook)──► PAYMENT_FAILED

PAID / PAYMENT_FAILED / otros ──(mismo evento de nuevo)──► no-op (idempotente)
```

Reglas:

1. Solo transicionar desde `PENDING_PAYMENT`.
2. Nunca marcar `PAID` solo por query.
3. Timeout / `UNAVAILABLE` / `PENDING` de API ≠ `PAYMENT_FAILED`.
4. Historial + `createdBy` en cada transición real.

## Validation rules

- Código de pedido inexistente → 404; no inventar pago.
- Params Bold ausentes + `PENDING_PAYMENT` → no forzar reconcile API (evitar ruido); UI pendiente.
- Params presentes + `PENDING_PAYMENT` → reconcile al menos una vez en servidor.
