# Research: Carrito interactivo

## Decision: no copiar `interactive-checkout` a `src/components/ui`

**Rationale:** El demo trae carrito local, zapatillas, `$129.99` y un `Button` CVA distinto. FR-001/003 y la constitution exigen la bolsa Zustand y el `Button` de `src/components/ui/button.tsx`. Un archivo shadcn de playground viola el clarify (solo página de carrito).

**Alternatives considered:** ruta `/demo/checkout`; pegar el TSX en `components/ui`. Rechazadas.

## Decision: evolucionar `cart-page-client.tsx` (extracción opcional de línea/resumen)

**Rationale:** Ya hay grid `lg:grid-cols-[1fr_380px]`, `lg:sticky`, cantidades, papelera, envío gratis y reconcile 006. El hueco es feedback de movimiento y claridad visual, no un segundo layout.

**Alternatives considered:** reescribir la página desde el demo. Se descarta: pierde stock, modalidad y moneda.

## Decision: CSS + `tailwindcss-animate`; no `framer-motion` ni `@number-flow/react`

**Rationale:** NumberFlow anima números en punto flotante y contradice FR-010. Framer Motion es dependencia nueva no justificada (principio V): SC-001 pide &lt; 300 ms, no un motor de layout. `transition-all duration-200` y `motion-reduce:transition-none` cubren entrada/cambio; la salida puede ser inmediata o una clase de opacidad breve. Lucide ya está.

**Alternatives considered:** NumberFlow con céntimos USD; Framer `AnimatePresence`. Rechazadas por dinero flotante y complejidad.

## Decision: layout responsive ya alineado al clarify

**Rationale:** El grid de una columna en &lt; `lg` apila en orden DOM: listado y luego `aside`. En `lg+`, sticky en el aside (`top-24` bajo la cabecera). No usar `fixed bottom-0` en el resumen.

**Alternatives considered:** barra de pago fija en móvil (opción B del clarify). Rechazada por el usuario.

## Decision: “−” deshabilitado en cantidad 1; quitar = papelera

**Rationale:** Clarify A y el store actual (`updateQuantity` no baja de 1). No mapear `delta -1` a `removeItem`.

## Decision: US3 es regresión, no mini-carrito

**Rationale:** Añadir en ficha ya usa `useCartStore`. Out of scope: drawer. Pruebas: ficha + store + página carrito, sin UI nueva en PDP.

## Decision: implementación vía OpenCode

**Rationale:** `.ai/integrations/cursor.md` — Cursor no gasta contexto en UI repetible. Tras `tasks.md`, Cursor crea `.ai/tasks/TASK-XXX.md` y OpenCode ejecuta `/ai-task`.
