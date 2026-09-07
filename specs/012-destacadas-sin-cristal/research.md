# Research: Destacadas sin cristal

## 1. Qué quitar del look 011

**Decision**: Eliminar el panel cristal (`border` + `bg-white/10` + `backdrop-blur`) y el título/equipo **dentro** de la foto. Eliminar el velo dual fuerte (`from-black/65` + `to-black/70`).

**Rationale**: Feedback del usuario: el cristal tapa la camiseta; pide imagen limpia y poco texto encima.

**Alternatives considered**: Texto fino arriba sin caja — rechazado en clarify (opción A: solo CTA en foto). Mantener velo dual — rechazado (opaca la prenda).

## 2. CTA solo en activa

**Decision**: Prop `showCta` en `SlideFace`. `true` en mobile (única) y desktop activo; `false` en peeks.

**Rationale**: Clarify Q5. Peeks = solo foto.

**Alternatives considered**: CTA en todos — rechazado.

## 3. Pie bajo la activa

**Decision**: Renderizar nombre + equipo **fuera** de `SlideFace`, debajo de la card activa (móvil: bajo el `article`; desktop: bloque centrado bajo el stage, alineado a la card central). Fuente: `items[currentIndex]`.

**Rationale**: Clarify Q3–Q4. Sincronía con la slide activa; peeks sin pie.

**Alternatives considered**: Pie bajo cada peek — rechazado. Título en el `h2` de sección — no refleja la slide actual.

## 4. Velo mínimo

**Decision**: Si hay CTA, franja suave inferior (`from-black/30–40` → transparent) opcional. Sin velo superior. Peeks: sin overlay.

**Rationale**: FR-005 imagen limpia; CTA aún debe leerse.

**Alternatives considered**: Sin velo absoluto — viable si el botón sólido se lee; preferir mínimo bajo CTA.

## 5. Tilt y 010

**Decision**: No tocar lógica de tilt, autoplay, dots, Pausar, swipe, fuente 009.

**Rationale**: US3 / FR-006–008.
