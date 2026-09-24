---
description: "Implementation tasks for the public purchase experience fixes"
---

# Tasks: Experiencia de compra pública

**Input**: Design documents from `specs/026-experiencia-compra/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/public-purchase.md`, and `quickstart.md`

**Tests**: Incluidas para talla, desglose y documentos legales, como pide `spec.md`. Se escriben antes del código de esa historia y deben fallar primero.

**Organization**: Las tareas siguen las historias de `spec.md`. El checkout legal (P1) se puede demostrar sin las demás correcciones.

**Scope guard**: No tocar `src/app/checkout/bold-client.tsx`, no rediseñar la marca y no crear pantallas de admin ni una lista de espera. Los precios siguen siendo enteros en pesos.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece (`US1` … `US6`)
- Las fases Setup, Foundational y Polish no llevan etiqueta de historia

## Path Conventions

- Proyecto único: `src/` y `tests/` en la raíz del repositorio

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar las páginas, la tarifa y el pago que esta corrección reutiliza. No hay dependencia ni migración nuevas.

- [x] T001 Verificar que existen las páginas públicas en `src/app/terminos/page.tsx`, `src/app/privacidad/page.tsx`, `src/app/tratamiento-datos/page.tsx` y `src/app/cambios-devoluciones/page.tsx`
- [x] T002 [P] Confirmar la tarifa de $15.000 y el umbral de $200.000 en `src/shared/config/site.ts`
- [x] T003 [P] Confirmar el texto "(no configurado)" en `src/app/checkout/consents.tsx` y el rechazo por documentos ausentes en `src/features/orders/repositories/order-repository.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Dejar cerrado el límite del pago antes de tocar el checkout.

**Critical**: Completar esta fase antes de implementar cualquier historia.

- [x] T004 Confirmar que el paso de pago sigue saliendo de `src/features/checkout/components/checkout-page-client.tsx` hacia `src/app/checkout/bold-client.tsx`, y no editar la firma ni ese cliente

**Checkpoint**: El pago existente queda fuera de alcance. Las historias pueden empezar.

---

## Phase 3: User Story 1 - Pagar sin que la documentación legal bloquee la compra (Priority: P1) 🎯 MVP

**Goal**: El checkout enlaza las páginas legales reales. "Continuar al pago" se habilita con el formulario válido y las tres casillas. Si falta un documento de entorno, se usa la página pública, se anota en el log y la compra no se bloquea.

**Independent Test**: Con un producto disponible, marcar las tres casillas y un formulario válido, y llegar al paso de pago sin ver "(no configurado)".

### Tests for User Story 1

- [x] T005 [US1] Crear en `tests/purchase-experience.test.ts` los casos de documentos presentes (ganan las URL `https://` del entorno) y ausentes (se usan `/terminos`, `/privacidad`, `/tratamiento-datos` y `/cambios-devoluciones`, y la compra no se bloquea). Escribirlos antes de la implementación para que fallen.

### Implementation for User Story 1

- [x] T006 [US1] Resolver siempre los cuatro documentos, con respaldo a las páginas públicas y una línea de log cuando se use el respaldo, en `src/shared/config/legal.ts`
- [x] T007 [US1] Enlazar las tres casillas y cambios y devoluciones, quitar "(no configurado)" y mostrar el mensaje de la casilla faltante en `src/app/checkout/consents.tsx`
- [x] T008 [US1] Exigir las tres casillas en `src/features/checkout/schemas/checkout-schema.ts` para que el formulario no sea válido hasta marcarlas
- [x] T009 [US1] Habilitar "Continuar al pago" solo con el formulario válido, sin deshabilitarlo por documentos ausentes, en `src/features/checkout/components/checkout-page-client.tsx`
- [x] T010 [US1] Guardar el documento resuelto y no rechazar el pedido cuando falte la configuración de entorno en `src/features/orders/repositories/order-repository.ts`
- [x] T011 [US1] Ejecutar `node --import tsx --test tests/purchase-experience.test.ts` y corregir los archivos de esta historia hasta que pasen los casos legales

**Checkpoint**: Se puede llegar al pago con las páginas legales actuales, aunque la talla y el desglose sigan como están.

---

## Phase 4: User Story 2 - Elegir talla antes de agregar al carrito (Priority: P2)

**Goal**: Ninguna talla viene marcada. Sin talla no entra nada al carrito, y la ficha muestra "Elige una talla", hace scroll, da foco y lo anuncia.

**Independent Test**: Abrir un producto, no elegir talla, pulsar agregar y comprobar que el carrito no cambia y que aparece "Elige una talla".

### Tests for User Story 2

- [x] T012 [US2] Extender `tests/purchase-experience.test.ts` para que una selección vacía no produzca una línea y para que cambiar de versión quite una talla que esa versión no tiene. Escribirlo antes de `src/features/products/domain/size-selection.ts`.

### Implementation for User Story 2

- [x] T013 [US2] Implementar la selección vacía, el rechazo sin talla y el vaciado al cambiar de versión en `src/features/products/domain/size-selection.ts`
- [x] T014 [US2] Quitar la talla inicial, no agregar sin talla y mostrar "Elige una talla" con scroll, foco y `role="alert"` en `src/features/products/components/product-detail-client.tsx`
- [x] T015 [P] [US2] Aplicar el mismo aviso, scroll y foco cuando falte la talla en `src/features/products/components/mystery-box-picker.tsx`
- [x] T016 [US2] Ejecutar `node --import tsx --test tests/purchase-experience.test.ts` y corregir los archivos de esta historia hasta que pasen los casos de talla

**Checkpoint**: La ficha y la caja misteriosa no agregan una talla que el cliente no eligió.

---

## Phase 5: User Story 3 - Leer y completar el checkout en el celular (Priority: P2)

**Goal**: Entre 320 y 430 px, checkout, carrito y ficha no se desplazan en horizontal. El texto salta de línea y "Continuar al pago" se puede pulsar al llegar al final.

**Independent Test**: Abrir esas tres pantallas a 320, 390 y 430 px y comprobar que no hay desplazamiento horizontal.

### Implementation for User Story 3

- [x] T017 [US3] Hacer que columnas, casillas y resumen encojan y que el texto salte de línea, sin ancho fijo por debajo de `lg`, en `src/features/checkout/components/checkout-page-client.tsx`
- [x] T018 [P] [US3] Aplicar el mismo encogimiento y salto de línea en `src/features/cart/components/cart-page-client.tsx`
- [x] T019 [P] [US3] Aplicar el mismo encogimiento y salto de línea en `src/features/products/components/product-detail-client.tsx`

**Checkpoint**: El botón de pago sigue en el flujo, a ancho completo en móvil, y no tapa el formulario.

---

## Phase 6: User Story 4 - Ver el mismo desglose en carrito y en checkout (Priority: P3)

**Goal**: Carrito y checkout muestran subtotal de productos, personalización si tiene precio, descuento si existe, envío real o "Gratis", y un total igual a la suma de esas líneas.

**Independent Test**: Armar un pedido con personalización y otro sin ella, por debajo y desde $200.000, y comprobar que los dos totales coinciden con la suma visible.

### Tests for User Story 4

- [x] T020 [US4] Extender `tests/purchase-experience.test.ts` con envío de $15.000 bajo $200.000, envío cero desde $200.000, personalización como línea propia y ausencia de esa línea cuando el recargo es cero. Escribirlo antes de `src/features/checkout/domain/order-breakdown.ts`.

### Implementation for User Story 4

- [x] T021 [US4] Calcular el desglose en pesos enteros en `src/features/checkout/domain/order-breakdown.ts`, usando `shippingFee` sobre productos más personalización
- [x] T022 [US4] Reemplazar "Se calcula al pagar" por las líneas del desglose en `src/features/cart/components/cart-page-client.tsx`
- [x] T023 [US4] Mostrar las mismas líneas y el mismo total en `src/features/checkout/components/checkout-page-client.tsx`
- [x] T024 [US4] Ejecutar `node --import tsx --test tests/purchase-experience.test.ts` y corregir los archivos de esta historia hasta que pasen los casos de totales

**Checkpoint**: Para el mismo pedido, el total del carrito y el del checkout son iguales a la suma de las líneas visibles.

---

## Phase 7: User Story 5 - Ver todas las fotos del producto (Priority: P3)

**Goal**: Varias fotos se eligen por miniatura en escritorio y se deslizan en móvil, con indicador de posición. Una sola foto no muestra controles vacíos.

**Independent Test**: Abrir un producto con varias imágenes y otro con una sola, en escritorio y en móvil.

### Implementation for User Story 5

- [x] T025 [P] [US5] Añadir deslizamiento e indicador "n de N" solo cuando hay más de una imagen, y conservar el texto alternativo, en `src/features/products/components/product-gallery.tsx`

**Checkpoint**: La ficha muestra cada foto publicada y no inventa controles para una sola imagen.

---

## Phase 8: User Story 6 - Salir de una liga o un producto que no se puede comprar (Priority: P4)

**Goal**: Una liga sin productos ofrece "Pídela por encargo" por WhatsApp. La tarjeta agotada abre la ficha. La ficha ofrece "Avisarme" y "Pedir por encargo", sin botón de compra.

**Independent Test**: Pulsar una liga "Próximamente" y abrir un agotado desde el listado. La liga abre WhatsApp con su nombre. La ficha tiene las dos acciones y no deja comprar.

### Implementation for User Story 6

- [x] T026 [P] [US6] Mostrar la liga sin productos como no disponible y enlazar "Pídela por encargo" al WhatsApp de la tienda con el nombre de la liga en `src/components/home/league-card.tsx`
- [x] T027 [P] [US6] Ofrecer la misma acción cuando una liga no tiene productos en `src/app/ligas/page.tsx`
- [x] T028 [P] [US6] Dejar la tarjeta agotada sin compra y con enlace a la ficha en `src/features/products/components/product-card.tsx`
- [x] T029 [US6] Mostrar "Avisarme" y "Pedir por encargo", cada uno con el nombre del producto, y ocultar el botón de agregar cuando esa compra no se puede hacer, en `src/features/products/components/product-detail-client.tsx`

**Checkpoint**: No queda un enlace de liga que no haga nada ni un botón de compra en un agotado.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar la verificación de todas las historias juntas.

- [x] T030 Ejecutar `node --import tsx --test tests/purchase-experience.test.ts` y dejar en verde talla, desglose y documentos legales
- [x] T031 Recorrer los siete pasos manuales de `specs/026-experiencia-compra/quickstart.md` en el navegador, incluidos 320, 390 y 430 px

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende del setup y bloquea las historias.
- **User Stories (Phase 3+)**: Dependen de la fase 2. US2, US5 y US6 pueden avanzar a la vez que US1, salvo donde comparten archivo.
- **Polish (Phase 9)**: Depende de las historias que se quieran entregar.

### User Story Dependencies

- **User Story 1 (P1)**: Empieza después de la fase 2. No depende de otras historias.
- **User Story 2 (P2)**: Empieza después de la fase 2. Independiente del checkout.
- **User Story 3 (P2)**: T017 espera a T009. T019 espera a T014. T018 no espera a otra historia.
- **User Story 4 (P3)**: T022 espera a T018. T023 espera a T017. El cálculo de T021 no espera a la interfaz.
- **User Story 5 (P3)**: Empieza después de la fase 2. Solo toca la galería.
- **User Story 6 (P4)**: T026, T027 y T028 empiezan después de la fase 2. T029 espera a T014 y T019.

### Within Each User Story

- La prueba de la historia se escribe y falla antes de la implementación.
- La función pura va antes de la pantalla que la usa.
- La historia se verifica con su comando antes de darla por cerrada.

### Parallel Opportunities

- T002 y T003 pueden ir con T001.
- Después de la fase 2: T005, T012, T020, T025, T026, T027 y T028 tocan archivos distintos.
- T014 y T015 pueden ir en paralelo después de T013.
- T017, T018 y T019 pueden ir en paralelo cuando sus dependencias de archivo ya terminaron.

---

## Parallel Example: User Story 1

```bash
# La prueba va primero y debe fallar:
Task: "T005 Casos legales en tests/purchase-experience.test.ts"

# Después, pantallas distintas:
Task: "T006 Resolver documentos en src/shared/config/legal.ts"
Task: "T007 Casillas en src/app/checkout/consents.tsx"
Task: "T008 Casillas obligatorias en src/features/checkout/schemas/checkout-schema.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2.
2. Completar Phase 3.
3. Parar y validar que el checkout llega al pago sin "(no configurado)".
4. Seguir con el resto solo si ese recorrido pasa.

### Incremental Delivery

1. Setup y foundational.
2. US1: la compra deja de bloquearse.
3. US2: no entra una talla no elegida.
4. US3: el celular no se desplaza de lado.
5. US4: carrito y checkout muestran el mismo total.
6. US5: la ficha muestra las fotos que ya tiene.
7. US6: ligas y agotados tienen salida por WhatsApp.

### Parallel Team Strategy

1. Cerrar juntos Phase 1 y Phase 2.
2. Una persona toma US1. Otra toma US2 y US5. Otra toma US6, menos T029.
3. US3 y US4 entran cuando el archivo de checkout o de carrito que necesitan ya no está en edición.

---

## Notes

- [P] marca otro archivo y ninguna dependencia incompleta.
- No editar `src/app/checkout/bold-client.tsx`.
- No usar `overflow-x: hidden` para esconder el desborde: el contenido tiene que caber.
- "Avisarme" y "Pedir por encargo" van solo en la ficha. La tarjeta agotada abre esa ficha.
- Verificar que cada prueba nueva falle antes de implementar su historia.
