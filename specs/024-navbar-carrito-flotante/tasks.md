---
description: "Implementation tasks for the persistent public navbar and mobile cart button"
---

# Tasks: Navbar fijo y carrito flotante móvil

**Input**: Design documents from `specs/024-navbar-carrito-flotante/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/public-navbar-cart.md`, and `quickstart.md`

**Tests**: Incluidas. La constitución exige prueba cuando cambia un recorrido visible, y el plan ya fija `tests/navbar-desktop-ui.test.ts` y `tests/mobile-cart-fab.test.ts`.

**Organization**: Las tareas siguen las historias de `spec.md`. La barra fija (P1) se puede entregar sin el botón. El botón (P2) reutiliza el carrito actual.

**Scope guard**: Solo la tienda pública. No modificar `src/components/layout/admin-layout.tsx`, Prisma, checkout, precios, stock ni la clave `fjs-cart`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece (`US1`, `US2`)
- Las fases Setup, Foundational y Polish no llevan etiqueta de historia

## Path Conventions

- Proyecto único: `src/` y `tests/` en la raíz del repositorio

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el stack y los límites que esta feature reutiliza. No hay dependencia, ruta ni migración nuevas.

- [x] T001 Verificar los scripts de Next.js, React, Tailwind, Zustand y el test runner de Node en `package.json`
- [x] T002 [P] Confirmar que la tienda pública monta el header y que el admin no lo monta en `src/components/layout/app-layout.tsx` y `src/components/layout/admin-layout.tsx`
- [x] T003 [P] Confirmar `--z-navbar`, `--z-drawer`, `--z-toast`, `--header-height` y `overflow-x: hidden` en `html, body` dentro de `src/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dejar registrado el comportamiento actual que las historias deben conservar.

**Critical**: Completar esta fase antes de implementar cualquier historia.

- [x] T004 Auditar la barra `sticky`, el drawer móvil, el bloqueo de scroll del body y `CartBadge` en `src/components/layout/header.tsx`
- [x] T005 [P] Confirmar el store `fjs-cart`, la suma de `quantity` y `persist.hasHydrated` en `src/shared/stores/cart-store.ts`
- [x] T006 [P] Confirmar que el toaster ocupa la esquina inferior derecha en la capa `--z-toast` en `src/components/ui/toaster.tsx`

**Checkpoint**: El anclaje actual, el carrito cliente y las capas visuales están entendidos. No hay trabajo de Prisma ni de API.

---

## Phase 3: User Story 1 - La barra de la tienda sigue visible al desplazar (Priority: P1) 🎯 MVP

**Goal**: La barra pública queda fija al borde superior del viewport en escritorio y en teléfono, sin tapar el contenido y sin cambiar el admin.

**Independent Test**: En portada, listado y ficha, a 1440px y a 375px, desplazar más de una pantalla y comprobar que marca, búsqueda, menú y carrito siguen usables. El panel admin no muestra esta barra.

### Tests for User Story 1

- [x] T007 [US1] Extender `tests/navbar-desktop-ui.test.ts` para exigir `fixed` (y no `sticky`) en el header público, el espaciador `h-16 md:h-[4.5rem]` con `aria-hidden`, y que `src/components/layout/admin-layout.tsx` siga sin montar `Header`. Escribir la aserción antes del cambio para que falle.

### Implementation for User Story 1

- [x] T008 [US1] Sustituir `sticky top-0` por `fixed top-0 inset-x-0 w-full` y añadir el espaciador de la fila cerrada en `src/components/layout/header.tsx`, conservando `z-[var(--z-navbar)]`, la búsqueda móvil y el drawer
- [x] T009 [US1] Ejecutar `node --import tsx --test tests/navbar-desktop-ui.test.ts` y corregir `src/components/layout/header.tsx` hasta que pase

**Checkpoint**: La historia 1 se puede demostrar sin el botón flotante.

---

## Phase 4: User Story 2 - Acceso flotante al carrito en el teléfono (Priority: P2)

**Goal**: En navegación compacta, un botón lleva a `/carrito` cuando hay unidades, y desaparece si el carrito está vacío, si la ruta es el carrito o el pago, si el menú móvil está abierto o si el ancho es de escritorio.

**Independent Test**: Con el ancho por debajo de 1024px, añadir una unidad y ver el botón con la cantidad sin volver arriba; activarlo abre `/carrito` y allí no se muestra. Vaciar el carrito lo oculta. A 1024px o más no aparece aunque haya unidades.

### Tests for User Story 2

- [x] T010 [US2] Crear `tests/mobile-cart-fab.test.ts` con la tabla de `shouldShowMobileCartFab` de `specs/024-navbar-carrito-flotante/data-model.md` y con aserciones de contrato sobre `src/features/cart/components/mobile-cart-fab.tsx` y `src/components/layout/header.tsx` (`lg:hidden`, enlace `/carrito`, `--z-navbar`, espera de rehidratación, badge `99+`). Escribirlas antes de la implementación para que fallen.

### Implementation for User Story 2

- [x] T011 [US2] Implementar `shouldShowMobileCartFab` en `src/features/cart/domain/mobile-cart-fab.ts` según `specs/024-navbar-carrito-flotante/data-model.md`
- [x] T012 [US2] Implementar el enlace flotante en `src/features/cart/components/mobile-cart-fab.tsx`, leyendo `useCartStore` de `src/shared/stores/cart-store.ts` y `usePathname`, sin pintar hasta `persist.hasHydrated()`
- [x] T013 [US2] Montar el botón desde `src/components/layout/header.tsx`, pasarle `isMobileOpen`, y conservar el `CartBadge` existente hacia `/carrito`
- [x] T014 [US2] Ejecutar `node --import tsx --test tests/mobile-cart-fab.test.ts tests/navbar-desktop-ui.test.ts` y corregir los archivos de esta historia hasta que pasen

**Checkpoint**: Las historias 1 y 2 funcionan juntas. El admin y la clave del carrito siguen iguales.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar regresiones de límites y el recorrido manual de `quickstart.md`.

- [x] T015 [P] Verificar que `src/components/layout/admin-layout.tsx` no importa `Header` ni `MobileCartFab`
- [x] T016 Recorrer los seis pasos manuales de `specs/024-navbar-carrito-flotante/quickstart.md` en la tienda local, en 1440px y en 375px

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: puede empezar de inmediato
- **Foundational (Phase 2)**: depende del setup y bloquea las historias
- **User Story 1 (Phase 3)**: depende de la fase 2
- **User Story 2 (Phase 4)**: depende de la fase 2 y, en la práctica, de T008, porque T013 también edita `src/components/layout/header.tsx`
- **Polish (Phase 5)**: depende de las historias que se quieran entregar

### User Story Dependencies

- **User Story 1 (P1)**: no depende del botón
- **User Story 2 (P2)**: la función de visibilidad no depende de la barra fija; el montaje en el header sí debe esperar a T008 para no pisar el mismo archivo

### Within Each User Story

- La prueba se escribe y falla antes de la implementación
- La función pura va antes del componente
- El componente va antes de montarlo en el header

### Parallel Opportunities

- T002 y T003 pueden ir en paralelo
- T005 y T006 pueden ir en paralelo
- T015 puede revisarse mientras se prepara el recorrido de T016, después de T014

---

## Parallel Example: User Story 1

```bash
# Después de T004, la prueba y la lectura de capas ya hechas en setup no comparten archivo con la implementación:
# T007 escribe tests/navbar-desktop-ui.test.ts
# T008, solo cuando T007 exista y falle, edita src/components/layout/header.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2
2. Completar Phase 3
3. Parar y validar el desplazamiento en escritorio y en teléfono
4. La barra fija ya entrega valor sin el botón

### Incremental Delivery

1. Setup + Foundational
2. User Story 1 → prueba de anclaje → demo
3. User Story 2 → prueba de visibilidad y botón → demo
4. Polish con el quickstart manual

### Parallel Team Strategy

Con dos personas, después de la fase 2:

- Una persona: T007 y T008 en la barra
- La otra: T010 y T011 en la función pura
- T012 y T013 esperan a que T008 haya dejado de editar `src/components/layout/header.tsx`

---

## Notes

- [P] marca archivos distintos y sin dependencia abierta
- No crear otro store de carrito ni otro destino distinto de `/carrito`
- El botón usa la capa `--z-navbar` para quedar debajo del drawer, de los diálogos y de los toasts
- Validar en el navegador antes de dar por cerrada la fase Polish
