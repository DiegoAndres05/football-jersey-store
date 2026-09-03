# Tasks: Modalidad de entrega y notificaciones de pedidos

**Input**: Documentos de diseño en `specs/001-modalidad-entrega-notificaciones/`

**Prerequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/admin-notifications.md`

**Estrategia de pruebas**: Las pruebas son obligatorias para esta feature porque cambia reglas de negocio, persistencia, autorización y workflows. Se reutilizan y amplían las pruebas enfocadas existentes, y se agregan pruebas de contrato, integración y servicio donde no existe cobertura.

## Phase 1: Setup (Shared Infrastructure)

**Objetivo**: Preparar las rutas y herramientas de trabajo sin duplicar la modalidad, carrito, checkout, pago mock ni control `allowsBackorder` ya implementados.

- [X] T001 Verificar en `package.json` los comandos `test`, `build` y `lint`, y documentar en `specs/001-modalidad-entrega-notificaciones/quickstart.md` cualquier ajuste de ejecución necesario para las pruebas nuevas
- [X] T002 [P] Crear la estructura de módulos server-only para notificaciones en `src/features/notifications/ports/notification-transport.ts`, `src/features/notifications/services/notification-service.ts` y `src/features/notifications/telegram/telegram-adapter.ts`
- [X] T003 [P] Crear los archivos de pruebas enfocados `tests/orders-admin.test.ts` y `tests/notifications.test.ts` con imports y fixtures compartidos compatibles con `tests/helpers.test.ts`

## Phase 2: Foundational (Blocking Prerequisites)

**Objetivo**: Dejar lista la base persistente, tipada y de autorización que necesitan las tres historias.

- [X] T004 Extender `prisma/schema.prisma` con `NotificationAttempt`, su relación no cascada con `Order`, estados operativos, índice por `(orderId, channel, eventKey)` y unicidad de `idempotencyKey`
- [X] T005 Crear la migración Prisma `prisma/migrations/20260903000000_add_notification_attempt/migration.sql` exclusivamente para `NotificationAttempt`, sin modificar `OrderItem.deliveryMode` ni `ProductVariant.allowsBackorder`
- [X] T006 [P] Definir los tipos y validadores de modalidad, resumen, filtros, resultado de retry y evento de notificación en `src/features/orders/types/admin-order-types.ts` y `src/features/notifications/types/notification-types.ts`
- [X] T007 [P] Añadir la lectura server-only de `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`, sin valores fallback en producción ni exposición al cliente, en `src/features/notifications/config/telegram-config.ts`
- [X] T008 Verificar y reutilizar la autorización de `src/features/auth/server/session.ts` en las futuras consultas y acciones administrativas, dejando explícito que las rutas de notificación no son públicas

## Phase 3: User Story 1 - Elegir modalidad por camiseta (Priority: P1) [MVP]

**Objetivo**: Confirmar que la selección existente por línea llega al pedido vigente con validación, snapshot y reserva correctos, aplicando solo los ajustes requeridos por el plan.

**Prueba independiente**: Con variantes con stock, sin stock y con `allowsBackorder` habilitado o deshabilitado, completar un carrito mixto y comprobar modalidad por línea, rechazo de modalidad ausente/no elegible, recálculo final y reserva solo de `INMEDIATA`.

### Tests for User Story 1

- [X] T009 [P] [US1] Ampliar `tests/delivery-mode.test.ts` para cubrir etiquetas y expectativas de plazo de ambas modalidades, modalidad no elegible y la ausencia de opciones cuando no hay stock ni `allowsBackorder`
- [X] T010 [P] [US1] Ampliar `tests/plan-inventory-movements.test.ts` para verificar que un carrito mixto reserva únicamente líneas `INMEDIATA` y que `BAJO_PEDIDO` no consume stock físico
- [X] T011 [US1] Crear `tests/order-repository.test.ts` para verificar snapshot de `OrderItem.deliveryMode`, rechazo de modalidad inválida/no elegible y ausencia de pedido o reserva inconsistente cuando falla la validación final

### Implementation for User Story 1

- [X] T012 [US1] Revisar y ajustar únicamente la validación final y el recálculo de `src/features/orders/repositories/order-repository.ts` para conservar selección por línea, precios, envío, stock y `OrderItem.deliveryMode` sin duplicar lógica existente
- [X] T013 [US1] Revisar y ajustar la integración de `src/features/checkout/components/checkout-page-client.tsx` y `src/features/checkout/schemas/checkout-schema.ts` para mantener datos del checkout, modalidad seleccionada y mensajes comprensibles ante cambios de disponibilidad
- [X] T014 [US1] Verificar el flujo de pago mock en `src/features/payments/services/mock-payment.ts` y `src/features/checkout/components/checkout-page-client.tsx` sin cambiar su proveedor, asegurando que el pedido solo se envíe después de pago confirmado

**Checkpoint**: US1 queda funcional y verificable sin depender de admin ni Telegram; la modalidad existente no se reimplementa.

## Phase 4: User Story 2 - Consultar modalidad en administración (Priority: P1)

**Objetivo**: Exponer listado, filtro, detalle, resumen mixto, históricos y retry autorizado sin alterar datos históricos ni lifecycle del pedido.

**Prueba independiente**: Crear pedidos inmediatos, bajo encargo y mixtos, consultar el listado y detalle con sesión admin, filtrar inclusivamente por cada modalidad y abrir un pedido histórico sin snapshot para ver `NO_DISPONIBLE`.

### Tests for User Story 2

- [X] T015 [P] [US2] Crear pruebas de contrato para `listOrders` y `retryOrderNotification` en `tests/orders-admin.test.ts`, cubriendo tipos de filtro, resumen derivado, resultado público estable y rechazo de pedido desconocido o sesión no autorizada
- [X] T016 [US2] Añadir fixtures de pedidos mixtos e históricos sin modalidad en `tests/orders-admin.test.ts` para verificar etiquetas por línea, `hasImmediate`, `hasBackorder`, `isMixed`, filtro inclusivo y `NO_DISPONIBLE` sin inferencia
- [X] T017 [US2] Verificar en `tests/orders-admin.test.ts` que retry no cambia estado, pago, importes, inventario, líneas ni modalidades y que no permite retry de un intento `SENT`

### Implementation for User Story 2

- [X] T018 [US2] Implementar la proyección y consulta inclusiva de pedidos en `src/features/orders/repositories/admin-order-repository.ts`, trayendo snapshots por línea y derivando `DeliverySummary` sin consultar stock o catálogo para reinterpretar históricos
- [X] T019 [US2] Implementar las acciones server-side autorizadas `listOrders` y `retryOrderNotification` en `src/features/orders/server/admin-order-actions.ts`, validando inputs con Zod y devolviendo errores públicos estables
- [X] T020 [US2] Crear el listado administrativo con filtro por modalidad y acceso al detalle en `src/app/admin/(dashboard)/pedidos/page.tsx`, respetando la sesión admin y mostrando pedidos mixtos en ambos filtros
- [X] T021 [US2] Crear el detalle administrativo en `src/app/admin/(dashboard)/pedidos/[id]/page.tsx` con producto, variante, talla, cantidad, personalización, modalidad, resumen mixto y estado del aviso
- [X] T023 [US2] Integrar la navegación de pedidos en `src/components/layout/admin-layout.tsx` y comprobar que pedidos históricos sin modalidad muestran `NO_DISPONIBLE` explícitamente

**Checkpoint**: US2 queda funcional con listado, detalle, filtro inclusivo, históricos y retry protegido, incluso si Telegram no está disponible.

## Phase 5: User Story 3 - Recibir aviso de nueva compra (Priority: P2)

**Objetivo**: Registrar y enviar un único aviso Telegram después de pedido creado y pago confirmado, con fallos no bloqueantes, persistencia auditable, retry e idempotencia.

**Prueba independiente**: Con transporte mock, ejecutar una compra pagada con Telegram configurado, ausente, con timeout y con error HTTP; comprobar estados, contenido, persistencia, ausencia de secretos, continuidad del checkout y como máximo un éxito por evento.

### Tests for User Story 3

- [X] T024 [US3] Crear pruebas unitarias en `tests/notifications.test.ts` para formatter, configuración incompleta, payload `sendMessage`, estados `SENT`, `FAILED` y `NOT_CONFIGURED`, timeout/HTTP error y redacción de secretos o PII innecesaria
- [X] T025 [US3] Crear pruebas de contrato del puerto en `tests/notifications.test.ts` para transporte inyectable, respuesta de referencia del proveedor y errores normalizados sin depender de red real
- [X] T026 [US3] Crear pruebas de integración de persistencia en `tests/notifications.test.ts` para transición `PENDING` a resultado, contador/timestamps, clave única, intento concurrente, retry de estados no exitosos y terminalidad de `SENT`
- [X] T027 [US3] Crear pruebas de workflow en `tests/order-notification.test.ts` para aviso posterior a `createOrder` y pago mock confirmado, fallo no bloqueante, no duplicación por reintento y conservación de pedido, total, líneas, reservas y modalidades

### Implementation for User Story 3

- [X] T028 [US3] Implementar el puerto server-only y el formatter de eventos en `src/features/notifications/ports/notification-transport.ts` y `src/features/notifications/services/notification-formatter.ts`, incluyendo código, fecha, estado inicial, total, cliente mínimo y modalidad de cada línea
- [X] T029 [US3] Implementar el adaptador Telegram en `src/features/notifications/telegram/telegram-adapter.ts` usando `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `fetch` inyectable y `sendMessage`, normalizando timeout, HTTP y errores Telegram sin filtrar secretos
- [X] T030 [US3] Implementar persistencia, claim/reconciliación idempotente y transiciones de `NotificationAttempt` en `src/features/notifications/repositories/notification-attempt-repository.ts`, con una clave estable para `orderId`, `TELEGRAM` y `ORDER_CREATED_PAID`
- [X] T031 [US3] Implementar el servicio de notificación y retry en `src/features/notifications/services/notification-service.ts`, permitiendo solo retry de `FAILED`/`NOT_CONFIGURED`, devolviendo `ALREADY_SENT` para `SENT` y registrando errores resumidos sin secretos
- [X] T032 [US3] Integrar el efecto secundario no bloqueante en `src/features/checkout/components/checkout-page-client.tsx` y `src/features/orders/server/order-actions.ts` para ejecutarlo solo después de `createOrder` correcto y pago mock confirmado, sin revertir ni duplicar el pedido
- [X] T033 [US3] Conectar `retryOrderNotification` de `src/features/orders/server/admin-order-actions.ts` con `src/features/notifications/services/notification-service.ts`, manteniendo autorización admin y sin mutar `Order`, `OrderItem` o inventario

**Checkpoint**: US3 queda funcional con configuración segura, mensaje Telegram, estados persistidos, fallos recuperables, retry autorizado e idempotencia.

## Phase 6: Polish & Cross-Cutting Concerns

**Objetivo**: Validar la feature completa, documentación operativa y regresiones antes de considerarla terminada.

- [X] T035 [P] Actualizar `specs/001-modalidad-entrega-notificaciones/quickstart.md` con comandos, fixtures, variables server-only, escenarios de Telegram mock y comprobación de históricos/retry
- [X] T036 [P] Actualizar `ARCHITECTURE.md` y `DECISIONS.md` con el límite de `src/features/notifications`, `NotificationAttempt`, idempotencia y la regla de que Telegram no bloquea checkout
- [X] T037 Ejecutar la validación enfocada `npm test -- --test-name-pattern='delivery|order|notification'` y corregir únicamente regresiones de esta feature en `tests/delivery-mode.test.ts`, `tests/plan-inventory-movements.test.ts`, `tests/order-repository.test.ts`, `tests/orders-admin.test.ts` y `tests/notifications.test.ts`
- [X] T038 Ejecutar los gates completos en orden `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`, documentando resultados o bloqueos en `specs/001-modalidad-entrega-notificaciones/quickstart.md`
- [X] T039 Ejecutar la revisión de seguridad y contrato sobre `src/features/notifications/config/telegram-config.ts`, `src/features/notifications/telegram/telegram-adapter.ts`, `src/features/orders/server/admin-order-actions.ts` y `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`, verificando server-only, autorización, redacción y no exposición de secretos

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No depende de otra fase; T002 y T003 pueden ejecutarse en paralelo, y T001 es independiente.
- **Foundational (Phase 2)**: Depende de Setup; T004-T005 deben preceder persistencia de notificaciones, T006-T008 pueden avanzar en paralelo cuando no modifiquen los mismos archivos.
- **User Stories**: Todas dependen de Foundational. US1 y US2 pueden comenzar en paralelo porque US1 verifica checkout existente y US2 consulta snapshots; US3 depende de que el contrato de pedido y el acceso admin estén definidos, por lo que se recomienda iniciar después de T012 y T019 aunque sus pruebas unitarias puedan prepararse antes.
- **Polish**: Depende de las historias que se quieran entregar y de sus checkpoints.

### User Story Dependencies

- **US1 (P1)**: Depende de Phase 2; no requiere US2 ni US3.
- **US2 (P1)**: Depende de Phase 2 y de que exista el snapshot de `OrderItem.deliveryMode` validado por US1; su proyección no depende de Telegram.
- **US3 (P2)**: Depende de Phase 2, integra el resultado de creación/pago de US1 y reutiliza la autorización y detalle de US2 para retry/estado.

### Parallel Opportunities

- En Setup, T002 y T003 son paralelizables porque trabajan en archivos distintos.
- En Foundational, T006 y T007 son paralelizables; T004 y T005 son secuenciales por depender del esquema Prisma.
- En US1, T009 y T010 son paralelizables; T011 debe ejecutarse antes de ajustar el repositorio.
- En US2, T015 precede a T016 porque comparten `tests/orders-admin.test.ts`; T018 precede a T019 y la UI de T020/T021 puede avanzar después del contrato de proyección.
- En US3, T024-T026 son secuenciales porque comparten `tests/notifications.test.ts`; T027 debe esperar al contrato de lifecycle. T028 y T029 pueden avanzar en paralelo; T030 precede a T031.
- T035 y T036 son paralelizables con el cierre técnico, pero T037-T039 deben ejecutarse después de las implementaciones.

## Parallel Example: User Story 1

```text
Task T009: Ampliar tests/delivery-mode.test.ts
Task T010: Ampliar tests/plan-inventory-movements.test.ts
```

## Parallel Example: User Story 2

```text
Task T015: Pruebas de contrato en tests/orders-admin.test.ts
Task T016: Fixtures de pedidos mixtos e históricos en tests/orders-admin.test.ts
```

## Parallel Example: User Story 3

```text
Task T024: Pruebas unitarias en tests/notifications.test.ts
Task T025: Pruebas del puerto en tests/notifications.test.ts
Task T027: Pruebas de workflow en tests/order-notification.test.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Ejecutar T009-T014 para verificar el checkout existente sin reimplementarlo.
3. Validar US1 de forma independiente con `tests/delivery-mode.test.ts`, `tests/order-repository.test.ts` y `tests/plan-inventory-movements.test.ts`.
4. Detenerse en el checkpoint: el MVP mínimo demuestra modalidad por línea, snapshot y reserva correcta; US2 y US3 son incrementos posteriores.

### Incremental Delivery

1. Añadir US1 y validar el flujo de compra.
2. Añadir US2 y validar listado, detalle, filtro inclusivo, mixtos e históricos.
3. Añadir US3 y validar Telegram, persistencia, fallos, retry e idempotencia.
4. Ejecutar Polish y todos los gates antes de integrar.

### Parallel Team Strategy

1. Completar Setup y Foundational juntos.
2. Un desarrollador puede cerrar US1 mientras otro prepara US2; US3 comienza con sus pruebas de formatter/adaptador mientras se estabiliza el contrato de pedidos.
3. Integrar por checkpoint y ejecutar los gates completos al final de cada incremento.

## Notes

- Cada tarea cumple el formato `- [ ] T### [P?] [US#]? Descripción con ruta exacta`.
- `[P]` se usa únicamente en tareas sin dependencia de trabajo incompleto en otra tarea y con superficies de archivo separables.
- La migración solo se incluye porque `plan.md` exige persistencia durable de `NotificationAttempt`.
- No se crean tareas para reimplementar selección por línea, carrito, checkout, `OrderItem.deliveryMode`, reserva inmediata o `allowsBackorder`; solo se verifican o ajustan donde el plan exige integración.