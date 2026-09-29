# Feature Specification: Expiración de reservas de inventario

**Feature Branch**: `028-expiracion-reservas-inventario`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "PRIORIDAD 1 — Corregir riesgos del flujo de compra. BACK-01 — Expiración de reservas de inventario. Objetivo: que una camiseta no quede bloqueada indefinidamente cuando alguien abandona el checkout. Debe implementarse: identificar reservas asociadas a órdenes PENDING_PAYMENT; definir tiempo de expiración; al expirar cancelar la orden, liberar reserva, liberar cupón si corresponde y registrar cambio en historial; no liberar si pago ya fue aprobado; hacerlo seguro e idempotente. Usa el contexto del repositorio, conserva requisitos verificables y actualiza/crea el artefacto de especificación correspondiente (spec.md según workflow). No modifiques código fuente ni implementes nada."

## Clarifications

### Session 2026-09-26

- Q: ¿Cómo se determina el vencimiento y cómo se ejecuta la limpieza? → A: Cada reserva tiene vencimiento individual; un cron/job programado evalúa las reservas; el plazo es de 30 minutos desde la creación del movimiento de reserva.
- Q: ¿Qué alcance tiene la expiración de una reserva? → A: Si expira una reserva, se cancela toda la orden y se liberan todas sus reservas activas.
- Q: ¿Cómo se manejan los fallos durante el procesamiento? → A: Se registran, se hace rollback de esa orden y se permite reintento.

## User Scenarios & Testing

### User Story 1 - Liberar inventario abandonado (Priority: P1)

Como responsable de operaciones, quiero que las órdenes que permanecen pendientes de pago más allá del plazo permitido liberen sus reservas de camisetas, para que el inventario vuelva a estar disponible y no se bloquee por checkouts abandonados.

**Why this priority**: El inventario reservado reduce directamente la disponibilidad para otros clientes y puede impedir ventas. Es el riesgo prioritario del flujo de compra.

**Independent Test**: Crear una orden `PENDING_PAYMENT` con reservas de inventario, avanzar el reloj hasta el vencimiento individual de uno de sus movimientos `RESERVATION` y ejecutar el cron/job de expiración; se debe observar la orden cancelada, todas sus reservas activas liberadas y el historial actualizado.

**Acceptance Scenarios**:

1. **Given** una orden `PENDING_PAYMENT` con una reserva cuyo movimiento `RESERVATION` fue creado hace 30 minutos o más, **When** se procesa la expiración, **Then** la orden pasa a `CANCELLED`, se liberan todas sus reservas activas y las unidades vuelven a estar disponibles.
2. **Given** una orden `PENDING_PAYMENT` aún dentro de los 30 minutos, **When** se ejecuta el proceso, **Then** la orden y sus reservas permanecen sin cambios.
3. **Given** una orden elegible con un cupón reservado, **When** expira, **Then** la reserva del cupón se libera con una razón de expiración y el cupón vuelve a contar como disponible.

### User Story 2 - Proteger pagos aprobados (Priority: P1)

Como cliente que ya completó el pago, quiero que una ejecución tardía de limpieza no cancele mi orden ni revierta su inventario, para conservar una compra aprobada aunque el proceso de expiración se ejecute concurrentemente.

**Why this priority**: Una liberación posterior a un pago aprobado causaría pérdida de inventario, inconsistencias contables y una experiencia de compra incorrecta.

**Independent Test**: Crear una orden pendiente, aprobar su pago y ejecutar la expiración antes, durante y después de un intento de limpieza; verificar que permanece `PAID`, no se generan cancelaciones y las reservas no se liberan.

**Acceptance Scenarios**:

1. **Given** una orden `PAID` o una orden cuyo pago fue aprobado antes de confirmar la expiración, **When** el proceso intenta expirar la orden, **Then** no cambia su estado, no crea movimientos de cancelación y no libera un cupón confirmado.
2. **Given** una orden pendiente que cambia a `PAID` mientras se identifica para expiración, **When** se aplica el resultado, **Then** la operación revalida el estado y deja intacta la orden aprobada.

### User Story 3 - Auditar y repetir la limpieza con seguridad (Priority: P2)

Como responsable de operaciones, quiero que la expiración deje trazabilidad y pueda reintentarse sin duplicar liberaciones, para detectar fallos y ejecutar limpiezas periódicas sin riesgo.

**Why this priority**: El proceso puede interrumpirse o recibir ejecuciones superpuestas; la idempotencia evita inventario artificial y facilita la recuperación operativa.

**Independent Test**: Ejecutar dos veces la expiración sobre la misma orden, incluyendo una ejecución parcial simulada; verificar que el resultado final es único y que el historial explica la transición.

**Acceptance Scenarios**:

1. **Given** una orden ya `CANCELLED` por expiración, **When** se vuelve a ejecutar la limpieza, **Then** no se crean movimientos, cambios de estado ni liberaciones de cupón adicionales.
2. **Given** una orden expirada, **When** se consulta su historial, **Then** aparece un cambio atribuible a expiración con fecha, motivo y referencia de la orden.

### Edge Cases

- Una orden sin movimientos de reserva vigentes debe poder cancelarse una sola vez sin crear una liberación negativa o duplicada.
- Si existen varias líneas o variantes, cada reserva vigente debe liberarse con su cantidad correspondiente; no se debe liberar más que lo reservado.
- Una orden `PAYMENT_FAILED` o ya `CANCELLED` puede quedar fuera del conjunto pendiente, pero cualquier reserva residual debe resolverse sin duplicar movimientos.
- Si el vencimiento ocurre exactamente en el límite de 30 minutos, se considera elegible para expiración.
- Un cupón ya `CONFIRMED` no se libera; un cupón `RESERVED` se libera solamente junto con la cancelación de la orden.
- Un fallo durante el procesamiento de una orden no debe marcarla como resuelta parcialmente sin dejar un resultado reintentable y auditable.
- La limpieza debe tolerar ejecuciones concurrentes y resultados repetidos sin liberar una misma reserva dos veces.

## Requirements

### Functional Requirements

- **FR-001**: El sistema MUST asignar y evaluar un vencimiento individual para cada reserva, calculado como 30 minutos desde la creación de su movimiento `RESERVATION`, y detectar las reservas cuyo vencimiento haya llegado.
- **FR-002**: El sistema MUST ejecutar la evaluación mediante un cron/job programado y tratar una reserva como expirada cuando el tiempo actual sea igual o posterior a su vencimiento individual.
- **FR-003**: Si una reserva de una orden es elegible para expiración, el sistema MUST cancelar la orden y liberar todas sus reservas activas, exactamente por variante y cantidad, dentro de una única transición coherente.
- **FR-004**: La liberación MUST registrarse como movimiento de inventario auditable asociado a la orden, conservando cantidad, variante, fecha y motivo de expiración.
- **FR-005**: Si la orden tiene una reserva de cupón en estado `RESERVED`, el sistema MUST cambiarla a `RELEASED`, guardar fecha y razón de expiración, y permitir que el cupón vuelva a estar disponible.
- **FR-006**: El sistema MUST bloquear la expiración cuando la orden está `PAID` o cuando existe evidencia de aprobación de pago; no debe liberar inventario ni cupones confirmados en ese caso.
- **FR-007**: Antes de aplicar una cancelación identificada previamente, el sistema MUST revalidar el estado actual de la orden y las reservas para evitar actuar sobre un pago aprobado concurrentemente.
- **FR-008**: El sistema MUST ser idempotente: repetir la operación sobre una orden ya cancelada o ya resuelta no debe crear movimientos, cambios de historial ni liberaciones de cupón adicionales.
- **FR-009**: El sistema MUST conservar en el historial de la orden un registro de la cancelación por expiración, incluyendo fecha, estado anterior, estado nuevo y motivo.
- **FR-010**: Si falla el procesamiento de una orden, el sistema MUST registrar el fallo, revertir mediante rollback los cambios de esa orden y permitir reintentarla sin perder la capacidad de completar o auditar la liberación pendiente.
- **FR-011**: El proceso MUST producir un resultado operativo por orden procesada (expirada, omitida por no elegible, ya resuelta o fallida) sin exponer datos sensibles del cliente.
- **FR-012**: El plazo de expiración MUST ser configurable para operaciones futuras y tener 30 minutos como valor inicial documentado.

### Key Entities

- **Orden**: Compra con estado de ciclo de vida, fecha de creación, importe y referencia para enlazar reservas, pagos y su historial.
- **Movimiento de inventario**: Registro inmutable de una reserva o liberación por variante y cantidad; permite reconstruir disponibilidad sin sobrescribir el pasado.
- **Reserva de cupón**: Uso temporal asociado a una orden, con estado `RESERVED`, `CONFIRMED` o `RELEASED`, vencimiento y motivo de liberación.
- **Historial de estado de orden**: Registro auditable de cada transición, incluyendo la cancelación por expiración.
- **Variante de camiseta**: Unidad vendible cuya disponibilidad se ve afectada por las reservas y liberaciones.

## Success Criteria

### Measurable Outcomes

- **SC-001**: El 100% de las órdenes `PENDING_PAYMENT` con al menos una reserva cuyo movimiento `RESERVATION` haya alcanzado 30 minutos queda cancelado y con todas sus reservas activas liberadas en la siguiente ejecución del cron/job.
- **SC-002**: El 100% de las órdenes con pago aprobado antes de la aplicación permanecen `PAID` y conservan sus reservas; no se genera ninguna liberación indebida en las pruebas de concurrencia.
- **SC-003**: En pruebas de repetición y concurrencia, cada reserva de inventario y cada reserva de cupón produce como máximo una liberación efectiva.
- **SC-004**: El 100% de las cancelaciones por expiración consultables contiene un registro de historial con motivo, fecha y referencia de orden.
- **SC-005**: La disponibilidad de una variante liberada se refleja para nuevos checkouts dentro de 1 minuto desde la finalización exitosa de la limpieza.
- **SC-006**: Las pruebas operativas pueden distinguir al menos 99% de los resultados como expirados, omitidos, ya resueltos o fallidos, sin revisar registros internos de implementación.

## Assumptions

- Cada reserva tiene un vencimiento individual de 30 minutos desde la creación de su movimiento `RESERVATION`; operaciones podrá ajustar este plazo posteriormente.
- La creación de la orden ya genera reservas de inventario identificables mediante la referencia de la orden y mantiene el pago aprobado como autoridad del estado `PAID`.
- Los importes y cantidades se conservan como enteros y la disponibilidad se deriva del historial de movimientos, conforme a la constitución del proyecto.
- La limpieza se ejecuta mediante un cron/job programado y puede procesar más de una orden; el alcance no incluye rediseñar el checkout ni cambiar el proveedor de pagos.
- El proceso no elimina órdenes, movimientos, usos de cupón ni historial; únicamente agrega transiciones y liberaciones auditables.
- Las órdenes sin cupón no requieren una operación de liberación de cupón.
- La resolución de una carrera entre pago y expiración favorece siempre el pago aprobado cuando este fue confirmado antes de la aplicación final de la expiración.
- La expiración de cualquier reserva activa cancela la orden completa y libera todas las reservas activas asociadas; un fallo revierte los cambios de esa orden, queda registrado y puede reintentarse.
