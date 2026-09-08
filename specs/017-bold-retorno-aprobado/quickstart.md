# Quickstart: Retorno Bold aprobado sin esperar webhook

## Prerequisites

- App: `npm run dev` con `BOLD_IDENTITY_KEY` / `BOLD_SECRET_KEY` (modo pruebas).
- **No** hace falta “Probar el webhook” de Bold para el happy path.
- Checkout → Bold pruebas → tarjeta aprobada.

## Automated checks

```bash
npm test -- --test-name-pattern='bold|return|reconcile|payment'
npx tsc --noEmit
```

Esperado: tests de `resolveReturnPersistence` (API pending + hint approved → APPLY_APPROVED; API rejected + hint approved → APPLY_REJECTED; hint rejected + API pending → NOOP); asserts de título/estado `Pago aprobado` en `src/app/pedido/confirmado/[code]/page.tsx`.

Contratos: [confirmation-page.md](contracts/confirmation-page.md), [bold-payment-reconcile.md](contracts/bold-payment-reconcile.md), [data-model.md](data-model.md).

## Manual happy path (sin webhook)

1. Completar checkout y pagar en Bold pruebas (VISA `4111111111111111`).
2. Aterrizar en `/pedido/confirmado/{code}?bold-tx-status=approved&bold-order-id=…` **sin** disparar “Probar el webhook”.
3. **Esperado**: título **Pago aprobado**, estado **Pago aprobado**. No “Confirmando…” como final. No “Pago confirmado” en esos rótulos.
4. Recargar: sigue pagado / mismos rótulos.
5. Pedido en BD: `PAID`; history con `bold-return:` y/o `bold-reconcile:`.

## Manual API confirma aprobado

Si la consulta Bold responde `APPROVED`, el resultado visible es el mismo (`Pago aprobado`); history puede ser `bold-reconcile:`.

## Manual contradicción (API rechazo + query approved)

Con API/mock que confirme rechazo: el pedido **no** queda `PAID` aunque la URL diga `approved`.

## Manual rechazo en URL (fuera de persistencia 017)

Retorno `bold-tx-status=rejected` sin API/webhook: **no** exigir `PAYMENT_FAILED` por la query. Puede verse “Confirmando…”. CTA de rechazo persistido sigue `/productos` cuando sí hay fallo confirmado.

## Idempotencia webhook

Si después se prueba el webhook de aprobado: un solo `PAID`, sin doble notificación útil.

## Regression

- Carrito, checkout, apertura Bold (015/FR-010).
- `PENDING_PAYMENT` sin query Bold: pendiente legítimo, no “Pago aprobado”.
