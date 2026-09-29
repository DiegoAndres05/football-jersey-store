---

description: "Tareas de implementación para expiración de reservas de inventario BACK-01"
---

# Tasks: Expiración de reservas de inventario (BACK-01)

**Input**: `specs/028-expiracion-reservas-inventario/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`)

**Objetivo**: liberar reservas vencidas de órdenes pendientes mediante un servicio server-only transaccional, idempotente y ejecutable por scheduler, sin modificar el flujo de checkout ni el proveedor de pagos.

**Convenciones**: `[P]` indica tareas paralelizables; `[USn]` identifica únicamente tareas de la fase de la historia correspondiente. Todas las rutas son relativas a la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar convenciones, configuración y estructura mínima sin cambiar todavía el comportamiento de negocio.

- [X] T001 Documentar en `src/features/orders/services/expiration-types.ts` los tipos discriminados `ExpiredReservationCandidate`, `ExpirationOrderResult` y opciones de lote/TTL.
- [X] T002 [P] Añadir en `src/features/orders/services/expiration-config.ts` la lectura validada de `INVENTORY_RESERVATION_TTL_MINUTES`, con entero positivo y valor por defecto de 30 minutos.
- [X] T003 [P] Crear el esqueleto server-only del servicio en `src/features/orders/services/expire-inventory-reservations.ts`, incluyendo `import "server-only"` y firmas públicas reutilizables por un scheduler.
- [X] T004 [P] Crear el archivo de pruebas focalizadas `tests/inventory-reservation-expiration.test.ts` usando `node:test`/`tsx` y helpers de fechas fijas.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establecer acceso transaccional, invariantes del ledger y observabilidad que necesitan todas las historias.

- [X] T005 Verificar en `prisma/schema.prisma` los enums, relaciones e índices de `Order`, `InventoryMovement`, `CouponUsage` y `OrderStatusHistory`; agregar únicamente los índices/migración necesarios para buscar `RESERVATION` por `createdAt` y `orderReference`.
- [X] T006 [P] Extraer o adaptar en `src/features/orders/repositories/inventory-plan.ts` una función que agrupe reservas activas por variante y produzca compensaciones exactas sin sobrescribir movimientos existentes.
- [X] T007 [P] Añadir en `src/features/orders/repositories/order-repository.ts` una operación server-only para bloquear y releer una orden con `SELECT ... FOR UPDATE` dentro de la transacción Prisma.
- [X] T008 [P] Añadir en `src/features/coupons/repositories/coupon-repository.ts` la transición atómica exclusiva `RESERVED → RELEASED`, preservando `CONFIRMED` y registrando `releasedAt`/`releaseReason`.
- [X] T009 Definir en `src/features/orders/services/expiration-logging.ts` logging resumido de resultados y errores sin PII, incluyendo código de resultado reintentable y referencia técnica de orden.
- [X] T010 [P] Crear fixtures y utilidades de aislamiento/transacción en `tests/helpers/inventory-reservation-expiration-fixtures.ts` para órdenes, movimientos, cupones y reloj controlado.

**Checkpoint**: la base de datos, los límites de dominio, el bloqueo por orden y el kit de pruebas están listos antes de implementar historias.

## Phase 3: User Story 1 - Liberar inventario abandonado (Priority: P1) 🎯 MVP

**Goal**: detectar una `RESERVATION` vencida, cancelar toda la orden pendiente, liberar todas sus reservas activas y liberar un cupón reservado en una única transacción.

**Independent Test**: crear una orden `PENDING_PAYMENT` con dos variantes y un cupón `RESERVED`, ejecutar con `now` fijo al límite de 30 minutos y comprobar `CANCELLED`, compensaciones exactas por variante, cupón `RELEASED` e historial de transición.

### Tests for User Story 1

- [X] T011 [P] [US1] Probar en `tests/inventory-reservation-expiration.test.ts` elegibilidad en el límite exacto (`createdAt + 30 min <= now`) y exclusión de reservas aún vigentes.
- [X] T012 [P] [US1] Probar en `tests/inventory-reservation-expiration.test.ts` múltiples variantes/cantidades, liberación exacta mediante `CANCELLATION` y cálculo de unidades liberadas.
- [X] T013 [P] [US1] Probar en `tests/inventory-reservation-expiration.test.ts` cancelación, `OrderStatusHistory` con fecha/motivo/referencia y liberación de `CouponUsage` `RESERVED`.

### Implementation for User Story 1

- [X] T014 [US1] Implementar en `src/features/orders/services/expire-inventory-reservations.ts` la selección acotada de candidatos `RESERVATION` vencidos, deduplicando `orderReference` y aplicando TTL/`now` inyectables.
- [X] T015 [US1] Implementar en `src/features/orders/services/expire-inventory-reservations.ts` el procesamiento aislado por orden: bloqueo, relectura de estado y comprobación de reservas vencidas antes de escribir.
- [X] T016 [US1] Implementar en `src/features/orders/services/expire-inventory-reservations.ts` la transacción que inserta `CANCELLATION` por variante, actualiza `PENDING_PAYMENT → CANCELLED` y crea `OrderStatusHistory`.
- [X] T017 [US1] Integrar en `src/features/orders/services/expire-inventory-reservations.ts` la liberación transaccional únicamente de `CouponUsage.state = RESERVED`, con razón de expiración y rollback completo ante excepción.
- [X] T018 [US1] Exponer en `src/features/orders/services/expire-inventory-reservations.ts` el resultado operativo por orden y el resumen de lote `{expired, skipped, resolved, failed}`, registrando fallos reintentables sin PII.
- [X] T019 [US1] Crear en `src/app/api/inventory/expire-reservations/route.ts` un adapter HTTP opcional para scheduler que valide con Zod el secreto server-only, no acepte estados del llamador y ejecute con runtime Node.js.
- [X] T020 [US1] Añadir en `tests/inventory-reservation-expiration.test.ts` prueba de integración del adapter autorizado/no autorizado, TTL configurable, lote acotado y respuesta sin datos personales.

**Checkpoint**: US1 es entregable de MVP cuando el servicio y el adapter cancelan una orden abandonada, liberan inventario/cupón y dejan auditoría verificable.

## Phase 4: User Story 2 - Proteger pagos aprobados (Priority: P1)

**Goal**: asegurar que una aprobación de pago gana carreras contra la expiración y que una orden `PAID` nunca pierde inventario ni cupón confirmado.

**Independent Test**: preparar una orden pendiente, ejecutar aprobación y expiración antes/durante/después del intento, y verificar que termina `PAID` sin `CANCELLATION`, sin historial de expiración y sin liberar cupón confirmado.

### Tests for User Story 2

- [X] T021 [P] [US2] Probar en `tests/inventory-reservation-expiration.test.ts` que órdenes `PAID`, `PAYMENT_FAILED` y `CANCELLED` se omiten sin escrituras.
- [X] T022 [P] [US2] Probar en `tests/inventory-reservation-expiration.test.ts` la carrera entre expiración y `src/features/orders/services/apply-bold-payment.ts`, verificando que el lock/revalidación deja ganar a `PAID`.
- [X] T023 [P] [US2] Probar en `tests/inventory-reservation-expiration.test.ts` que un `CouponUsage` `CONFIRMED` no cambia y que no se crean compensaciones para una aprobación concurrente.

### Implementation for User Story 2

- [X] T024 [US2] Revalidar en `src/features/orders/services/expire-inventory-reservations.ts` el estado de la orden después del bloqueo y antes de cada escritura, devolviendo `skipped`/`resolved` sin efectos para pagos aprobados.
- [X] T025 [US2] Alinear en `src/features/orders/services/apply-bold-payment.ts` la adquisición del lock y la transición de pago con el servicio de expiración, sin alterar contratos del proveedor Bold.
- [X] T026 [US2] Añadir en `src/features/orders/services/expire-inventory-reservations.ts` manejo explícito de conflictos/serialización para que el error de carrera sea reintentable y no produzca liberación parcial.
- [X] T027 [US2] Completar en `tests/inventory-reservation-expiration.test.ts` una prueba concurrente contra PostgreSQL de rollback y prioridad de pago, aislando cada orden procesada.

**Checkpoint**: US1 y US2 deben coexistir sin cancelar ni liberar inventario de ninguna orden cuyo pago haya sido aprobado.

## Phase 5: User Story 3 - Auditar y repetir la limpieza con seguridad (Priority: P2)

**Goal**: hacer la limpieza idempotente, reintentable y operativamente trazable en ejecuciones repetidas o superpuestas.

**Independent Test**: ejecutar dos veces el job sobre la misma orden y simular una excepción después de una operación intermedia; verificar un único conjunto de movimientos/historial/cupón y un resultado `failed` reintentable antes del éxito.

### Tests for User Story 3

- [X] T028 [P] [US3] Probar en `tests/inventory-reservation-expiration.test.ts` segunda ejecución sobre una orden ya cancelada/resuelta sin nuevos movimientos, historial ni liberación de cupón.
- [X] T029 [P] [US3] Probar en `tests/inventory-reservation-expiration.test.ts` orden sin reservas activas, referencias huérfanas y cantidades múltiples sin compensación negativa o duplicada.
- [X] T030 [P] [US3] Probar en `tests/inventory-reservation-expiration.test.ts` rollback completo ante fallo inyectado y reintento exitoso con resultado `failed` seguido de `expired`.

### Implementation for User Story 3

- [X] T031 [US3] Implementar en `src/features/orders/services/expire-inventory-reservations.ts` detección de compensaciones existentes por orden/variante y estados terminales para garantizar idempotencia.
- [X] T032 [US3] Implementar en `src/features/orders/services/expire-inventory-reservations.ts` clasificación consistente `expired`, `skipped`, `resolved` y `failed`, incluyendo órdenes sin movimientos y referencias huérfanas.
- [X] T033 [US3] Añadir en `src/features/orders/services/expire-inventory-reservations.ts` límites de lote, orden determinista y ejecución por orden para tolerar cron solapado sin bloquear todo el checkout.
- [X] T034 [US3] Configurar en `vercel.json` o en la configuración equivalente del proveedor el scheduler periódico del adapter, documentando que el despliegue puede escoger HTTP o job gestionado sin proceso residente.
- [X] T035 [US3] Documentar en `specs/028-expiracion-reservas-inventario/quickstart.md` variables de entorno, secreto, frecuencia sugerida, ejecución manual, estados de resultado y procedimiento de reintento sin PII.

**Checkpoint**: las ejecuciones repetidas, concurrentes y fallidas dejan un ledger único, historial auditable y capacidad de reintento.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: cerrar documentación, validaciones y gates de entrega sin introducir alcance fuera de BACK-01.

- [X] T036 [P] Actualizar `README.md` o la documentación operativa apropiada con el scheduler, TTL por defecto, secreto y alerta sobre logs sin PII.
- [X] T037 [P] Revisar `src/features/orders/services/expire-inventory-reservations.ts`, `src/features/orders/repositories/inventory-plan.ts` y `src/features/coupons/repositories/coupon-repository.ts` para eliminar duplicación y preservar límites Inventory/Orders/Coupons.
- [X] T038 [P] Ejecutar `npm test` y confirmar que las pruebas focalizadas de `tests/inventory-reservation-expiration.test.ts` cubren quickstart/spec sin regresiones.
- [X] T039 [P] Ejecutar `npx tsc --noEmit` y corregir errores de tipos en `src/features/orders/services/expire-inventory-reservations.ts`, `src/features/orders/services/expiration-config.ts` y `src/app/api/inventory/expire-reservations/route.ts`.
- [X] T040 [P] Ejecutar `npm run lint` y resolver advertencias/errores introducidos por BACK-01.
- [X] T041 Ejecutar `npm run build` con configuración de producción y verificar en `src/app/api/inventory/expire-reservations/route.ts` que el adapter es server-only y el scheduler no se incluye en bundles de cliente.
- [X] T042 Revisar el diff de `src/features/orders/services/expire-inventory-reservations.ts`, `tests/inventory-reservation-expiration.test.ts` y `specs/028-expiracion-reservas-inventario/quickstart.md` para confirmar que no se alteró checkout, pagos Bold ni catálogo fuera de la integración de lock.

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (T001–T004)** no depende de otras fases y puede comenzar inmediatamente.
2. **Foundational (T005–T010)** depende de Setup; bloquea todas las historias.
3. **US1 (T011–T020)** depende de Foundational y es el MVP funcional.
4. **US2 (T021–T027)** depende de Foundational y de las interfaces transaccionales de US1 (T015–T018); puede desarrollarse en paralelo después de estabilizar esas firmas.
5. **US3 (T028–T035)** depende de Foundational y de US1; T033–T035 deben completar antes de activar el scheduler.
6. **Polish (T036–T042)** depende de las historias que se quieran entregar; T041–T042 son gates finales.

### User Story Dependencies

- **US1 (P1)**: única historia necesaria para el MVP; no depende de US2/US3.
- **US2 (P1)**: reutiliza el servicio y lock de US1, pero sus pruebas son independientes y protegen el flujo de pago existente.
- **US3 (P2)**: reutiliza la transacción de US1 y endurece idempotencia, operación y scheduler.

### Parallel Opportunities

- Setup: T002–T004 pueden ejecutarse en paralelo con T001.
- Foundational: T006–T010 pueden ejecutarse en paralelo tras acordar los tipos de T001.
- US1: T011–T013 son pruebas paralelas; T014 y T019 pueden avanzar en paralelo, y T020 queda después del adapter.
- US2: T021–T023 son pruebas paralelas; T024–T026 pueden separarse por archivo/área tras fijar el contrato de lock.
- US3: T028–T030 son pruebas paralelas; T031–T033 pueden dividirse entre dominio y operación, y T034–T035 entre scheduler y documentación.
- Polish: T036–T040 son paralelizables; T041 y T042 son secuenciales al cierre.

## Parallel Example: MVP (User Story 1)

```text
Después de T001–T010:
  Worker A: T011, T012, T013 (pruebas de límite, cantidades, historial/cupón)
  Worker B: T014, T015 (selección, lock y revalidación)
  Worker C: T016, T017, T018 (transacción, cupón y resultados)
  Worker D: T019 (adapter scheduler) y luego T020 (prueba del adapter)
```

## Implementation Strategy

### MVP First

1. Completar Setup y Foundational.
2. Implementar US1 y validar su prueba independiente con reloj fijo y base de prueba.
3. Ejecutar `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`.
4. Detenerse con el servicio reutilizable y adapter autorizado listos para una primera entrega.

### Incremental Delivery

1. Añadir US2 antes de habilitar limpiezas en producción para garantizar que `PAID` gana cualquier carrera.
2. Añadir US3, scheduler, reintentos e idempotencia operativa.
3. Ejecutar Polish y documentar el procedimiento de despliegue/rollback.

## Independent Test Criteria

- **US1**: con `now` fijo, una reserva exactamente vencida cancela la orden, compensa cada variante con cantidad exacta, libera solo el cupón `RESERVED` y escribe historial; una reserva vigente no cambia.
- **US2**: `PAID` antes o durante la aplicación permanece `PAID`, sin `CANCELLATION`, sin reversión de inventario y sin liberar cupones `CONFIRMED`.
- **US3**: la segunda ejecución no agrega escrituras; un fallo revierte la transacción completa y devuelve un resultado reintentable; concurrencia y referencias huérfanas no duplican liberaciones.

## Formato de validación

Todas las tareas ejecutables de este documento cumplen estrictamente `- [ ] T###`, usan `[P]` solo cuando son paralelizables, usan `[USn]` únicamente dentro de fases de historias y contienen una ruta explícita de archivo o configuración.
