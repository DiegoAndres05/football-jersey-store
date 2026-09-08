# Data Model: Retorno Bold aprobado sin esperar webhook

## Entities (existing — no Prisma migration)

Reusa el modelo de [015 data-model](../015-bold-confirmacion-pago/data-model.md). Esta entrega no añade tablas.

### Order

| Field | Role |
|-------|------|
| `code` | Identidad de la ruta de confirmación; único pedido que puede marcarse pagado |
| `status` | `PENDING_PAYMENT` → `PAID` (esta feature); `PAYMENT_FAILED` solo vía API/webhook |
| `paidAt` | Se setea al aplicar `APPROVED` |

### OrderStatusHistory

| Field | Uso 017 |
|-------|---------|
| `createdBy` | `bold-webhook:…` \| `bold-reconcile:…` \| **`bold-return:…`** (nuevo origen) |
| `fromStatus` / `toStatus` | `PENDING_PAYMENT` → `PAID` |

### NotificationAttempt

Sin cambio: `notifyOrderPaid` sigue idempotente si webhook y retorno compiten.

## Derived

### BoldReturnParams

| Param | Autoridad 017 |
|-------|----------------|
| `bold-tx-status` | Hint. Persistible **solo** si normaliza a `APPROVED` **y** la API no es `REJECTED`. No autoridad de rechazo. |
| `bold-order-id` | Lookup secundario de API; no marca otro `code`. Opcional. |

### ResolveReturnAction (nuevo, no persistido)

Salida de `resolveReturnPersistence(apiOutcome, returnHint)`:

| Action | Cuándo | Efecto Order |
|--------|--------|--------------|
| `APPLY_APPROVED` | API `APPROVED`, **o** API `PENDING`/`UNAVAILABLE` + hint `APPROVED` | `PENDING_PAYMENT` → `PAID` |
| `APPLY_REJECTED` | API `REJECTED` (aunque el hint sea `approved`) | `PENDING_PAYMENT` → `PAYMENT_FAILED` |
| `NOOP` | API no definitiva y hint no es `APPROVED` (incluye `rejected` en URL) | Sin cambio |

### ConfirmationUiMode

| Mode | Condición | Título / estado |
|------|-----------|-----------------|
| `paid` | `status === PAID` | **Pago aprobado** / **Pago aprobado** |
| `failed` | `status === PAYMENT_FAILED` | Pago rechazado (sin cambio 017) |
| `confirming` | `PENDING_PAYMENT` + params Bold **y** hint **no** persistió `approved` | Confirmando pago… / Confirmando… |
| `pending` | `PENDING_PAYMENT` sin params Bold | Pedido recibido / Pendiente de pago |

## State transitions

```text
PENDING_PAYMENT
  ├── API APPROVED ─────────────────────────────► PAID  (source: reconcile)
  ├── API PENDING/UNAVAILABLE + URL APPROVED ───► PAID  (source: return)
  ├── API REJECTED ─────────────────────────────► PAYMENT_FAILED  (source: reconcile)
  ├── webhook SALE_APPROVED ────────────────────► PAID  (source: webhook)
  └── webhook SALE_REJECTED ────────────────────► PAYMENT_FAILED
       URL rejected alone ──────────────────────► NOOP (017)

PAID ──(cualquier APPROVED/REJECTED posterior)──► no-op
```

## Validation rules

1. Solo transicionar desde `PENDING_PAYMENT`.
2. Código inexistente → 404.
3. Hint `approved` aplica **solo** al `code` de la ruta.
4. API `REJECTED` impide `PAID` aunque la query diga `approved`.
5. Query `rejected`/`failed` no persiste `PAYMENT_FAILED`.
6. Doble camino (return luego webhook) → una transición, un notify útil.
