# Feature Specification: Navbar fijo y carrito flotante móvil

**Feature Branch**: `024-navbar-carrito-flotante`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "El navbar de la tienda nunca debe desaparecer cuando se haga scroll (desktop y mobile). Además, un botón flotante del carrito cuando se le agreguen artículos, para que el usuario no tenga que estar buscando el carrito (en mobile)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La barra de la tienda sigue visible al desplazar (Priority: P1)

Un cliente recorre la tienda en el teléfono o en el computador. Baja por la portada, un listado o la ficha de una camiseta y, en todo momento, sigue viendo la barra superior con la marca, la búsqueda, el menú y el acceso al carrito.

**Why this priority**: Si la barra se va con el desplazamiento, el cliente pierde orientación y tiene que volver arriba para buscar, cambiar de sección o abrir el carrito.

**Independent Test**: Abrir la tienda pública en un ancho de escritorio y en un ancho de teléfono, desplazar hasta el final de una página larga y comprobar que la barra superior sigue visible y usable.

**Acceptance Scenarios**:

1. **Given** un cliente en la portada de la tienda en escritorio, **When** desplaza hacia abajo y hacia arriba, **Then** la barra superior permanece visible en la parte alta de la pantalla.
2. **Given** un cliente en el teléfono en el listado de productos o en la ficha de una camiseta, **When** desplaza la página, **Then** la barra superior permanece visible y sus controles siguen pudiendo usarse.
3. **Given** un cliente que abre el menú de navegación del teléfono, **When** el menú está abierto, **Then** puede cerrarlo y la barra de la tienda vuelve a estar disponible; el desplazamiento de la página no la oculta.
4. **Given** un cliente en el panel de administración, **When** desplaza una pantalla de administración, **Then** esta historia no cambia esa barra: aplica solo a la tienda pública.

---

### User Story 2 - Acceso flotante al carrito en el teléfono (Priority: P2)

Un cliente en el teléfono añade una o más camisetas. Sin volver arriba a buscar el icono del carrito, ve un botón flotante que le indica que hay artículos y lo lleva al carrito.

**Why this priority**: En el teléfono el icono de la barra es pequeño y fácil de perder de vista mientras se compara productos. El botón flotante acorta el camino a la compra, pero solo tiene sentido después de que la barra ya no se pierda al desplazar.

**Independent Test**: En un ancho de teléfono, añadir un artículo desde una ficha y comprobar que aparece el botón flotante con la cantidad; quitar todos los artículos y comprobar que desaparece. En escritorio, el mismo carrito con artículos no muestra ese botón.

**Acceptance Scenarios**:

1. **Given** el carrito está vacío en el teléfono, **When** el cliente navega la tienda, **Then** no se muestra el botón flotante del carrito.
2. **Given** el cliente añade al menos un artículo en el teléfono, **When** la página termina de reflejar el carrito, **Then** aparece un botón flotante visible sin desplazar, con la cantidad de artículos y un nombre que identifica que abre el carrito.
3. **Given** el botón flotante está visible, **When** el cliente lo activa, **Then** llega a la misma pantalla de carrito que usa el icono de la barra.
4. **Given** el carrito tiene artículos y el cliente usa un ancho de escritorio, **When** recorre la tienda, **Then** no aparece el botón flotante; el acceso al carrito sigue siendo el de la barra.
5. **Given** el cliente vacía el carrito en el teléfono, **When** ya no quedan artículos, **Then** el botón flotante desaparece.
6. **Given** el cliente está en la pantalla del carrito o en el pago, **When** el carrito tiene artículos, **Then** el botón flotante no se muestra, para no tapar las acciones de compra.

---

### Edge Cases

- Si la cantidad de artículos cambia (más unidades, quitar una línea, cupón no aplica aquí), el número del botón flotante se actualiza de inmediato y coincide con el total de unidades del carrito, no solo con el número de líneas.
- Si el cliente rota el teléfono o ensancha la ventana hasta el ancho de escritorio, el botón flotante desaparece aunque el carrito siga con artículos. Si vuelve al ancho de teléfono y el carrito sigue con artículos, el botón reaparece.
- El botón flotante no tapa el contenido principal ni los botones de compra de la ficha: queda en una esquina inferior, con margen respecto al borde y a la zona segura del teléfono.
- Al abrir el menú lateral del teléfono, el botón flotante no queda por encima del menú ni impide cerrarlo.
- Recargar la página o volver más tarde en el mismo navegador conserva el carrito ya guardado: si había artículos, el botón flotante vuelve a mostrarse en el teléfono.
- Páginas cortas, en las que casi no hay desplazamiento, mantienen la barra visible igual que las páginas largas.
- El teclado del teléfono puede reducir la zona visible; la barra sigue anclada a la parte superior de la vista de la tienda y el botón flotante no queda oculto detrás del teclado de forma permanente al cerrarlo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La barra superior de la tienda pública MUST permanecer visible en la parte alta de la pantalla durante todo el desplazamiento, en escritorio y en teléfono.
- **FR-002**: Los controles ya presentes en esa barra (marca, búsqueda, menú, carrito y el resto de accesos actuales) MUST seguir disponibles mientras la barra está fija.
- **FR-003**: El comportamiento MUST aplicar en las páginas de la tienda pública que muestran esa barra, incluidas portada, catálogo, ficha, ligas, carrito y pago.
- **FR-004**: El panel de administración MUST quedar fuera de este cambio.
- **FR-005**: En ancho de teléfono, el sistema MUST mostrar un botón flotante del carrito solo cuando el carrito tenga al menos un artículo.
- **FR-006**: En ancho de escritorio, el sistema MUST NOT mostrar ese botón flotante.
- **FR-007**: El botón flotante MUST indicar la cantidad total de unidades del carrito y MUST llevar a la pantalla de carrito existente.
- **FR-008**: El botón flotante MUST ocultarse cuando el carrito quede vacío y también mientras el cliente está en el carrito o en el pago.
- **FR-009**: El botón flotante MUST permanecer visible al desplazar una página de tienda en el teléfono, sin obligar al cliente a volver al inicio de la página.
- **FR-010**: El botón flotante MUST NOT cubrir la barra superior, el menú abierto del teléfono ni la acción principal de añadir al carrito en la ficha.
- **FR-011**: El acceso al carrito de la barra MUST seguir existiendo en teléfono y escritorio; el botón flotante es un atajo adicional, no un reemplazo.

### Key Entities

- **Carrito del cliente**: Conjunto de artículos ya elegidos en el navegador. El botón flotante depende de si hay unidades y de cuántas hay. No introduce un carrito nuevo ni otro destino de compra.
- **Barra de la tienda**: Barra superior pública con marca, búsqueda, navegación y acceso al carrito. Debe permanecer a la vista al desplazarse.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una prueba de escritorio y otra de teléfono, la barra superior sigue visible después de desplazar al menos una pantalla completa en portada, listado y ficha.
- **SC-002**: En teléfono, un cliente que añade el primer artículo ve el botón flotante sin hacer otro desplazamiento, en la misma vista.
- **SC-003**: Activar el botón flotante abre el carrito en un solo toque, el mismo destino que el icono de la barra.
- **SC-004**: En escritorio, con artículos en el carrito, el botón flotante no aparece en ninguna página de la tienda.
- **SC-005**: Al vaciar el carrito, el botón flotante deja de mostrarse antes de que el cliente cambie de página.

## Assumptions

- "Teléfono" es el ancho en el que la tienda ya presenta la navegación compacta; "escritorio" es el ancho en el que la navegación principal cabe en la barra. No se pide un botón flotante en escritorio.
- El botón flotante abre la pantalla de carrito ya existente. No abre un panel nuevo ni cambia el checkout.
- La cantidad mostrada es la suma de unidades, no el número de líneas distintas.
- El botón no se muestra en el carrito ni en el pago para no tapar finalizar compra o pagar.
- El carrito sigue guardándose en el navegador del cliente como hoy; esta feature no crea una cuenta ni sincroniza el carrito entre dispositivos.
- La identidad visual de la tienda se mantiene: el botón usa el mismo lenguaje del carrito actual (icono de bolsa y cantidad), sin una campaña visual nueva.
- Si el menú del teléfono está abierto, ese menú tiene prioridad sobre el botón flotante.
