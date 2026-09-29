# Quickstart de validación BACK-01

## Prerrequisitos

- Node.js/npm, `npm install` y `npm run db:generate`.
- `DATABASE_URL` (y `DIRECT_URL` para migraciones) de una base de prueba.
- `INVENTORY_RESERVATION_TTL_MINUTES=30` o un valor positivo reducido para
  pruebas locales.
- `INVENTORY_RESERVATION_CRON_SECRET`, secreto server-only enviado como
  `x-inventory-expiration-secret` o `Authorization: Bearer ...`.

El scheduler recomendado ejecuta el adapter cada 5 minutos (ver `vercel.json`).
También puede invocarse manualmente:

```bash
curl -X POST "$APP_URL/api/inventory/expire-reservations" \
  -H "x-inventory-expiration-secret: $INVENTORY_RESERVATION_CRON_SECRET" \
  -H "content-type: application/json" \
  -d '{"limit":100}'
```

La respuesta solo contiene contadores `{expired, skipped, resolved, failed}`.
Los fallos son reintentables; repetir la ejecución es seguro y no crea
compensaciones duplicadas. Los logs usan únicamente el código técnico de la
orden y métricas, nunca nombre, correo, teléfono o dirección.

## Gates

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Las pruebas focalizadas deben cubrir límite exacto, reserva vigente, múltiples
variantes/cantidades, historial, cupón reservado y confirmado, orden `PAID`,
segunda ejecución, rollback, concurrencia y resultados sin PII.

## Escenario extremo a extremo

1. Crear en una base de prueba una orden `PENDING_PAYMENT` con dos líneas
   `INMEDIATA` y, opcionalmente, un cupón `RESERVED`.
2. Simular `RESERVATION` con `createdAt` al menos 30 minutos atrás.
3. Ejecutar el servicio con un `now` fijo o invocar el adapter autorizado.
4. Verificar `CANCELLED`, una compensación exacta por variante, cupón
   `RELEASED` con razón/fecha e historial `PENDING_PAYMENT → CANCELLED`.
5. Ejecutar de nuevo: debe ser `resolved/skipped`, sin nuevos movimientos,
   historial ni liberación de cupón.
6. Repetir con aprobación concurrente: la orden queda `PAID`, sin
   `CANCELLATION` ni reversión del cupón confirmado.

Consultar [data-model.md](./data-model.md) para estados y
[research.md](./research.md) para decisiones y alternativas.
