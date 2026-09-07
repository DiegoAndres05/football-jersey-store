# Feature Specification: Elegir fotos del carrusel desde el admin

**Feature Branch**: `009-admin-carrusel-fotos`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: el carrusel del inicio es demasiado complicado (destacado + activo + foto principal + mínimo 2). En el admin, un apartado para hacer clic en las imágenes del catálogo que deben salir y un solo botón para guardar; al hacerlo, esas imágenes aparecen en el carrusel.

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde vive ese apartado en el admin? → A: Un bloque arriba de la lista de Productos, sin ítem nuevo en el menú.
- Q: ¿Qué fotos aparecen en ese bloque de arriba? → A: Todas las fotos de productos visibles en la tienda (varias por producto si hay); las de productos ocultos no salen.
- Q: ¿Se pueden elegir dos fotos del mismo producto? → A: Sí: cada foto es una diapositiva (el mismo producto puede salir más de una vez).
- Q: ¿Qué pasa si ya hay 5 fotos marcadas y pulsa una sexta? → A: No se marca la sexta; un aviso dice que el máximo es 5 (puede desmarcar una y elegir otra).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir las fotos del carrusel en un solo paso (Priority: P1)

Como persona que administra la tienda, quiero ver las fotos de los productos que ya se ven en la tienda, pulsar las que deben ir al carrusel del inicio y guardar con un solo botón, para no depender de Destacado ni de adivinar por qué no se ve el coverflow.

**Why this priority**: Es el flujo pedido. Sin esto, el carrusel sigue atado a reglas opacas.

**Independent Test**: En `/admin/productos`, marcar dos fotos del catálogo en el bloque de arriba, pulsar el botón de guardar, abrir el inicio: esas dos fotos están en el carrusel.

**Acceptance Scenarios**:

1. **Given** hay al menos un producto visible en la tienda con imagen, **When** abre la lista de Productos en el admin, **Then** ve arriba de esa lista un bloque con **todas** las fotos de esos productos visibles (varias por producto si hay), no las de productos ocultos, ni un ítem nuevo de menú ni un formulario de “destacado”.
2. **Given** esa galería, **When** hace clic en una o más fotos (incluso dos del mismo producto) y pulsa el único botón de guardar, **Then** la selección queda persistida y recibe confirmación clara (sin recargar a una página de error).
3. **Given** una selección guardada, **When** un visitante abre el inicio, **Then** el carrusel muestra **esas** fotos (cada una como diapositiva, aunque dos sean del mismo producto), en el orden en que se eligieron, no el conjunto de productos marcados como destacados.
4. **Given** acaba de guardar, **When** vuelve a Productos, **Then** las fotos elegidas siguen marcadas como seleccionadas en el bloque de arriba.
5. **Given** ya hay 5 fotos marcadas, **When** pulsa una sexta que no estaba marcada, **Then** esa sexta **no** se marca y ve un aviso de que el máximo es 5; puede desmarcar una y elegir otra.

---

### User Story 2 - Quitar o cambiar la selección sin pelear con el catálogo (Priority: P2)

Como administradora, quiero desmarcar fotos y guardar de nuevo, o vaciar la selección, para cambiar el carrusel sin borrar productos ni variantes.

**Why this priority**: El catálogo real no se debe tocar para “apagar” el coverflow.

**Independent Test**: Desmarcar una foto, guardar; el inicio ya no la muestra. Vaciar todas, guardar; el carrusel desaparece.

**Acceptance Scenarios**:

1. **Given** hay fotos seleccionadas, **When** hace clic otra vez en una ya marcada y guarda, **Then** esa foto sale del carrusel.
2. **Given** hay fotos en el carrusel, **When** deja cero seleccionadas y guarda, **Then** el inicio no muestra carrusel (el resto del inicio sigue).
3. **Given** una foto de un producto que luego se oculta o se queda sin imagen, **When** un visitante abre el inicio, **Then** esa diapositiva no se inventa con una imagen ajena; se omite.

---

### User Story 3 - Ver el carrusel en el inicio sin reglas extra (Priority: P3)

Como visitante, quiero ver en el inicio las camisetas que la tienda eligió para el carrusel, aunque haya una sola, para no depender de un mínimo de dos destacadas.

**Why this priority**: El mínimo de 2 y el flag Destacado son el “complique” que hay que quitar de la portada.

**Independent Test**: Guardar una sola foto en el admin; el inicio muestra el carrusel con esa pieza (flechas pueden ocultarse si no hay más).

**Acceptance Scenarios**:

1. **Given** hay exactamente una foto guardada para el carrusel, **When** abre el inicio, **Then** ve esa camiseta en el bloque del carrusel (después de la barra de confianza, antes de las ligas).
2. **Given** hay varias fotos guardadas, **When** recorre el carrusel, **Then** el comportamiento visual ya acordado se mantiene (coverflow, español, sin precio, CTA a la ficha de esa camiseta).

---

### Edge Cases

- Catálogo sin imágenes de productos visibles: el bloque de arriba en Productos lo dice con claridad; no hay qué pulsar. El inicio no muestra carrusel.
- Productos ocultos: sus fotos **no** aparecen en el bloque. Si una foto ya elegida pasa a un producto oculto o se borra, esa diapositiva se omite en el inicio; las demás siguen. En el bloque deja de verse (solo fotos de productos visibles).
- Tope de 5: al pulsar una sexta foto **no** se marca. Un aviso dice que el máximo es 5. MUST NOT caer la más antigua ni recortar en silencio al guardar. Desmarcar una permite elegir otra.
- Guardar sin haber cambiado nada: no debe fallar; el estado queda igual.
- Quién puede usar el bloque: solo quien ya entra al panel de administración (misma lista de Productos).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar el selector del carrusel como un **bloque arriba de la lista de Productos** en el admin, con las fotos elegibles y **un** botón para guardar. MUST NOT añadir un ítem nuevo al menú del admin.
- **FR-002**: La persona MUST poder marcar y desmarcar fotos haciendo **clic** sobre ellas. MUST NOT exigir marcar Destacado ni que la foto sea la “principal” para incluirla.
- **FR-009**: El bloque MUST listar **todas** las fotos de productos **visibles en la tienda** (varias por producto si existen). MUST NOT listar fotos de productos ocultos. La visibilidad en tienda no se usa como interruptor del carrusel: solo filtra qué se puede pulsar.
- **FR-010**: El sistema MUST permitir seleccionar más de una foto del mismo producto. Cada foto seleccionada MUST ser una diapositiva distinta en el inicio. MUST NOT reemplazar en silencio la foto previa de ese producto.
- **FR-011**: Con 5 fotos ya marcadas, un clic en otra foto no marcada MUST NOT añadirla. MUST mostrar un aviso claro de que el máximo es 5. MUST NOT sustituir la más antigua ni recortar la lista al guardar.
- **FR-003**: Al guardar, el sistema MUST persistir exactamente las fotos marcadas (0 a 5). El inicio MUST usar **solo** esa lista para el carrusel, no el conjunto de productos destacados.
- **FR-004**: Si la lista guardada está vacía (o ninguna foto sigue siendo usable), el inicio MUST NOT mostrar el carrusel.
- **FR-005**: Si hay **una o más** fotos usables guardadas, el inicio MUST mostrar el carrusel con esas piezas. MUST NOT exigir un mínimo de dos.
- **FR-006**: Cada diapositiva MUST seguir yendo a la ficha de la camiseta de esa foto, en español, sin precio en el overlay (como el carrusel ya definido).
- **FR-007**: “Las más buscadas” y el checkbox Destacado MUST NOT controlarse desde este bloque (siguen siendo otra cosa, más abajo en la misma lista de Productos).
- **FR-008**: Solo personal autenticado del admin MUST poder ver y guardar este bloque.

### Key Entities

- **Foto de catálogo**: imagen ya asociada a un producto. En el bloque del carrusel solo cuentan las de productos visibles en la tienda.
- **Selección del carrusel**: lista ordenada de hasta 5 **fotos** (no de productos), guardada por el admin, que alimenta el inicio. La misma camiseta puede aparecer más de una vez si se eligieron varias de sus fotos.
- **Carrusel del inicio**: el bloque visual ya existente entre la barra de confianza y las ligas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de aceptación, el 100% de las personas de prueba del admin logra poner 2 fotos en el carrusel del inicio en menos de 1 minuto (clic + un botón), sin usar Destacado.
- **SC-002**: Tras guardar, el 100% de las visitas al inicio muestran exactamente las fotos usables de esa selección (mismo orden), o ningún carrusel si la lista está vacía.
- **SC-003**: Con 1 sola foto guardada, el 100% de las visitas al inicio ven esa foto en el carrusel (no un bloque oculto).
- **SC-004**: El 100% de los intentos de guardar de un visitante no autenticado fallan; el bloque en Productos no es público.

## Assumptions

- El coverflow, su lugar en el inicio, el español, el CTA “Ver camiseta” y la ausencia de precio **ya existen** (feature 008). Esta entrega **cambia solo cómo se eligen las fotos**.
- El máximo de 5 se mantiene para que el escenario 3D siga siendo legible; el sexto clic no entra.
- El orden es el de la selección (clic / orden al guardar).
- Dos fotos del mismo producto cuentan como dos diapositivas.
- No se suben fotos nuevas en este bloque: se elige entre las fotos ya subidas de productos visibles.
- El menú del admin no gana una entrada “Carrusel”; el flujo vive en Productos.
- “Visible en la tienda” es el mismo criterio que ya usa el admin para mostrar u ocultar un producto; no se exige Destacado.
- OpenCode implementará tras plan/tareas; Cursor no pega un demo.

## Out of Scope

- Volver a usar Destacado o “mínimo 2 productos activos” como fuente del carrusel.
- Editor de recorte, filtros o upload dentro de esta pantalla.
- Ranking por ventas.
- Cambiar ligas, hero o “Las más buscadas”.
- Borrar productos para “limpiar” el carrusel.
