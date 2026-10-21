# Feature Specification: Movimiento Halloween del inicio

**Feature Branch**: `030-refine-halloween-motion`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "Ajusta la animación de la página de inicio Halloween de Flashsport para que se vea premium y elegante, no recargada: dejar solo 2 murciélagos y 1 araña; movimiento lento con pausas largas; opacidad de 50 a 60 %; entrada escalonada del titular, el texto y los botones; flote y acercamiento sutil de la tarjeta de la camiseta; paleta actual; respetar reducir movimiento."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver una decoración discreta (Priority: P1)

Una persona abre la página de inicio y ve la decoración de Halloween como un detalle, no como el protagonista. Hay dos murciélagos y una araña. No hay fantasma ni murciélagos de más. La camiseta y el titular se leen primero.

**Why this priority**: Hoy la decoración compite con la camiseta y el mensaje. Si sigue recargada, el inicio no se siente premium.

**Independent Test**: Abrir el inicio con movimiento permitido y contar la decoración visible durante un minuto: exactamente dos murciélagos y una araña, sin fantasma.

**Acceptance Scenarios**:

1. **Given** el inicio con la decoración de Halloween, **When** la persona mira la primera pantalla, **Then** ve como máximo dos murciélagos y una araña, y no ve un fantasma ni otros murciélagos.
2. **Given** esa misma pantalla, **When** compara la decoración con la camiseta y el titular, **Then** la decoración se ve más tenue, entre el 50 % y el 60 % de opacidad, y no tapa el titular, los botones ni la camiseta.
3. **Given** la decoración usa solo hueso, negro, grises y blanco, **When** se muestra el inicio, **Then** no aparece ningún color nuevo.

---

### User Story 2 - Ver un movimiento lento (Priority: P1)

Los murciélagos cruzan de vez en cuando y descansan un buen rato. La araña se mece en su sitio, despacio y con poco recorrido. Nada arranca ni se detiene de golpe.

**Why this priority**: El movimiento continuo de varios elementos a la vez es lo que hace que el inicio se sienta recargado.

**Independent Test**: Observar el inicio durante 60 segundos y anotar cuántos murciélagos cruzan a la vez y cuánto espera cada uno entre una pasada y la siguiente.

**Acceptance Scenarios**:

1. **Given** el movimiento del sistema está permitido, **When** un murciélago termina de cruzar, **Then** espera entre 20 y 30 segundos antes de volver a cruzar.
2. **Given** los dos murciélagos están en la página, **When** uno está cruzando, **Then** el otro no cruza al mismo tiempo.
3. **Given** la araña está visible, **When** se mueve, **Then** solo se balancea en su lugar, muy despacio, sube y baja poco, y no recorre la pantalla.
4. **Given** cualquier recorrido de la decoración, **When** empieza o termina, **Then** acelera y frena con suavidad, sin saltos.

---

### User Story 3 - Leer el mensaje al entrar (Priority: P2)

Al cargar el inicio, el titular, el párrafo y los botones no aparecen todos de golpe. Entran uno detrás de otro, con un fundido y una subida corta.

**Why this priority**: La entrada escalonada ordena la lectura, pero la decoración y el ritmo importan más para que el inicio deje de verse recargado.

**Independent Test**: Recargar el inicio y ver que el titular empieza, luego el párrafo, luego los botones, con cerca de medio segundo entre el inicio de cada uno.

**Acceptance Scenarios**:

1. **Given** el inicio acaba de cargar y el movimiento está permitido, **When** aparece el mensaje, **Then** entran en este orden: el titular, el párrafo y los botones.
2. **Given** esa entrada, **When** pasa de un grupo al siguiente, **Then** el siguiente empieza cerca de 0,5 segundos después, con un fundido y una subida leve.
3. **Given** la entrada ya terminó, **When** la persona sigue en la página, **Then** el titular, el párrafo y los botones quedan quietos y completamente visibles.

---

### User Story 4 - Sentir la camiseta viva, sin exagerar (Priority: P2)

La tarjeta de la camiseta flota apenas, de forma constante. Al pasar el puntero se acerca un poco y vuelve a su tamaño al salir.

**Why this priority**: Da presencia al producto sin sumar más personajes ni movimiento por toda la pantalla.

**Independent Test**: Mirar la tarjeta en reposo y medir un vaivén de 3 a 5 px. Pasar el puntero y ver un acercamiento de 3 % a 4 % que tarda 300 ms.

**Acceptance Scenarios**:

1. **Given** el movimiento está permitido y la tarjeta está en reposo, **When** la persona la observa, **Then** sube y baja de forma continua entre 3 y 5 px.
2. **Given** el puntero entra en la tarjeta, **When** se acerca, **Then** crece entre un 3 % y un 4 % en 300 ms.
3. **Given** el puntero sale de la tarjeta, **When** vuelve al reposo, **Then** recupera su tamaño en 300 ms y el flote sigue.
4. **Given** no hay fotografía de producto, **When** se muestra la tarjeta de reserva, **Then** el flote y el acercamiento se aplican igual a esa tarjeta.

---

### User Story 5 - Respetar quien pide menos movimiento (Priority: P1)

Si el sistema tiene activada la opción de reducir movimiento, el inicio se ve quieto. El mensaje y la camiseta están disponibles al momento, sin esperas ni recorridos.

**Why this priority**: Un inicio elegante no puede marear a quien ya pidió menos movimiento.

**Independent Test**: Activar reducir movimiento, recargar el inicio y comprobar que no hay cruces, balanceo, flote ni entrada escalonada, y que el texto y los botones se pueden usar de inmediato.

**Acceptance Scenarios**:

1. **Given** reducir movimiento está activo, **When** se abre el inicio, **Then** los murciélagos y la araña no se desplazan.
2. **Given** esa misma preferencia, **When** carga la página, **Then** el titular, el párrafo y los botones aparecen de una vez, visibles y sin subida.
3. **Given** esa misma preferencia, **When** se mira la tarjeta, **Then** no flota, y al pasar el puntero no se acerca.

---

### Edge Cases

- En teléfono, la decoración sigue detrás del mensaje y de la camiseta: no cubre botones ni el producto, y no se puede pulsar.
- Al recargar, la entrada del texto ocurre una sola vez. No se repite al hacer scroll ni al volver de otra sección de la misma página.
- Si el puntero entra y sale de la tarjeta antes de que termine el acercamiento, el tamaño no salta: sigue la misma transición de 300 ms.
- La decoración no anuncia nada a un lector de pantalla y no recibe el foco.
- El resto de la página de inicio, el catálogo, el carrito y el checkout no cambian su movimiento ni su apariencia por esta mejora.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La primera pantalla del inicio MUST mostrar exactamente dos murciélagos y una araña como decoración de Halloween.
- **FR-002**: El inicio MUST NOT mostrar un fantasma ni murciélagos adicionales.
- **FR-003**: La decoración MUST verse entre el 50 % y el 60 % de opacidad.
- **FR-004**: La decoración MUST permanecer detrás del titular, del párrafo, de los botones y de la tarjeta de la camiseta, sin impedir leerlos ni pulsarlos.
- **FR-005**: Cada murciélago MUST cruzar la pantalla con un recorrido suave, que acelere al empezar y frene al terminar.
- **FR-006**: Cada murciélago MUST esperar entre 20 y 30 segundos entre el fin de una pasada y el inicio de la siguiente.
- **FR-007**: MUST NOT haber dos murciélagos cruzando la pantalla al mismo tiempo.
- **FR-008**: La araña MUST balancearse muy despacio en su lugar, con un sube y baja corto, sin cruzar la pantalla.
- **FR-009**: Con el movimiento permitido, el titular, el párrafo y los botones MUST entrar en ese orden, cada uno con un fundido y una subida leve.
- **FR-010**: El inicio de cada grupo MUST ocurrir cerca de 0,5 segundos después del inicio del grupo anterior. Cada fundido MUST durar menos de 1 segundo.
- **FR-011**: La línea corta que está encima del titular MUST entrar junto con el titular, en el mismo momento.
- **FR-012**: La tarjeta de la camiseta MUST flotar de forma continua entre 3 y 5 px mientras el movimiento esté permitido.
- **FR-013**: Al pasar el puntero, la tarjeta MUST acercarse entre un 3 % y un 4 %, y MUST volver a su tamaño al salir. Cada cambio MUST durar 300 ms.
- **FR-014**: La decoración, la tarjeta y el texto MUST usar solo la paleta actual de hueso, negro, grises y blanco.
- **FR-015**: Con reducir movimiento activo, los murciélagos y la araña MUST quedarse quietos, la tarjeta MUST NOT flotar ni acercarse, y el titular, el párrafo y los botones MUST mostrarse de inmediato, completos y quietos.
- **FR-016**: Esta mejora MUST limitarse a la primera pantalla del inicio. El resto de la tienda MUST conservar su comportamiento actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una observación de 60 segundos hay exactamente 2 murciélagos y 1 araña, y ningún fantasma.
- **SC-002**: En esa misma observación nunca cruzan dos murciélagos a la vez, y cada murciélago permanece sin cruzar entre 20 y 30 segundos después de cada pasada.
- **SC-003**: La opacidad de murciélagos y araña queda entre el 50 % y el 60 %, y una persona puede leer el titular y pulsar los dos botones sin que la decoración los cubra.
- **SC-004**: Tras cargar, el párrafo empieza cerca de 0,5 segundos después del titular, y los botones cerca de 0,5 segundos después del párrafo. Los tres quedan del todo visibles antes de que pasen 3 segundos.
- **SC-005**: El flote de la tarjeta se mantiene entre 3 y 5 px, y el acercamiento con el puntero queda entre el 3 % y el 4 % en 300 ms.
- **SC-006**: Con reducir movimiento, el inicio no tiene ningún recorrido, flote ni entrada escalonada, y el mensaje se puede leer en el primer instante.
- **SC-007**: Una revisión visual no encuentra colores fuera de hueso, negro, grises y blanco en la decoración ni en la tarjeta.

## Assumptions

- El alcance es solo la primera pantalla pública del inicio de Flashsport. No cambia textos, fotos, precios, catálogo, carrito, checkout ni el panel de administración.
- La línea corta “Tienda de camisetas de fútbol” forma parte del titular y entra con él. Los tres tiempos de entrada son titular, párrafo y botones.
- “Cerca de 0,5 segundos” admite una diferencia de hasta una décima de segundo.
- Cada fundido dura menos de 1 segundo. La subida es corta, suficiente para notarse y no para desplazar el texto fuera de su lugar.
- La pausa de cada murciélago se cuenta desde que sale de la pantalla hasta que vuelve a entrar. Durante esa pausa no se ve cruzando.
- Los dos murciélagos pueden existir a la vez en la página; solo uno cruza en cada momento. La araña puede mecerse mientras un murciélago cruza, porque su movimiento es local y lento, no un tercer recorrido.
- “Sube y baja poco” significa un recorrido claramente menor que el alto de la araña y menor que un cruce de pantalla.
- La tarjeta de reserva, cuando no hay fotografía, recibe el mismo flote y el mismo acercamiento que la tarjeta con foto.
- Reducir movimiento apaga también el acercamiento al pasar el puntero, para que no quede ninguna animación.
- La decoración es ornamental: no tiene texto, no recibe foco y no bloquea clics.
- No se agregan ilustraciones ni colores de Halloween fuera de la paleta actual.
