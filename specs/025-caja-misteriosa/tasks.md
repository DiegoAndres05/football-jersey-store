---
description: "Implementation tasks for the public mystery box product"
---

# Tasks: Caja misteriosa

**Input**: Design documents from `specs/025-caja-misteriosa/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/public-mystery-box.md`, and `quickstart.md`

**Tests**: Incluidas. La constitución exige prueba cuando cambia un recorrido de compra, y el plan fija `tests/mystery-box.test.ts`.

**Organization**: Las tareas siguen las historias de `spec.md`. Elegir nivel y talla (P1) se puede demostrar sin la entrada de navegación. Encontrar la caja (P2) y cerrar el pedido (P3) se apoyan en esa línea.

**Scope guard**: No crear un checkout nuevo, no rediseñar el admin y no descontar una camiseta concreta al vender la caja. Los precios siguen siendo enteros en pesos.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece (`US1`, `US2`, `US3`)
- Las fases Setup, Foundational y Polish no llevan etiqueta de historia

## Path Conventions

- Proyecto único: `src/`, `prisma/` y `tests/` en la raíz del repositorio

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el catálogo, las versiones y la línea de compra que esta feature reutiliza. No hay dependencia ni pasarela nuevas.

- [ ] T001 Verificar `Product`, `Version`, `Size`, `ProductVariant` y el ledger de inventario en `prisma/schema.prisma`
- [ ] T002 [P] Confirmar los destinos públicos y la tarjeta de producto en `src/components/layout/nav-links.tsx` y `src/features/products/components/product-card.tsx`
- [ ] T003 [P] Confirmar la identidad de línea y el snapshot de pedido en `src/shared/stores/cart-store.ts` y `src/features/orders/repositories/order-repository.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dejar el tipo de producto y la siembra de la caja antes de las historias.

**Critical**: Completar esta fase antes de implementar cualquier historia.

- [ ] T004 Añadir `productKind` con default `JERSEY` a `Product` y `lineKind` con default `JERSEY` a `OrderItem` en `prisma/schema.prisma`, y generar la migración aditiva
- [ ] T005 Sembrar el equipo interno, la temporada interna y el producto `caja-misteriosa` con variantes `fan`, `player` y `retro` por talla en `prisma/seed.ts`

**Checkpoint**: Las camisetas existentes siguen siendo `JERSEY`. La caja existe en datos, todavía sin sección pública.

---

## Phase 3: User Story 1 - Elegir nivel y talla de la caja (Priority: P1) 🎯 MVP

**Goal**: En `/caja-misteriosa` el cliente ve Básica/Fan, Estándar/Player y Premium/Retro, elige una talla disponible y agrega una línea sin equipo ni personalización.

**Independent Test**: Abrir la sección, elegir un nivel y una talla, agregar al carrito y ver Caja misteriosa, el nivel, la calidad, la talla y el precio.

### Tests for User Story 1

- [ ] T006 [US1] Crear `tests/mystery-box.test.ts` para el mapa `fan`/`player`/`retro`, el rechazo de otro slug y una línea sin personalización ni equipo visible. Escribirla antes de la implementación para que falle.

### Implementation for User Story 1

- [ ] T007 [US1] Implementar `mysteryBoxTier` y la etiqueta de línea en `src/features/products/domain/mystery-box.ts`
- [ ] T008 [US1] Crear la sección en `src/app/caja-misteriosa/page.tsx` y el selector de nivel y talla en `src/features/products/components/mystery-box-picker.tsx`, usando `salePrice` y sin controles de personalización
- [ ] T009 [US1] Guardar `lineKind: "MYSTERY_BOX"` al agregar desde `src/features/products/components/mystery-box-picker.tsx` y mostrarla sin equipo en `src/features/cart/components/cart-page-client.tsx` y `src/shared/stores/cart-store.ts`
- [ ] T010 [US1] Ejecutar `node --import tsx --test tests/mystery-box.test.ts` y corregir los archivos de esta historia hasta que pase

**Checkpoint**: La historia 1 se puede demostrar abriendo la ruta directa, aunque la navegación todavía no la anuncie.

---

## Phase 4: User Story 2 - Encontrar la caja en la tienda y en su sección (Priority: P2)

**Goal**: La caja publicada y comprable aparece en la navegación, en `/productos` y en la búsqueda, y las tres abren `/caja-misteriosa`. No aparece en ligas ni equipos.

**Independent Test**: Activar la caja, abrirla desde la navegación, desde el listado y desde la búsqueda. Despublicarla y comprobar que esos tres accesos desaparecen.

### Tests for User Story 2

- [ ] T011 [US2] Extender `tests/mystery-box.test.ts` para exigir el enlace condicional a `/caja-misteriosa` en `src/components/layout/nav-links.tsx` y `src/features/products/components/product-card.tsx`, y la redirección en `src/app/productos/[slug]/page.tsx`. Escribir las aserciones antes del cambio de esas pantallas.

### Implementation for User Story 2

- [ ] T012 [US2] Mostrar "Caja misteriosa" en `src/components/layout/nav-links.tsx` y pasarle la disponibilidad desde `src/components/layout/header.tsx` solo si el producto está activo y tiene una variante comprable
- [ ] T013 [P] [US2] Incluir la caja en el listado y la búsqueda de `src/features/products/repositories/product-repository.ts`, y hacer que `src/features/products/components/product-card.tsx` abra `/caja-misteriosa` sin mostrar el equipo interno
- [ ] T014 [US2] Redirigir `/productos/caja-misteriosa` a `/caja-misteriosa` en `src/app/productos/[slug]/page.tsx` y excluir `MYSTERY_BOX` de ligas y equipos en `src/features/products/repositories/product-repository.ts`
- [ ] T015 [US2] Ejecutar `node --import tsx --test tests/mystery-box.test.ts` y corregir los archivos de esta historia hasta que pase

**Checkpoint**: Las historias 1 y 2 se recorren desde la tienda. El pedido todavía puede mostrar el equipo interno.

---

## Phase 5: User Story 3 - Completar la compra de la caja (Priority: P3)

**Goal**: El pago y la confirmación guardan nivel, calidad y talla, no muestran un club y rechazan la línea si la variante ya no se puede comprar.

**Independent Test**: Llevar una caja hasta el pago, ver el resumen sin equipo y confirmar que el pedido conserva Básica/Fan, Estándar/Player o Premium/Retro más la talla. Repetir con una talla agotada y comprobar que no se cobra.

### Tests for User Story 3

- [ ] T016 [US3] Extender `tests/mystery-box.test.ts` para el snapshot `lineKind: "MYSTERY_BOX"`, `customizationType: "NONE"` y el precio entero de `salePrice`, apuntando a `src/features/orders/repositories/order-repository.ts`. Escribir la aserción antes del cambio.

### Implementation for User Story 3

- [ ] T017 [US3] Persistir `lineKind`, calidad y talla sin mostrar equipo en `src/features/orders/repositories/order-repository.ts`
- [ ] T018 [P] [US3] Ocultar el equipo de las líneas caja en `src/features/checkout/components/checkout-page-client.tsx` y en la confirmación de `src/app/pedido/confirmado/[code]/page.tsx`
- [ ] T019 [US3] Revalidar stock y bajo pedido de la variante caja antes de crear el pedido en `src/features/orders/repositories/order-repository.ts`, y no descontar una camiseta concreta
- [ ] T020 [US3] Ejecutar `node --import tsx --test tests/mystery-box.test.ts` y corregir los archivos de esta historia hasta que pase

**Checkpoint**: Las tres historias cierran el recorrido de compra. El admin sigue siendo el editor actual.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar que el admin existente alcanza y recorrer `quickstart.md`.

- [ ] T021 [P] Verificar que publicar, ocultar, precio, tallas y stock de la caja se editan con el producto y el inventario actuales, sin una pantalla nueva bajo `src/app/admin`
- [ ] T022 Recorrer los seis pasos manuales de `specs/025-caja-misteriosa/quickstart.md` en la tienda local

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: puede empezar de inmediato
- **Foundational (Phase 2)**: depende del setup y bloquea las historias. T005 depende de T004
- **User Story 1 (Phase 3)**: depende de la fase 2
- **User Story 2 (Phase 4)**: depende de la fase 2 y de T008, porque el enlace abre la sección
- **User Story 3 (Phase 5)**: depende de T009, porque el pedido lee la línea que el carrito ya guardó
- **Polish (Phase 6)**: depende de las historias que se quieran entregar

### User Story Dependencies

- **User Story 1 (P1)**: no depende de la navegación ni del pago
- **User Story 2 (P2)**: puede probarse con la sección ya creada
- **User Story 3 (P3)**: usa la misma línea de la historia 1

### Within Each User Story

- La prueba se escribe y falla antes de la implementación de esa historia
- El mapa de niveles va antes de la sección
- La sección va antes de montarla en navegación y tienda
- La línea de carrito va antes del snapshot de pedido

### Parallel Opportunities

- T002 y T003 pueden ir en paralelo
- T013 puede avanzar junto a T012 porque tocan archivos distintos
- T018 puede avanzar junto a T017 si no edita `order-repository.ts`

---

## Parallel Example: User Story 2

```bash
# Después de T011, dos archivos distintos:
# T012 edita src/components/layout/nav-links.tsx y src/components/layout/header.tsx
# T013 edita src/features/products/repositories/product-repository.ts y src/features/products/components/product-card.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2
2. Completar Phase 3
3. Parar y validar `/caja-misteriosa` con un nivel y una talla
4. La sección ya permite agregar la caja al carrito

### Incremental Delivery

1. Setup + Foundational
2. User Story 1 → sección y carrito → demo
3. User Story 2 → navegación, tienda y búsqueda → demo
4. User Story 3 → pago y confirmación → demo
5. Polish con el quickstart manual

### Parallel Team Strategy

Con dos personas, después de la fase 2:

- Una persona: T006 a T010 en la sección y el carrito
- La otra espera a T008 para T012 y puede preparar T016 sobre el contrato del pedido
- T014 espera a que T013 deje de editar `product-repository.ts`

---

## Notes

- [P] marca archivos distintos y sin dependencia abierta
- Básica/Fan, Estándar/Player y Premium/Retro salen de `mysteryBoxTier`, no de textos sueltos
- El precio cobrado es `salePrice` en pesos enteros
- La venta descuenta la variante de la caja, no una camiseta al azar
- Validar en el navegador antes de dar por cerrada la fase Polish
