# Feature Specification: Destacadas sin cristal que tape la camiseta

**Feature Branch**: `012-destacadas-sin-cristal`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: el look reciente de Destacadas (011) está bien hasta un punto, pero el panel tipo cristal encima de la foto se ve horrible porque tapa la camiseta.

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde van nombre, equipo y “Ver camiseta” al quitar el cristal? → A: (inicial) Nombre arriba sin panel; CTA abajo — **superseded** por la decisión de imagen limpia.
- Q: ¿Cómo se oscurece la foto / cuánta UI encima? → A: Imagen limpia prioritaria; velo mínimo; poco texto que opaque la camiseta.
- Q: Con “imagen limpia”, ¿cuánto texto queda encima de la foto? → A: Solo el CTA “Ver camiseta” sobre la foto. Nombre/equipo fuera de la imagen (bajo la card).
- Q: En escritorio con peeks, ¿dónde va el nombre/equipo? → A: Solo bajo la tarjeta **activa**. Los peeks sin pie.
- Q: ¿Los peeks de escritorio también muestran “Ver camiseta” sobre la foto? → A: No. CTA solo en la activa. Peeks = solo foto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver la camiseta limpia (Priority: P1)

Como visitante en Destacadas, quiero ver la foto de la camiseta **limpia** (sin panel cristal ni mucho texto encima), para reconocer el producto de un vistazo.

**Why this priority**: El cristal y el texto encima opacan la mercancía.

**Independent Test**: Abrir el inicio; la foto activa no tiene panel cristal ni nombre/equipo encima; CTA solo en la activa; peeks = solo foto; nombre/equipo bajo la activa; la prenda se ve clara.

**Acceptance Scenarios**:

1. **Given** Destacadas con al menos una diapositiva, **When** mira la foto de la tarjeta, **Then** no hay panel cristal ni nombre/equipo superpuestos sobre la camiseta.
2. **Given** esa tarjeta, **When** mira el cuerpo de la prenda, **Then** la camiseta se reconoce con la imagen limpia (velo mínimo o ninguno salvo lo imprescindible para el CTA).
3. **Given** la misma diapositiva activa, **When** busca título y acción, **Then** el CTA “Ver camiseta” está solo en la foto activa (abajo) y el nombre (y equipo si hay) están bajo la card activa. Los peeks no muestran CTA ni pie.

---

### User Story 2 - Seguir sabiendo qué camiseta es (Priority: P2)

Como visitante, quiero ver el nombre y el equipo junto a la foto (bajo la card) y poder pulsar “Ver camiseta” en la foto, para no perder claridad.

**Why this priority**: Sacar el texto de la foto no debe ocultar la identidad del producto.

**Independent Test**: Nombre/equipo bajo la card coinciden con la foto; CTA en la foto abre esa ficha; al cambiar de slide, todo sigue sincronizado.

**Acceptance Scenarios**:

1. **Given** una diapositiva con equipo al frente, **When** mira bajo la card activa, **Then** ve nombre y equipo/liga de **esa** camiseta (no encima de la foto). Los peeks no llevan pie de nombre.
2. **Given** la tarjeta activa, **When** pulsa “Ver camiseta” sobre la foto, **Then** abre la ficha de esa camiseta.
3. **Given** varias diapositivas, **When** cambia de slide, **Then** foto, nombre bajo la card y CTA corresponden a la misma camiseta.

---

### User Story 3 - No romper lo ya aceptado (Priority: P3)

Como visitante, quiero que inclinación (activa en escritorio), una tarjeta bajo ~1024 px, autoplay, Pausar, dots y fotos del admin sigan como en 010/011, para que este arreglo sea solo de la cara.

**Why this priority**: Alcance mínimo.

**Independent Test**: Controles 010 intactos; tilt 011 si aplica; foto limpia; hero sin cambios.

**Acceptance Scenarios**:

1. **Given** Destacadas, **When** usa flechas, dots, swipe o Pausar, **Then** el comportamiento sigue el de 010.
2. **Given** escritorio sin menos movimiento, **When** mueve el cursor sobre la activa, **Then** la inclinación suave sin agrandar sigue disponible (011).
3. **Given** el inicio, **When** mira fuera de Destacadas, **Then** el banner hero y el resto no cambian.

---

### Edge Cases

- Nombre largo: legible bajo la card; no vuelve a entrar como bloque sobre la foto.
- Sin equipo: solo nombre bajo la card + CTA en la foto.
- Peek de escritorio: solo foto (sin CTA ni pie); pie y CTA solo en la **activa**.
- Una sola foto: CTA en la foto + pie debajo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La cara Destacadas MUST NOT mostrar un panel tipo cristal (fondo semitransparente + borde + blur) encima de la foto.
- **FR-002**: Sobre la foto MUST NOT haber nombre ni equipo. La imagen MUST verse limpia. El CTA “Ver camiseta” MUST aparecer solo en la diapositiva **activa** (abajo, discreto). Los peeks MUST ser solo foto (sin CTA encima).
- **FR-003**: Nombre y equipo/liga (si existe) MUST mostrarse **fuera** de la imagen, bajo la card **activa** únicamente (móvil: la única card; escritorio: la centrada). MUST NOT mostrar pie de nombre bajo los peeks. MUST corresponder a la misma diapositiva que la foto activa y su CTA.
- **FR-004**: El CTA de la activa MUST ser el enlace a la ficha; MUST NOT exigir tarjeta entera como enlace; MUST NOT mostrar precio ni dots dentro de la foto.
- **FR-005**: Cualquier velo sobre la foto MUST ser mínimo (p. ej. solo una franja suave abajo para el CTA). MUST NOT opaquear la camiseta con velos fuertes ni texto abundante.
- **FR-006**: MUST conservar inclinación suave solo en activa de escritorio, sin agrandar, off en &lt;~1024 px / peeks / menos movimiento (011).
- **FR-007**: MUST conservar comportamiento 010 (una card bajo ~1024 px, swipe, dots, autoplay, Pausar) y fuente de fotos 009.
- **FR-008**: MUST NOT cambiar hero, otras secciones, admin, catálogo o backend.

### Key Entities

- **Foto Destacadas (activa)**: imagen limpia + CTA abajo; sin cristal ni título encima.
- **Foto Destacadas (peek)**: solo imagen limpia.
- **Pie de diapositiva**: nombre + equipo/liga solo bajo la activa.
- **Diapositiva Destacadas**: sin cambio de datos (009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de revisión, el 100% reporta la camiseta reconocible con imagen limpia (sin cristal ni título encima).
- **SC-002**: El 100% encuentra el CTA solo en la activa, el nombre bajo la activa, y peeks sin CTA ni pie; sin precio ni dots en la imagen.
- **SC-003**: En 10 cambios de diapositiva, 10/10 mantienen foto + pie (nombre) + CTA de la misma camiseta.
- **SC-004**: Controles 010 y tilt 011 (si aplica) pasan no-regresión en el 100% de una pasada.

## Assumptions

- 011 se mantiene en tilt, peeks y sin precio; se revierte el cristal y el título sobre la foto.
- CTA solo en la activa; peeks = solo foto; nombre/equipo bajo la activa (clarifications Session 2026-09-06).
- Arreglo mínimo sobre el carrusel / `SlideFace` actual.

## Out of Scope

- Rediseñar el carrusel completo, hero u otras secciones.
- Volver a poner panel cristal o título grande encima de la foto.
- Cambiar fotos del admin, precios en overlay, o card-7/demo.
