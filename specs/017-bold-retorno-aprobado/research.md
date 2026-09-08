# Research: 017 — API única autoridad

## Autoridad de pago

- **Decision**: Solo consulta Bold o webhook persisten PAID/PAYMENT_FAILED. `bold-tx-status` no es autoridad.
- **Rationale**: Clarificación 2026-09-08 B; constitution III/IV; tests P0 de seguridad.
- **Alternatives considered**: URL approved como fallback (017 original A) — rechazado por forgery.

## Liberación en REJECTED

- **Decision**: Misma transacción que el cambio de estado; CANCELLATION = −(quantity de cada RESERVATION) agrupada por variante; `orderReference` = `order.code`.
- **Rationale**: Diagnóstico de stock apartado; constitution II.
- **Alternatives considered**: Solo revalidatePath (no restaura ledger); SALE en APPROVED (fuera de alcance).

## UX Confirmando

- **Decision**: Cliente llama `POST /api/bold/reconcile` con poll acotado; no envía status de pago.
- **Rationale**: Webhook de pruebas no llega; la API sí puede confirmar.
- **Alternatives considered**: Confiar en la query para salir de Confirmando.
