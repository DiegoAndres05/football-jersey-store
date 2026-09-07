# Feature Specification: Menú de navegación en navbar desktop

**Feature Branch**: `013-menu-navbar-desktop`

**Created**: 2026-09-06

**Status**: Ready for planning

**Input**: User description: "me gustaría que en desktop tenga un menú en el navbar, así parecido al que ya sale en desktop". Aclaración: el control debe ser un botón con tres líneas horizontales apiladas y su contenido debe incluir Vistos recientes y Favoritos.

## Contexto observado

La tienda ya muestra en desktop (a partir de `lg`) enlaces horizontales en el navbar: Inicio, Tienda, Ligas, Sobre nosotros y Contacto. En tamaños menores, el mismo header muestra un botón “Menú” que abre un panel lateral. En desktop se añadirá un botón independiente con icono de tres líneas horizontales apiladas, conservando los enlaces horizontales existentes. Al activarlo, abrirá un menú desplegable tipo popover anclado debajo del botón, con las opciones Vistos recientes y Favoritos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceder a la navegación principal desde desktop (Priority: P1)

Como comprador en desktop, quiero encontrar y abrir el menú de navegación desde el navbar para acceder rápidamente a las secciones públicas de la tienda sin tener que adivinar dónde están.

**Why this priority**: Añade acceso directo a listas personales desde el navbar sin quitar la navegación pública existente.

**Independent Test**: En un viewport desktop, localizar el control o enlaces definidos para el navbar, activar la navegación y comprobar que se puede llegar a Inicio, Tienda, Ligas, Sobre nosotros y Contacto.

**Acceptance Scenarios**:

1. **Given** la tienda abierta en desktop, **When** la persona mira el navbar, **Then** la navegación principal o el control de menú se identifica claramente y conserva el estilo visual del header existente.
2. **Given** la tienda abierta en desktop, **When** la persona activa el botón de tres líneas, **Then** se abre un menú visible que contiene Vistos recientes y Favoritos.
3. **Given** que la persona usa teclado, **When** enfoca y activa el botón o una opción, **Then** puede abrir, recorrer y cerrar el menú sin perder el foco ni quedar atrapada.

---

### User Story 2 - Conservar las acciones actuales del navbar (Priority: P2)

Como comprador, quiero seguir usando búsqueda, cuenta, favoritos, vistos recientemente, carrito y selector de moneda mientras navego en desktop, para que el nuevo menú no quite acciones existentes.

**Why this priority**: El cambio debe mejorar el acceso a la navegación sin degradar tareas de compra ya disponibles.

**Independent Test**: En desktop, verificar cada acción existente antes y después de abrir/cerrar la navegación, incluyendo carrito y sus indicadores.

**Acceptance Scenarios**:

1. **Given** el navbar desktop con la navegación abierta o cerrada, **When** la persona usa búsqueda, cuenta, favoritos, vistos recientemente o carrito, **Then** cada acción conserva su destino y estado actual.
2. **Given** el selector de moneda visible en el tamaño correspondiente, **When** la persona cambia la moneda, **Then** la acción conserva su comportamiento actual y el menú no tapa ni altera el selector de forma inesperada.

---

### User Story 3 - Mantener paridad responsive (Priority: P3)

Como comprador que cambia el tamaño de la ventana, quiero que la navegación siga siendo utilizable y coherente entre desktop y tamaños menores, sin mostrar dos menús superpuestos.

**Why this priority**: El header ya tiene comportamientos distintos por breakpoint; el nuevo menú no debe crear estados contradictorios.

**Independent Test**: Redimensionar entre un viewport menor a `lg` y uno desktop, abrir/cerrar la navegación en cada estado y comprobar que solo aparece el patrón correspondiente.

**Acceptance Scenarios**:

1. **Given** el menú lateral móvil abierto, **When** el viewport pasa a desktop, **Then** no quedan panel, overlay ni bloqueo de scroll propios del estado móvil.
2. **Given** la navegación desktop abierta, **When** el viewport pasa a un tamaño menor a `lg`, **Then** la navegación móvil conserva su comportamiento actual y no queda un menú desktop superpuesto.

## Edge Cases

- El navbar debe seguir siendo usable en anchos desktop estrechos, sin solapar marca, navegación, búsqueda, moneda, acciones ni carrito.
- Un menú abierto debe cerrarse al seleccionar una opción, al usar el cierre explícito, al pulsar fuera o `Escape`.
- Las rutas inexistentes o errores de navegación deben conservar el manejo actual de la aplicación.
- El estado activo debe funcionar tanto en rutas exactas como en subrutas de Tienda y Ligas.
- El cambio no debe modificar el menú del panel administrativo.
- El menú no debe ocultar indicadores de favoritos o carrito ni impedir acceder a checkout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En desktop, el navbar MUST ofrecer una navegación pública accesible para Inicio, Tienda, Ligas, Sobre nosotros y Contacto.
- **FR-002**: En desktop, el navbar MUST mostrar un botón independiente con un icono reconocible de tres líneas horizontales apiladas, sin reemplazar los enlaces horizontales existentes.
- **FR-003**: Al activar el botón de menú desktop, MUST mostrarse un menú que contenga las opciones Vistos recientes y Favoritos, cada una con su destino público existente.
- **FR-003a**: El menú desktop MUST aparecer como un popover anclado debajo del botón hamburguesa, manteniendo visibles los enlaces horizontales principales.
- **FR-004**: La navegación MUST conservar el marcado de sección activa para la ruta actual y sus subrutas relevantes.
- **FR-005**: Cada destino de navegación MUST llevar a la ruta pública existente correspondiente y MUST conservar sus parámetros o filtros cuando el destino los incluya.
- **FR-006**: La navegación MUST poder operarse con teclado y tecnologías de asistencia, con nombre accesible, foco visible, orden lógico y cierre predecible.
- **FR-007**: Abrir o cerrar la navegación MUST NOT bloquear ni cambiar el comportamiento de búsqueda, cuenta, carrito o selector de moneda; las opciones Favoritos y Vistos recientes deben seguir siendo accesibles desde el menú.
- **FR-008**: En tamaños menores a desktop, MUST conservarse el panel lateral móvil existente.
- **FR-009**: El cambio MUST NOT alterar el catálogo, productos, carrito, checkout, autenticación, admin ni contenido de las páginas enlazadas.
- **FR-010**: El estilo del botón y menú MUST ser coherente con el navbar actual: iconografía, tipografía, estados activos, bordes, espaciado y contraste.

### Key Entities

- **Navbar público**: cabecera persistente de la tienda con marca, navegación, búsqueda y acciones de compra.
- **Navegación principal**: conjunto de destinos públicos actualmente definido por Inicio, Tienda, Ligas, Sobre nosotros y Contacto.
- **Estado de navegación**: cerrado, abierto, sección activa y foco actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de las rutas públicas probadas, la persona puede identificar y usar la navegación desktop sin buscar controles ocultos durante más de 5 segundos.
- **SC-002**: En una pasada de aceptación, el 100% de los cinco destinos principales abre la ruta correcta y marca la sección activa correcta.
- **SC-003**: El 100% de las acciones actuales del navbar (búsqueda, cuenta, favoritos, vistos recientemente, carrito y moneda) conserva su destino y comportamiento en una regresión desktop.
- **SC-004**: En una pasada de teclado y lector de pantalla, el 100% de los controles de navegación tiene nombre accesible, foco visible y una forma clara de cierre.
- **SC-005**: En 10 cambios de ancho entre móvil y desktop, 10/10 terminan con un único patrón de navegación visible y sin overlay o bloqueo de scroll residual.
- **SC-006**: Al menos el 90% de las personas de prueba identifica cómo abrir o usar la navegación desktop en el primer intento.

## Assumptions

- La solicitud se refiere a la tienda pública, no al navbar del panel administrativo.
- Las rutas y etiquetas actuales de `NavLinks` son la fuente de verdad inicial; no se inventan nuevas categorías hasta que el usuario las pida.
- “Desktop” corresponde al breakpoint actual de la tienda (`lg`, aproximadamente 1024 px), salvo que el diseño aprobado indique otro.
- El diseño debe reutilizar la apariencia y comportamiento accesible del menú móvil existente, adaptándolo al botón hamburguesa desktop.
- No se cambia la lógica de carrito, favoritos, búsqueda, moneda ni checkout.

## Out of Scope

- Crear categorías, filtros o páginas nuevas de catálogo.
- Rediseñar completamente el header, el branding o el footer.
- Cambiar la navegación del panel admin.
- Modificar rutas, permisos, autenticación o persistencia.
- Cambiar el patrón de navegación móvil existente.
