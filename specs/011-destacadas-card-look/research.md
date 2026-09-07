# Research: Look de la tarjeta Destacadas

## 1. Dónde vive el look (card-7 vs SlideFace)

**Decision**: Adaptar `SlideFace` en `featured-coverflow-carousel.tsx`. No crear `card-7.tsx`, `demo.tsx` ni `/components/ui` en la raíz.

**Rationale**: El DTO ya es `HomepageCarouselSlide`. Un primitivo shadcn genérico (`imageUrl`, `price`, `logoUrl`) no mapea al catálogo y ensucia `src/components/ui/card.tsx`.

**Alternatives considered**: Extraer `slide-face.tsx` en products — innecesario para un único consumidor. Copiar 21st.dev — rechazado (marca, precio, CDN).

## 2. Inclinación vs coverflow

**Decision**: Tilt en el **interior** de `SlideFace` (rotateX/Y ≤ ~6°). El wrapper de coverflow sigue con `translateX` / `rotateY` / `scale` de 010. Tilt **sin** `scale` extra. Solo `tiltEnabled` en el slide activo, `lg+`, sin reduced-motion.

**Rationale**: En la activa, coverflow ya pone `rotateY: 0`. Un scale 1.05 pelea con el scale 0.88 de vecinos y recorta texto (clarification: tamaño estable). 6° es más discreto que los 8° del demo y deja margen con el `rotateY` de peeks.

**Alternatives considered**: Tilt en el wrapper de coverflow — mezcla dos rotaciones Y. 8° + scale 1.05 del demo — rechazo explícito. CSS-only `hover:rotate` — no sigue el cursor.

## 3. Umbral escritorio

**Decision**: El mismo corte que 010: Tailwind `lg` = 1024 px. Para no adjuntar `mousemove` en tablet, `matchMedia("(min-width: 1024px)")` (o reutilizar el estado de reduced-motion con un segundo MQL).

**Rationale**: Spec 010/011 alineadas. Clases `lg:` solas no impiden que el handler corra si el nodo desktop está `hidden`… el nodo desktop **no está en el DOM visual** (`hidden lg:block`) pero sí montado; hay que **no** activar tilt en el SlideFace de peeks y, en mobile, el único SlideFace visible no recibe tilt.

**Alternatives considered**: 768 px — contradice 010. Solo CSS hover — el nodo desktop existe en el árbol también bajo `lg` hide… `hidden` es `display:none`, así que el stage desktop no recibe eventos bajo 1024. Aun así, gated explícito evita tilt si alguien unifica los stages.

## 4. Overlay dual

**Decision**: Degradado con oscuro en **ambos** extremos y centro más transparente, p. ej. `bg-gradient-to-b from-black/65 via-transparent to-black/70` (valores aproximados; ajustar a contraste). No velo plano.

**Rationale**: Clarification B. El overlay actual `from-black/70 via-black/20 to-transparent` solo cubre abajo; el cristal arriba quedaría sobre foto clara.

**Alternatives considered**: Dos capas `from-top` + `from-bottom` — válido si un solo `gradient-to-b` no basta. Velo uniforme — rechazado.

## 5. Cristal (glass)

**Decision**: Recuadro superior: `border-white/10 bg-white/10` (o `/5`) `backdrop-blur-md` `rounded-xl`. Texto blanco. Sin logo de marca. Sin equipo → solo nombre.

**Rationale**: Look de referencia sin assets que no existen en el DTO. `backdrop-blur` ya está en el stack Tailwind del repo.

**Alternatives considered**: Lucide como “logo” — prohibido. `logoUrl` — no hay campo.

## 6. CTA y enlaces

**Decision**: Mantener `Button asChild` + `Link` a `/productos/${slug}` abajo. La foto y el contenedor **no** son `Link`. CTA en peeks navega a **esa** ficha (misma cara).

**Rationale**: Clarifications 010 (no card-link) y 011-A (misma cara en peeks). Un CTA en peek es coherente y evita cromado que “aparece” al centrar.

**Alternatives considered**: CTA solo en activa — rechazado (clarification A). Card entera clicable — fuera de alcance.

## 7. Media

**Decision**: `next/image` con `item.url`. No Unsplash de relleno, no `cdn.21st.dev`, no ampliar `remotePatterns` para el demo.

**Rationale**: Constitución: storage de catálogo. 009 ya resuelve URLs.

## 8. Tests

**Decision**: Extender `tests/featured-coverflow-ui.test.ts` (lectura de fuente). No e2e obligatorio en esta entrega; quickstart cubre pasada visual.

**Rationale**: El suite actual ya valida CTA, dots, Pausar, `lg:hidden`. Mismo patrón de bajo coste.

**Alternatives considered**: Playwright — fuera de alcance mínimo.
