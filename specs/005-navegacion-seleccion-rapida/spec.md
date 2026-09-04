# Feature Specification: Navegación y selección más rápidas en la tienda

**Feature Branch**: `005-navegacion-seleccion-rapida`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Quiero que te encargues de hacerle una optimizacion a la tienda, al seleccionar algo o cambiar de pestaña se demora bastante, elige las mejores opciones sin afectar lo que ya existe de manera negativa"

## Clarifications

### Session 2026-09-04

- Q: Mientras se actualiza el catálogo tras elegir un filtro, ¿qué debe ver el comprador? → A: A. El listado anterior sigue visible, con aviso de “actualizando”, hasta que llega el resultado nuevo.
- Q: Si el administrador oculta o cambia un producto mientras el comprador sigue en la tienda, ¿cuándo debe dejar de verse en un listado reutilizado? → A: A. En cuanto termina la siguiente navegación o filtro, el resultado final es el catálogo público actual. Reutilizar solo acelera la espera.
- Q: ¿Qué acciones del catálogo deben dejar el listado anterior visible mientras actualizan? → A: A. Filtros, orden, búsqueda confirmada y cambio de página.
- Q: Al cambiar versión o talla, ¿qué pasa si la foto nueva aún no está lista? → A: A (recomendado). Precio y disponibilidad se actualizan ya; la imagen anterior o el hueco se mantienen hasta la foto nueva.
- Q: ¿El patrón de listado anterior aplica a la primera visita al catálogo, cuando aún no hay camisetas en pantalla? → A: A (recomendado). No. Ese patrón solo aplica cuando ya hay un listado visible. La primera llegada usa el primer pintado ya definido; no se inventa un listado previo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtrar y seleccionar en el catálogo sin esperar a que la pantalla se congele (Priority: P1)

Como comprador que explora camisetas, quiero que al pulsar un filtro, cambiar el orden, confirmar una búsqueda o pasar de página el control reaccione de inmediato y el listado se actualice sin vaciarse ni bloquearse, para seguir eligiendo sin la sensación de que la tienda se trabó.

**Why this priority**: Es el gesto repetido de “seleccionar algo” en la tienda. Hoy cada cambio de listado recarga el catálogo entero y, mientras tanto, los controles se deshabilitan; eso es la demora más visible y la de mayor valor si se corrige primero.

**Independent Test**: En `/productos`, aplicar y quitar filtros, cambiar orden, confirmar una búsqueda y pasar de página; comprobar que el control se marca al instante, que el listado anterior permanece con “actualizando”, que el conjunto final coincide con las reglas actuales y que se puede seguir pulsando sin esperar a que termine la actualización anterior.

**Acceptance Scenarios**:

1. **Given** el catálogo ya visible con camisetas, **When** la persona pulsa un filtro, cambia el orden, confirma una búsqueda o pasa de página, **Then** el control elegido cambia de estado de inmediato y no queda deshabilitado el resto de controles del catálogo.
2. **Given** una actualización de listado en curso, **When** la persona mira la página, **Then** sigue viendo el listado anterior, con una indicación clara de que se está actualizando, y no una página vacía ni un esqueleto que quite las camisetas.
3. **Given** que la actualización termina, **When** se muestran los resultados, **Then** coinciden con la combinación de filtros vigente y con el comportamiento de catálogo ya existente (mismos productos que hoy para esos criterios).
4. **Given** la persona pulsa varios controles de listado en sucesión rápida (filtros, orden, página o búsqueda), **When** termina la última actualización, **Then** el listado corresponde a la última combinación elegida, no a una intermedia, y no se “saltan” selecciones visibles.
5. **Given** un filtro que no deja productos, **When** termina la actualización, **Then** se muestra el vacío existente del catálogo, no un listado inventado ni el listado anterior presentado como definitivo.

---

### User Story 2 - Cambiar de sección de la tienda sin perder el hilo (Priority: P2)

Como comprador, quiero pasar entre Inicio, Tienda, Ligas y el resto de secciones públicas y sentir que la cabecera y el destino responden al instante, para no esperar una pantalla en blanco cada vez que “cambio de pestaña”.

**Why this priority**: La navegación entre secciones es el otro gesto que el usuario describe como cambio de pestaña. Es independiente del filtrado y se puede entregar sin tocar la ficha ni el checkout.

**Independent Test**: Desde Inicio, ir a Tienda, Ligas, una ficha y volver atrás; cronometrar que la cabecera permanece usable y que una sección ya visitada en la misma sesión reaparece más rápido que la primera vez, sin cambiar el contenido comercial de cada ruta.

**Acceptance Scenarios**:

1. **Given** la persona está en una sección pública, **When** pulsa otra sección de la navegación principal, **Then** el destino queda marcado de inmediato en la cabecera y no se pierde la capacidad de pulsar otro enlace.
2. **Given** una navegación en curso, **When** el contenido nuevo aún no está listo, **Then** no se sustituye toda la tienda por un blanco prolongado: se conserva estructura (cabecera/pie) y se indica carga del contenido principal.
3. **Given** la persona vuelve a una sección que ya visitó en la misma sesión, **When** entra de nuevo, **Then** el contenido útil aparece antes que en la primera visita y, al terminar la carga, el catálogo coincide con las reglas públicas vigentes (no con un listado obsoleto presentado como final).
4. **Given** usa Atrás/Adelante del navegador, **When** recorre catálogo filtrado y fichas, **Then** recupera la sección y los filtros que ya tenía, con el mismo significado que hoy.

---

### User Story 3 - Elegir versión y talla en la ficha al instante (Priority: P3)

Como comprador en una ficha, quiero que al elegir versión (p. ej. Fan/Player) o talla el precio y la disponibilidad cambien al momento, aunque la foto nueva aún esté cargando, sin una espera equivalente a recargar la página.

**Why this priority**: Es otra “selección” frecuente, pero ya ocurre en la ficha sin recargar; la historia existe para impedir regresiones y para alinear cualquier demora residual con el mismo estándar de respuesta inmediata.

**Independent Test**: En una ficha con varias versiones y tallas, cambiar opciones en ráfaga y comprobar que precio, disponibilidad y acción de compra siguen a la última elección de inmediato, sin esperar la foto nueva ni ir al servidor por cada clic, y sin alterar personalización, cantidad ni carrito hasta “Agregar”.

**Acceptance Scenarios**:

1. **Given** una ficha con varias versiones y tallas, **When** la persona cambia de versión o talla, **Then** la opción queda marcada de inmediato y precio, disponibilidad y estado de compra reflejan esa variante sin recargar la ficha.
2. **Given** la foto de la nueva combinación aún no terminó de cargar, **When** la persona ya eligió versión o talla, **Then** el precio y la disponibilidad ya corresponden a esa variante; se conserva la imagen anterior o su hueco hasta que llegue la foto nueva, sin bloquear la selección.
3. **Given** una talla agotada, **When** la persona intenta seleccionarla, **Then** el comportamiento actual se conserva (no se vende como disponible) y la interacción no introduce una espera nueva.
4. **Given** cambios rápidos de versión/talla, **When** se detiene en una combinación, **Then** lo mostrado coincide con esa combinación y no con una anterior.

---

### Edge Cases

- Un filtro en vuelo no debe presentarse como resultado final: el listado anterior permanece visible y marcado como desactualizado respecto de la selección nueva hasta que llega el resultado.
- La última intención del usuario gana: clics rápidos no deben dejar un listado de un filtro ya desmarcado.
- Vacío, error de catálogo y “sin resultados” siguen siendo estados explícitos; la rapidez no autoriza a rellenar con productos que no cumplen el filtro.
- Atrás del navegador, recarga y enlace compartido con los mismos criterios deben seguir abriendo el mismo recorte de catálogo que hoy.
- Prefetch o reutilización de una sección ya vista puede acelerar la espera, pero al terminar esa navegación o filtro el listado definitivo MUST ser el catálogo público vigente; un producto que las reglas ya no muestran no queda como resultado final.
- La cabecera, el carrito, favoritos, guía de tallas, checkout de invitado e inventario no cambian de reglas: solo cambia la rapidez percibida de seleccionar y navegar.
- Esta feature no sustituye ni relaja los criterios de primer pintado de `004-moneda-carga-feedback` (contenido útil al aterrizar); aquí el problema es la espera *después* de que la página ya está abierta.
- Administración, importación y reportes quedan fuera: el alcance es la tienda pública.
- Una foto de ficha lenta no bloquea la selección de versión o talla; se conserva la imagen anterior o el hueco hasta la nueva.
- El patrón listado anterior + “actualizando” no aplica a la primera llegada al catálogo, cuando aún no hay camisetas en pantalla.
- Elegir moneda, si existe, no se rediseña aquí; no debe volverse más lenta por estos cambios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST reflejar de inmediato el estado seleccionado de cualquier control que actualice el listado de catálogo: filtros (liga, equipo, temporada, versión, talla, disponibilidad), orden, búsqueda confirmada y cambio de página, sin esperar a que el listado nuevo esté listo.
- **FR-002**: El sistema MUST NOT deshabilitar el resto de controles del catálogo solo porque una actualización de listado esté en curso.
- **FR-003**: Mientras el listado se actualiza **y ya había camisetas visibles**, el sistema MUST conservar el listado anterior, indicar que la actualización está en curso y MUST NOT vaciar la página ni sustituir las camisetas por un esqueleto. El listado anterior MUST NOT presentarse como el resultado final de la nueva selección. Si aún no hay listado (primera llegada al catálogo), aplica el primer pintado existente, no un listado inventado.
- **FR-004**: Al completar una actualización de catálogo, el sistema MUST mostrar exactamente el conjunto de productos que las reglas vigentes de filtro ya definen para esa combinación; MUST NOT ampliar, reducir ni reordenar de forma distinta a la actual salvo la rapidez.
- **FR-005**: Si el usuario cambia de filtro, orden, búsqueda o página antes de terminar la actualización anterior, el sistema MUST aplicar la última combinación elegida y MUST NOT mostrar como definitivo un resultado intermedio.
- **FR-006**: El sistema MUST conservar vacíos, errores y paginación actuales del catálogo; un resultado vacío no se sustituye por el listado anterior presentado como final.
- **FR-007**: Al cambiar de sección pública (Inicio, Tienda, Ligas y demás enlaces principales), el sistema MUST marcar el destino de inmediato en la navegación y MUST mantener cabecera y pie utilizables durante la carga del contenido.
- **FR-008**: Una sección pública ya visitada en la misma sesión MUST ofrecer contenido útil más pronto que en la primera visita. Al completar esa navegación, el contenido definitivo MUST coincidir con el catálogo público vigente, no con una copia obsoleta presentada como final.
- **FR-009**: Atrás/Adelante y la URL con criterios de catálogo MUST seguir representando la misma selección que hoy.
- **FR-010**: En la ficha, cambiar versión o talla MUST actualizar de inmediato la opción marcada, el precio, la disponibilidad y el estado de compra, sin recargar la página y sin esperar una ida al servidor ni la foto nueva por cada clic. La imagen anterior o su hueco se conservan hasta que cargue la foto de la variante elegida.
- **FR-011**: El sistema MUST conservar el significado actual de personalización, modalidad de entrega, carrito, favoritos, guía de tallas, checkout de invitado e inventario.
- **FR-012**: El sistema MUST anunciar de forma perceptible (incluido apoyo a tecnologías de asistencia) que el catálogo se está actualizando y cuándo terminó, sin exigir adivinarlo por el vacío de la página.
- **FR-013**: Optimizaciones de rapidez MUST NOT dejar como definitivo un producto inactivo o un recorte de filtro que las reglas públicas vigentes ya no mostrarían. La reutilización solo acelera la espera hasta el resultado actual.

### Key Entities *(include if feature involves data)*

- **Selección de catálogo**: combinación vigente de criterios (liga, equipo, temporada, versión, talla, disponibilidad, búsqueda, orden, página) ya expresada en la URL.
- **Listado visible**: camisetas mostradas; durante una actualización es el listado anterior marcado como pendiente; al terminar es el resultado vigente de la última selección.
- **Sección pública**: destino de la navegación principal (Inicio, Tienda, Ligas y equivalentes actuales).
- **Selección de ficha**: versión y talla de la variante que se está considerando, independiente del listado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 95% de los clics de prueba sobre filtro, orden, búsqueda confirmada o página, el control refleja la nueva selección en menos de 150 ms, sin quedar el panel de catálogo bloqueado.
- **SC-002**: En el 90% de los cambios de filtro sobre un catálogo ya cargado (conexión típica de hogar), el listado anterior permanece visible de forma continua con aviso de actualización; la página no permanece en blanco más de 200 ms ni sustituye las camisetas por un esqueleto.
- **SC-003**: En el 90% de esas mismas pruebas, el listado definitivo de una combinación habitual aparece en menos de 1 segundo, y el 100% de las combinaciones de aceptación devuelve el mismo conjunto de productos que el comportamiento actual.
- **SC-004**: El 100% de las ráfagas de 5 filtros seguidos termina mostrando solo la última combinación, nunca una intermedia como si fuera final.
- **SC-005**: En el 90% de los cambios entre Inicio, Tienda y Ligas, la cabecera permanece accionable en menos de 200 ms y, en revisitas de la misma sesión, el contenido útil aparece en menos de 1 segundo; el 100% de esas revisitas termina con el catálogo público vigente, no con un listado obsoleto como final.
- **SC-006**: En el 95% de los cambios de versión o talla en ficha, precio y disponibilidad coinciden con la variante elegida en menos de 150 ms, sin recargar la ficha y sin esperar a que termine la foto nueva.
- **SC-007**: En una pasada de regresión, el 100% de carrito, personalización, checkout invitado, favoritos y guía de tallas conserva su comportamiento previo.
- **SC-008**: Al menos el 90% de las personas de prueba percibe que filtrar o cambiar de sección es “inmediato o casi inmediato” frente a la versión actual, en una comparación A/B informal de 8 intentos.

## Assumptions

- “Seleccionar algo” en el catálogo incluye filtros/chips, orden, búsqueda confirmada (como hoy, al enviar) y cambio de página; en la ficha, versión y talla. No incluye crear pedidos ni guardar en admin.
- La búsqueda no pasa a ser en vivo letra a letra; se mantiene la confirmación actual (enviar/Enter) y, una vez confirmada, usa el mismo patrón de listado anterior + “actualizando”.
- “Cambiar de pestaña” se refiere a las secciones de la tienda pública (navegación principal y, por analogía, grupos de filtro), no a pestañas del sistema operativo ni al panel admin.
- Las reglas de qué producto entra en un filtro, el orden actual y la paginación no se rediseñan; solo se acelera la respuesta percibida.
- Mostrar el listado anterior con un estado “actualizando” es la única presentación permitida durante la espera; no se usa esqueleto ni página vacía como recubrimiento del listado.
- Reutilizar una sección ya vista solo acelera la espera; al terminar la navegación o el filtro, el resultado final es siempre el catálogo público vigente.
- La feature `004-moneda-carga-feedback` cubre primer pintado, moneda y toasts de admin; esta spec no los reabre.
- El patrón listado anterior + “actualizando” aplica solo cuando ya hay un listado en pantalla; la primera visita al catálogo no inventa resultados previos.
- En la ficha, el precio y la disponibilidad no esperan a la foto nueva.

## Out of Scope

- Sustituir el listado en actualización por un esqueleto o por una página vacía.
- Cambiar criterios de filtro, ranking, paginación o fichas de producto.
- Checkout, pagos, inventario, ledger, precios base o moneda de venta.
- Panel de administración, importaciones o reportes.
- Rediseño visual de la marca, nuevas secciones o un buscador distinto al actual.
- Sustituir el trabajo de primer pintado ya especificado en `004-moneda-carga-feedback`.
- Bloquear la selección de versión o talla hasta que cargue la foto nueva.
- Precargar de forma agresiva todo el catálogo de una vez si eso degrada el primer uso o muestra datos que ya no aplican.
