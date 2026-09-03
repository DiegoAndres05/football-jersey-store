# Data Model

## Existing entities retained

### Order
- Existing code, customer snapshot, integer totals, payment status and lifecycle status remain authoritative.
- New notification behavior references the order; it does not mutate totals, payment reference, lines or status when Telegram fails.

### OrderItem
- Existing historical product/variant/size, quantity, customization, unit price and `deliveryMode` snapshot remain unchanged.
- Valid values are `INMEDIATA` and `BAJO_PEDIDO`. Historical absence is represented in the admin projection as `NO_DISPONIBLE`, not persisted as a guessed choice.

### ProductVariant
- Existing `allowsBackorder` remains the per-size administrative control. It is not copied into notification history and is not used to reinterpret an old order.

## New entity: NotificationAttempt

| Field | Type | Rules |
|---|---|---|
| `id` | String | Prisma id, immutable |
| `orderId` | String | Required relation to `Order`; no cascade delete for audit history |
| `channel` | String | MVP value `TELEGRAM` |
| `eventKey` | String | Required stable event name, e.g. `ORDER_CREATED_PAID` |
| `idempotencyKey` | String | Required, unique for order/channel/event |
| `status` | String | `PENDING`, `SENT`, `FAILED`, `NOT_CONFIGURED` |
| `attemptCount` | Int | Starts at 0; increments for each provider call |
| `providerMessageRef` | String? | Telegram message id/reference only; no token or chat secret |
| `errorCode` | String? | Normalized non-secret category |
| `errorMessage` | String? | Short redacted operational detail; no token, chat ID or unnecessary PII |
| `createdAt` | DateTime | Immutable creation time |
| `updatedAt` | DateTime | Last state change |
| `sentAt` | DateTime? | Set only after confirmed provider success |
| `lastAttemptAt` | DateTime? | Set whenever a send attempt begins/ends |

Relations: `Order 1 -> N NotificationAttempt`. Add an index on `(orderId, channel, eventKey)` and a unique constraint on `idempotencyKey` (or the equivalent composite unique key). Do not cascade delete audit attempts.

## State transitions

- New event: `PENDING` -> provider call -> `SENT`, `FAILED`, or `NOT_CONFIGURED`.
- Authorized retry: `FAILED` or `NOT_CONFIGURED` -> `PENDING`/attempt -> `SENT` or the same non-success state.
- `SENT` is terminal for the event. Concurrent workers must re-read and conditionally claim/reconcile the same idempotency key; never create a second successful event.
