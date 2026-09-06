# Implementation Plan: Carrito interactivo en el flujo de compra

**Branch**: `007-carrito-interactivo` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-carrito-interactivo/spec.md`

## Summary

Aplicar el patrón visual del checkout interactivo de referencia (listado + resumen pegajoso, cantidades, total que se actualiza a la vista, transiciones breves) **solo** a la página de carrito real. Misma bolsa Zustand, `formatMoney`, tope inmediato (006) y `Button` existente. Sin demo de zapatillas, sin segundo carrito, sin `@number-flow/react` (evitar totales en flotante) y sin sustituir el sistema de botones.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Zustand 5 (`useCartStore`), `formatMoney`, `Button`/`Badge` en `src/components/ui`, `tailwindcss-animate`, lucide-react (ya en el proyecto). Sin framer-motion ni NumberFlow.

**Storage**: Carrito client persistido (`fjs-cart`). Sin migración Prisma.

**Testing**: Node test runner vía `tsx` (lectura de fuente / contratos de UI como `favorites-ui.test.ts`); `tsc --noEmit`, lint (limitación Next 16) y build

**Target Platform**: Web, checkout invitado, español

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Cambio de cantidad válido actualiza recuento y total en &lt; 300 ms percibidos (SC-001), sin recargar la ruta

**Constraints**: COP enteros; tope inmediata; “−” deshabilitado en cantidad 1; móvil listado→resumen sin barra fija; `prefers-reduced-motion` no bloquea acciones; OpenCode ejecuta tras tareas en `.ai/tasks/`

**Scale/Scope**: `src/app/carrito/page.tsx` + `src/features/cart/components/cart-page-client.tsx` (posible extracción de línea/resumen en el mismo feature). Ficha y checkout no se rediseñan (US3 = regresión de la bolsa)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. UI de carrito en `src/features/cart`. No se mueve stock ni pedidos.
- **II. Auditable integrity**: PASS. Sin escribir ledger; importes siguen enteros COP; `formatMoney` para la vista.
- **III. Typed contracts**: PASS. Se reutilizan `CartItem`, `CurrencyContext` y acciones de stock ya tipadas.
- **IV. Least privilege**: PASS. Sin nuevos secretos ni rutas admin.
- **V. Verified delivery**: PASS. Pruebas de contrato de UI (menos deshabilitado, grid, `useCartStore`, ir a `/checkout`) + gates. Complejidad extra (framer-motion / NumberFlow) no justificada.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/007-carrito-interactivo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/interactive-cart.md
└── tasks.md                 # /speckit.tasks; ejecución OpenCode vía .ai/tasks/
```

### Source Code

```text
src/
├── app/carrito/page.tsx
├── features/cart/
│   ├── components/cart-page-client.tsx    # layout + motion + resumen
│   ├── components/cart-line-card.tsx      # opcional: extraer línea
│   ├── components/cart-summary-panel.tsx  # opcional: extraer resumen
│   ├── domain/immediate-quantity.ts       # sin cambios de reglas
│   └── server/cart-stock-actions.ts       # sin cambios de reglas
├── components/ui/button.tsx               # reutilizar; no reemplazar
├── shared/stores/cart-store.ts            # misma API add/update/remove
└── shared/money/format.ts

tests/
└── cart-interactive-ui.test.ts
```

**Structure Decision**: Monolito por bounded context. La interacción vive en Cart, no en `src/components/ui/interactive-checkout.tsx` (eso duplicaría estado). Extracción de línea/resumen opcional si `cart-page-client.tsx` supera ~300 líneas; no es un componente shadcn genérico de demo.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: no demo; CSS/`tailwindcss-animate` en lugar de framer-motion y NumberFlow; grid `lg:grid-cols-[1fr_380px]` ya existente; `lg:sticky` solo en escritorio; OpenCode no Cursor para implementar.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/interactive-cart.md](contracts/interactive-cart.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Conservar `useCartStore`, reconcile de stock al montar, `formatMoney` y textos en español.
2. Afinar listado + panel: transiciones de entrada/salida de línea y de total (`duration-200`, respetar `motion-reduce`).
3. “−” `disabled` si `quantity <= 1`; “+” sigue el remaining inmediato; papelera quita.
4. Escritorio: `aside` `lg:sticky lg:top-24`. Móvil: un solo flujo (grid 1 col), resumen **después** del listado, sin `fixed`/`sticky` de pago en viewport pequeño.
5. CTA “Ir a pagar” → `/checkout`. Vacío actual sin panel de total.
6. Tests de fuente: store, `/checkout`, disabled minus, `lg:grid-cols`, ausencia de productos demo / NumberFlow / segundo `useState` de carrito.
7. Cursor escribe `.ai/tasks/` tras `/speckit.tasks`; OpenCode `/ai-task`.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** Cart posee la UI; Products/Orders intactos.
- **II.** Totales de vista derivados de enteros COP; sin NumberFlow sobre floats.
- **III.** Sin nuevos payloads; contratos de UI documentados.
- **IV.** Sin superficie admin nueva.
- **V.** Tests de contrato + build; sin librerías de animación nuevas.

## Complexity Tracking

> Sin violaciones constitucionales.
