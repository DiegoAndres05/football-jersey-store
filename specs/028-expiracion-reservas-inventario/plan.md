# Implementation Plan: Expiración de reservas de inventario (BACK-01)

**Branch**: `028-expiracion-reservas-inventario` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-expiracion-reservas-inventario/spec.md`

## Summary

Crear un proceso programable que detecte movimientos `RESERVATION` vencidos
(30 minutos por defecto), agrupe la orden pendiente y, dentro de una
transacción bloqueada, revalide que siga en `PENDING_PAYMENT`, la cancele,
agregue `CANCELLATION` que compense exactamente todas sus reservas, libere el
`CouponUsage` reservado y escriba `OrderStatusHistory`. Será idempotente,
favorecerá un pago aprobado en una carrera y devolverá un resultado operativo
por orden. La lógica vivirá en servicios server-only reutilizables por un
cron/job, sin rediseñar checkout ni el proveedor de pagos.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js runtime de Next.js 16

**Primary Dependencies**: Next.js App Router, Prisma 5.22, PostgreSQL/Supabase,
Zod, `node:test`/`tsx`

**Storage**: PostgreSQL mediante Prisma. `InventoryMovement` es ledger
inmutable; `Order`, `OrderStatusHistory` y `CouponUsage` son persistencia
relacionada. SQLite solo es auxiliar histórico de desarrollo.

**Testing**: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`

**Target Platform**: servidor Node.js de Next.js con cron gestionado por el
proveedor de despliegue. No existe convención de cron en `src/app/api`; el job
debe encapsularse en un servicio reutilizable.

**Project Type**: aplicación web e-commerce Next.js App Router

**Performance Goals**: procesar un lote acotado sin bloquear checkout; cada
orden se procesa aisladamente y ejecuciones solapadas son seguras.

**Constraints**: cantidades enteras y ledger inmutable; transacción por orden;
`SELECT ... FOR UPDATE` sobre `Order`; no cancelar `PAID`; no liberar cupones
`CONFIRMED`; rollback completo ante error; TTL configurable con default 30 min;
logs sin PII.

**Scale/Scope**: órdenes de checkout invitado con reservas `INMEDIATA`; no
cambia checkout, pagos Bold, catálogo ni crea `tasks.md`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-research (2026-09-26)

- **I. Domain boundaries — PASS**: Inventory selecciona/libera; Orders
  transiciona e historiza; Coupons libera su uso, con servicios explícitos.
- **II. Auditable integrity — PASS**: no se sobrescribe ledger; cada liberación
  es `CANCELLATION` y la transición queda en historial.
- **III. Typed/validated contracts — PASS**: resultado discriminado tipado;
  adapter validado con Zod y sin aceptar estado de pago del llamador.
- **IV. Least privilege — PASS**: server-only y autorización por secreto de
  entorno; no se exponen datos de cliente.
- **V. Verified delivery — PASS**: pruebas de dominio, persistencia,
  concurrencia, rollback y gates npm.
- **Complejidad — PASS**: se reutilizan `planReservationCancellations`,
  `shouldReleaseReservations` y el modelo `CouponUsage`; no se agrega cola.

No hay violaciones que requieran `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/028-expiracion-reservas-inventario/
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No se genera `contracts/`: el servicio/adapter es una interfaz operativa
interna y no se ha elegido un endpoint público de cron.

### Source Code (repository root)

```text
prisma/schema.prisma
src/features/inventory/server/
src/features/orders/repositories/inventory-plan.ts
src/features/orders/services/apply-bold-payment.ts
src/features/coupons/repositories/coupon-repository.ts
src/app/api/bold/
tests/plan-inventory-movements.test.ts
tests/bold-inventory-release.test.ts
tests/coupons-*.test.ts
scripts/
```

**Structure Decision**: aplicación única Next.js. La lógica transaccional será
un servicio server-only invocable por un adapter cron (HTTP o scheduler), con
selección por `InventoryMovement.createdAt` y `orderReference`; no depende de
React ni de un proceso residente.

### Diseño técnico y flujo

1. Consultar reservas `RESERVATION` cuyo `createdAt + ttl <= now`, enlazar
   `orderReference` a órdenes `PENDING_PAYMENT`, deduplicar códigos y limitar
   lotes.
2. Por orden, bloquear con `FOR UPDATE`, releer estado y movimientos. Si ya
   no es `PENDING_PAYMENT`, devolver `skipped/resolved` sin escrituras.
3. Verificar que exista reserva vencida; compensar **todas** las reservas de la
   orden por variante, evitando una segunda liberación; crear `CANCELLATION`.
4. En la misma transacción actualizar a `CANCELLED`, crear historial con fecha,
   motivo y referencia, y pasar solo `CouponUsage.state = RESERVED` a
   `RELEASED`.
5. Ante error, rollback de la orden completa, log resumido sin PII y resultado
   `failed` reintentable. El adapter valida secreto, fija `now` y reporta
   `{expired, skipped, resolved, failed}`.

### Riesgos y mitigaciones

- Carrera pago/expiración: lock y relectura; `PAID` gana.
- Doble cron/reintento: estado más comprobación de liberaciones por orden.
- Liberación parcial: una transacción por orden.
- Referencia huérfana: reportar `skipped/failed`, nunca inventar una orden.
- TTL ambiguo: `INVENTORY_RESERVATION_TTL_MINUTES`, entero positivo, default 30.
- Sin cron existente: adapter delgado y operación documentada en quickstart.

### Post-design Constitution Check (2026-09-26)

- **I–II — PASS**: ownership explícito y ledger/historial/cupón auditables.
- **III — PASS**: tipos discriminados y Zod en adapter.
- **IV — PASS**: ejecución server-only, secreto y logs sin PII.
- **V — PASS**: pruebas de límite, cupón, rollback, idempotencia y carrera;
  lint/type/build quedan en quickstart.
- **Excepciones**: ninguna.

## Complexity Tracking

Sin violaciones constitucionales.
