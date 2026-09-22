# Implementation Plan: Navbar fijo y carrito flotante móvil

**Branch**: `024-navbar-carrito-flotante` (setup no reportó branch activo) | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-navbar-carrito-flotante/spec.md`

## Summary

La barra pública debe seguir visible al desplazar en escritorio y en teléfono. Hoy usa `sticky`, pero `html` y `body` tienen `overflow-x: hidden`, y ese recorte convierte el eje vertical en contenedor de scroll y puede soltar un elemento sticky. La barra pasa a `fixed` respecto al viewport, con un espaciador en el flujo de la misma altura para que el contenido no quede debajo. En anchos por debajo de `lg` (1024px), el mismo header muestra un botón flotante al carrito cuando hay unidades, reutilizando el store `fjs-cart` y el destino `/carrito`. No aparece en escritorio, ni con el carrito vacío, ni en `/carrito` o `/checkout`, ni por encima del menú móvil. El admin no cambia.

## Technical Context

**Language/Version**: TypeScript y Next.js App Router, según `package.json`.

**Primary Dependencies**: React, Tailwind CSS, Zustand (`src/shared/stores/cart-store.ts`), `next/navigation`.

**Storage**: Sin persistencia nueva. El carrito sigue en el store cliente `fjs-cart` (localStorage vía Zustand persist).

**Testing**: `npm test` con `node --import tsx --test`. Prueba de dominio para la visibilidad del botón y prueba de contrato de UI al estilo de `tests/navbar-desktop-ui.test.ts`. Revisión manual en el navegador en escritorio y en ancho de teléfono.

**Target Platform**: Tienda pública web. Escritorio desde 1024px. Teléfono y navegación compacta por debajo de 1024px, incluidos 320–375px.

**Performance Goals**: La barra no se anima al scroll. El botón aparece en la misma vista al cambiar la cantidad, sin pedir otro desplazamiento. Sin listeners de scroll nuevos para mostrar u ocultar la barra.

**Constraints**: No tocar el layout de admin. No crear otro carrito ni otro destino de checkout. No tapar el drawer (`--z-drawer`), los toasts (`--z-toast`) ni los diálogos. La cantidad es la suma de unidades, igual que `CartBadge`.

**Scale/Scope**: `src/components/layout/header.tsx`, un componente cliente pequeño del botón, una función pura de visibilidad y dos pruebas. Sin Prisma ni API.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Límites de dominio**: PASS. La regla de cuándo mostrar el botón vive en `src/features/cart`. El header público sigue en `src/components/layout`. No hay acoplamiento con inventario, pedidos ni admin.
- **II. Integridad auditable**: PASS. No hay movimientos de inventario, precios ni pedidos.
- **III. Contratos tipados**: PASS. La visibilidad es una función pura tipada. El botón es cliente porque lee estado del navegador y la ruta. No hay server action nueva.
- **IV. Menor privilegio**: PASS. No se exponen datos nuevos ni secretos. El botón solo enlaza a `/carrito`.
- **V. Entrega verificable**: PASS. La regla de negocio del botón tiene test unitario y el anclaje de la barra tiene aserción de contrato. El recorrido visual queda en `quickstart.md`.

## Project Structure

### Documentation (this feature)

```text
specs/024-navbar-carrito-flotante/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── public-navbar-cart.md
└── tasks.md                 # lo crea /speckit.tasks, no este comando
```

### Source Code (repository root)

```text
src/components/layout/header.tsx          # barra fixed + espaciador + monta el botón
src/components/layout/app-layout.tsx      # sin cambio de límites; sigue siendo el único layout público
src/features/cart/domain/mobile-cart-fab.ts
src/features/cart/components/mobile-cart-fab.tsx
src/shared/stores/cart-store.ts           # se lee; no se duplica
src/app/globals.css                       # --header-height y z-index ya existen; no hace falta token nuevo
tests/navbar-desktop-ui.test.ts           # se extiende el anclaje fixed y el espaciador
tests/mobile-cart-fab.test.ts
```

**Structure Decision**: Un solo proyecto Next.js. La presentación queda en el header público, que ya es cliente y ya conoce el menú móvil. La decisión de mostrar el botón es dominio de carrito y se prueba sin DOM. El admin (`src/components/layout/admin-layout.tsx`) no importa el header público.

## Complexity Tracking

Sin violaciones. No hay proyecto, repositorio ni persistencia nuevos.

## Phase 0 — Research

Ver [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): vista derivada del carrito; sin entidad persistida.
- [contracts/public-navbar-cart.md](./contracts/public-navbar-cart.md): barra fija, espaciador y botón flotante.
- [quickstart.md](./quickstart.md): pruebas automáticas y recorrido manual.

## Post-design Constitution Check

PASS en los cinco principios. El diseño no abre excepciones: no cambia dinero, stock, auth ni el panel admin. La única pieza cliente nueva lee el store y la ruta que el header ya usa.
