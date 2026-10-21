# Tasks: Movimiento Halloween del inicio

**Input**: Design documents from `/specs/030-refine-halloween-motion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluidas porque `plan.md`, la constitución y `quickstart.md` exigen una prueba pura de cantidades, horarios y medidas. Escribir cada bloque de pruebas primero y verlo fallar. No correr `npm test`: usar solo `node --import tsx --test tests/halloween-hero-motion.test.ts`.

**Organization**: Cinco historias. US1, US2 y US5 son P1. US3 y US4 son P2. Comparten el módulo de medidas de la fase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece

## Phase 1: Setup

**Purpose**: Dejar el hero listo para recortar la decoración sin tocar el resto de la portada.

- [X] T001 Marcar la sección hero de `src/app/page.tsx` como contenedor relativo que recorte el desborde horizontal, sin cambiar textos, botones ni el carrusel

---

## Phase 2: Foundational

**Purpose**: Medidas y horario que usan todas las historias.

**⚠️ CRITICAL**: Ninguna historia empieza antes de cerrar esta fase.

- [X] T002 Cubrir dos murciélagos, una araña, ningún fantasma, opacidad 0,55, cruce de 12 s, espera de 25 s, desfase de 13 s, ventanas sin solape, araña de 6 px, flote de 4 px, escala 1,035, 300 ms, fundido de 0,8 s y desfase de entrada de 0,5 s en `tests/halloween-hero-motion.test.ts`
- [X] T003 Definir esas medidas y `batFlightWindows` en `src/components/home/hero-halloween-motion.ts` hasta que la prueba de T002 pase

**Checkpoint**: El horario se puede comprobar sin abrir el navegador. Todavía no hay siluetas en la página.

---

## Phase 3: User Story 1 - Ver una decoración discreta (Priority: P1) 🎯 MVP

**Goal**: La primera pantalla muestra dos murciélagos y una araña, tenues, detrás del mensaje y de la camiseta.

**Independent Test**: Abrir `/` y contar exactamente dos murciélagos y una araña, sin fantasma. El titular y los botones se leen y se pueden pulsar.

### Tests for User Story 1

- [X] T004 [US1] Afirmar en `tests/halloween-hero-motion.test.ts` que la decoración sale de la lista del módulo, usa opacidad 0,55, no anuncia nada y no recibe el puntero

### Implementation for User Story 1

- [X] T005 [US1] Pintar las tres siluetas en negro o gris ya tokenizado, sin color nuevo, en `src/components/home/hero-halloween.tsx`
- [X] T006 [US1] Montar esa decoración detrás del texto y de la tarjeta dentro del hero de `src/app/page.tsx`

**Checkpoint**: Se ven dos murciélagos y una araña quietos. No tapan “Comprar ahora” ni “Explorar ligas”.

---

## Phase 4: User Story 2 - Ver un movimiento lento (Priority: P1)

**Goal**: Los murciélagos cruzan de uno en uno, con una espera larga, y la araña solo se mece.

**Independent Test**: Observar `/` durante 60 segundos. Nunca cruzan dos murciélagos a la vez y cada uno espera 25 segundos entre pasadas. La araña no recorre la pantalla.

### Tests for User Story 2

- [X] T007 [US2] Afirmar en `tests/halloween-hero-motion.test.ts` que `src/app/globals.css` usa el cruce, la espera, el desfase y el balanceo exportados por `src/components/home/hero-halloween-motion.ts`

### Implementation for User Story 2

- [X] T008 [US2] Añadir los recorridos con aceleración y freno en `src/app/globals.css`, dejando cada murciélago fuera del hero durante su espera
- [X] T009 [US2] Aplicar esas clases a cada silueta en `src/components/home/hero-halloween.tsx`

**Checkpoint**: Un murciélago cruza en 12 segundos y el otro espera. La araña sube y baja 6 px.

---

## Phase 5: User Story 5 - Respetar quien pide menos movimiento (Priority: P1)

**Goal**: Con reducir movimiento, la decoración y la tarjeta quedan quietas y el texto se lee al instante.

**Independent Test**: Activar reducir movimiento, recargar `/` y comprobar que no hay cruces, balanceo, flote, acercamiento ni entrada escalonada.

### Tests for User Story 5

- [X] T010 [US5] Afirmar en `tests/halloween-hero-motion.test.ts` que `src/app/globals.css` anula murciélagos, araña, flote y acercamiento bajo `prefers-reduced-motion: reduce`, y que `src/components/home/hero-copy-animation.tsx` solo anima con `prefers-reduced-motion: no-preference`

### Implementation for User Story 5

- [X] T011 [US5] Añadir esa anulación en `src/app/globals.css` para las clases de decoración, flote y acercamiento

**Checkpoint**: La decoración ya no se mueve con reducir movimiento. El texto existente sigue apareciendo completo porque su animación ya está dentro de `no-preference`.

---

## Phase 6: User Story 3 - Leer el mensaje al entrar (Priority: P2)

**Goal**: La línea corta y el titular entran juntos. El párrafo y los botones les siguen, cada uno 0,5 segundos después.

**Independent Test**: Recargar `/` con movimiento permitido. El párrafo empieza cerca de 0,5 segundos después del titular y los botones cerca de 0,5 segundos después del párrafo. No se repite al hacer scroll.

### Tests for User Story 3

- [X] T012 [US3] Afirmar en `tests/halloween-hero-motion.test.ts` que `src/components/home/hero-copy-animation.tsx` agrupa la línea corta con el titular, usa desfase de 0,5 s, fundido de 0,8 s y subida de 12 px

### Implementation for User Story 3

- [X] T013 [P] [US3] Cambiar el timeline de `src/components/home/hero-copy-animation.tsx` a esos tres tiempos y limpiar la transformación al terminar

**Checkpoint**: La entrada termina en 1,8 segundos y el texto queda quieto. Con reducir movimiento no hay fundido.

---

## Phase 7: User Story 4 - Sentir la camiseta viva, sin exagerar (Priority: P2)

**Goal**: La tarjeta flota 4 px y, al pasar el puntero, se acerca un 3,5 % en 300 ms. La reserva sin foto hace lo mismo.

**Independent Test**: Mirar la tarjeta en reposo y pasar el puntero. El vaivén es de 4 px. El acercamiento dura 300 ms y se deshace al salir.

### Tests for User Story 4

- [X] T014 [US4] Afirmar en `tests/halloween-hero-motion.test.ts` que el contenedor de `src/components/home/hero-product.tsx` usa el flote de 4 px y el acercamiento de 1,035 en 300 ms, tanto con foto como con la reserva

### Implementation for User Story 4

- [X] T015 [US4] Definir el flote y el acercamiento en `src/app/globals.css`, reutilizando la anulación de T011
- [X] T016 [US4] Aplicar esas clases al contenedor único de `src/components/home/hero-product.tsx`, de modo que la foto y la reserva “FS” queden dentro

**Checkpoint**: La tarjeta flota y se acerca. Con reducir movimiento no hace ninguna de las dos cosas.

---

## Phase 8: Polish

**Purpose**: Cerrar el recorrido de `quickstart.md` sin ampliar el alcance.

- [X] T017 Ejecutar `node --import tsx --test tests/halloween-hero-motion.test.ts` y anotar el resultado frente a `specs/030-refine-halloween-motion/quickstart.md`
- [X] T018 [P] Revisar que `src/components/home/hero-halloween.tsx` no introduce un fantasma ni un color fuera de los tokens de `src/app/globals.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Empieza de inmediato.
- **Foundational (Phase 2)**: Depende de T001. Bloquea todas las historias.
- **US1, US2 y US5**: Dependen de la fase 2. US2 depende de las siluetas de US1. US5 depende de las clases de US2.
- **US3**: Depende de la fase 2. No depende de las siluetas.
- **US4**: Depende de la anulación escrita en US5 para no dejar el acercamiento activo con reducir movimiento.
- **Polish**: Depende de las historias que se quieran entregar.

### User Story Dependencies

- **US1 (P1)**: Después de la fase 2. No depende de otra historia.
- **US2 (P1)**: Después de US1, porque anima las siluetas ya montadas.
- **US5 (P1)**: Después de US2. El texto ya respeta la preferencia; esta historia cubre la decoración y deja preparada la tarjeta.
- **US3 (P2)**: Después de la fase 2. Puede hacerse en paralelo con US1.
- **US4 (P2)**: Después de US5.

### Parallel Opportunities

- T013 toca solo `src/components/home/hero-copy-animation.tsx` y puede avanzar junto con T005 y T006.
- T018 toca solo la revisión de `src/components/home/hero-halloween.tsx` y puede avanzar junto con T017.
- Las pruebas viven en un solo archivo: T002, T004, T007, T010, T012 y T014 no van en paralelo.

---

## Parallel Example: User Story 3

```bash
# Después de la fase 2, la entrada del texto no espera a las siluetas:
Task: "T013 Cambiar el timeline en src/components/home/hero-copy-animation.tsx"
Task: "T005 Pintar las siluetas en src/components/home/hero-halloween.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Cerrar Phase 1 y Phase 2.
2. Cerrar Phase 3.
3. Parar y contar en `/` dos murciélagos y una araña, sin fantasma y sin tapar los botones.

### Incremental Delivery

1. US1 deja la decoración visible y tenue.
2. US2 le da el cruce lento y el balanceo.
3. US5 apaga ese movimiento cuando el sistema lo pide.
4. US3 ordena la entrada del texto.
5. US4 anima la tarjeta, incluida la reserva sin foto.

### Parallel Team Strategy

1. Una persona cierra Setup y Foundational.
2. A partir de ahí, una persona sigue US1 → US2 → US5 → US4 y otra puede tomar US3.
3. No repartir las tareas de `tests/halloween-hero-motion.test.ts` ni las de `src/app/globals.css`.

---

## Notes

- Cada tarea de prueba se escribe antes que la implementación de su historia y debe fallar antes de esa implementación.
- No cambiar catálogo, carrito, checkout, carrusel ni admin.
- Parar en cualquier checkpoint y comprobar solo esa historia.
