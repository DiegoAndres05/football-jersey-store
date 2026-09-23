# Feature Specification: Caja misteriosa

**Feature Branch**: `025-caja-misteriosa`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Quiero aplicar un nuevo producto que debería tener su sección y salir también en la tienda. El producto se llama caja misteriosa. El usuario solo puede escoger una caja básica, estándar y premium, eligiendo la talla, porque dentro va a venir una camiseta."

## Clarifications

### Session 2026-09-23

- Q: ¿Qué promete cada nivel de la caja? → A: Cada nivel promete una calidad distinta de camiseta. El cliente no elige el equipo.
- Q: ¿Qué calidad corresponde a cada nivel? → A: Básica es Fan, Estándar es Player y Premium es Retro.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir nivel y talla de la caja (Priority: P1)

Un cliente quiere una camiseta sorpresa. Entra a Caja misteriosa y ve que Básica promete Fan, Estándar promete Player y Premium promete Retro. No escoge el equipo. Elige un nivel, elige la talla y la agrega al carrito como cualquier otra compra de la tienda.

**Why this priority**: Sin esta elección no hay producto que vender. El valor es comprar una camiseta sorpresa con un nivel de caja y una talla claros.

**Independent Test**: Abrir la sección de Caja misteriosa, elegir un solo nivel y una talla disponible, agregar al carrito y ver en el carrito el nombre de la caja, el nivel, la calidad prometida, la talla y el precio.

**Acceptance Scenarios**:

1. **Given** la caja está publicada, **When** el cliente abre su sección, **Then** ve el nombre Caja misteriosa y exactamente tres opciones: Básica promete Fan, Estándar promete Player y Premium promete Retro.
2. **Given** el cliente está en esa sección, **When** intenta armar la compra, **Then** solo puede elegir uno de esos tres niveles y una talla; no puede elegir equipo, temporada, jugador ni personalización.
3. **Given** el cliente eligió nivel y talla disponible, **When** agrega la caja al carrito, **Then** el carrito muestra Caja misteriosa, el nivel, la calidad prometida, la talla y el precio de ese nivel.
4. **Given** el cliente no eligió talla o no eligió nivel, **When** intenta agregar al carrito, **Then** la tienda le pide lo que falta y no agrega una línea incompleta.

---

### User Story 2 - Encontrar la caja en la tienda y en su sección (Priority: P2)

Un cliente que recorre la tienda, o que busca desde la navegación, encuentra Caja misteriosa sin tener que adivinar la dirección. La sección propia explica el producto; el listado de la tienda también lo muestra y lleva a esa misma sección.

**Why this priority**: El producto solo se vende si se puede descubrir. La sección explica la sorpresa; la tienda lo pone junto al resto del catálogo.

**Independent Test**: Desde la navegación pública abrir la sección de Caja misteriosa. En el listado de la tienda encontrar la misma caja y comprobar que abre la misma sección. Buscar "caja misteriosa" y llegar al mismo lugar.

**Acceptance Scenarios**:

1. **Given** un cliente en la tienda pública, **When** usa la navegación, **Then** encuentra una entrada propia de Caja misteriosa que abre su sección.
2. **Given** un cliente en el listado de productos, **When** recorre o filtra el catálogo, **Then** la caja aparece como un producto comprable y abre su sección.
3. **Given** un cliente busca "caja misteriosa", **When** hay resultados, **Then** la caja aparece y lleva a su sección.
4. **Given** la caja no está publicada o no tiene ningún nivel disponible, **When** el cliente abre la tienda, **Then** no se ofrece como compra disponible.

---

### User Story 3 - Completar la compra de la caja (Priority: P3)

El cliente paga la caja con el mismo camino de compra de la tienda. El pedido guarda que compró una caja de un nivel y una talla, no un equipo concreto, porque el equipo sigue siendo sorpresa al momento de pagar.

**Why this priority**: La elección ya tiene valor en el carrito. Esta historia cierra el cobro y deja constancia de lo que se prometió.

**Independent Test**: Llevar una caja con nivel y talla hasta el pago y confirmar que el resumen y el pedido dicen Caja misteriosa, el nivel, la calidad prometida, la talla y el precio, sin nombrar un equipo.

**Acceptance Scenarios**:

1. **Given** el carrito tiene una caja, **When** el cliente revisa el resumen antes de pagar, **Then** ve nivel, calidad prometida, talla y precio, y entiende que el equipo es sorpresa.
2. **Given** el pago se completa, **When** el cliente ve la confirmación, **Then** el pedido conserva Caja misteriosa, el nivel, la calidad prometida y la talla.
3. **Given** el nivel o la talla ya no están disponibles al pagar, **When** el cliente intenta confirmar, **Then** la tienda no cobra esa línea y explica que debe elegir otra opción disponible.

---

### Edge Cases

- Si una talla de un nivel no tiene disponibilidad, esa talla no se puede agregar. Los otros niveles y tallas siguen pudiendo comprarse.
- Si los tres niveles están agotados, la sección explica que no hay cajas disponibles y no permite agregar al carrito.
- Cambiar de Básica a Premium actualiza el precio y cambia la calidad prometida de Fan a Retro antes de agregar. El carrito no mezcla el precio ni la calidad de un nivel con el nombre de otro.
- Dos cajas del mismo nivel y la misma talla suman cantidad en una sola línea. Otro nivel, u otra talla, es otra línea.
- La caja no ofrece nombre, número ni jugador. Esos controles de una camiseta normal no aparecen en esta sección.
- El cliente no ve el equipo, la temporada ni el diseño antes de pagar. El pedido tampoco los inventa.
- La guía de tallas de la tienda sigue disponible, porque la prenda que llega depende de la talla elegida.
- El panel de administración no se rediseña. Solo debe poder publicar y mantener esta caja con sus tres niveles, tallas, precios y disponibilidad.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La tienda MUST ofrecer un producto público llamado Caja misteriosa.
- **FR-002**: Caja misteriosa MUST tener una sección propia, enlazada desde la navegación de la tienda.
- **FR-003**: Caja misteriosa MUST aparecer también en el listado de la tienda y en la búsqueda pública, y esos accesos MUST abrir la misma sección.
- **FR-004**: La sección MUST explicar que cada caja incluye una camiseta y que el cliente no elige el equipo ni el diseño.
- **FR-005**: El cliente MUST poder elegir solo uno de estos niveles, con esta calidad fija: Básica promete Fan, Estándar promete Player y Premium promete Retro.
- **FR-006**: El cliente MUST elegir una talla para la camiseta que viene dentro, entre las tallas que la tienda publique para esa caja.
- **FR-007**: La sección MUST mostrar la calidad prometida por cada nivel y MUST NOT pedir equipo, temporada, jugador, nombre o número.
- **FR-008**: Cada nivel MUST tener su propio precio, visible antes de agregar al carrito.
- **FR-009**: Agregar al carrito MUST exigir nivel y talla, y la línea MUST mostrar Caja misteriosa, el nivel, la calidad prometida, la talla y el precio de ese nivel.
- **FR-010**: El checkout y el pedido MUST conservar nivel, calidad prometida y talla, y MUST NOT presentar un equipo como si el cliente lo hubiera elegido. La camiseta que se entrega MUST corresponder a esa calidad.
- **FR-011**: Un nivel o una talla sin disponibilidad MUST NOT poder agregarse ni cobrarse.
- **FR-012**: Quien administra el catálogo MUST poder publicar, ocultar y actualizar los tres niveles, sus precios, sus tallas y su disponibilidad, sin crear un segundo tipo de producto con otro nombre.

### Key Entities

- **Caja misteriosa**: El producto público. Se encuentra en su sección y en la tienda. Promete una camiseta de la talla elegida. El equipo es sorpresa; la calidad no lo es.
- **Nivel**: Básica promete Fan, Estándar promete Player y Premium promete Retro. Cada uno tiene precio y disponibilidad propios. El cliente elige solo uno por línea.
- **Talla**: La talla de la camiseta que viene dentro. La elige el cliente entre las tallas ofrecidas para esa caja.
- **Línea de compra**: La caja, un nivel, su calidad prometida, una talla y una cantidad. No incluye equipo ni personalización.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cliente nuevo identifica Básica como Fan, Estándar como Player y Premium como Retro, y elige nivel y talla en menos de un minuto desde que abre la sección.
- **SC-002**: En una revisión de la sección, el listado y la búsqueda, los tres caminos abren la misma Caja misteriosa.
- **SC-003**: El 100% de las líneas de caja que llegan al pedido incluyen nivel, calidad prometida y talla, y ninguna incluye un equipo elegido por el cliente.
- **SC-004**: Una talla agotada de un nivel no puede agregarse; una prueba con otro nivel o talla disponible sí puede agregarse.

## Assumptions

- Básica, Estándar y Premium son los únicos niveles. Su calidad queda fija: Fan, Player y Retro. No hay un cuarto nivel ni una caja por equipo.
- El precio de cada nivel lo define la tienda en pesos, con las mismas reglas de precio que el resto del catálogo. Esta spec no fija montos.
- Las tallas son las que la tienda ya usa para camisetas y estén publicadas para esta caja.
- Fan, Player y Retro son las calidades de camiseta que la tienda ya ofrece. La prenda empacada debe ser de esa calidad y de la talla elegida.
- El equipo, la temporada y el diseño siguen siendo sorpresa y no se muestran antes del pago.
- La caja usa el carrito, el pago y la confirmación que ya tiene la tienda. No abre un checkout distinto.
- No incluye personalización. La guía de tallas existente sirve para elegir la talla.
- La disponibilidad se controla por nivel y por talla. El cliente no elige la camiseta concreta. Quien empaca debe respetar la talla y la calidad prometida por el nivel.
- La sección propia es una página de la tienda pública, además de la ficha que se ve en el listado. No reemplaza las secciones de ligas ni de equipos.
- Si la caja no está publicada, desaparece de la navegación, del listado y de la búsqueda.
