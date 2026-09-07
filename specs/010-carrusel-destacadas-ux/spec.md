# Feature Specification: Usabilidad del carrusel Destacadas

**Feature Branch**: `010-carrusel-destacadas-ux`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: mejorar el carrusel “Destacadas” de la homepage (indicadores táctiles, una tarjeta completa en móvil, autoplay con pausa visible, sincronía imagen/título, coverflow menos agresivo, accesibilidad). Fuera de alcance: otras secciones, catálogo y backend.

## Clarifications

### Session 2026-09-06

- Q: ¿A partir de qué ancho deja de ser “una tarjeta completa” y puede haber coverflow/peek de escritorio? → A: Todo lo que no sea escritorio (~1024 px): una tarjeta; coverflow solo en ancho de escritorio.
- Q: ¿Cómo abre el visitante la ficha de la camiseta que está viendo? → A: No se implementa tarjeta entera como enlace; solo el CTA “Ver camiseta” abre la ficha.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recorrer Destacadas en teléfono sin recortes (Priority: P1)

Como visitante en un viewport que no es de escritorio (menos de ~1024 px, p. ej. teléfono ~390 px o tablet), quiero ver **una** camiseta completa al frente, con nombre y acción legibles, y pasar de foto con un gesto o un indicador fácil de pulsar, para no pelear con tarjetas laterales cortadas ni puntos diminutos.

**Why this priority**: Es el fallo más visible: overflow, peek confuso y dots casi intocables.

**Independent Test**: Abrir el inicio a ~390 px y a un ancho de tablet por debajo de ~1024 px, con al menos dos fotos en Destacadas; se ve una sola tarjeta entera; el título no se corta a mitad de palabra de forma ilegible; los indicadores se pueden pulsar con el dedo; el deslizamiento cambia de camiseta.

**Acceptance Scenarios**:

1. **Given** el carrusel visible en un viewport menor a escritorio (~1024 px, p. ej. ~390 px), **When** mira el bloque Destacadas, **Then** hay **una** tarjeta centrada y completa; no hay laterales recortadas ni un peek que tape el título.
2. **Given** esa vista, **When** desliza horizontalmente sobre el carrusel, **Then** pasa a la camiseta siguiente o anterior.
3. **Given** varias diapositivas, **When** pulsa un indicador, **Then** llega a esa camiseta; el área táctil de cada indicador es al menos **44 × 44 px** (el punto dibujado puede ser más pequeño) y el activo se distingue con claridad (más contraste que un punto gris sobre gris).

---

### User Story 2 - Controlar el avance automático (Priority: P2)

Como visitante, quiero que las fotos avancen solas a un ritmo pausado (~5 s), que paren si pongo el cursor encima, y que pueda **pausar o reanudar** con un control visible, para no perder el control del carrusel.

**Why this priority**: El autoplay existe pero no hay forma obvia de pararlo; en movimiento reducido no debe molestar.

**Independent Test**: Con dos o más fotos, esperar ~5 s y ver el cambio; pasar el cursor y comprobar que no avanza; pulsar Pausar y comprobar que no avanza; Reanudar lo reanuda. Con preferencia de menos movimiento, no hay autoplay insistente.

**Acceptance Scenarios**:

1. **Given** dos o más diapositivas y sin preferencia de movimiento reducido, **When** deja el bloque sin usarlo, **Then** cambia de camiseta cada ~5 segundos.
2. **Given** el autoplay activo, **When** pone el cursor sobre el carrusel, **Then** el avance automático se pausa; al salir, se reanuda salvo que haya pulsado Pausar.
3. **Given** el carrusel con varias fotos, **When** pulsa el control **Pausar**, **Then** deja de avanzar solo y el control pasa a **Reanudar**; al reanudar, vuelve el intervalo de ~5 s.
4. **Given** la persona tiene activada la preferencia de menos movimiento, **When** abre el inicio, **Then** el carrusel **no** avanza solo; flechas, indicadores y swipe siguen disponibles.

---

### User Story 3 - Ver foto, nombre y acción de la misma camiseta (Priority: P3)

Como visitante, quiero que en cada momento la foto, el nombre, el equipo/subtítulo y el botón “Ver camiseta” correspondan a **la misma** pieza, para no pulsar una ficha que no es la que estoy viendo.

**Why this priority**: El desfase en la transición rompe la confianza y el CTA.

**Independent Test**: Avanzar varias veces (flecha, indicador, autoplay): en cada instante de la transición, título/subtítulo/CTA coinciden con la foto de esa tarjeta (no un encabezado que “se adelanta”). El CTA de la tarjeta activa abre esa ficha.

**Acceptance Scenarios**:

1. **Given** el carrusel en movimiento, **When** cambia de diapositiva, **Then** imagen, nombre, equipo/subtítulo y CTA cambian **juntos** (misma camiseta).
2. **Given** una camiseta al frente, **When** pulsa “Ver camiseta”, **Then** abre la ficha de **esa** camiseta. Pulsar solo la foto **no** es un requisito de esta entrega.
3. **Given** escritorio (~1024 px o más), **When** mira el bloque, **Then** la tarjeta activa es obvia; las vecinas (si se ven) son un peek legible, no recortes que impidan reconocer la foto. Por debajo de ~1024 px no hay coverflow.

---

### Edge Cases

- Una sola foto: no hay flechas, indicadores ni autoplay; se ve esa tarjeta completa (regla ya de 009).
- Ninguna foto: el bloque no se muestra (regla ya de 009).
- Teclado: foco visible; flechas Anterior/Siguiente con el bloque enfocado; Enter/Espacio en indicadores y en Pausar/Reanudar; no interceptar teclas del resto de la página.
- Redimensionar de escritorio (~1024 px o más) a un ancho menor (p. ej. ~390 px o tablet): una tarjeta completa; en escritorio, flechas y peek más calmado.
- Muchas diapositivas (hasta 5): todos los indicadores siguen siendo tocables.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En cualquier viewport menor a escritorio (~1024 px) el bloque Destacadas MUST mostrar una sola tarjeta completa, centrada, sin overflow ilegible de título/subtítulo y sin laterales recortadas.
- **FR-002**: Cada indicador MUST tener área táctil mínima de 44 × 44 px, contraste suficiente y estado activo distinguible. MUST permitir ir a esa diapositiva.
- **FR-003**: MUST existir swipe horizontal funcional en viewport menor a ~1024 px (y no debe impedir el scroll vertical de la página).
- **FR-004**: Con dos o más diapositivas, MUST haber autoplay de ~5 s, pausa al pasar el cursor, y un control visible **Pausar** / **Reanudar** en español.
- **FR-005**: Si la persona pide menos movimiento, MUST NOT haber autoplay. Controles manuales MUST seguir.
- **FR-006**: Foto, nombre, equipo/subtítulo y CTA de una diapositiva MUST corresponder siempre a la misma camiseta (sin desfase entre encabezado y foto).
- **FR-007**: En escritorio (~1024 px o más), la tarjeta activa MUST ser dominante y obvia. Los peeks laterales, si existen, MUST ser más legibles que un recorte agresivo. Por debajo de ~1024 px MUST NOT haber efecto coverflow.
- **FR-008**: Flechas Anterior/Siguiente, indicadores y Pausar/Reanudar MUST tener nombres accesibles en español, foco por teclado y activación con Enter/Espacio en los botones.
- **FR-009**: El CTA “Ver camiseta” de la tarjeta activa MUST ser claro y llevar a la ficha de esa camiseta. MUST NOT exigirse que toda la tarjeta sea un enlace.
- **FR-010**: MUST NOT cambiar la fuente de fotos (sigue la selección del admin), ni otras secciones de la home, ni el catálogo/backend.

### Key Entities

- **Diapositiva Destacadas**: una foto de catálogo ya elegida (imagen, nombre, equipo, enlace a ficha).
- **Indicador**: control para ir a una diapositiva concreta.
- **Estado de autoplay**: en marcha, pausado por cursor, pausado por la persona, o desactivado por menos movimiento.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada a ~390 px y a un ancho de tablet menor a ~1024 px, el 100% de las revisiones ven una sola tarjeta completa y pueden leer nombre y CTA sin recorte que los haga ilegibles.
- **SC-002**: El 100% de los indicadores tienen área táctil ≥ 44 × 44 px y el activo se identifica a simple vista.
- **SC-003**: En escritorio, el 100% de las revisiones pueden pausar y reanudar el autoplay con el control visible, y el hover también pausa.
- **SC-004**: En 10 transiciones seguidas, 10/10 muestran foto + nombre + CTA de la misma camiseta (0 desfases).
- **SC-005**: Con preferencia de menos movimiento, 0 avances automáticos en 15 s; el paso manual sigue funcionando.
- **SC-006**: Teclado (foco + flechas + Enter/Espacio) recorre el carrusel en el 100% de una checklist de aceptación, sin capturar teclas fuera del bloque.

## Assumptions

- El bloque Destacadas, su lugar en el inicio, las fotos del admin (009), el CTA “Ver camiseta” y la ausencia de precio **ya existen**. Esta entrega **solo mejora la experiencia** de ese bloque.
- Autoplay ≈ 5 s (dentro del rango 5–6 s pedido).
- El umbral “no escritorio / una tarjeta” es menor a ~1024 px; escritorio (~1024 px o más) puede mostrar coverflow/peek. ~390 px sigue siendo el caso de teléfono a verificar.
- Una foto o cero fotos siguen las reglas de 009.
- Arreglo mínimo sobre el carrusel actual; no se rediseña el resto de la home.

## Out of Scope

- Otras secciones de la homepage (hero, ligas, “Las más buscadas”).
- Catálogo, admin, persistencia o backend.
- Cambiar cuántas fotos se eligen o el tope de 5.
- Añadir precios al overlay.
- Un playground o demo de restaurante.
- Convertir toda la tarjeta en enlace a la ficha (la foto no tiene que navegar).
