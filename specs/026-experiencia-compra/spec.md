# Feature Specification: Experiencia de compra pública

**Feature Branch**: `026-experiencia-compra`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Corregir los problemas de experiencia de compra de la tienda pública de Flashsport detectados en una prueba de usuario. Alcance: página de producto, carrito, checkout y ligas. Fuera de alcance: panel admin, rediseño de marca e integración de pago (no tocar la firma ni el flujo de pago)."

## Clarifications

### Session 2026-09-24

- Q: ¿Dónde aparecen "Avisarme" y "Pedir por encargo" en un producto agotado? → A: Solo en la ficha. La tarjeta del listado dice "Agotado", no deja comprar y abre la ficha.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pagar sin que la documentación legal bloquee la compra (Priority: P1)

Un cliente con un producto disponible llena el checkout. Las autorizaciones hablan de términos, privacidad y tratamiento de datos, enlazan las páginas legales que ya existen y permiten seguir al pago. No aparece "(no configurado)" ni un aviso de que la documentación no está configurada.

**Why this priority**: Hoy la compra se detiene antes del pago aunque las páginas legales ya cargan. Sin esto no hay venta.

**Independent Test**: Con un producto disponible, marcar las casillas obligatorias y un formulario válido, y llegar al paso de pago ya existente sin ver "(no configurado)".

**Acceptance Scenarios**:

1. **Given** las páginas de términos, privacidad, tratamiento de datos y cambios y devoluciones están publicadas, **When** el cliente abre el checkout, **Then** cada casilla de autorización muestra su texto real y enlaza la página correspondiente, sin la frase "(no configurado)".
2. **Given** el formulario de envío es válido y las tres casillas obligatorias están marcadas, **When** el cliente pulsa "Continuar al pago", **Then** el botón está habilitado y abre el paso de pago ya existente.
3. **Given** falta marcar una casilla obligatoria, **When** el cliente intenta continuar, **Then** la compra no avanza y aparece un mensaje claro junto a las casillas que faltan.
4. **Given** falta algún documento legal, **When** el cliente abre el checkout, **Then** la tienda usa un texto y un enlace válidos por defecto, no bloquea "Continuar al pago" por esa ausencia, y deja constancia para el operador de la tienda.

---

### User Story 2 - Elegir talla antes de agregar al carrito (Priority: P2)

Un cliente abre una camiseta y ninguna talla viene marcada. Si pulsa comprar sin elegir talla, el producto no entra al carrito y la tienda le pide que elija una.

**Why this priority**: Hoy se agrega la talla S sin que el cliente la haya elegido, y el pedido puede salir en una talla distinta a la deseada.

**Independent Test**: Abrir un producto con varias tallas, no elegir ninguna, pulsar agregar al carrito y comprobar que el carrito sigue igual y que aparece "Elige una talla".

**Acceptance Scenarios**:

1. **Given** un producto con tallas, **When** se abre su página en escritorio o en móvil, **Then** ninguna talla aparece preseleccionada.
2. **Given** no hay talla elegida, **When** el cliente pulsa cualquier botón de agregar o de compra rápida, **Then** no se agrega ninguna línea al carrito.
3. **Given** el cliente intentó agregar sin talla, **When** la tienda responde, **Then** muestra "Elige una talla" junto al selector, desplaza la vista hasta ese selector, le da el foco y anuncia el mensaje a lectores de pantalla.
4. **Given** el cliente eligió una talla disponible, **When** agrega el producto, **Then** el carrito recibe exactamente esa talla.

---

### User Story 3 - Leer y completar el checkout en el celular (Priority: P2)

Un cliente en un teléfono de 320 a 430 píxeles de ancho ve el checkout, el carrito y la página de producto completos, sin tener que desplazarse de lado. El botón de pago sigue visible y se puede pulsar.

**Why this priority**: A 390 píxeles las tarjetas se salen de la pantalla y los textos de consentimiento quedan cortados, así que el cliente no puede revisar lo que autoriza.

**Independent Test**: Abrir checkout, carrito y página de producto a 320, 390 y 430 píxeles de ancho y comprobar que no hay desplazamiento horizontal y que el botón de pago se puede usar.

**Acceptance Scenarios**:

1. **Given** el ancho está entre 320 y 430 píxeles, **When** el cliente recorre checkout, carrito y página de producto, **Then** no aparece desplazamiento horizontal.
2. **Given** ese mismo ancho, **When** se muestran tarjetas, campos, casillas y el resumen del pedido, **Then** usan el ancho disponible y los textos pasan a la línea siguiente en lugar de cortarse.
3. **Given** el formulario ya se puede enviar, **When** el cliente llega al final del checkout en móvil, **Then** "Continuar al pago" sigue visible y se puede pulsar.

---

### User Story 4 - Ver el mismo desglose en carrito y en checkout (Priority: P3)

Un cliente compara el carrito con el checkout y ve las mismas líneas: productos, personalización si la hay, envío con su valor real y total. El total coincide con la suma de lo que está a la vista.

**Why this priority**: Hoy el carrito dice que el envío se calcula al pagar, pero el total ya incluye el envío, y la personalización se suma sin una línea propia.

**Independent Test**: Armar un pedido con personalización y otro sin ella, por debajo y por encima del envío gratis, y comprobar que carrito y checkout muestran el mismo total y que ese total es la suma de las líneas visibles.

**Acceptance Scenarios**:

1. **Given** un carrito con productos y sin personalización, **When** el cliente ve el carrito y luego el checkout, **Then** ambos muestran subtotal de productos, envío y total, con los mismos valores.
2. **Given** el cliente agregó nombre o número con recargo, **When** ve el resumen, **Then** la personalización aparece como línea propia con su precio, separada del subtotal de productos.
3. **Given** el pedido aún no alcanza el envío gratis, **When** se muestra el envío, **Then** aparece el valor real del envío, no la frase "se calcula al pagar".
4. **Given** el pedido alcanza el envío gratis, **When** se muestra el envío, **Then** la línea dice "Gratis" y el total no suma cargo de envío.
5. **Given** cualquier resumen visible, **When** se suman las líneas que el cliente ve, **Then** el resultado es exactamente el total mostrado, en carrito y en checkout.
6. **Given** la moneda visible es pesos colombianos, **When** se muestran los montos, **Then** usan el formato de pesos de Colombia.

---

### User Story 5 - Ver todas las fotos del producto (Priority: P3)

Un cliente abre una camiseta con varias fotos. En escritorio elige una miniatura y la foto grande cambia. En el celular desliza las fotos y ve en qué posición va.

**Why this priority**: Hoy la ficha muestra una sola imagen aunque el producto tenga más, y el cliente no puede revisar el diseño antes de comprar.

**Independent Test**: Abrir un producto con varias imágenes y otro con una sola, y comprobar la galería en escritorio y en móvil.

**Acceptance Scenarios**:

1. **Given** un producto con varias imágenes, **When** el cliente lo abre en escritorio, **Then** ve miniaturas que se pueden pulsar y la imagen principal cambia a la elegida.
2. **Given** ese producto en móvil, **When** el cliente desliza la galería, **Then** cambia de imagen y un indicador muestra la posición actual.
3. **Given** un producto con una sola imagen, **When** se abre la ficha, **Then** se muestra esa imagen y no aparecen controles vacíos de galería.
4. **Given** cualquier imagen visible, **When** un lector de pantalla la encuentra, **Then** tiene un texto alternativo que describe la foto.

---

### User Story 6 - Salir de una liga o un producto que no se puede comprar (Priority: P4)

Un cliente pulsa una liga marcada como "Próximamente" o abre un producto agotado. Entiende que no puede comprarlo ahora y tiene una acción útil, en lugar de un enlace que no hace nada o un botón de compra activo.

**Why this priority**: No impide las compras de productos disponibles, pero evita callejones sin salida en ligas y agotados.

**Independent Test**: Pulsar una liga sin productos y abrir un producto agotado desde el listado. La liga abre WhatsApp con su nombre. La tarjeta agotada abre la ficha, y ahí están "Avisarme" y "Pedir por encargo".

**Acceptance Scenarios**:

1. **Given** una liga sin productos, **When** se muestra su tarjeta, **Then** se ve como no disponible y no parece un enlace roto.
2. **Given** esa liga, **When** el cliente elige "Pídela por encargo", **Then** se abre WhatsApp con un mensaje que menciona esa liga.
3. **Given** un producto agotado en el listado, **When** el cliente ve su tarjeta, **Then** dice "Agotado", no ofrece compra y abre la ficha del producto.
4. **Given** la ficha de un producto agotado, **When** el cliente elige "Avisarme" o "Pedir por encargo", **Then** se abre WhatsApp con un mensaje que menciona ese producto, y no hay un botón de compra activo.

---

### Edge Cases

- El pedido queda exactamente en el monto a partir del cual el envío es gratis: la línea de envío dice "Gratis".
- Hay un descuento aplicado: aparece como línea propia y el total sigue siendo la suma de las líneas visibles.
- La personalización no tiene recargo: no se muestra una línea de personalización en cero, y el total sigue cuadrando.
- Todas las tallas están agotadas: no se puede agregar el producto y no queda una talla marcada por defecto.
- El cliente cambia de versión o de calidad después de elegir talla: la talla elegida se conserva solo si existe para la nueva opción; si no existe, vuelve a quedar sin talla.
- Falta una sola página legal y las demás existen: solo esa usa el texto por defecto, la compra no se bloquea y queda constancia para el operador.
- El destino ya no permite pago en línea: ese límite se mantiene; esta corrección no abre destinos nuevos.
- El ancho es 320 píxeles y el texto de consentimiento es largo: el texto salta de línea y no genera desplazamiento horizontal.
- El producto no tiene imagen: la ficha no muestra controles de galería vacíos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El checkout MUST mostrar tres casillas obligatorias con los textos reales de términos y condiciones, política de privacidad y tratamiento de datos según la Ley 1581 de Colombia, y MUST enlazar también cambios y devoluciones.
- **FR-002**: Esas casillas MUST enlazar las páginas públicas ya publicadas de términos, privacidad, tratamiento de datos y cambios y devoluciones. El checkout MUST NOT mostrar "(no configurado)" ni "La documentación legal no está configurada" cuando esas páginas existen.
- **FR-003**: Si falta un documento, la tienda MUST usar un texto y un enlace válidos por defecto, MUST NOT bloquear la compra por esa ausencia y MUST dejar constancia para el operador de la tienda.
- **FR-004**: "Continuar al pago" MUST habilitarse solo cuando el formulario de envío es válido y las tres casillas obligatorias están marcadas. Si falta una casilla, MUST mostrarse un mensaje claro y la compra MUST NOT avanzar.
- **FR-005**: Al continuar, el cliente MUST llegar al paso de pago ya existente. Esta corrección MUST NOT cambiar la firma ni el flujo de ese pago.
- **FR-006**: Ninguna talla MUST venir preseleccionada en la página de producto ni en ningún otro punto público donde se elige talla antes de comprar.
- **FR-007**: Si el cliente intenta agregar un producto sin talla, desde escritorio, móvil o un botón de compra rápida, la tienda MUST NOT agregar nada al carrito, MUST mostrar "Elige una talla" junto al selector, MUST llevar la vista y el foco a ese selector y MUST anunciar el mensaje a lectores de pantalla.
- **FR-008**: Entre 320 y 430 píxeles de ancho, checkout, carrito y página de producto MUST NOT requerir desplazamiento horizontal. Tarjetas, campos, casillas y resumen MUST usar el ancho disponible y el texto MUST saltar de línea. El botón de pago MUST permanecer visible y usable.
- **FR-009**: Carrito y checkout MUST mostrar el mismo desglose: subtotal de productos, personalización como línea propia cuando tiene precio, envío con su valor real o "Gratis", y total.
- **FR-010**: El total MUST ser igual a la suma de las líneas visibles, tanto en el carrito como en el checkout, para el mismo pedido. Un descuento aplicado MUST aparecer como línea propia.
- **FR-011**: El envío MUST seguir la regla ya publicada de la tienda: tarifa fija mientras el pedido no alcance el monto de envío gratis, y "Gratis" desde ese monto. MUST NOT decir que el envío se calcula al pagar cuando el monto ya está definido.
- **FR-012**: Los montos en pesos MUST mostrarse en formato colombiano.
- **FR-013**: La página de producto MUST mostrar una galería cuando hay varias imágenes: miniaturas pulsables en escritorio, deslizamiento en móvil e indicador de posición. Si hay una sola imagen, o ninguna, MUST NOT mostrar controles vacíos. Cada imagen visible MUST tener texto alternativo descriptivo.
- **FR-014**: Una liga sin productos MUST verse como no disponible y MUST ofrecer "Pídela por encargo", que abre el WhatsApp de la tienda con un mensaje que nombra esa liga.
- **FR-015**: Un producto agotado MUST NOT ofrecer un botón de compra activo. En el listado, su tarjeta MUST decir "Agotado" y MUST abrir la ficha. En la ficha MUST ofrecer "Avisarme" y "Pedir por encargo", y cada acción MUST abrir el WhatsApp de la tienda con un mensaje que nombra ese producto.

### Key Entities

- **Autorización de compra**: las tres aceptaciones obligatorias (términos, privacidad y tratamiento de datos) y el enlace a cambios y devoluciones. Cada una apunta a un documento publicado o, si falta, a un texto válido por defecto.
- **Desglose del pedido**: subtotal de productos, personalización, descuento si existe, envío y total. El total es la suma de esas líneas.
- **Selección de talla**: la talla elegida por el cliente. Empieza vacía y solo existe después de una elección explícita.
- **Galería del producto**: las imágenes publicadas del producto, su orden y el texto que describe cada una.
- **Salida de no disponible**: la acción de WhatsApp para una liga sin productos, o las dos acciones de la ficha de un producto agotado. El listado de un agotado solo abre esa ficha. El mensaje nombra la liga o el producto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cliente con un producto disponible, formulario válido y las tres casillas marcadas llega al paso de pago en un solo intento, sin ver "(no configurado)".
- **SC-002**: En las pruebas de compra, cero productos entran al carrito sin una talla elegida por el cliente.
- **SC-003**: A 320, 390 y 430 píxeles de ancho, checkout, carrito y página de producto no muestran desplazamiento horizontal, y el botón de pago se puede pulsar.
- **SC-004**: Para el mismo pedido, el total del carrito es igual al total del checkout, y ambos son iguales a la suma de las líneas visibles, con y sin personalización y con envío de pago o gratis.
- **SC-005**: Un producto con varias imágenes permite ver cada una en escritorio y en móvil; un producto con una sola imagen no muestra controles de galería vacíos.
- **SC-006**: Cada liga sin productos abre WhatsApp nombrando esa liga. Cada producto agotado, en su ficha, ofrece "Avisarme" y "Pedir por encargo" nombrando ese producto. Ni la liga ni el producto presentan un botón de compra activo.

## Assumptions

- El alcance es solo la tienda pública: página de producto, carrito, checkout y ligas. Quedan fuera el panel de administración, un rediseño de marca y cualquier cambio a la firma o al flujo del pago.
- Las páginas públicas de términos, privacidad, tratamiento de datos y cambios y devoluciones ya existen y son los documentos que el checkout debe enlazar.
- Las tres casillas obligatorias son términos, privacidad y tratamiento de datos. Cambios y devoluciones se enlaza en ese mismo bloque y no es una cuarta casilla que bloquee el pago.
- Si falta un documento, el texto por defecto es una autorización breve y válida en español que apunta a la página pública correspondiente de la tienda. La compra sigue disponible.
- La constancia para el operador es un registro de que faltó ese documento. No se muestra al cliente.
- El envío gratis sigue la regla actual de la tienda: $15.000 en pesos por debajo de $200.000 y gratis desde $200.000. El umbral se calcula con el mismo subtotal que la tienda ya usa para el envío, antes del cargo de envío.
- Los precios de origen siguen siendo pesos enteros. Si el cliente está viendo otra moneda, el desglose usa esa misma presentación en carrito y checkout, y la igualdad de líneas se mantiene.
- "Avisarme" y "Pedir por encargo" aparecen solo en la ficha del producto agotado. Abren el WhatsApp público que la tienda ya usa, con mensajes distintos. La tarjeta del listado dice "Agotado" y abre esa ficha. No se crea una lista de espera ni una pantalla nueva de administración.
- La regla de talla aplica a toda compra pública que pida talla, incluida la caja misteriosa y cualquier compra rápida.
- Los destinos que hoy no pueden pagar en línea siguen igual.
- La verificación de esta corrección incluye pruebas repetibles de la talla obligatoria, del desglose con y sin personalización y con envío de pago o gratis, y del checkout con documentos legales presentes y ausentes.
