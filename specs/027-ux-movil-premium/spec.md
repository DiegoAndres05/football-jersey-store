# Feature Specification: Compra móvil premium

**Feature Branch**: `027-ux-movil-premium`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Mejorar el UX/UI móvil de la tienda pública de Flashsport para que la compra en teléfono se sienta premium. Alcance: viewport 320–430 px, con prioridad cerca de 390×844. Páginas: inicio, menú, catálogo, liga y equipo, ficha de producto, carrito, checkout y contacto. Fuera de alcance: panel admin, rediseño de marca, integración de pago y SEO técnico salvo lo que afecte el layout móvil."

## Clarifications

### Session 2026-09-26

- Q: ¿Cómo se ve el resumen del pedido en el checkout cuando el ancho es de hasta 430 px? → A: El resumen está cerrado junto al botón. Un toque lo abre con artículos, subtotal, envío y total.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar desde la ficha sin buscar el botón (Priority: P1)

Un cliente abre una camiseta en el teléfono. Ve la foto, el nombre y el precio, y también una barra fija abajo con el precio de ahora, la talla elegida o el aviso de que falta, y el botón de agregar al carrito.

**Why this priority**: Hoy talla, entrega y “Agregar al carrito” quedan debajo del pliegue. Sin esa barra la compra en el teléfono exige buscar el botón.

**Independent Test**: En un ancho de 390 px, abrir una ficha, ver la barra sin hacer scroll, elegir talla y agregar al carrito desde esa barra.

**Acceptance Scenarios**:

1. **Given** un teléfono de hasta 430 px de ancho, **When** el cliente abre la ficha, **Then** ve una barra fija en la parte inferior con el precio actual, un resumen corto de talla y el botón “Agregar al carrito”.
2. **Given** el cliente agregó personalización con recargo, **When** mira la barra, **Then** el precio incluye ese recargo.
3. **Given** no hay talla elegida, **When** pulsa “Agregar al carrito” en la barra, **Then** no entra nada al carrito, la vista va al selector, el selector recibe el foco y aparece “Elige una talla”.
4. **Given** hay talla elegida y se puede comprar, **When** pulsa el botón de la barra, **Then** el carrito recibe esa talla.
5. **Given** el teclado o un panel está abierto, **When** el cliente escribe o elige dentro de ese panel, **Then** la barra no tapa el campo activo.
6. **Given** el ancho es de 768 px o más y el botón de agregar ya se ve sin un scroll largo, **When** se abre la ficha, **Then** la barra fija no es obligatoria.

---

### User Story 2 - El carrito flotante no tapa la compra ni el contacto (Priority: P1)

El botón flotante del carrito sigue ayudando a volver al carrito, pero no cubre “Agregar al carrito” ni el correo de contacto.

**Why this priority**: Hoy ese botón negro se monta sobre la compra en la ficha y sobre el correo en contacto.

**Independent Test**: Con artículos en el carrito, recorrer ficha, contacto, carrito, checkout y pedido a 390 px y comprobar que el botón flotante no cubre un botón principal ni el correo.

**Acceptance Scenarios**:

1. **Given** la barra de compra de la ficha está visible, **When** el cliente está en esa ficha, **Then** el botón flotante del carrito no se muestra.
2. **Given** el cliente está en carrito, checkout o pedido, **When** mira la pantalla, **Then** el botón flotante no se muestra.
3. **Given** el cliente está en inicio, catálogo, liga, equipo o contacto, con artículos en el carrito y el menú cerrado, **When** aparece el botón flotante, **Then** respeta el margen seguro inferior y el contenido de la página tiene espacio de sobra para que no tape textos ni botones.
4. **Given** el botón flotante está visible, **When** se mira su área de toque y su cantidad, **Then** el área mide al menos 44×44 px y la cantidad se lee con claridad.

---

### User Story 3 - Ver las fotos de la camiseta con el dedo (Priority: P1)

En el teléfono el cliente pasa las fotos de lado, sabe cuál está viendo y puede ampliar una foto. Si solo hay una, no aparecen controles vacíos.

**Why this priority**: Hoy la ficha móvil se percibe como una sola imagen grande, sin una forma clara de recorrer el resto.

**Independent Test**: Abrir una ficha con dos o más fotos a 390 px, deslizar y ver el indicador. Abrir otra con una sola foto y comprobar que no hay puntos vacíos.

**Acceptance Scenarios**:

1. **Given** el producto tiene dos o más imágenes, **When** el cliente desliza en horizontal, **Then** cambia de imagen y un indicador muestra la posición, por ejemplo “1/4”.
2. **Given** esa galería, **When** el cliente toca la imagen, **Then** puede ampliarla.
3. **Given** el producto tiene una sola imagen, o ninguna, **When** se abre la ficha, **Then** no se muestran puntos, contador ni miniaturas vacías.
4. **Given** cualquier imagen visible, **When** un lector de pantalla la encuentra, **Then** tiene un texto alternativo descriptivo.
5. **Given** el ancho es de 390 px o menos y hay varias fotos, **When** se muestra la galería, **Then** las miniaturas no ocupan la ficha si con eso se pierde la foto principal o el indicador.

---

### User Story 4 - Leer el nombre de la camiseta (Priority: P1)

En el catálogo, el carrito y el resumen del checkout el cliente reconoce el producto. El nombre no queda reducido a una palabra cortada.

**Why this priority**: Nombres como “Camiseta Local FC…” o “Real Madrid 2026-…” impiden saber qué se está comprando.

**Independent Test**: Ver una tarjeta de catálogo, una línea de carrito y el resumen de checkout a 390 px y leer el nombre en dos líneas, con equipo, versión y talla aparte.

**Acceptance Scenarios**:

1. **Given** una tarjeta del catálogo en móvil, **When** el nombre es largo, **Then** se muestran al menos dos líneas antes del recorte.
2. **Given** una línea del carrito o del resumen de checkout, **When** el cliente la lee, **Then** el nombre ocupa el ancho útil en dos líneas o completo, y equipo, versión y talla van en una línea secundaria.
3. **Given** esos tres lugares, **When** se compara el mismo producto, **Then** el nombre visible permite reconocerlo sin abrirlo de nuevo.

---

### User Story 5 - Pulsar sin fallar el dedo (Priority: P1)

Favoritos, iconos de la barra, tallas, versiones, personalización, cantidad, cerrar menú o filtros y las casillas del checkout se pueden pulsar con el pulgar.

**Why this priority**: Varios controles están por debajo del tamaño cómodo de un dedo y la gente pulsa el control de al lado.

**Independent Test**: Medir el área de toque de favoritos, una talla, el menos y el más de cantidad, un icono del encabezado y una casilla del checkout. Cada uno mide al menos 44×44 px, con al menos 8 px hasta el control vecino.

**Acceptance Scenarios**:

1. **Given** un ancho de hasta 430 px, **When** el cliente pulsa favoritos, un icono del encabezado, una talla, una versión, una opción de personalización, menos, más, cerrar menú, cerrar filtros o una casilla del checkout, **Then** el área de toque mide al menos 44×44 px.
2. **Given** dos de esos controles están juntos, **When** se mide el espacio entre ellos, **Then** hay al menos 8 px.
3. **Given** el icono dibujado es más pequeño que 44 px, **When** se pulsa alrededor del icono, **Then** el toque igual activa ese control.

---

### User Story 6 - Completar el checkout por partes (Priority: P2)

En el teléfono el checkout se recorre por contacto, envío y autorizaciones. Los errores aparecen al salir del campo. El resumen y el botón de continuar se entienden sin desplazamiento horizontal.

**Why this priority**: El formulario es largo y “Continuar al pago” solo aparece al final, después de revisar todo de una vez.

**Independent Test**: En 320, 390 y 430 px, llenar contacto con un error, ver el mensaje junto al campo, abrir el resumen y llegar al botón sin scroll horizontal.

**Acceptance Scenarios**:

1. **Given** el ancho es de hasta 430 px, **When** el cliente entra al checkout, **Then** ve el progreso del paso y las secciones de contacto, envío y autorizaciones.
2. **Given** un campo obligatorio queda inválido, **When** el cliente sale de ese campo, **Then** el error aparece junto al campo y no solo al enviar el formulario.
3. **Given** el cliente quiere revisar el pedido, **When** pulsa el resumen cerrado que está junto al botón principal, **Then** ve los artículos, el subtotal, el envío y el total.
4. **Given** un ancho entre 320 y 430 px, **When** recorre el checkout, **Then** no hay desplazamiento horizontal y el botón principal se puede pulsar.

---

### User Story 7 - Saber cuántos filtros hay puestos (Priority: P2)

El cliente abre filtros, ve cuántos están activos, puede limpiarlos y, al aplicar, vuelve a la grilla actualizada.

**Why this priority**: Sin contador ni limpieza, el catálogo filtrado parece vacío o arbitrario.

**Independent Test**: Activar un filtro de liga y uno de modalidad, ver “Filtros (2)”, limpiar todo y ver la grilla sin esos filtros.

**Acceptance Scenarios**:

1. **Given** no hay filtros activos, **When** se muestra el botón, **Then** dice “Filtros”.
2. **Given** hay uno o más filtros activos, **When** se muestra el botón, **Then** dice “Filtros (N)” con esa cantidad.
3. **Given** el panel de filtros está abierto y hay filtros activos, **When** el cliente lo mira, **Then** ve “Limpiar todo”.
4. **Given** el cliente aplica los filtros, **When** el panel se cierra, **Then** la grilla corresponde a esos filtros y la vista queda en el resultado.

---

### User Story 8 - Menú y portada caben en la mano y en la primera pantalla (Priority: P3)

El menú no deja un hueco grande entre los destinos y las utilidades. La portada, en un teléfono estrecho, deja ver el inicio del primer producto sin perder la jerarquía.

**Why this priority**: No bloquea agregar al carrito, pero la primera impresión y el menú se sienten vacíos o demasiado largos.

**Independent Test**: Abrir el menú a 390 px y alcanzar moneda, favoritos y vistos recientemente sin un tramo vacío largo. Abrir el inicio y ver al menos el comienzo del primer producto en el primer pantallazo.

**Acceptance Scenarios**:

1. **Given** el menú móvil está abierto, **When** el cliente mira los destinos y el bloque de moneda, favoritos y vistos recientemente, **Then** ese bloque queda al alcance del pulgar, sin un vacío grande entre ambos grupos.
2. **Given** el menú, **When** se listan los destinos, **Then** siguen presentes los destinos públicos actuales, incluidos ligas y la caja misteriosa cuando corresponda.
3. **Given** el ancho es de 390 px o menos, **When** se abre el inicio, **Then** el hero es más compacto y el primer producto asoma en la primera pantalla.
4. **Given** los botones “Comprar ahora” y “Explorar ligas”, **When** se miden, **Then** cada área de toque mide al menos 44×44 px.

---

### User Story 9 - Ver cuánto falta para el envío gratis (Priority: P3)

En el carrito, además del texto, una barra muestra qué tan cerca está el pedido del envío gratis. Cambiar la cantidad actualiza el total al momento.

**Why this priority**: El texto ya existe. La barra hace visible el incentivo sin ser necesaria para pagar.

**Independent Test**: Con un subtotal por debajo del envío gratis, ver la barra incompleta. Subir la cantidad hasta el umbral y ver la barra llena y el envío en “Gratis”.

**Acceptance Scenarios**:

1. **Given** el pedido aún no alcanza el envío gratis, **When** el cliente ve el carrito, **Then** lee cuánto falta y ve una barra de avance hacia ese monto.
2. **Given** el pedido ya alcanza el envío gratis, **When** mira la barra, **Then** el avance está completo y el envío se muestra como gratis.
3. **Given** el cliente pulsa menos o más, **When** cambia la cantidad, **Then** el área de toque mide al menos 44×44 px y el subtotal y el total cambian en ese momento.

---

### User Story 10 - La foto corresponde al nombre (Priority: P3)

Si el nombre habla de una temporada, la imagen principal es la de esa referencia. Si la imagen guardada es otra, el texto visible se alinea a la referencia real. No se inventan fotos nuevas.

**Why this priority**: Una foto que no coincide con el nombre daña la confianza, pero no impide el resto de la compra móvil.

**Independent Test**: Abrir un producto cuyo nombre cita una temporada y comprobar que la imagen principal, o el texto si se corrige el copy, habla de la misma referencia que el artículo guardado.

**Acceptance Scenarios**:

1. **Given** el nombre publicado cita una temporada o una referencia, **When** el cliente ve la imagen principal, **Then** esa imagen corresponde a esa referencia o el texto visible deja de prometer otra.
2. **Given** hay que corregir el desajuste, **When** se hace, **Then** se usa el nombre, la temporada o la imagen que ya existen. No se crea una foto nueva.

---

### Edge Cases

- El producto está agotado o esa talla no se puede comprar: la barra no agrega una línea y no presenta un botón de compra activo.
- El cliente cambia la personalización: el precio de la barra cambia con el recargo y vuelve al precio base si quita la personalización.
- El ancho está entre 431 y 767 px: la barra fija de la ficha no es obligatoria; el botón de agregar de la página sigue disponible.
- El menú móvil está abierto: el botón flotante del carrito no se muestra encima del menú.
- No hay imágenes: la ficha no muestra controles de galería.
- Hay muchas imágenes: el indicador sigue diciendo la posición actual y el deslizamiento no mueve la página de lado.
- El pedido está exactamente en el monto de envío gratis: la barra de avance se ve completa.
- No hay filtros activos: no aparece “Filtros (0)” ni “Limpiar todo”.
- El teclado reduce la altura visible: la barra de compra no cubre el campo con foco.
- La caja misteriosa no es una de las páginas de este alcance. No se le exige la barra fija, salvo que más adelante use la misma ficha.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En anchos de hasta 430 px, la ficha MUST mostrar una barra fija inferior con el precio actual, la talla elegida o el texto “Elige talla”, y el botón “Agregar al carrito”.
- **FR-002**: Esa barra MUST respetar el margen seguro inferior del teléfono. MUST NOT mostrarse de forma obligatoria desde 768 px si el botón de agregar ya es visible sin un scroll largo.
- **FR-003**: Si falta la talla, el botón de la barra MUST NOT agregar al carrito. MUST llevar la vista y el foco al selector y MUST mostrar “Elige una talla”.
- **FR-004**: El precio de la barra MUST incluir el recargo de personalización cuando exista. Los montos MUST seguir en pesos enteros y, si se ven en pesos, con formato colombiano.
- **FR-005**: Con el teclado o un panel abierto, la barra MUST NOT tapar el campo o el control activo.
- **FR-006**: El botón flotante del carrito MUST NOT mostrarse en carrito, checkout, pedido ni en la ficha mientras la barra de compra esté visible.
- **FR-007**: En el resto de páginas del alcance, si el carrito tiene artículos y el menú está cerrado, el botón flotante MUST quedar sobre el margen seguro y la página MUST reservar espacio para que no tape textos ni botones. Su área de toque MUST ser de al menos 44×44 px y la cantidad MUST leerse.
- **FR-008**: Con dos o más imágenes, la ficha en móvil MUST permitir deslizar en horizontal, MUST mostrar la posición y MUST permitir ampliar la imagen al tocarla.
- **FR-009**: Con una imagen o ninguna, la ficha MUST NOT mostrar controles vacíos de galería. Cada imagen visible MUST tener texto alternativo descriptivo. En 390 px o menos, las miniaturas MUST NOT competir con la foto principal.
- **FR-010**: Las tarjetas del catálogo MUST mostrar el nombre en al menos dos líneas antes de recortarlo. Carrito y resumen de checkout MUST mostrar un nombre reconocible, completo o en dos líneas, y equipo, versión y talla en una línea secundaria.
- **FR-011**: Favoritos, iconos del encabezado, tallas, versiones, personalización, menos, más, cerrar menú, cerrar filtros y casillas del checkout MUST ofrecer un área de toque de al menos 44×44 px, con al menos 8 px entre controles vecinos.
- **FR-012**: En anchos de hasta 430 px, el checkout MUST mostrar el progreso del paso y las secciones de contacto, envío y autorizaciones. Un campo inválido MUST mostrar su error al salir del campo.
- **FR-013**: En ese mismo ancho, el resumen del pedido MUST estar cerrado junto al botón principal y MUST abrirse con un toque para mostrar artículos, subtotal, envío y total. Entre 320 y 430 px el checkout MUST NOT desplazarse en horizontal.
- **FR-014**: El botón de filtros MUST decir “Filtros (N)” cuando hay N filtros activos y “Filtros” cuando no hay ninguno. Con filtros activos, el panel MUST ofrecer “Limpiar todo”. Aplicar MUST cerrar el panel y MUST actualizar la grilla.
- **FR-015**: El menú móvil MUST acercar las utilidades de moneda, favoritos y vistos recientemente a los destinos, sin quitar los destinos públicos actuales. En 390 px o menos, el inicio MUST ser más compacto para que el primer producto asome en la primera pantalla. “Comprar ahora” y “Explorar ligas” MUST tener área de toque de al menos 44×44 px.
- **FR-016**: El carrito MUST mostrar una barra de avance hacia el envío gratis además del texto de cuánto falta. Menos y más MUST medir al menos 44×44 px y MUST actualizar subtotal y total al momento.
- **FR-017**: Si el nombre publicado y la imagen principal no describen la misma referencia, la tienda MUST alinear el texto o la imagen usando los datos ya guardados. MUST NOT crear fotos nuevas.
- **FR-018**: Esta corrección MUST NOT cambiar el panel admin, la marca, la firma del pago, el aviso de pago ni el paso de pago.

### Key Entities

- **Barra de compra**: precio actual, resumen de talla y acción de agregar. Solo es obligatoria en la ficha cuando el ancho es de hasta 430 px.
- **Botón flotante del carrito**: acceso al carrito con la cantidad. Se oculta en carrito, checkout, pedido y en la ficha cuando la barra de compra está visible.
- **Galería móvil**: imágenes del producto, posición actual y ampliación. Sin controles si hay una sola imagen.
- **Área de toque**: el rectángulo pulsable de un control, de al menos 44×44 px, distinto del tamaño del icono dibujado.
- **Resumen de filtros**: la cantidad de filtros activos y la acción de limpiarlos.
- **Avance de envío gratis**: la proporción entre el subtotal que ya usa la tienda para el envío y el monto a partir del cual el envío es gratis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pantalla de 390×844 px, la ficha muestra la barra de compra sin scroll y, tras elegir talla, el producto entra al carrito desde esa barra.
- **SC-002**: En las páginas del alcance, el botón flotante no cubre un botón principal ni el correo de contacto.
- **SC-003**: Una ficha con dos o más fotos permite deslizar y muestra la posición. Una ficha con una foto no muestra controles vacíos.
- **SC-004**: En el catálogo el nombre se lee en dos líneas. En el carrito el nombre identifica el artículo sin abrirlo otra vez.
- **SC-005**: Favoritos, tallas, menos, más e iconos del encabezado tienen un área de toque de al menos 44×44 px.
- **SC-006**: Entre 320 y 430 px el checkout no se desplaza en horizontal, valida al salir del campo y abre el resumen de artículos, subtotal, envío y total con un toque junto al botón principal.
- **SC-007**: Con al menos un filtro de liga o de modalidad, el botón dice “Filtros (N)” y “Limpiar todo” quita esos filtros.

## Assumptions

- El alcance visual es la tienda pública: inicio, menú, catálogo, liga, equipo, ficha, carrito, checkout y contacto. Quedan fuera el admin, un cambio de marca y cualquier cambio a la firma, al aviso o al paso de pago.
- La barra fija es obligatoria solo hasta 430 px de ancho. Desde 768 px no se exige si el botón de la ficha ya se ve. Entre 431 y 767 px no se añade una barra nueva.
- El envío gratis sigue la regla ya publicada: $15.000 por debajo de $200.000 y gratis desde $200.000, sobre el mismo subtotal que la tienda ya usa.
- “Sobre nosotros” sigue llamándose así. Ligas y Caja misteriosa siguen en el menú cuando ya corresponden. Este trabajo solo acerca las utilidades.
- En 390 px o menos la galería usa deslizamiento, indicador y ampliación. Las miniaturas quedan para anchos mayores si no caben junto a la foto principal.
- La ampliación es una vista grande de la imagen ya publicada, con una forma clara de cerrarla.
- El desajuste de foto y nombre se corrige con el nombre, la temporada o la imagen ya guardados.
- En el checkout de hasta 430 px el resumen no ocupa la pantalla de forma fija. Permanece cerrado junto al botón y se abre con un toque.
- La verificación incluye pruebas repetibles de la barra según ancho y ruta, de la ocultación del botón flotante, del nombre en dos líneas, del área de toque de las tallas y de que el checkout a 390 px no se desplaza en horizontal.
