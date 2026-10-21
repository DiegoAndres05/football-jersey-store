# Implementation Plan: Movimiento Halloween del inicio

**Branch**: `030-refine-halloween-motion` (setup no reportó branch activo) | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-refine-halloween-motion/spec.md`

## Summary

La primera pantalla del inicio muestra exactamente dos murciélagos y una araña, en hueso, negro, grises y blanco, al 55 % de opacidad. Cada murciélago cruza 12 segundos y espera 25 segundos; nunca cruzan juntos. La araña se mece en su sitio. El titular entra con la línea corta de encima, y el párrafo y los botones les siguen con 0,5 segundos de diferencia. La tarjeta de la camiseta flota 4 px y, al pasar el puntero, se acerca un 3,5 % en 300 ms. Reducir movimiento deja todo quieto y el texto visible al instante.

## Technical Context

**Language/Version**: TypeScript y Next.js App Router, según `package.json`.

**Primary Dependencies**: GSAP, ya usado en `src/components/home/hero-copy-animation.tsx`. La decoración y el flote usan CSS del proyecto, sin librería nueva. Colores: los tokens actuales de `src/app/globals.css` (`--background`, `--foreground`, `--muted-foreground`, `--card`).

**Storage**: N/A. No hay datos de pedido, catálogo ni preferencias guardadas.

**Testing**: `node --import tsx --test tests/halloween-hero-motion.test.ts`. No correr `npm test` entero: esa orden incluye pruebas que escriben pedidos. Recorrido visual en [quickstart.md](./quickstart.md).

**Target Platform**: Tienda pública, primera pantalla de `/`, en teléfono y escritorio.

**Project Type**: Tienda web. Sin cambios de pago, envío, catálogo ni admin.

**Performance Goals**: La decoración no pide red ni imágenes remotas. Los recorridos son CSS. La entrada del texto sigue siendo un solo efecto al cargar.

**Constraints**: Opacidad 0,55. Pausa de cada murciélago 25 s, dentro de 20–30 s. Subida de la araña 6 px. Flote de la tarjeta 4 px. Acercamiento 3,5 % en 300 ms. Fundido de cada grupo 0,8 s, menor de 1 s. Paleta actual. `prefers-reduced-motion: reduce` apaga recorridos, flote, acercamiento y la entrada escalonada.

**Scale/Scope**: Solo la sección hero de `src/app/page.tsx`. El resto de la portada, el carrusel y las otras páginas quedan como están.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Límites de dominio**: PASS. El cambio vive en la presentación del inicio (`src/components/home` y la sección hero de `src/app/page.tsx`). No cruza pedidos, inventario ni pagos.
- **II. Integridad auditable**: PASS. No hay precios, stock ni estados de pedido.
- **III. Contratos tipados**: PASS. El horario de los murciélagos y las medidas salen de constantes tipadas. El componente de texto sigue siendo cliente solo porque ya anima al cargar. La decoración no necesita estado de navegador.
- **IV. Menor privilegio**: PASS. No hay admin, secretos ni datos de cliente.
- **V. Entrega verificable**: PASS. Una prueba pura comprueba cantidades, pausa, que los cruces no se solapan y las medidas. El contrato de fuente comprueba que la página usa esas constantes y respeta reducir movimiento. El ojo lo confirma `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/030-refine-halloween-motion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── hero-halloween-motion.md
└── tasks.md
```

### Source Code (repository root)

```text
src/components/home/hero-halloween-motion.ts
src/components/home/hero-halloween.tsx
src/components/home/hero-copy-animation.tsx
src/components/home/hero-product.tsx
src/app/page.tsx
src/app/globals.css
tests/halloween-hero-motion.test.ts
```

**Structure Decision**: Un solo proyecto Next.js. Las medidas viven en un módulo puro para poder probarlas sin abrir el navegador. La decoración se pinta dentro del hero, detrás del texto y de la tarjeta, y no se monta en el resto de la página. GSAP se queda en la entrada del texto, que ya existe. Los bucles de murciélagos, araña y flote van en CSS para que reducir movimiento los apague sin JavaScript.

## Complexity Tracking

Sin violaciones. No hay librería, tabla ni ruta nuevas. No se reescribe el hero ni el carrusel.

## Phase 0 — Research

Ver [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): piezas de decoración, horarios y medidas de la tarjeta y de la entrada.
- [contracts/hero-halloween-motion.md](./contracts/hero-halloween-motion.md): lo que se ve en la primera pantalla, con movimiento y sin él.
- [quickstart.md](./quickstart.md): prueba automática y recorrido visual.

## Post-design Constitution Check

PASS en los cinco principios. El diseño no toca dinero, inventario, pago ni admin. La decoración es ornamental, no recibe foco y no bloquea el puntero.
