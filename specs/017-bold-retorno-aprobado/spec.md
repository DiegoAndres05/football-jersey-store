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

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver “Pago aprobado” al volver de Bold sin webhook (Priority: P1)

Como comprador que acaba de pagar en Bold (sobre todo en modo pruebas, donde el aviso asíncrono no llega) y es redirigido a la confirmación con `bold-tx-status=approved`, quiero que el pedido quede **pagado** y ver **“Pago aprobado”**, para no quedar mirando “Confirmando…” como si el cobro no hubiera ocurrido.

**Why this priority**: Es el fallo reportado: Bold ya aprobó y el comprador no recibe confirmación. Bloquea QA en pruebas y genera soporte en cualquier entorno donde el aviso asíncrono no llegue a tiempo o no se envíe.

**Independent Test**: Completar un pago de prueba aprobado, aterrizar en `/pedido/confirmado/{code}?bold-order-id=…&bold-tx-status=approved` **sin** disparar el aviso asíncrono de Bold. El **título** y el **estado** muestran “Pago aprobado” (no “Confirmando…” ni “Pago confirmado” como esos rótulos) y, al recargar, el pedido sigue pagado.

**Acceptance Scenarios**:

1. **Given** un pedido pendiente de pago y un retorno de Bold con `bold-tx-status=approved` (y `bold-order-id` si aplica), **When** el comprador abre la confirmación y Bold **no** envió el aviso asíncrono, **Then** el pedido se persiste como pagado y el **título** y el **estado** muestran “Pago aprobado”.
2. **Given** el mismo retorno aprobado, **When** la consulta al proveedor también confirma el pago, **Then** el pedido queda pagado una sola vez y el título y el estado muestran “Pago aprobado”.
3. **Given** el pedido ya persistido como pagado por ese retorno, **When** el comprador recarga la confirmación, **Then** título y estado siguen “Pago aprobado” (no un mensaje temporal).

---

### User Story 2 - El aviso asíncrono de producción sigue siendo válido e idempotente (Priority: P2)

Como operación de la tienda, quiero que el aviso asíncrono de Bold en producción siga marcando el pedido como pagado (o rechazado) con el **mismo** resultado que el retorno, **sin duplicar** efectos, para que el webhook siga siendo la fuente de verdad **cuando llega** y no pelee con un pagado ya persistido por el retorno.

**Why this priority**: Cierra el hueco de pruebas sin romper el canal de producción ni el historial de pedido.

**Independent Test**: Marcar pagado desde el retorno y luego aplicar el mismo resultado por aviso asíncrono (o al revés): un solo estado pagado, un solo conjunto de efectos post-pago (p. ej. notificación), historial coherente.

**Acceptance Scenarios**:

1. **Given** el pedido ya pagado por el retorno aprobado, **When** llega el aviso asíncrono de aprobado, **Then** el pedido permanece pagado y no se duplican efectos post-pago.
2. **Given** el aviso asíncrono de aprobado llegó antes que el comprador abra la confirmación, **When** abre `/pedido/confirmado/{code}` con o sin params de retorno, **Then** el título y el estado muestran “Pago aprobado”.
3. **Given** un pago rechazado confirmado por el proveedor, **When** la query dice `approved`, **Then** el pedido **no** se marca pagado; prevalece el resultado verificado del proveedor (rechazo).

---

### User Story 3 - “Confirmando…” solo mientras no hay aprobación (Priority: P3)

Como comprador en la confirmación, quiero que “Confirmando…” sea un estado **breve** y solo si el pago aún no está resuelto, para no interpretarlo como un cobro eterno o fallido cuando Bold ya devolvió `approved`.

**Why this priority**: Es el síntoma visible; se puede verificar aparte de los detalles de persistencia.

**Independent Test**: Con retorno `approved`, la confirmación no termina en “Confirmando…”. Sin señal de aprobado y sin resultado del proveedor, puede mostrar confirmación en curso un tiempo corto, no de forma indefinida como estado final esperado.

**Acceptance Scenarios**:

1. **Given** la URL de confirmación incluye `bold-tx-status=approved`, **When** termina la carga (o un reintento breve), **Then** la UI **no** queda en “Confirmando…”: título y estado muestran “Pago aprobado” si el pedido se marcó pagado.
2. **Given** retorno Bold **sin** `approved` (incluido `rejected`/`failed`) y el proveedor aún no tiene resultado final, **When** el comprador espera, **Then** puede ver “Confirmando…” de forma transitoria; esta entrega MUST NOT persistir pago fallido solo por esa query. **MUST NOT** usarse “Confirmando…” como pantalla permanente cuando el retorno ya traía `approved`.
3. **Given** un pedido pendiente **sin** retorno Bold, **When** abre la confirmación, **Then** no se finge “Pago aprobado”; puede seguir el copy de pendiente legítimo.

---

### Edge Cases

- Retorno `approved` sin aviso asíncrono y sin resultado útil de la consulta al proveedor (pruebas o producción) → persistir pagado para **ese** código de pedido (si está pendiente) y mostrar “Pago aprobado”.
- Retorno `approved` y consulta al proveedor también aprobado → un solo marcado de pagado (idempotente).
- Query `approved` forjada pero la consulta al proveedor confirma **rechazo** → no marcar pagado; prevalece el rechazo verificado.
- Código de pedido inexistente o que no coincide con la confirmación → no inventar un pago.
- El `bold-order-id` de la URL no debe marcar **otro** pedido; el pago aplica solo al código de la ruta de confirmación.
- Aviso asíncrono de aprobado después del retorno → no-op / idempotente.
- Aviso asíncrono de rechazo **después** de que el retorno ya marcó pagado → no deshacer el pagado en este alcance (el pedido ya no está pendiente); no corromper historial.
- Recargas repetidas de la misma URL con `approved` → siguen mostrando pagado, sin efectos duplicados.
- Pedido que nunca pasó por Bold → fuera de este arreglo; no se marca pagado.
- Retorno `rejected`/`failed` (u otro no-`approved`) sin consulta ni aviso asíncrono que confirmen el rechazo → MUST NOT persistir pago fallido en este alcance; puede seguir confirmando/pendiente hasta que el proveedor o el webhook resuelvan (regla de `015`).
- Copy de confirmación pagada: el **título** y el **estado** MUST ser **“Pago aprobado”**. MUST NOT usar “Pago confirmado” ni “¡Pago confirmado!” como título o estado en esa pantalla. El cuerpo (entrega, email) MAY conservar el resto del texto. Correos y panel admin quedan fuera.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En **cualquier entorno** (pruebas y producción), si el comprador aterriza en `/pedido/confirmado/{code}` con `bold-tx-status=approved` (y `bold-order-id` si viene) y el pedido está pendiente de pago, el sistema MUST consultar primero al proveedor y luego persistir **pagado** cuando: (a) la consulta confirma el pago, **o** (b) la consulta no entrega un resultado final **contradictorio** (pendiente, vacío, no encontrado o error/timeout — no un rechazo/fallo). MUST NOT exigir el aviso asíncrono ni un entorno de pruebas para salir de “Confirmando…”. MUST NOT persistir pagado desde la URL si el pedido ya no está pendiente.
- **FR-002**: Cuando el pedido está pagado, la página de confirmación MUST mostrar **“Pago aprobado”** como **título** y como **estado**. MUST NOT usar “Pago confirmado” ni “¡Pago confirmado!” en esos dos rótulos. MUST NOT dejar “Confirmando…” (ni “Confirmando pago…”) como estado final cuando el retorno ya traía `approved`.
- **FR-003**: El pagado MUST quedar en el pedido. Recargar la misma confirmación MUST seguir mostrando “Pago aprobado” en título y estado.
- **FR-004**: La transición a pagado MUST ser **idempotente** y MUST reutilizar el mismo efecto post-pago que el aviso asíncrono (p. ej. notificación operativa una sola vez). Un segundo retorno, recarga o aviso asíncrono con el mismo resultado MUST NOT duplicar efectos ni corromper el historial.
- **FR-005**: El aviso asíncrono de Bold MUST seguir siendo un camino válido para marcar pagado o rechazado. En producción es la fuente de verdad **cuando llega**; MUST NOT bloquear el pagado ya persistido por el retorno. MUST permanecer **idempotente** respecto al marcado hecho en la confirmación.
- **FR-006**: Si la consulta al proveedor confirma **rechazo/fallo**, el sistema MUST NOT marcar pagado aunque la query diga `approved`.
- **FR-007**: MUST NOT marcar pagado un código de pedido inexistente, ni aplicar el retorno de un pedido a otro.
- **FR-008**: “Confirmando…” MUST usarse solo como estado transitorio cuando hay retorno Bold pero **aún no** hay `approved` persistible ni resultado final del proveedor. MUST NOT ser el resultado esperado cuando `bold-tx-status=approved`.
- **FR-008b**: Un `bold-tx-status` de rechazo/fallo MUST NOT, por sí solo, persistir el pedido como pago fallido. El rechazo persistido sigue exigiendo consulta al proveedor o aviso asíncrono (sin cambio de alcance respecto a `015`).
- **FR-009**: Textos de esta pantalla MUST estar en español.
- **FR-010**: MUST NOT romper carrito, checkout, apertura de Bold, ni el flujo de aviso asíncrono ya existente.

Esta entrega **ajusta** la regla de `015-bold-confirmacion-pago` que impedía persistir pagado con la query sola: esa regla se mantiene si el proveedor confirma un **rechazo**; se relaja en **todos los entornos** cuando el retorno es `approved` y no hay resultado final contradictorio.

### Key Entities

- **Pedido**: identificado por código; estados de pago relevantes: pendiente de pago, pagado, pago fallido/rechazado.
- **Retorno Bold**: parámetros visibles en la URL de confirmación (`bold-tx-status`, `bold-order-id`).
- **Consulta al proveedor**: verificación del cobro cuando está disponible.
- **Aviso asíncrono Bold**: notificación posterior (webhook); fuente de verdad en producción; no llega en modo pruebas salvo prueba manual.
- **Confirmación de pedido**: página que el comprador ve al volver de Bold.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de las pruebas de pago aprobado **sin** aviso asíncrono, al abrir la URL de confirmación con `bold-tx-status=approved` el comprador ve “Pago aprobado” en el **título y el estado**, y **0** casos terminan en “Confirmando…” como estado final.
- **SC-002**: En el 100% de esas mismas pruebas, recargar la confirmación sigue mostrando “Pago aprobado” en título y estado (pagado persistido).
- **SC-003**: En el 100% de las pruebas de idempotencia, aplicar el mismo resultado por retorno y luego por aviso asíncrono (o al revés) deja un solo estado pagado y sin efectos post-pago duplicados.
- **SC-004**: En el 100% de las pruebas donde el proveedor confirma rechazo y la query dice `approved`, el pedido **no** queda pagado.
- **SC-005**: En el 100% de las vistas de confirmación con pedido pagado, título y estado dicen “Pago aprobado”; **0** usan “Pago confirmado” / “¡Pago confirmado!” en esos rótulos. Un comprador de prueba distingue “Pago aprobado” de “Confirmando…” en una sola mirada.

## Assumptions

- El redirect de Bold a `/pedido/confirmado/{code}` con `bold-tx-status` y `bold-order-id` ya ocurre; el hueco es persistir y mostrar aprobado **sin** depender del aviso asíncrono.
- En modo pruebas Bold **no** envía el aviso asíncrono salvo “Probar el webhook”; el mismo criterio de persistencia aplica en producción para no dejar “Confirmando…” si el aviso se retrasa o no llega.
- En **todos los entornos**, `approved` en el retorno + sin rechazo verificado del proveedor → persistir pagado. Se consulta al proveedor **antes** de confiar en la URL; si responde rechazo/fallo, la URL no gana.
- En producción el aviso asíncrono sigue llegando y es la fuente de verdad **cuando está presente**; no sustituye ni invalida un pagado ya persistido por el retorno/consulta. Ambos caminos son el mismo resultado de dominio, idempotentes.
- Confiar en `approved` de la URL aplica **solo** al pedido del código en la ruta, **solo** si está pendiente de pago, y **solo** si la consulta al proveedor no contradice con un rechazo/fallo. Conocer el enlace de confirmación ya permite ver ese pedido (checkout de invitado).
- Los efectos post-pago existentes (p. ej. notificación al pasar a pagado) se disparan la primera vez que el pedido queda pagado, da igual el camino.
- El copy de confirmación **pagada** es **“Pago aprobado”** en título y estado; sustituye “Pago confirmado” / “¡Pago confirmado!” en esa pantalla. No se exige cambiar correos ni administración.
- Persistencia desde la query aplica **solo** a `approved` → pagado. No hay simetría para rechazo en esta entrega.
- No se pide un nuevo estado de pedido; se usan pagado / pendiente / fallido ya existentes.
- Guest checkout y montos enteros en COP no cambian.

## Out of Scope

- Esperar o simular el aviso asíncrono de Bold en modo pruebas como única vía de éxito.
- Persistir pago fallido/rechazado solo porque la URL trae `rejected`/`failed` (sin consulta al proveedor ni aviso asíncrono).
- Cambiar carrito, formulario de checkout o la apertura de Bold.
- Restaurar el carrito tras un pago fallido.
- Deshacer un pedido ya pagado si más tarde llega un rechazo.
- Nuevos proveedores de pago o cobro en una moneda distinta.
- Cambiar el copy de correos, notificaciones o del panel de administración.
