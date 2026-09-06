# Research: Carrusel de camisetas en el inicio

## Decision: no copiar `3-d-coverflow-carousel` a `src/components/ui`

**Rationale:** El archivo de referencia trae `defaultDishes`, inglés, fotos CDN de comida, `View Menu`, SVG inline y un `img` crudo. FR-001/002/007 y la constitution (catalog media) lo prohíben. Un playground en `/components/ui` o `/demo` viola el clarify.

**Alternatives considered:** pegar el TSX y solo cambiar textos; ruta `/demo`. Rechazadas.

## Decision: feature Products + composición en `src/app/page.tsx`

**Rationale:** Las diapositivas son productos destacados. Constitution I: bounded context `src/features/products`. El hero sigue en `src/components/home/hero-product.tsx` (una foto, no carrusel).

**Alternatives considered:** componente genérico shadcn; meter el coverflow dentro de `HeroProduct`. Rechazadas (FR-005: no reemplazar el hero).

## Decision: selector puro `slidesForFeaturedCarousel`

**Rationale:** FR-004/SC-005 son reglas de negocio (foto, tope 5, ocultar &lt; 2). Van en dominio testeable, no en JSX. Entrada: `ProductCardData[]` ya cargado por `getFeaturedProducts`. Sin query Prisma nueva ni ranking de ventas.

**Alternatives considered:** `getFeaturedProducts(5)` solo para el carrusel (aún habría que filtrar sin foto). El filtro en memoria sobre los 8 ya pedidos es suficiente.

## Decision: CSS 3D + lucide-react; no framer-motion

**Rationale:** El patrón pide perspectiva y `rotateY`. CSS lo cubre. Lucide ya está (007, home). No instalar animación extra (principio V).

**Alternatives considered:** copiar SVG inline del demo; embla-carousel. Rechazadas por deps o duplicar iconos.

## Decision: `next/image` y URLs de `primaryImage`

**Rationale:** Constitution: no depender de CDN externo permanente. `HeroProduct` ya usa `next/image` + `product.primaryImage`. El fondo desenfocado puede ser la misma URL con `Image` + clases, no `<img src={cdn.21st.dev}>`.

## Decision: escenario oscuro solo en la sección

**Rationale:** FR-010 permite un escenario propio; prohíbe pintar toda la home de restaurante. El resto (hero claro, trust, ligas) no cambia.

## Decision: teclado acotado al bloque, no `window`

**Rationale:** El demo escucha `ArrowLeft/Right` en `window` y rompería inputs/accesibilidad en una home larga. Escuchar en el `<section tabIndex={0}>` (o cuando el bloque tiene foco). Swipe en el stage.

## Decision: autoplay 5 s; `prefers-reduced-motion` lo apaga

**Rationale:** FR-008. Pausa en hover, focus y touch. Reduced-motion: sin autoplay; flechas y puntos siguen.

## Decision: CTA sin precio; copy español

**Rationale:** FR-006/011. “Destacadas” + “Ver camiseta”. `Button asChild` + `Link` a `/productos/${slug}`. No `formatMoney` aquí.

## Decision: implementación vía OpenCode

**Rationale:** Tras `tasks.md`, Cursor crea `.ai/tasks/TASK-XXX.md`. No `/speckit.implement` en Cursor. No pegar el demo.
