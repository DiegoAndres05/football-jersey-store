# Quickstart: Confirmación Bold refleja pago aprobado

## Prerequisites

- App runnable (`npm run dev`) with `BOLD_IDENTITY_KEY` / `BOLD_SECRET_KEY` (test mode).
- Webhook Bold opcional para prueba en paralelo; no requerido si la API de consulta responde.
- Pedido de prueba vía checkout → Bold modo pruebas.

## Automated checks (local)

```bash
npm test -- --test-name-pattern='bold|confirm|reconcile|payment'
npx tsc --noEmit
```

Esperado tras implementar: tests de mapeo de estados Bold → outcome, transición idempotente `PENDING_PAYMENT`→`PAID`/`PAYMENT_FAILED`, y asserts de copy/CTA en la página de confirmación (o componentes asociados).

## Manual happy path (approved)

1. Carrito → checkout → abrir Bold pruebas.
2. Pagar con VISA test `4111111111111111` (aprobada).
3. Landing en `/pedido/confirmado/{code}?bold-tx-status=approved&bold-order-id=…`.
4. **Esperado**: UI “Pago confirmado” / pagado en ≤ ~unos segundos (carga o soft-retry). **No** “Pago pendiente”.
5. Recargar la misma URL (con o sin query): sigue pagado.
6. Admin / BD: `status = PAID`, history con origen reconcile y/o webhook; Telegram como máximo un envío útil (`SENT` / `ALREADY_SENT`).

## Manual reject path

1. Repetir checkout con tarjeta de rechazo Bold (docs de pruebas).
2. **Esperado**: UI rechazo/fallido + CTA a `/productos`. **No** aprobado.

## Manual confirming / API delay

1. Simular API lenta/fallida (mock en test o cortar red hacia Bold en staging controlado).
2. Con params Bold y pedido aún `PENDING_PAYMENT`: UI “Confirmando pago…”, no “Pago rechazado”.
3. Cuando API/webhook resuelva: UI final correcta.

## Regression

- Carrito, datos de checkout y apertura de Bold siguen OK (FR-008).
- Pedido `PENDING_PAYMENT` sin query Bold: copy de pendiente legítimo (sin forzar “Confirmando…” engañoso).

## Contracts

- [confirmation-page.md](contracts/confirmation-page.md)
- [bold-payment-reconcile.md](contracts/bold-payment-reconcile.md)
- [data-model.md](data-model.md)
