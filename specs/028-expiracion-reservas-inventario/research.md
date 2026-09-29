# Investigación BACK-01

## Ledger y transacción por orden

`prisma/schema.prisma` define `InventoryMovement` como fuente de verdad:
`RESERVATION` resta stock y `CANCELLATION` lo restaura. `Order` empieza en
`PENDING_PAYMENT` y `OrderStatusHistory` conserva auditoría. Se seleccionarán
reservas por `type`, `createdAt` y `orderReference`, se deduplicarán órdenes y
cada una se procesará con `Order FOR UPDATE`.

Se reutilizarán `planReservationCancellations` y las comprobaciones de
`applyBoldPayment`. Sobrescribir stock o borrar reservas se rechaza porque
rompe el ledger inmutable; una cola persistente es complejidad innecesaria para
el MVP.

## TTL y ejecución

No existe cron/job en `src/app/api`; las únicas rutas operativas actuales son
Bold y usan `NextResponse`, runtime `nodejs` y Zod. El TTL se resolverá desde
`INVENTORY_RESERVATION_TTL_MINUTES`, entero positivo, con 30 como default, y se
calculará desde `InventoryMovement.createdAt`. Un servicio server-only será
reutilizable por un adapter HTTP o scheduler del proveedor, sin asumir Vercel.

Persistir `expiresAt` en cada movimiento sería más explícito, pero exige
migración/backfill no solicitados; el TTL configurable calculado satisface el
alcance actual.

## Cupón y pago

`CouponUsage` ya modela `RESERVED`, `CONFIRMED`, `RELEASED`, `expiresAt`,
`releasedAt` y `releaseReason`; `reserveCoupon` bloquea el cupón y
`applyBoldPayment` confirma únicamente al aprobar. La expiración actualizará
solo `RESERVED → RELEASED` dentro de la transacción de la orden. Nunca tocará
`CONFIRMED`, y no se usará una liberación fuera de la transacción.

## Verificaciones del repositorio

Se revisaron `order-repository.ts`, `inventory-plan.ts`,
`admin-inventory-projection.ts`, `coupon-repository.ts`,
`apply-bold-payment.ts`, rutas Bold, pruebas de inventario/cupones y scripts
npm. No se implementó código fuente ni se creó `tasks.md`.
