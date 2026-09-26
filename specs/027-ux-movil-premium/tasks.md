---
description: "Implementation tasks for the public mobile purchase experience"
---

# Tasks: Compra móvil premium

**Input**: Design documents from `specs/027-ux-movil-premium/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/public-mobile-purchase.md`, and `quickstart.md`

**Tests**: Incluidas para la barra según ancho, la ocultación del botón flotante, el nombre en dos líneas, el área de toque de la talla y el checkout sin desborde horizontal. Se escriben antes del código de esa historia y deben fallar primero.

**Organization**: Las tareas siguen las historias de `spec.md`. La barra de la ficha (P1) se puede demostrar sin el resto.

**Scope guard**: No editar `src/app/checkout/bold-client.tsx` ni la firma, el aviso o el paso de pago. No rediseñar la marca ni el admin. No crear fotos ni correr `prisma/seed.ts`. La caja misteriosa no recibe la barra.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece (`US1` … `US10`)
- Las fases Setup, Foundational y Polish no llevan etiqueta de historia

## Path Conventions

- Proyecto único: `src/` y `tests/` en la raíz del repositorio

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar lo que el móvil ya cumple para no rehacerlo. No hay dependencia ni migración nuevas.

- [X] T001 Verificar las rutas en las que `shouldShowMobileCartFab` ya se oculta en `src/features/cart/domain/mobile-cart-fab.ts` y el enlace de 56 px en `src/features/cart/components/mobile-cart-fab.tsx`
- [X] T002 [P] Verificar el deslizamiento, el texto “n de N” y la ausencia de controles con una sola imagen en `src/features/products/components/product-gallery.tsx`
- [X] T003 [P] Verificar el nombre en dos líneas de `src/features/products/components/product-card.tsx` y el nombre en una línea de `src/features/cart/components/cart-page-client.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dejar el pago fuera de este trabajo antes de tocar la ficha y el checkout.

**Critical**: Completar esta fase antes de implementar cualquier historia.

- [X] T004 Confirmar que el paso de pago sigue en `src/app/checkout/bold-client.tsx` y no editar ese archivo

**Checkpoint**: El pago queda intacto. Las historias pueden empezar.

---

## Phase 3: User Story 1 - Comprar desde la ficha sin buscar el botón (Priority: P1) 🎯 MVP

**Goal**: Hasta 430 px, la ficha muestra una barra inferior con precio, talla o “Elige talla”, y “Agregar al carrito”. Sin talla no agrega.

**Independent Test**: A 390 px, ver la barra sin scroll, elegir talla y agregar desde la barra.

### Tests for User Story 1

- [X] T005 [US1] Crear en `tests/mobile-purchase-ux.test.ts` los casos de `shouldShowPurchaseBar`: visible a 390, no obligatoria a 768. Escribirlos antes de la implementación para que fallen.

### Implementation for User Story 1

- [X] T006 [US1] Implementar `shouldShowPurchaseBar` en `src/features/products/domain/purchase-bar.ts`
- [X] T007 [US1] Crear la barra con precio, resumen de talla, margen seguro y el botón “Agregar al carrito” en `src/features/products/components/product-purchase-bar.tsx`
- [X] T008 [US1] Montar la barra solo en anchos de hasta 430 px, reutilizar “Elige una talla” con scroll y foco, incluir el recargo de personalización y ocultarla con teclado o diálogo abierto en `src/features/products/components/product-detail-client.tsx`
- [X] T009 [US1] Ejecutar `node --import tsx --test tests/mobile-purchase-ux.test.ts` y corregir los archivos de esta historia hasta que pasen los casos de la barra

**Checkpoint**: Se puede agregar desde la barra en un teléfono estrecho, aunque el botón flotante todavía pueda taparla.

---

## Phase 4: User Story 2 - El carrito flotante no tapa la compra ni el contacto (Priority: P1)

**Goal**: El botón flotante no aparece en carrito, checkout, pedido ni en la ficha mientras la barra está visible. En el resto no tapa textos ni botones.

**Independent Test**: Con artículos en el carrito, recorrer ficha, contacto, carrito, checkout y pedido a 390 px.

### Tests for User Story 2

- [X] T010 [US2] Extender `tests/mobile-purchase-ux.test.ts` para ocultar el botón flotante en `/pedido` y en `/productos/{slug}` cuando el ancho es de 430 px o menos, y seguir mostrándolo en `/productos` y en `/contacto`. Escribirlo antes de cambiar `src/features/cart/domain/mobile-cart-fab.ts`.

### Implementation for User Story 2

- [X] T011 [US2] Añadir esas rutas y el ancho de la barra a `shouldShowMobileCartFab` en `src/features/cart/domain/mobile-cart-fab.ts`
- [X] T012 [US2] Pasar el ancho de hasta 430 px y conservar el margen seguro y el área de 44 px en `src/features/cart/components/mobile-cart-fab.tsx`
- [X] T013 [P] [US2] Reservar espacio inferior en móvil para que el botón no tape el correo en `src/app/contacto/page.tsx` y el contenido público en `src/components/layout/app-layout.tsx`
- [X] T014 [US2] Ejecutar `node --import tsx --test tests/mobile-purchase-ux.test.ts` y corregir los archivos de esta historia hasta que pasen los casos del botón flotante

**Checkpoint**: El botón flotante ya no cubre la barra de la ficha ni el correo.

---

## Phase 5: User Story 3 - Ver las fotos de la camiseta con el dedo (Priority: P1)

**Goal**: Deslizar, ver la posición y ampliar. Con una sola foto, sin controles vacíos. Sin miniaturas a 390 px o menos.

**Independent Test**: Deslizar una ficha con varias fotos a 390 px y abrir otra con una sola foto.

### Implementation for User Story 3

- [X] T015 [P] [US3] Añadir la ampliación con cierre, y ocultar las miniaturas por debajo de 390 px, sin controles cuando hay una imagen o ninguna, en `src/features/products/components/product-gallery.tsx`

**Checkpoint**: La galería móvil se recorre y se amplía con las fotos que el producto ya tiene.

---

## Phase 6: User Story 4 - Leer el nombre de la camiseta (Priority: P1)

**Goal**: Catálogo, carrito y resumen de checkout dejan un nombre reconocible en dos líneas, con equipo, versión y talla aparte.

**Independent Test**: Leer una tarjeta, una línea de carrito y el resumen a 390 px.

### Tests for User Story 4

- [X] T016 [US4] Extender `tests/mobile-purchase-ux.test.ts` para exigir dos líneas de nombre en `src/features/cart/components/cart-page-client.tsx` y en el resumen de `src/features/checkout/components/checkout-page-client.tsx`. Escribirlo antes de quitar el recorte de una línea.

### Implementation for User Story 4

- [X] T017 [US4] Mostrar el nombre en dos líneas y dejar equipo, versión y talla en la línea secundaria en `src/features/cart/components/cart-page-client.tsx`
- [X] T018 [US4] Mostrar el mismo nombre reconocible en el resumen de `src/features/checkout/components/checkout-page-client.tsx`

**Checkpoint**: El nombre del artículo se reconoce sin abrirlo de nuevo. La tarjeta de catálogo ya cumple las dos líneas.

---

## Phase 7: User Story 5 - Pulsar sin fallar el dedo (Priority: P1)

**Goal**: Favoritos, iconos, tallas, versiones, personalización, cantidad, cerrar y casillas tienen un área de toque de al menos 44×44 px, con 8 px entre vecinos.

**Independent Test**: Medir favoritos, una talla, menos, más y un icono del encabezado.

### Tests for User Story 5

- [X] T019 [US5] Extender `tests/mobile-purchase-ux.test.ts` para exigir un área de al menos 44 px en los controles de talla de `src/features/products/components/product-variant-selector.tsx`. Escribirlo antes de cambiar esas clases.

### Implementation for User Story 5

- [X] T020 [US5] Subir el área de talla y versión a 44 px, con 8 px de separación, en `src/features/products/components/product-variant-selector.tsx`
- [X] T021 [P] [US5] Subir el área del favorito a 44 px en `src/features/products/components/product-card.tsx`
- [X] T022 [P] [US5] Subir el área de los iconos del encabezado y de cerrar el menú a 44 px en `src/components/layout/header.tsx`
- [X] T023 [US5] Subir menos y más a 44 px en `src/features/cart/components/cart-page-client.tsx`
- [X] T024 [P] [US5] Subir personalización, cerrar filtros y casillas del checkout a 44 px en `src/features/products/components/product-customization.tsx`, `src/features/products/components/product-filters.tsx` y `src/app/checkout/consents.tsx`

**Checkpoint**: Los controles del alcance se pueden pulsar con el pulgar.

---

## Phase 8: User Story 6 - Completar el checkout por partes (Priority: P2)

**Goal**: Hasta 430 px, el resumen empieza cerrado junto al botón y se abre con un toque. No hay scroll horizontal. El error sigue apareciendo al salir del campo.

**Independent Test**: A 320, 390 y 430 px, provocar un error de campo, abrir el resumen y pulsar el botón sin desplazamiento horizontal.

### Tests for User Story 6

- [X] T025 [US6] Extender `tests/mobile-purchase-ux.test.ts` para exigir que el checkout a 390 px no use un ancho fijo que fuerce scroll horizontal y que el resumen pueda abrirse junto al botón en `src/features/checkout/components/checkout-page-client.tsx`. Escribirlo antes de ese cambio.

### Implementation for User Story 6

- [X] T026 [US6] Dejar el resumen cerrado junto a “Continuar al pago” en anchos de hasta 430 px, reutilizando el desglose existente, y conservar la validación al salir del campo en `src/features/checkout/components/checkout-page-client.tsx`

**Checkpoint**: El checkout estrecho se entiende sin un resumen fijo que tape el formulario.

---

## Phase 9: User Story 7 - Saber cuántos filtros hay puestos (Priority: P2)

**Goal**: El botón dice “Filtros (N)” cuando hay filtros y “Filtros” cuando no. “Limpiar todo” está dentro del panel.

**Independent Test**: Activar una liga, ver el contador, limpiar y ver la grilla completa.

### Implementation for User Story 7

- [X] T027 [P] [US7] Escribir “Filtros (N)” en el botón y mover “Limpiar todo” al panel cuando hay filtros activos en `src/app/productos/page.tsx`

**Checkpoint**: Aplicar cierra el panel y la grilla corresponde a los filtros elegidos.

---

## Phase 10: User Story 8 - Menú y portada caben en la mano y en la primera pantalla (Priority: P3)

**Goal**: El menú acerca moneda, favoritos y vistos recientemente a los destinos. A 390 px el primer producto de la portada asoma. Los dos botones del hero miden al menos 44 px.

**Independent Test**: Abrir menú e inicio a 390 px.

### Implementation for User Story 8

- [X] T028 [P] [US8] Reducir el vacío entre destinos y utilidades sin quitar ligas ni la caja misteriosa en `src/components/layout/header.tsx` y `src/components/layout/nav-links.tsx`
- [X] T029 [P] [US8] Compactar el hero bajo 390 px y dejar “Comprar ahora” y “Explorar ligas” con área de 44 px en `src/app/page.tsx`

**Checkpoint**: La portada muestra el principio del primer producto y el menú se recorre con el pulgar.

---

## Phase 11: User Story 9 - Ver cuánto falta para el envío gratis (Priority: P3)

**Goal**: Además del texto, una barra avanza hacia $200.000. Menos y más actualizan subtotal y total al momento.

**Independent Test**: Subir la cantidad hasta el umbral y ver la barra completa y el envío gratis.

### Implementation for User Story 9

- [X] T030 [US9] Dibujar la barra de avance hacia $200.000 junto al texto de envío gratis en `src/features/cart/components/cart-page-client.tsx`

**Checkpoint**: Cambiar la cantidad mueve la barra y el total en el momento.

---

## Phase 12: User Story 10 - La foto corresponde al nombre (Priority: P3)

**Goal**: Si el nombre y la imagen principal no describen la misma referencia, se alinean con datos ya guardados.

**Independent Test**: Revisar un producto cuyo nombre cita una temporada y comprobar que la imagen principal, o el texto corregido, habla de esa misma referencia.

### Implementation for User Story 10

- [X] T031 [P] [US10] Comparar nombre, temporada e imagen principal ya guardados, y corregir solo el texto o la imagen principal existente, sin fotos nuevas y sin `prisma/seed.ts`

**Checkpoint**: No queda una promesa de temporada que la foto principal contradiga, cuando los datos actuales permiten alinearla.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar la verificación del alcance móvil.

- [X] T032 Ejecutar `node --import tsx --test tests/mobile-purchase-ux.test.ts` y dejar en verde barra, botón flotante, nombres, talla y checkout
- [ ] T033 Recorrer los siete pasos manuales de `specs/027-ux-movil-premium/quickstart.md` a 390×844, y el checkout también a 320 y 430 px

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende del setup y bloquea las historias.
- **User Stories (Phase 3+)**: Dependen de la fase 2. US3, US7, US8 y US10 pueden avanzar junto a US1 si no comparten archivo.
- **Polish (Phase 13)**: Depende de las historias que se quieran entregar.

### User Story Dependencies

- **User Story 1 (P1)**: Empieza después de la fase 2. No depende de otras historias.
- **User Story 2 (P1)**: Empieza después de la fase 2. Conviene cerrarla después de US1 para comprobar que no tapa la barra.
- **User Story 3 (P1)**: Empieza después de la fase 2. Solo toca la galería.
- **User Story 4 (P1)**: T017 espera a que US9 no esté editando el carrito. T018 espera a T026 si US6 ya empezó; si no, va antes de T026.
- **User Story 5 (P1)**: T023 espera a T017. T020, T021, T022 y T024 pueden ir en paralelo entre sí.
- **User Story 6 (P2)**: T026 espera a T018.
- **User Story 7 (P2)**: Empieza después de la fase 2.
- **User Story 8 (P3)**: T028 espera a T022 si ambos editan `header.tsx`.
- **User Story 9 (P3)**: T030 espera a T017 y T023.
- **User Story 10 (P3)**: Empieza después de la fase 2. No toca las pantallas de las otras historias.

### Within Each User Story

- La prueba de la historia se escribe y falla antes de la implementación.
- La función pura va antes del componente que la usa.
- La historia se verifica con su comando antes de darla por cerrada.

### Parallel Opportunities

- T002 y T003 pueden ir con T001.
- Después de la fase 2: T005, T010, T015, T016, T019, T027 y T031 tocan archivos distintos.
- T021, T022 y T024 pueden ir en paralelo después de T019.
- T028 y T029 pueden ir en paralelo cuando `header.tsx` ya no está en la historia 5.

---

## Parallel Example: User Story 1

```bash
# La prueba va primero y debe fallar:
Task: "T005 Casos de la barra en tests/mobile-purchase-ux.test.ts"

# Después, la regla y la barra:
Task: "T006 shouldShowPurchaseBar en src/features/products/domain/purchase-bar.ts"
Task: "T007 Barra visual en src/features/products/components/product-purchase-bar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3.
3. Parar y validar la barra a 390 px.
4. Seguir con US2 para que el botón flotante no la tape.

### Incremental Delivery

1. US1: agregar sin buscar el botón.
2. US2: el carrito flotante deja de tapar.
3. US3 a US5: fotos, nombres y dedos.
4. US6 y US7: checkout y filtros.
5. US8 a US10: menú, portada, envío gratis y foto coherente con el nombre.

### Parallel Team Strategy

1. Cerrar juntos Phase 1 y Phase 2.
2. Una persona toma US1 y US3. Otra toma US2 y US7. Otra toma US5 en archivos que no sean el carrito.
3. US4, US6 y US9 entran en orden sobre carrito y checkout.

---

## Notes

- [P] marca otro archivo y ninguna dependencia incompleta.
- No editar `src/app/checkout/bold-client.tsx`.
- No correr `prisma/seed.ts`.
- La barra solo es obligatoria hasta 430 px.
- El resumen del checkout empieza cerrado y se abre con un toque.
- Verificar que cada prueba nueva falle antes de implementar su historia.
