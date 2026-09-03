# Tasks: Guia de tallas, favoritos y vistos recientemente

**Input**: Design documents from `/specs/002-guia-tallas-favoritos-recientes/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/size-guide-and-local-state.md`

**Scope**: Implementacion exclusivamente cliente para guia de tallas, favoritos y vistos recientes. No se crean endpoints, acciones de servidor, modelos Prisma, migraciones, configuracion administrativa ni sincronizacion de cuenta.

**Tests**: Obligatorios por la constitucion para las reglas de negocio, los stores locales, el workflow de compra y la accesibilidad.

## Phase 1: Setup (Shared Local Infrastructure)

**Purpose**: Preparar la infraestructura de prueba y los limites de archivos cliente compartidos sin agregar persistencia de servidor.

- [X] T001 [P] Registrar `tests/size-recommender.test.ts`, `tests/local-product-references.test.ts` y las pruebas de integracion de esta feature en el comando `test` de `package.json`
- [X] T002 [P] Definir el limite de almacenamiento local tolerante a fallos en `src/shared/stores/safe-storage.ts`, incluyendo lectura, parseo, migracion y escritura protegidas con fallback en memoria

## Phase 2: Foundational (Blocking Local Prerequisites)

**Purpose**: Establecer los tipos compartidos y la resolucion de referencias que las tres historias necesitan para mantenerse independientes del carrito, checkout y backend.

- [X] T003 [P] Definir tipos de referencias locales, estados de hidratacion y contratos de resolucion vigente en `src/features/products/types/local-product-reference-types.ts`
- [X] T004 Implementar la resolucion de nombre, imagen, precio y disponibilidad vigente desde los datos publicos existentes en `src/features/products/services/local-product-references.ts`
- [X] T005 [P] Verificar que la infraestructura local no importa Prisma, rutas admin ni `src/shared/stores/cart-store.ts` mediante una prueba de aislamiento en `tests/local-product-references.test.ts`

**Checkpoint**: La infraestructura cliente es independiente, recuperable ante errores de `localStorage` y no altera datos de compra.

## Phase 3: User Story 1 - Encontrar la talla recomendada (Priority: P1) MVP

**Goal**: Desde la ficha, abrir "¿No sabes qué talla eres?", introducir exclusivamente altura en cm y peso en kg, obtener una recomendacion Fan o Player explicada y aplicar solo una talla disponible.

**Independent Test**: En una ficha con variantes, abrir la invitacion, completar valores validos, obtener o corregir la recomendacion y seleccionar la talla disponible sin depender de favoritos, vistos, registro ni backend.

### Tests for User Story 1

- [X] T006 [P] [US1] Escribir pruebas unitarias del recomendador para tablas Fan y Player, limites inclusivos, tolerancia de altura de 1 cm, rangos invalidos y Player 3XL/4XL no recomendables en `tests/size-recommender.test.ts`
- [X] T007 [P] [US1] Escribir pruebas unitarias de solapamientos que prioricen peso y que devuelvan principal, alternativa y advertencia cuando el peso no desempata en `tests/size-recommender.test.ts`
- [X] T008 [P] [US1] Escribir pruebas unitarias del esquema de entrada para vacio, no numerico, cero, negativo y valores fisicamente inverosimiles con mensajes en espanol en `tests/size-guide-schema.test.ts`
- [X] T009 [P] [US1] Escribir pruebas de integracion de la guia en ficha para invitacion, campos cm/kg, actualizacion al editar, talla agotada y conservacion de la compra en `tests/size-guide-ui.test.ts`
- [X] T010 [P] [US1] Escribir pruebas de accesibilidad del dialogo, labels, `aria-invalid`, errores descritos, region viva, foco, cierre por teclado y estado comprensible del resultado en `tests/size-guide-accessibility.test.ts`

### Implementation for User Story 1

- [X] T011 [P] [US1] Definir tablas readonly tipadas Fan y Player, rangos indicados, medidas complementarias, tolerancia de 1 cm y version normalizada en `src/features/products/types/size-guide-types.ts`
- [X] T012 [P] [US1] Definir validacion runtime de solo `heightCm` y `weightKg` con unidades visibles y mensajes corregibles en `src/features/products/schemas/size-guide-schema.ts`
- [X] T013 [US1] Implementar el servicio puro de recomendacion en `src/features/products/services/size-recommender.ts`, priorizando coincidencia de peso en solapamientos, devolviendo estados tipados y filtrando variantes realmente disponibles
- [X] T014 [US1] Implementar el dialogo accesible con la invitacion "¿No sabes qué talla eres?", entradas cm/kg, resultado orientativo, alternativa/advertencia y actualizacion inmediata en `src/features/products/components/size-guide-dialog.tsx`
- [X] T015 [US1] Integrar la apertura de la guia, la version Fan/Player, las variantes disponibles y la aplicacion de solo la talla recomendada en `src/features/products/components/product-detail-client.tsx`
- [X] T016 [US1] Integrar el control de acceso a la guia y su estado visual en la ficha server/client sin convertir en cliente la pagina completa en `src/app/productos/[slug]/page.tsx`
- [X] T017 [US1] Completar estados de una sola talla, variantes incompletas, ninguna variante comprable y recomendacion agotada sin bloquear compra en `src/features/products/components/product-variant-selector.tsx`

**Checkpoint**: US1 funciona de forma independiente y el recomendador nunca inventa una talla ni modifica version, personalizacion, cantidad o modalidad de entrega.

## Phase 4: User Story 2 - Guardar y comparar favoritos (Priority: P2)

**Goal**: Permitir marcar, desmarcar y consultar productos favoritos sin registro, con referencias minimas locales, informacion vigente y retiro seguro de productos inactivos.

**Independent Test**: Marcar un producto desde catalogo y ficha, recargar el navegador, abrir `/favoritos`, comprobar orden/precio/disponibilidad vigentes, retirar un producto y mantener el carrito intacto.

### Tests for User Story 2

- [X] T018 [P] [US2] Escribir pruebas unitarias del store de favoritos para ids unicos, orden descendente por `savedAt`, toggle/remove idempotentes, limpieza y payload sin variante en `tests/favorites-store.test.ts`
- [X] T019 [P] [US2] Escribir pruebas de persistencia local de favoritos para JSON corrupto, lectura bloqueada, escritura bloqueada, recuperacion parcial y fallback en memoria en `tests/favorites-store.test.ts`
- [X] T020 [P] [US2] Escribir pruebas de integracion de favorito desde tarjeta, ficha, cabecera y `/favoritos`, incluyendo producto inactivo, estado vacio y confirmacion accesible en `tests/favorites-ui.test.ts`
- [X] T021 [P] [US2] Escribir pruebas de accesibilidad para boton con nombre, `aria-pressed`, operacion por teclado, anuncio de confirmacion y controles de retiro en `tests/favorites-accessibility.test.ts`

### Implementation for User Story 2

- [X] T022 [US2] Implementar el store Zustand persistido de favoritos con payload `{ productId, slug, savedAt }`, aislamiento de storage y operaciones `isFavorite`, `toggleFavorite`, `removeFavorite` y `clearFavorites` en `src/shared/stores/favorites-store.ts`
- [X] T023 [US2] Integrar boton accesible de favorito en tarjetas, detener activacion accidental del enlace y mostrar el estado guardado sin acoplarlo al carrito en `src/features/products/components/product-card.tsx`
- [X] T024 [US2] Integrar boton accesible de favorito en la ficha y confirmacion mediante el patron de toast existente en `src/features/products/components/product-detail-client.tsx`
- [X] T025 [US2] Añadir acceso a favoritos y estado de cantidad sin registro en la cabecera en `src/components/layout/header.tsx`
- [X] T026 [US2] Crear la pagina publica `/favoritos` con hidratacion cliente, estados carga/vacio/error, referencias resueltas con catalogo vigente y retiro individual en `src/app/favoritos/page.tsx`
- [X] T027 [US2] Añadir la presentacion reutilizable de tarjetas favoritas con imagen, nombre, precio, disponibilidad y retorno a ficha en `src/features/products/components/favorites-list.tsx`

**Checkpoint**: US2 conserva y retira favoritos sin autenticacion, no guarda decisiones de variante y una falla de storage no impide catalogo, ficha, carrito o checkout.

## Phase 5: User Story 3 - Recuperar productos vistos recientemente (Priority: P3)

**Goal**: Registrar fichas activas, deduplicar y limitar a 12 productos, y ofrecer una lista vigente que sobreviva al regreso del visitante sin afectar la compra.

**Independent Test**: Visitar fichas activas, repetir una, superar 12 productos, abrir la lista, volver a una ficha, retirar/limpiar entradas y comprobar que el carrito no cambia.

### Tests for User Story 3

- [X] T028 [P] [US3] Escribir pruebas unitarias del store de vistos para deduplicacion, movimiento al inicio, maximo 12, retiro y limpieza en `tests/recently-viewed-store.test.ts`
- [X] T029 [P] [US3] Escribir pruebas de persistencia degradada para vistos con JSON corrupto, storage bloqueado, referencias parciales y sesion en memoria independiente de favoritos en `tests/recently-viewed-store.test.ts`
- [X] T030 [P] [US3] Escribir pruebas de integracion para registrar solo fichas activas despues de cargar, mostrar la lista y resolver datos vigentes en `tests/recently-viewed-ui.test.ts`
- [X] T031 [P] [US3] Escribir pruebas de accesibilidad para lista, enlaces, retiro/limpieza, estados no disponible y operacion completa por teclado en `tests/recently-viewed-accessibility.test.ts`

### Implementation for User Story 3

- [X] T032 [US3] Implementar el store Zustand persistido de vistos con payload `{ productId, slug, lastViewedAt }`, deduplicacion, limite 12, retiro, limpieza y fallback protegido en `src/shared/stores/recently-viewed-store.ts`
- [X] T033 [US3] Registrar el producto solo despues de cargar una ficha activa y mostrar su lista vigente sin guardar talla, personalizacion, cantidad ni entrega en `src/features/products/components/product-detail-client.tsx`
- [X] T034 [US3] Crear el componente de productos vistos con orden reciente, estado no disponible, retiro individual y limpieza opcional en `src/features/products/components/recently-viewed.tsx`
- [X] T035 [US3] Integrar la superficie de vistos recientes en la experiencia publica de compra y sus estados responsive en `src/app/productos/page.tsx`
- [X] T036 [US3] Añadir enlace de navegacion a vistos recientes sin registro en `src/components/layout/header.tsx`

**Checkpoint**: US3 funciona con 12 referencias maximas, sin duplicados, con datos vigentes y sin bloquear ninguna superficie de compra cuando el storage falla.

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verificar aislamiento, regresiones, accesibilidad, responsive y los gates exigidos por la constitucion.

- [X] T037 [P] Añadir pruebas de regresion para selector de version/talla, personalizacion, modalidad de entrega, agregar al carrito y checkout invitado en `tests/local-product-references.test.ts`
- [X] T038 [P] Añadir una prueba de aislamiento que simule `localStorage` corrupto/bloqueado para comprobar catalogo, ficha, carrito y checkout operables en `tests/storage-degradation.test.ts`
- [X] T039 [P] Revisar y ajustar nombres accesibles, foco, region viva, contraste y viewport movil de las superficies de la feature en `src/features/products/components/size-guide-dialog.tsx`, `src/features/products/components/product-card.tsx`, `src/features/products/components/favorites-list.tsx` y `src/features/products/components/recently-viewed.tsx`
- [X] T040 Ejecutar los escenarios de `specs/002-guia-tallas-favoritos-recientes/quickstart.md` y corregir solo los fallos de esta feature en `specs/002-guia-tallas-favoritos-recientes/quickstart.md`
- [X] T041 Ejecutar `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`, documentando cualquier fallo preexistente y dejando todos los gates aplicables verdes en `package.json`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 y T002 pueden comenzar inmediatamente y en paralelo.
- **Foundational (Phase 2)**: T003 depende de T002; T004 depende de T003; T005 depende de T002 y T004. Esta fase bloquea las historias.
- **US1 (Phase 3)**: T006-T010 son pruebas paralelas; T011-T012 pueden comenzar en paralelo con las pruebas; T013 depende de T011-T012; T014-T017 dependen del servicio y sus pruebas.
- **US2 (Phase 4)**: T018-T021 son pruebas paralelas; T022 depende de T002-T005 y de las pruebas del store; T023-T027 dependen de T022 y de T004 cuando resuelven datos vigentes.
- **US3 (Phase 5)**: T028-T031 son pruebas paralelas; T032 depende de T002-T005 y de las pruebas del store; T033-T036 dependen de T032 y T004.
- **Polish (Phase 6)**: T037-T039 pueden ejecutarse en paralelo tras sus historias; T040 depende de las tres historias; T041 depende de todos los cambios y pruebas anteriores.

### User Story Dependencies

- **US1 (P1)**: Puede iniciar después de Foundational y es el MVP; no depende de US2 ni US3.
- **US2 (P2)**: Puede iniciar después de Foundational y es independiente de US1; solo reutiliza superficies de producto sin depender del recomendador.
- **US3 (P3)**: Puede iniciar después de Foundational y es independiente de US1/US2; su store permanece separado del store de favoritos.

### Parallel Opportunities

- T001-T002 y luego T003 pueden repartirse entre infraestructura y tipos sin tocar los mismos archivos.
- En cada historia, todas las pruebas marcadas `[P]` son independientes entre si y deben escribirse antes de implementar.
- US1, US2 y US3 pueden implementarse en paralelo despues de Foundational si se respetan sus archivos; la entrega recomendada sigue P1 → P2 → P3.
- En Polish, las pruebas de regresion, degradacion y la auditoria de accesibilidad pueden ejecutarse en paralelo antes de los gates finales.

## Implementation Strategy

### MVP First (US1 only)

1. Completar Setup y Foundational.
2. Completar US1 con recomendador puro, dialogo accesible y seleccion de talla disponible.
3. Ejecutar las pruebas de reglas, integracion UI, accesibilidad y los gates de typecheck/lint/build.
4. Detenerse en el checkpoint de US1 para validar el MVP antes de incorporar persistencia de preferencias.

### Incremental Delivery

1. Añadir US2 con favoritos locales independientes y `/favoritos`; validar persistencia, datos vigentes y degradacion.
2. Añadir US3 con historial limitado a 12; validar deduplicacion, retorno y aislamiento del carrito.
3. Completar Polish y repetir el quickstart y todos los gates.

### Traceability

- **US1**: FR-001 a FR-005 y FR-016; tablas, validacion, recomendacion y seleccion contextual.
- **US2**: FR-006 a FR-009, FR-013 a FR-016; store, superficies y lista vigente.
- **US3**: FR-010 a FR-016; store limitado, registro post-carga y lista vigente.
- **Cross-cutting**: FR-014, FR-015, FR-016, SC-006 a SC-008 y los escenarios de degradacion del quickstart.

## Format Validation

- Cada tarea usa exactamente `- [ ] T###`, con IDs secuenciales del T001 al T041.
- `[P]` aparece solo en tareas separables sin dependencia de una tarea incompleta.
- `[US1]`, `[US2]` y `[US3]` aparecen exclusivamente dentro de sus fases de historia.
- Cada descripcion incluye una ruta exacta del repositorio.