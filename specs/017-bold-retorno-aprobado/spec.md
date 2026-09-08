# Feature Specification: Retorno Bold aprobado sin esperar webhook

**Feature Branch**: `017-bold-retorno-aprobado`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: Al volver de Bold a `/pedido/confirmado/{code}?bold-order-id=...&bold-tx-status=approved`, la UI se queda en “Confirmando…” porque solo espera el webhook. Bold no envía webhook en modo pruebas salvo “Probar el webhook”. Objetivo: si la URL trae approved (o la API de Bold confirma el pago), persistir el pedido como pagado y mostrar “Pago aprobado”. El webhook sigue siendo fuente de verdad en producción, idempotente. No dejar “Confirmando…” eterno cuando Bold ya aprobó.

## Clarifications

### Session 2026-09-07

- Q: ¿En producción también se persiste pagado si la URL trae `approved` y el proveedor no contradice? → A: Option A — sí, en todos los entornos: `approved` en el retorno + sin rechazo verificado → persistir pagado. El webhook de producción sigue válido e idempotente.
- Q: Si el retorno trae rechazo y el proveedor no confirma nada, ¿qué hacer? → A: Option B — fuera de alcance: solo se persiste pagado con `approved`. El rechazo espera consulta o aviso asíncrono.
- Q: ¿Dónde debe verse exactamente “Pago aprobado”? → A: Option A — título y estado de la confirmación cuando está pagado. Sustituye “Pago confirmado” / “¡Pago confirmado!” en esa pantalla.

### Session 2026-09-08

- Q: ¿Qué queda como regla de 017 respecto a `bold-tx-status=approved`? → A: Option B — superado: solo la consulta al proveedor o el aviso asíncrono de Bold persisten pagado o fallido. La URL **no** es autoridad de pago (ni en pruebas ni en producción).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver “Pago aprobado” cuando Bold confirma el cobro (Priority: P1)

Como comprador que vuelve de Bold a la confirmación, quiero que el pedido se marque **pagado** y ver **“Pago aprobado”** cuando la **consulta a Bold** (o el aviso asíncrono) confirma el cobro, para no depender de un parámetro de URL falsificable ni quedarme en “Confirmando…” si Bold ya resolvió.

**Why this priority**: Cierra el hueco de confirmación sin abrir un atajo de pago desde la query.

**Independent Test**: Checkout → Bold pruebas aprobado → landing en confirmación. El servidor consulta Bold. Si Bold confirma aprobado, título y estado muestran “Pago aprobado” y el pedido queda pagado al recargar. Manipular `bold-tx-status=approved` sin confirmación de Bold MUST NOT marcar pagado.

**Acceptance Scenarios**:

1. **Given** un pedido pendiente y Bold confirma aprobado vía consulta, **When** el comprador está en la confirmación (con o sin params de retorno), **Then** el pedido se persiste como pagado y título y estado muestran “Pago aprobado”.
2. **Given** la URL trae `bold-tx-status=approved` pero la consulta a Bold no confirma aprobado (pendiente, vacío o error), **When** se reconcilia, **Then** el pedido **no** se marca pagado; puede verse “Confirmando…” de forma transitoria.
3. **Given** el pedido ya pagado por consulta o aviso asíncrono, **When** recarga la confirmación, **Then** título y estado siguen “Pago aprobado”.

---

### User Story 2 - Aviso asíncrono e idempotencia (Priority: P2)

Como operación, quiero que el aviso asíncrono de Bold marque pagado o rechazado con el mismo resultado que la consulta, **sin duplicar** efectos, y que un rechazo confirmado libere las reservas de inventario de esa orden.

**Why this priority**: Producción usa el aviso asíncrono; el rechazo no debe dejar stock apartado.

**Independent Test**: Pagado por consulta y luego aviso de aprobado → un solo pagado. Rechazo confirmado → `PAYMENT_FAILED` y reservas revertidas una sola vez (webhook y reconcile concurrentes no duplican).

**Acceptance Scenarios**:

1. **Given** el pedido ya pagado, **When** llega el aviso asíncrono de aprobado, **Then** permanece pagado sin efectos duplicados.
2. **Given** el aviso de aprobado llegó antes que la confirmación, **When** abre la página, **Then** título y estado muestran “Pago aprobado”.
3. **Given** Bold confirma rechazo, **When** query dice `approved`, **Then** el pedido **no** se marca pagado; queda fallido y se liberan las RESERVATION de esa orden (CANCELLATION compensatoria, idempotente).
4. **Given** un pedido solo bajo pedido (sin RESERVATION), **When** el rechazo se aplica, **Then** no se inventan movimientos de cancelación.

---

### User Story 3 - “Confirmando…” transitorio (Priority: P3)

Como comprador, quiero “Confirmando…” solo mientras Bold aún no resolvió, y “Pago aprobado” / “Pago rechazado” cuando hay resultado persistido.

**Independent Test**: Con params de retorno y pedido aún pendiente → Confirmando (poll acotado al servidor). Con PAID → Pago aprobado. Sin params y pendiente → pendiente legítimo.

**Acceptance Scenarios**:

1. **Given** retorno Bold y pedido aún no finalizado, **When** mira la pantalla, **Then** ve “Confirmando…” hasta que la consulta/aviso resuelvan o se agote el reintento breve.
2. **Given** retorno `rejected` y Bold aún no confirma, **When** espera, **Then** no se persiste fallido solo por la query.
3. **Given** pendiente **sin** retorno Bold, **When** abre confirmación, **Then** no se finge “Pago aprobado”.

---

### Edge Cases

- Query `approved` forjada sin confirmación de Bold → MUST NOT marcar pagado.
- Consulta Bold pendiente/error → no pagado ni fallido; Confirmando / reintento; webhook puede cerrar después.
- Código de pedido inexistente → 404 / no inventar pago.
- `bold-order-id` de otro pedido → MUST NOT aplicar ese cobro a este código.
- Recargas / doble webhook / reconcile concurrente → una transición, un notify, una liberación de reserva.
- Aviso de rechazo **después** de PAID → no deshacer pagado ni tocar inventario de esa orden.
- Pedido ya `PAYMENT_FAILED` → no segunda CANCELLATION.
- APPROVED/PAID → este alcance MUST NOT escribir CANCELLATION ni SALE.
- Copy: título y estado pagados = “Pago aprobado”. Cuerpo MAY decir “Pago confirmado” en el párrafo descriptivo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST persistir pagado **solo** cuando la consulta a Bold o el aviso asíncrono confirman aprobado. Los query params (`bold-tx-status`, `bold-order-id`) MUST NOT ser autoridad de pago. MUST NOT persistir pagado porque la URL dice `approved` si la consulta no confirma aprobado.
- **FR-002**: Pedido pagado → título y estado **“Pago aprobado”**. MUST NOT usar “Pago confirmado” / “¡Pago confirmado!” en esos rótulos.
- **FR-003**: El pagado MUST persistirse. Recargar sigue mostrando “Pago aprobado”.
- **FR-004**: Transiciones de pago MUST ser idempotentes (mismo camino consulta y aviso asíncrono; notify una vez).
- **FR-005**: El aviso asíncrono MUST seguir siendo camino válido de pagado/rechazado e idempotente.
- **FR-006**: Si Bold confirma rechazo, MUST NOT marcar pagado aunque la query diga `approved`. MUST pasar a pago fallido y, en la **misma** transacción, revertir RESERVATION de esa orden con CANCELLATION cuya cantidad deriva de las reservas reales (no asumir +1). MUST NOT duplicar CANCELLATION. MUST NOT revertir inventario en APPROVED.
- **FR-007**: MUST NOT marcar pagado un código inexistente ni cruzar pedidos.
- **FR-008**: “Confirmando…” solo mientras no hay resultado persistido tras retorno Bold. MUST NOT ser el estado final si ya está pagado.
- **FR-008b**: Query de rechazo MUST NOT, sola, persistir fallido.
- **FR-009**: Textos de esta pantalla en español.
- **FR-010**: MUST NOT romper carrito, checkout, apertura de Bold ni el aviso asíncrono.
- **FR-011**: Tras rechazo aplicado, MUST revalidar el catálogo (`/productos`, `/`, fichas afectadas) con el patrón `revalidatePath` existente. MUST NOT introducir `revalidateTag` si el proyecto no lo usa.

### Key Entities

- **Pedido**: código; pendiente / pagado / fallido.
- **Retorno Bold**: params de URL; disparador de UI/reconcile, no autoridad.
- **Consulta al proveedor**: única autoridad de cobro junto al aviso asíncrono.
- **RESERVATION / CANCELLATION**: ledger; cancelación solo en rechazo confirmado.

## Success Criteria *(mandatory)*

- **SC-001**: El 100% de las pruebas con Bold confirmando aprobado muestran “Pago aprobado” en título y estado y pedido pagado; 0 se marcan pagados solo por la query.
- **SC-002**: Recargar confirmación pagada: 100% siguen “Pago aprobado”.
- **SC-003**: Idempotencia consulta + aviso: un solo pagado, sin notify duplicado, en el 100% de las pruebas.
- **SC-004**: Query `approved` + Bold rechazo: 100% no quedan pagados; reservas de inmediata se revierten una vez.
- **SC-005**: Distinguir “Pago aprobado” vs “Confirmando…” en una mirada.

## Assumptions

- La confirmación dispara reconcile **en servidor** (sin status de pago enviado por el cliente).
- Bold API o webhook son la autoridad; la URL no lo es (clarificación 2026-09-08 B).
- Liberación de inventario solo en REJECTED confirmado; APPROVED no cambia el ledger en este alcance.
- Copy de título/estado pagado = “Pago aprobado”.
- Guest checkout y enteros COP no cambian.

## Out of Scope

- Persistir pagado o fallido solo por query.
- Implementar SALE en cobro aprobado.
- Restaurar carrito tras fallo.
- Deshacer un PAID si llega un rechazo posterior.
- `revalidateTag` / cambiar arquitectura de caché.
- Correos y admin copy.
