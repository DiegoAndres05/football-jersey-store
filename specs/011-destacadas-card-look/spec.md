# Feature Specification: Look de la tarjeta Destacadas

**Feature Branch**: `011-destacadas-card-look`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: cambiar la cara de cada diapositiva Destacadas tomando como inspiración visual una tarjeta de producto interactiva (cabecera tipo cristal, overlay, inclinación suave en escritorio). No copiar el demo (marca, precio, fotos externas, indicadores falsos). Conservar comportamiento ya definido en 010 (una tarjeta en no-escritorio, autoplay, CTA, fotos del admin).

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde van nombre, equipo y “Ver camiseta” en la tarjeta Destacadas? → A: Cristal arriba (nombre + equipo/liga). “Ver camiseta” abajo.
- Q: Al mover el cursor sobre la tarjeta activa en escritorio, ¿solo se inclina o también se agranda? → A: Solo inclinación suave. Tamaño estable.
- Q: ¿Cómo debe oscurecerse la foto para leer cristal arriba y “Ver camiseta” abajo? → A: Velo en ambos extremos; centro de la camiseta más claro.
- Q: En escritorio, ¿las tarjetas laterales (peek) llevan el mismo cristal y “Ver camiseta” que la activa? → A: Sí: misma cara en activa y peeks (cristal arriba, CTA abajo).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconocer la camiseta en una tarjeta más clara (Priority: P1)

Como visitante en Destacadas, quiero ver la foto de catálogo con el nombre y el equipo/liga en una cabecera tipo cristal **arriba**, un velo oscuro **en los extremos** (prenda más visible al centro), y el botón “Ver camiseta” **abajo** de esa misma pieza, para entender de inmediato qué estoy viendo y pasar a la ficha.

**Why this priority**: Es el cambio visible de esta entrega: la cara de la diapositiva, no el mecanismo del carrusel.

**Independent Test**: Con al menos una foto elegida por el admin, abrir el inicio y mirar Destacadas: cabecera cristal arriba con nombre y equipo/liga (si existe), velo más marcado arriba y abajo con la prenda más clara al centro, “Ver camiseta” abajo que abre esa ficha. No hay precio ni indicadores extra dentro de la tarjeta.

**Acceptance Scenarios**:

1. **Given** Destacadas visible con una diapositiva, **When** mira la tarjeta al frente, **Then** ve foto de catálogo con la prenda reconocible al centro; **arriba** un recuadro tipo cristal con el nombre y, si hay equipo, el equipo (y liga si aplica); **abajo** el CTA “Ver camiseta”, claro y usable.
2. **Given** esa tarjeta, **When** pulsa “Ver camiseta”, **Then** abre la ficha de **esa** camiseta. Pulsar solo la foto no es un requisito.
3. **Given** la tarjeta al frente, **When** busca precio o puntos de paginación dentro de la card, **Then** no los hay (los indicadores del carrusel siguen fuera de la card).

---

### User Story 2 - Inclinación suave solo donde aporta (Priority: P2)

Como visitante en escritorio, quiero que la tarjeta **activa** se incline un poco al mover el cursor, **sin agrandarse**, para que se sienta más viva; en teléfono o si pido menos movimiento, no quiero ese efecto.

**Why this priority**: El look de referencia incluye inclinación; mal aplicada molesta, recorta texto o pelea con el peek de escritorio.

**Independent Test**: En escritorio (~1024 px o más) sin preferencia de menos movimiento, pasar el cursor por la tarjeta al frente y ver una inclinación leve que vuelve al reposo al salir, **sin** que la tarjeta crezca. En ~390 px, o con menos movimiento, o en las tarjetas laterales (peek), no hay inclinación.

**Acceptance Scenarios**:

1. **Given** escritorio (~1024 px o más) y sin preferencia de menos movimiento, **When** mueve el cursor sobre la tarjeta **activa**, **Then** esa tarjeta se inclina de forma suave y limitada **sin agrandarse**; al salir, vuelve a plana.
2. **Given** viewport menor a ~1024 px, **When** usa Destacadas, **Then** no hay inclinación al cursor; sigue una sola tarjeta completa (regla 010).
3. **Given** preferencia de menos movimiento, **When** mira Destacadas en cualquier ancho, **Then** no hay inclinación automática ni al cursor.
4. **Given** escritorio con peeks laterales, **When** el cursor está sobre una vecina (no la activa), **Then** esa vecina no se inclina; sí muestra la misma cara (cristal arriba, CTA abajo) de **su** camiseta; el peek sigue reconocible y el título de la activa no se recorta por el efecto.

---

### User Story 3 - Seguir usando Destacadas como hasta ahora (Priority: P3)

Como visitante, quiero que flechas, indicadores táctiles, swipe, autoplay (~5 s), Pausar/Reanudar y la sincronía foto–nombre–CTA sigan igual, para que el look nuevo no empeore lo ya corregido.

**Why this priority**: Esta entrega es cosmética sobre la cara; 010 no se reabre.

**Independent Test**: Recorrer Destacadas con flechas, indicadores, swipe y autoplay: cada paso muestra la misma camiseta en foto, nombre, equipo y CTA. Pausar sigue visible. Fotos siguen siendo las del admin.

**Acceptance Scenarios**:

1. **Given** dos o más diapositivas, **When** cambia de slide (flecha, indicador, swipe o autoplay), **Then** foto, nombre, equipo/subtítulo y “Ver camiseta” corresponden a la misma camiseta (0 desfases).
2. **Given** Destacadas, **When** usa controles del carrusel, **Then** los indicadores siguen fuera de la card, con área táctil usable, y no aparecen un segundo juego de puntos dentro de la tarjeta.
3. **Given** las fotos ya elegidas en admin, **When** carga el inicio, **Then** Destacadas muestra esas fotos de catálogo, no imágenes de demostración ni de otra marca.

---

### Edge Cases

- Una sola foto: misma cara nueva; sin flechas ni autoplay (regla 009/010).
- Sin equipo/liga: la cabecera muestra el nombre; no hay texto vacío inventado ni copy de otra industria.
- Nombre largo: se mantiene legible en la cabecera superior (no cortado de forma que no se pueda leer); no debe desbordar la card ni tapar el CTA de abajo.
- Redimensionar de escritorio a ~390 px: desaparece la inclinación; una tarjeta completa.
- Peek de escritorio: misma cara (cristal + CTA de esa camiseta); solo la activa puede inclinarse; las vecinas no “flotan” de forma que tapen o recorten la activa.
- Preferencia de menos movimiento: sin inclinación; el resto de controles manuales sigue.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La cara de cada diapositiva Destacadas visible (activa y peeks de escritorio) MUST mostrar la foto de catálogo de esa diapositiva; **arriba**, el nombre y el equipo/liga cuando existan, en cabecera tipo cristal; **abajo**, el CTA “Ver camiseta” hacia la ficha de esa camiseta. MUST NOT usar una cara simplificada (solo foto) en las vecinas.
- **FR-002**: La cabecera de nombre y equipo/liga MUST ir en la parte **superior** de la tarjeta, semitransparente (tipo cristal) sobre la foto, con contraste suficiente. El CTA MUST ir en la parte **inferior**, no dentro de esa cabecera.
- **FR-003**: MUST existir un velo oscuro más marcado en los **extremos** (arriba y abajo) para leer cabecera y CTA, dejando el **centro** de la camiseta más claro y reconocible. MUST NOT ser un velo uniforme que opaque toda la prenda.
- **FR-004**: MUST NOT mostrar precio ni etiqueta de precio en Destacadas.
- **FR-005**: MUST NOT mostrar indicadores de paginación **dentro** de la tarjeta. Los indicadores del carrusel MUST permanecer fuera de la card, como en 010.
- **FR-006**: MUST NOT exigir que toda la tarjeta sea un enlace; el CTA “Ver camiseta” es la acción para abrir la ficha.
- **FR-007**: En escritorio (~1024 px o más), sin preferencia de menos movimiento, la tarjeta **activa** MUST inclinarse de forma suave y limitada al mover el cursor sobre ella, y MUST volver al reposo al salir. MUST NOT agrandarse (el tamaño aparente se mantiene).
- **FR-008**: MUST NOT haber inclinación en viewport menor a ~1024 px, ni en tarjetas que no están al frente, ni cuando la persona pide menos movimiento.
- **FR-009**: La inclinación MUST NOT recortar de forma ilegible el nombre o el CTA, ni impedir reconocer el peek de las vecinas en escritorio. MUST NOT usar agrandamiento de la tarjeta para lograr el efecto.
- **FR-010**: Foto, nombre, equipo/subtítulo y CTA MUST seguir correspondiendo a la misma camiseta en cada momento (sin desfase).
- **FR-011**: MUST NOT cambiar la fuente de fotos (sigue la selección del admin), ni el banner hero ni otras secciones de la home, ni el catálogo/backend.
- **FR-012**: MUST NOT introducir fotos, marcas o textos de demostración ajenos a Flashsport (p. ej. calzado, precios en dólares de muestra).
- **FR-013**: Autoplay, pausa al cursor, control Pausar/Reanudar, swipe, flechas e indicadores MUST conservar el comportamiento ya aceptado en 010.

### Key Entities

- **Cara Destacadas**: presentación visual de una diapositiva (foto de catálogo, cabecera cristal arriba con nombre y equipo/liga opcional, CTA abajo).
- **Diapositiva Destacadas**: la foto ya elegida por el admin (009); esta entrega no cambia qué fotos hay.
- **Estado de inclinación**: en reposo, inclinada por cursor (solo activa en escritorio), o desactivada (no-escritorio, peek, o menos movimiento).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de revisión, el 100% identifica el nombre en la cabecera superior, el CTA abajo y la prenda al centro, sin precio ni puntos extra dentro de la card.
- **SC-002**: En escritorio sin menos movimiento, 100% de las pruebas de cursor sobre la tarjeta activa ven inclinación suave y retorno al plano al salir, **sin** agrandamiento; 0 inclinación en peeks.
- **SC-003**: En ~390 px, 0 inclinación; una tarjeta completa sigue siendo visible (alineado con 010).
- **SC-004**: Con preferencia de menos movimiento, 0 inclinación en 15 s de uso (cursor incluido).
- **SC-005**: En 10 cambios de diapositiva, 10/10 muestran foto + nombre + CTA de la misma camiseta.
- **SC-007**: En escritorio con peeks, el 100% de las tarjetas visibles (activa y vecinas) muestran cristal arriba y CTA abajo de **su** camiseta; 0 caras “solo foto” en laterales.

## Assumptions

- La frase “card del hero” del pedido se interpreta como la **tarjeta prominente de Destacadas**, no el banner hero de la home. El hero no cambia.
- 008/009/010 ya definen lugar, fotos, una tarjeta bajo ~1024 px, autoplay y CTA. Esta entrega **solo cambia el aspecto de la cara**.
- “Inclinación suave y limitada” significa un efecto discreto al cursor, **sin agrandar** la tarjeta, no un giro agresivo que tape vecinos o texto.
- Sin equipo, no se inventa subtítulo.
- Idioma español; tienda Colombia; sin precio en este bloque.

## Out of Scope

- Banner hero y resto de secciones de la homepage.
- Catálogo, admin, persistencia, cuántas fotos se eligen.
- Precio en el overlay.
- Copiar un componente de demostración de terceros (marca, fotos externas, playground a pantalla completa).
- Convertir toda la tarjeta en enlace.
- Reabrir o rediseñar controles del carrusel salvo que el look nuevo los rompa.
