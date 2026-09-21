# Validation report

## Ejecutado

- `npm run db:generate` ✅ Prisma Client generado.
- `npm run db:push` ✅ el proveedor PostgreSQL configurado aceptó el esquema.
- `npx tsc --noEmit` ✅.
- `node --import tsx --test tests/domain-foundation.test.ts` ✅ (3/3).
- `npm test` ✅ suite existente completada (la salida contiene warnings de
  componentes, sin fallos de proceso).
- `npm run lint` ⚠️ el script actual expande `next lint` como si `lint` fuera
  un directorio; Next responde `Invalid project directory .../lint`. Esto es
  un problema del script/configuración preexistente.
- `npx tsc --noEmit` ✅ después de añadir el contrato de checkout y consentimientos.
- `node --import tsx --env-file=.env --test tests/checkout-contract.test.ts tests/order-snapshots.test.ts tests/logica.test.ts` ✅ (21/21).
- `node --import tsx --env-file=.env --test tests/bold-preparation.test.ts tests/bold-idempotency.test.ts tests/bold-secrets.test.ts tests/bold-integrity.test.ts tests/bold-payment-reconcile.test.ts` ✅ (48/48).
- `npx tsc --noEmit` ✅ después de implementar la preparación server-only y los contratos de
  reconciliación Bold.
- Quickstart reanudado el 2026-09-21:
  - `npm run db:generate` ✅.
  - `npm run db:push` ✅; PostgreSQL remoto reportó el esquema sincronizado.
  - `npm run db:seed` ⚠️ quedó detenido tras 120 s después de `🌱 Seed iniciado...`; no se
    reintentó para evitar duplicar datos.
  - `npm test` ⚠️ 505/506; el único fallo es `tests/helpers.test.ts` porque el `.env`
    local define un WhatsApp distinto al fixture esperado (`573046149525` vs
    `573000000000`). No corresponde a esta feature.
  - `npm run lint` ✅.
  - `npx tsc --noEmit` ✅.
  - `npx prisma migrate deploy` ⚠️ bloqueado por la migración previa
    `20260920220000_add_coupons`: PostgreSQL devuelve `type "DiscountType" already exists`
    (P3018). No se alteró ni resolvió esa migración ajena.
- Pruebas enfocadas de la tienda pública ✅: 29/29 en catálogo honesto, rutas, PDP/carrito,
  totales, reconciliación, checkout/snapshots, Bold sandbox/idempotencia/secretos y filtros
  móviles.
- Revisión de alcance/secretos ✅: `git diff --check` limpio, no hay archivos modificados bajo
  `src/app/admin/`, no aparecen secretos en el diff y los cambios de rutas están limitados a
  superficie pública/API Bold.

## Bloqueos operativos

- `npm run db:seed` inició, pero no terminó dentro de la ventana de validación;
  no se forzó una segunda ejecución para evitar duplicar o bloquear datos.
- No se ejecutó `prisma migrate deploy` ni un backfill real; `db:push` fue usado
  como validación local y no sustituye la migración productiva.
- Las URLs/versiones legales del `.env.example` son placeholders HTTPS y no
  habilitan publicación.
- Las llaves Bold están vacías; el código falla cerrado fuera de
  `PAYMENT_PROVIDER=bold-sandbox` con ambas llaves presentes.
- No se ejecutó una transacción Bold real: el proveedor permanece deliberadamente en
  sandbox y las pruebas no requieren ni imprimen llaves. La activación productiva está
  bloqueada por diseño.
- La matriz visual completa de 30 productos y VoiceOver no pudo cerrarse en este entorno:
  el servidor público local sí respondió `/productos`, pero no hay Chromium/Chrome
  disponible para automatizar los cuatro viewports. La evidencia automatizada de filtros,
  labels, estados y ausencia de overflow queda en `tests/responsive-accessibility.md` y
  `tests/mobile-filters.test.ts`; SC-006/SC-007 siguen pendientes de revisión manual.
- La prueba amplia con `--test-name-pattern` incluye archivos de fases paralelas
  que aún están en evolución; la validación reproducible de T036–T044 es el
  comando enfocado de 21 pruebas anterior.

## Alcance

No hay cambios bajo `src/app/admin`. Las rutas públicas existentes y sus
contratos no se eliminan.
