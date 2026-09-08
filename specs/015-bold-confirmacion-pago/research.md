# Research: Confirmación Bold refleja pago aprobado

## Fuente de verdad al volver de Bold

- **Decision**: Los query params (`bold-tx-status`, `bold-order-id`) solo disparan reconciliación. Persistencia de `PAID` / `PAYMENT_FAILED` solo tras verificación con la API de Bold (o webhook ya procesado). La query nunca marca pagado sola.
- **Rationale**: Clarificación C; los params son forjables; la constitución exige integridad auditable del ciclo de pedido.
- **Alternatives considered**: Confiar en `bold-tx-status=approved` (rápido, inseguro); esperar solo webhook (deja el bug de QA si el webhook llega tarde).

## Endpoint / lookup de estado Bold

- **Decision**: Reutilizar y, si hace falta, ampliar `getBoldTransactionStatus` en `src/features/payments/services/bold-service.ts`. Lookup primario por `order.code` (es el `order-id` / `reference_id` enviado a Bold). Si no hay resultado útil y viene `bold-order-id` en la URL, intentar lookup secundario por ese id. Normalizar estados a un outcome de dominio: `APPROVED` → pagado; `REJECTED` | `FAILED` → fallido; `APPROVED`-equivalentes case-insensitive; pendiente / `NO_TRANSACTION_FOUND` / error de red → no persistir cambio.
- **Rationale**: El botón de pagos usa el `order-id` del checkout (`result.code`). Docs Bold documentan `APPROVED` / `REJECTED` / `FAILED` (API v1 `status` o voucher `payment_status`). El helper actual apunta a `GET …/v1/payment/{referenceId}`; en implementación se valida o se añade el voucher `…/v2/payment-voucher/…` si el lookup por botón falla en pruebas.
- **Alternatives considered**: Solo `bold-order-id`; solo webhook notifications API; inventar estados desde la query.

## Transición de pedido compartida (webhook + confirmación)

- **Decision**: Extraer un servicio/función única (p. ej. en `payments` u `orders`) que, solo desde `PENDING_PAYMENT`, aplique `PAID` (+ `paidAt` + history) o `PAYMENT_FAILED` (+ history) de forma idempotente y, en el caso `PAID`, llame `notifyOrderPaid` (ya idempotente vía `NotificationAttempt`). Webhook y reconciliación de confirmación usan el mismo camino.
- **Rationale**: Clarificación B de efectos post-pago; evita divergencia webhook vs confirmación; historial auditable con `createdBy` distinto (`bold-webhook:…` vs `bold-reconcile:…`).
- **Alternatives considered**: Duplicar lógica en page + webhook; notificar solo desde webhook.

## UX de “Confirmando…” y reintento breve

- **Decision**: En la carga del Server Component, si el pedido está `PENDING_PAYMENT` y hay señal de retorno Bold (`bold-tx-status` y/o `bold-order-id`), ejecutar una reconciliación servidor. Si tras eso sigue pendiente: mostrar “Confirmando pago…” (no “Pago pendiente”) y un cliente ligero que haga `router.refresh()` / re-reconcile cada ~2s, máximo ~3–4 intentos (~6–8s). Si aún no hay resultado: mantener copy de confirmación en curso (o pendiente reconciliable), **sin** marcar `PAYMENT_FAILED`. Pedidos `PENDING_PAYMENT` **sin** params Bold conservan el copy de pendiente legítimo.
- **Rationale**: Clarificación B de fallback; SC-001 pide segundos, no minutos; no confundir timeout de API con rechazo.
- **Alternatives considered**: Bloquear SSR indefinido; marcar fallido tras un timeout; poll infinito.

## Mensajería y CTA de rechazo

- **Decision**: Tres copy distintos en español: aprobado / confirmando / rechazado. Rechazo → CTA principal a `/productos` (“Volver a comprar” o equivalente). No restaurar carrito; no reabrir Bold sobre el mismo pedido.
- **Rationale**: Clarificaciones A→B de CTA; el carrito se limpia al abrir Bold.
- **Alternatives considered**: CTA a `/checkout` vacío; restaurar líneas del pedido fallido.

## Alcance técnico no tocado

- **Decision**: No cambiar creación de pedido, formulario de checkout, payload Bold de apertura, ni firma de integridad salvo lo estrictamente necesario para leer `searchParams` y reconciliar.
- **Rationale**: FR-008 / fuera de alcance QA.
- **Alternatives considered**: Rehacer redirect URL; reintroducir mock payment en confirmación.
