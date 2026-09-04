# Feature Specification: Tope de stock en entrega inmediata y precios coherentes en USD

**Feature Branch**: `006-stock-carrito-usd`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Grave: dice stock 1 de entrega inmediata, pero el carrito deja subir a 2. Menor: el toggle USD se selecciona, pero los precios siguen en estilo COP ($89.900)"

## Clarifications

### Session 2026-09-04

- Q: Si el carrito ya tiene más unidades inmediatas que el stock vigente, ¿qué ocurre? → A: Se reduce sola la cantidad inmediata al stock vigente (si el stock es 0, se quita esa línea inmediata) y se explica en español. El comprador sigue desde el carrito ya corregido.
- Q: ¿El tope de “misma talla” es la letra de talla o la variante que se vende? → A: La variante concreta (camiseta + versión + talla), el mismo identificador que usa el inventario, no la letra de talla suelta entre versiones.
- Q: Al llegar al tope, ¿se puede pulsar “+” o se impide el aumento? → A: Se deshabilita aumentar en el carrito. Un nuevo “añadir” desde la ficha no incrementa y muestra el aviso en español.
- Q: ¿Los precios en USD deben cambiar en la página actual o solo al ir a otra ruta? → A: En la página actual, en la misma visita, sin exigir navegar a otra pantalla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - No comprar más unidades inmediatas de las que hay en stock (Priority: P1)

Como comprador, quiero que la cantidad de una camiseta en entrega inmediata no pueda superar las unidades físicas que la tienda me muestra, para no creer que ya reservé más stock del que existe y no llegar al pago con una cantidad imposible.

**Why this priority**: Es el defecto grave. Hoy la ficha puede decir que queda 1 unidad de entrega inmediata y el carrito igual permite 2. Eso contradice la promesa de disponibilidad, genera rechazo en el checkout y puede sobrevender la expectativa aunque el pedido luego se bloquee.

**Independent Test**: Con una variante que muestra 1 unidad de entrega inmediata, intentar llegar a cantidad 2 desde la ficha y desde el carrito; comprobar que la cantidad inmediata permanece en 1, que hay un aviso comprensible, que el “+” queda deshabilitado y que el checkout no recibe una línea inmediata con más unidades que el stock mostrado.

**Acceptance Scenarios**:

1. **Given** una variante con 1 unidad de stock físico y modalidad entrega inmediata, **When** la persona añade esa camiseta al carrito, **Then** la línea inmediata queda en cantidad 1.
2. **Given** esa misma línea ya en el carrito con cantidad 1, **When** intenta subir la cantidad con “+”, **Then** el control está deshabilitado, la cantidad permanece en 1 y no se añade una unidad extra.
3. **Given** esa misma línea ya en el carrito con cantidad igual al stock, **When** pulsa otra vez “añadir al carrito” en la ficha, **Then** la cantidad inmediata no aumenta y ve un aviso en español de que no hay más unidades de entrega inmediata.
4. **Given** una variante con N unidades de stock físico (N ≥ 1) y modalidad entrega inmediata, **When** intenta poner N + 1 en esa línea o en el conjunto de líneas inmediatas de esa misma variante, **Then** el total inmediato de esa variante no supera N.
5. **Given** que la variante también permite bajo encargo, **When** la persona ya tiene el máximo inmediato, **Then** no se “cuela” una unidad extra como si fuera inmediata; si quiere más, debe elegir bajo encargo como modalidad distinta, no subir la cantidad de la línea inmediata.
6. **Given** una línea de bajo encargo, **When** aumenta la cantidad, **Then** el tope de stock físico de entrega inmediata no limita esa línea.
7. **Given** un carrito que ya tenía más unidades inmediatas que el stock vigente (por un intento anterior o porque el stock bajó), **When** la persona vuelve al carrito o intenta pagar, **Then** la cantidad inmediata se reduce sola al stock vigente; si el stock es 0, esa línea inmediata se quita; se explica el cambio en español; y puede seguir desde el carrito ya corregido. No se confirma un pedido inmediato inconsistente.

---

### User Story 2 - Ver dólares de verdad cuando USD está seleccionado (Priority: P2)

Como comprador que elige USD, quiero que los precios dejen de verse como pesos colombianos (por ejemplo `$89.900`) y pasen a verse como dólares convertidos, para confiar en que la moneda marcada es la que estoy usando para decidir la compra.

**Why this priority**: Es el defecto menor. El control ya puede marcarse en USD mientras los importes siguen con el aspecto y la magnitud de COP. Eso incumple la promesa de moneda de venta ya definida para la tienda.

**Independent Test**: Con USD habilitado y tasa vigente, elegir USD y permanecer en la misma página (inicio, catálogo, ficha, favoritos, carrito o checkout); comprobar que los importes de decisión pasan a dólares sin ir a otra ruta, y que al volver a COP reaparecen los valores en pesos.

**Acceptance Scenarios**:

1. **Given** USD está habilitado y hay una tasa vigente, **When** la persona selecciona USD, **Then** el control queda marcado en USD y, en esa misma página y visita, los precios visibles de catálogo, ficha, favoritos, carrito y checkout se muestran convertidos a dólares, sin exigir navegar a otra ruta.
2. **Given** USD está seleccionado, **When** la persona mira un precio que en COP se vería como `$89.900` (o equivalente en pesos, incluido un recargo de personalización), **Then** no ve ese mismo estilo ni esa misma magnitud en pesos: ve un importe en dólares, con identificación de moneda que no se confunde con COP.
3. **Given** USD está seleccionado, **When** navega a otra página pública de la tienda, **Then** la elección se mantiene y los precios de esa página también están en dólares, no un mixto de selector USD y precios COP.
4. **Given** la persona vuelve a COP, **When** mira las mismas pantallas, **Then** los importes coinciden de nuevo con los pesos base, sin recargo por haber pasado por USD.
5. **Given** USD no está disponible (sin tasa o tasa inválida), **When** intenta elegir USD, **Then** el control no queda marcado como USD y los precios siguen en COP, con una explicación de que los dólares no están disponibles.

---

### Edge Cases

- Varias líneas inmediatas de la misma variante (por ejemplo, con y sin personalización) no pueden sumar más que el stock físico de esa variante.
- Dos versiones distintas de la misma camiseta (misma letra de talla, distinta variante) tienen topes independientes.
- Añadir otra vez el mismo producto desde la ficha no debe incrementar por encima del tope inmediato; es el mismo límite que el botón “+” del carrito, con aviso en lugar de incremento.
- Si el stock inmediato llega a 0 después de que la línea ya estaba en el carrito, esa línea inmediata se quita al volver al carrito o al intentar pagar, se explica el cambio y no queda comprable como inmediata. Bajo encargo, si está permitido, sigue siendo una elección explícita, no una conversión automática.
- Bajo encargo sigue pudiendo venderse sin stock físico; este arreglo no elimina esa modalidad ni reserva stock por esas líneas.
- El checkout ya puede rechazar stock insuficiente: esta feature exige que el carrito y la ficha no contradigan ese rechazo de forma rutinaria, y que un carrito obsoleto se corrija antes de cobrar.
- Un importe en USD debe verse distinto de COP tanto en símbolo o código como en magnitud (un precio de decenas de miles de pesos no puede presentarse como si fueran dólares).
- Si el selector de moneda se pinta como USD pero aún no hay importes convertidos, eso es un fallo: o se muestran dólares o no se afirma USD.
- El panel de administración sigue mostrando y capturando importes en COP; esta feature no cambia esa convención.
- Cambiar de moneda no altera cantidades, talla, personalización ni modalidad de entrega.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST impedir que la cantidad de entrega inmediata de una variante en el carrito supere el stock físico vigente de esa variante (camiseta + versión + talla).
- **FR-002**: El sistema MUST aplicar el mismo tope al añadir desde la ficha, al aumentar cantidad en el carrito y a la suma de todas las líneas inmediatas de esa misma variante.
- **FR-003**: Al alcanzar el tope inmediato, el sistema MUST deshabilitar el control de aumentar cantidad en el carrito. Si el comprador intenta añadir otra unidad inmediata desde la ficha, el sistema MUST NOT incrementar la cantidad y MUST informar en español, de forma perceptible, que no hay más unidades de entrega inmediata.
- **FR-004**: El sistema MUST NOT aplicar el tope de stock físico a las líneas de bajo encargo.
- **FR-005**: El sistema MUST conservar la regla existente de no confirmar un pedido con líneas inmediatas por encima del stock; el carrito y la ficha MUST alinearse con esa regla antes de llegar al pago.
- **FR-006**: Cuando el stock inmediato vigente es menor que la cantidad inmediata ya guardada en el carrito, al volver al carrito o al intentar pagar el sistema MUST reducir sola esa cantidad al stock vigente y, si el stock es 0, MUST quitar la línea inmediata, con una explicación en español. MUST NOT convertir en silencio el excedente a bajo encargo. El comprador MUST poder continuar desde el carrito ya corregido.
- **FR-007**: Cuando USD está seleccionado y hay tasa vigente, el sistema MUST mostrar todos los importes de decisión del comprador (listado, ficha, favoritos, recargo de personalización, carrito, envío, descuentos y totales de checkout) convertidos a dólares en la página actual, sin exigir navegar a otra ruta.
- **FR-008**: El sistema MUST identificar de forma visible la moneda mostrada de modo que un precio en USD no pueda confundirse con un precio en COP (ni por formato tipo `$89.900` ni por mostrar el importe en pesos sin convertir).
- **FR-009**: El sistema MUST mantener el selector y los precios de acuerdo: si el control indica USD, los precios visibles MUST estar en USD; si los precios no pueden mostrarse en USD, el control MUST permanecer o volver a COP.
- **FR-010**: El sistema MUST conservar COP como moneda base interna (importes enteros en pesos) y USD como moneda de venta convertida; MUST NOT introducir un segundo catálogo de precios.
- **FR-011**: El sistema MUST conservar el resto del comportamiento de catálogo, personalización, envío, checkout de invitado e inventario que no esté cubierto por estos defectos.

### Key Entities

- **Variante vendible**: combinación concreta de camiseta, versión y talla; es la unidad de stock físico y del tope de entrega inmediata.
- **Stock físico de variante**: unidades disponibles para entrega inmediata de esa variante, las mismas que la tienda muestra al comprador.
- **Línea de carrito inmediata**: unidad de compra comprometida a entrega inmediata; su cantidad no puede exceder el stock físico de su variante, ni sola ni sumada con otras líneas inmediatas de esa variante.
- **Línea de carrito bajo encargo**: unidad de compra sin reserva de stock físico; no usa el tope de entrega inmediata.
- **Preferencia de moneda**: elección visible del visitante entre COP y USD como moneda de venta.
- **Importe de venta**: cantidad que el comprador ve para decidir o pagar, en la moneda que el control afirma estar usando.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de las pruebas con stock inmediato N de una variante, ninguna acción de ficha o carrito deja una cantidad inmediata mayor que N para esa variante.
- **SC-002**: En el 100% de los intentos de superar el stock inmediato, el comprador no incrementa la cantidad: el “+” del carrito está deshabilitado al tope y un “añadir” extra desde la ficha deja un aviso comprensible con cantidad válida.
- **SC-003**: En una pasada de aceptación de inicio, catálogo, ficha, favoritos, carrito y checkout con USD seleccionado y tasa vigente, el 100% de los importes de decisión se ve en dólares convertidos en la página donde se eligió USD; ninguno conserva el estilo o la magnitud de un precio en COP (por ejemplo `$89.900`).
- **SC-004**: En el 100% de las pruebas, el selector y los precios coinciden: no se observa USD marcado con precios en COP, ni USD marcado sin tasa vigente.
- **SC-005**: En el 100% de las pruebas de bajo encargo, se puede pedir una cantidad mayor que el stock físico sin tratar esas unidades como entrega inmediata.
- **SC-006**: En el 100% de las pruebas con carrito obsoleto (cantidad inmediata > stock, incluido stock 0), al abrir el carrito o intentar pagar la cantidad se corrige sola, se explica el cambio y no se crea un pedido inmediato inconsistente. Las cantidades inmediatas ya válidas siguen pudiendo confirmarse.

## Assumptions

- El stock que ve el comprador para entrega inmediata es el tope comercial de esa modalidad; no es un dato decorativo.
- El tope se aplica por variante vendible, no por la letra de talla compartida entre versiones.
- Pedir más unidades que el stock inmediato no convierte en silencio la línea a bajo encargo; bajo encargo sigue siendo una elección explícita y una línea distinta.
- Un carrito con cantidad inmediata inválida se corrige al reabrirlo o al intentar pagar; no se deja al comprador “trabado” con un número imposible ni se espera solo al rechazo final del checkout.
- El rechazo de stock insuficiente al confirmar el pedido se mantiene como última defensa.
- La conversión y el formato de USD ya están definidos para la tienda (COP base, USD de venta, tasa 1 USD = X COP, total oficial convertido una sola vez). Esta feature cierra el hueco en el que el control y los precios no coinciden, incluso en la página donde se pulsa el selector.
- El defecto de USD se evalúa en las pantallas públicas donde el comprador ve precios para decidir o pagar, no en el panel de administración.
- Si una pantalla pública muestra precio al comprador, forma parte del alcance de coherencia COP/USD.
- El idioma de la interfaz permanece en español.

## Out of Scope

- Cambiar la forma de calcular el stock (sigue derivándose de las reglas de inventario ya vigentes).
- Nuevas modalidades de entrega o un tope arbitrario para bajo encargo.
- Integrar un proveedor de pagos en USD.
- Un segundo listado de precios en dólares mantenido a mano.
- Rediseñar el selector de moneda o los textos de disponibilidad, salvo lo necesario para que dejen de contradecir stock y moneda.
- Cambiar cómo administración captura o muestra importes (siguen en COP).
