# Implementation Plan: Modalidad de entrega y notificaciones de pedidos

**Branch**: `001-modalidad-entrega-notificaciones` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-modalidad-entrega-notificaciones/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Completar la visibilidad administrativa de la modalidad ya persistida por línea y añadir notificaciones internas por Telegram después de pedido creado y pago confirmado. Se conservan `OrderItem.deliveryMode` y `ProductVariant.allowsBackorder`; el cambio añade consulta/filtro admin, contrato server-only y persistencia auditable e idempotente de intentos.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript, Next.js 16 App Router, React 18

**Primary Dependencies**: Prisma 5, PostgreSQL/Supabase, Zod, Next Server Actions, Node `fetch`

**Storage**: PostgreSQL/Supabase via Prisma; existing `Order`/`OrderItem` plus notification-attempt history

**Testing**: Node test runner via `tsx`, focused unit/integration tests, TypeScript, lint, build

**Target Platform**: Next.js server y browser clients, con variables server-only

**Project Type**: Full-stack web application con checkout invitado y dashboard admin autenticado

**Performance Goals**: checkout no espera a Telegram; avisos configurados quedan encaminados en menos de 60 segundos mediante intento/reintento

**Constraints**: importes COP enteros; secretos fuera de cliente y DB; fallos de notificación no revierten pedidos; no hay pasarela real en MVP

**Scale/Scope**: un canal Telegram y destinatario inicial, un evento de compra por pedido, dashboard y pedidos históricos existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. La notificación vive en `src/features/notifications`; consultas y acciones de órdenes permanecen en `orders`.
- **II. Auditable integrity**: PASS. Se conservan snapshots e inventario; los intentos son historial operativo separado.
- **III. Typed contracts**: PASS. Zod y tipos explícitos validan filtros, comandos y respuestas del proveedor.
- **IV. Least privilege**: PASS. `getSessionUser` protege administración; las variables Telegram son server-only y no se persisten.
- **V. Verified delivery**: PASS. Se planifican pruebas de modalidad, admin, mock Telegram, fallos, reintentos, idempotencia e históricos.
- **Exception**: la tabla de intentos está justificada por FR-013 a FR-015; un log en memoria no sobrevive reinicios ni permite reintentos seguros.

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── app/admin/(dashboard)/                 # UI de listado y detalle admin
├── features/orders/                       # proyecciones, filtros y acciones
├── features/notifications/                # puerto, formatter y servicio Telegram
├── features/checkout/                     # integración post-pago
├── features/payments/                     # proveedor mock existente
├── shared/                                # tipos/configuración compartidos
└── lib/prisma.ts                          # cliente Prisma

tests/
├── delivery-mode.test.ts
├── orders-admin.test.ts
└── notifications.test.ts

```

**Structure Decision**: Mantener el monolito Next.js organizado por bounded contexts. La UI sigue en `src/app/admin`; el dominio queda en `features/orders` y la nueva `features/notifications`. No se crea una API pública adicional: Server Actions y servicios server-only son la frontera existente.

## Design

1. **Admin order projection**: ampliar la consulta existente para traer `deliveryMode` de cada `OrderItem`, derivar `hasImmediate`, `hasBackorder` e `isMixed`, y aceptar filtro inclusivo por modalidad. Un pedido histórico sin snapshot se muestra como `NO_DISPONIBLE`, nunca se infiere de stock o catálogo.
2. **Order detail and retry**: añadir detalle admin con modalidad junto a producto/variante/talla/cantidad/personalización, resumen por modalidad y estado de notificación. La acción de retry requiere sesión admin y no edita `Order` ni `OrderItem`.
3. **Notification port**: crear servicio en `src/features/notifications` con formatter y adaptador Telegram. Lee `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` solo en servidor; ausencia de cualquiera produce `NOT_CONFIGURED`. El transporte mockeable normaliza timeout, HTTP y errores Telegram.
4. **Lifecycle**: el mock payment sigue confirmando el pago. Solo después de `createOrder` correcto se intenta notificar; el intento queda fuera de la transacción del pedido, por lo que Telegram no bloquea ni revierte checkout. Una clave única por `orderId` y evento evita duplicados concurrentes.
5. **Persistence**: agregar migración Prisma solo para `NotificationAttempt` con pedido, canal, evento/idempotency key, estado, timestamps, referencia del proveedor, error resumido y contador. No se guardan token/chat ID ni se cambia `OrderItem.deliveryMode` o `ProductVariant.allowsBackorder`.
6. **Operational behavior**: estados `PENDING`, `SENT`, `FAILED`, `NOT_CONFIGURED`; errores resumidos sin secretos ni PII innecesaria. Solo estados no exitosos son reintentables y cada evento admite como máximo un éxito.

## Implementation Order

1. Añadir modelo de intentos, migración e identificadores tipados de estado/idempotencia.
2. Implementar proyección, detalle, filtro y acción admin autorizada.
3. Implementar formatter/adaptador Telegram con configuración de entorno y transporte mockeable.
4. Integrar la orquestación post-pedido/post-mock-payment sin cambiar la selección ni el proveedor de pago.
5. Añadir pruebas enfocadas y ejecutar suite, typecheck, lint y build.

## Post-Design Constitution Check

- **I. Domain boundaries**: PASS. Notification ownership es explícito y la integración con órdenes es una llamada estrecha.
- **II. Auditable integrity**: PASS. Los intentos son historial operativo; snapshots e inventario siguen siendo la fuente de verdad.
- **III. Typed contracts**: PASS. Filtros, comandos, payload Telegram y estados persistidos tienen tipos y validación de frontera.
- **IV. Least privilege**: PASS. Solo admins autenticados consultan/reintentan; secretos permanecen server-only.
- **V. Verified delivery**: PASS. El diseño cubre pruebas enfocadas y gates de suite, tipos, lint y build, manteniendo aislado el mock payment.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| Tabla de intentos y servicio de retry | FR-013 a FR-015 exigen auditoría durable, recuperación e idempotencia tras reinicios/concurrencia | Log o flag en memoria pierde estado y no permite retry admin seguro |
