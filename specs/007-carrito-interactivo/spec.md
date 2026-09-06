# Feature Specification: Carrito interactivo en el flujo de compra

**Feature Branch**: `007-carrito-interactivo`

**Created**: 2026-09-06

**Status**: Implemented (OpenCode; Cursor review 2026-09-06)

**Input**: User description: integrar un componente de checkout interactivo (listado + panel de carrito con cantidades, total en vivo y animaciones) en un proyecto con estructura tipo shadcn, Tailwind y TypeScript.

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde vive el patrón del componente de referencia? → A: Solo la página de carrito de compra: listado + resumen vivo, mismas líneas, stock y moneda que hoy. Sin ruta de demostración.
- Q: ¿Qué hace “−” cuando la cantidad ya es 1? → A: En cantidad 1, “−” está deshabilitado. Quitar la línea es una acción aparte (quitar / papelera).
- Q: En teléfono, ¿dónde va el resumen (total + pagar)? → A: Listado arriba y resumen debajo, en columna. En escritorio el resumen sigue visible al hacer scroll.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Revisar y ajustar el carrito con un panel vivo (Priority: P1)

Como comprador, quiero ver mis camisetas a un lado y un resumen fijo del carrito al otro, con cantidades que suben o bajan al instante y un total que se actualiza a la vista, para decidir si pago sin sentir que la página “se recarga” o que el resumen está desconectado de las líneas.

**Why this priority**: Es el valor del componente de referencia (listado + panel pegajoso + total). Sin esto, copiar un demo aparte no mejora la compra real.

**Independent Test**: Con al menos dos camisetas en el carrito, abrir la página de carrito, cambiar cantidades (respetando el tope de entrega inmediata), quitar una línea y comprobar que el recuento, el total y el panel se actualizan de inmediato, en la moneda visible, y que “Ir a pagar” lleva al checkout existente.

**Acceptance Scenarios**:

1. **Given** un carrito con una o más camisetas reales (nombre, foto, talla, modalidad, precio), **When** la persona abre el carrito, **Then** ve las líneas y un resumen persistente (panel o bloque equivalente) con número de artículos y total, sin un catálogo de ejemplo (zapatillas u otros productos ajenos a la tienda).
2. **Given** una línea visible, **When** aumenta o disminuye la cantidad con los controles, **Then** la cantidad, el subtotal de esa línea y el total del resumen cambian de inmediato, con una transición breve y perceptible, y el tope de entrega inmediata vigente se respeta (no se puede pasar del stock inmediato; el “+” no inventa unidades). Si la cantidad es 1, disminuir está deshabilitado.
3. **Given** una línea en el carrito, **When** la quita con la acción explícita de quitar (no con “−”), **Then** desaparece con una transición breve, el recuento y el total bajan, y si era la última el carrito muestra el vacío ya existente (invitar al catálogo).
4. **Given** el resumen con artículos, **When** pulsa pagar / checkout, **Then** continúa el flujo de pago de invitado ya definido; no se abre un cobro paralelo ni un carrito distinto.
5. **Given** COP o USD como moneda visible, **When** mira precios y total, **Then** el formato coincide con el resto de la tienda (no un “$129.99” de catálogo demo) y cambiar moneda no altera cantidades ni tallas.

---

### User Story 2 - Entender el carrito en móvil sin perder el resumen (Priority: P2)

Como comprador en un teléfono, quiero que el listado y el resumen no queden en una fila estrecha ilegible, para poder ajustar cantidades y ver el total sin desplazarme a ciegas.

**Why this priority**: El patrón de dos columnas del componente de referencia es de escritorio; sin adaptación, el carrito empeora en el tráfico móvil habitual de la tienda.

**Independent Test**: Abrir el carrito con artículos en un ancho típico de teléfono y en uno de escritorio; en móvil el listado va primero y el resumen debajo; en escritorio el resumen permanece visible al hacer scroll del listado.

**Acceptance Scenarios**:

1. **Given** un viewport de escritorio con varias líneas, **When** hace scroll en el listado, **Then** el resumen permanece a la vista (pegajoso o equivalente) sin tapar los controles de cantidad.
2. **Given** un viewport de teléfono, **When** revisa el carrito, **Then** ve primero las líneas y, al bajar, el resumen con total y pagar; puede cambiar cantidades y pulsar pagar sin recortar textos ni botones. No hay barra fija de pago tapando el listado.

---

### User Story 3 - Recibir feedback al añadir desde la ficha sin un segundo carrito (Priority: P3)

Como comprador en la ficha, quiero que al agregar una camiseta el recuento del carrito (cabecera o destino del carrito) refleje el cambio, para confiar en que usé la misma bolsa de compra y no una demo aparte.

**Why this priority**: El demo de referencia incluye “Add” a un carrito local. En esta tienda el añadir ya existe; lo valioso es que la experiencia interactiva del carrito use esa misma bolsa, no duplicarla.

**Independent Test**: Añadir desde una ficha, abrir el carrito: la misma línea, cantidad y reglas de stock; el recuento de cabecera coincide.

**Acceptance Scenarios**:

1. **Given** una ficha con una variante añadible, **When** agrega al carrito y va al carrito, **Then** ve esa línea en el panel interactivo, no un listado de productos de muestra.
2. **Given** el tope inmediato ya alcanzado, **When** intenta añadir otra unidad inmediata, **Then** el comportamiento de aviso y no incremento de la feature de stock se mantiene.

---

### Edge Cases

- Carrito vacío: no se muestra un panel de total en cero como si hubiera compra en curso; se conserva el vacío actual hacia el catálogo.
- Entrega inmediata vs bajo encargo: el panel muestra la modalidad; el tope de stock solo aplica a inmediata, como hoy.
- Varias líneas de la misma variante (p. ej. con y sin personalización) siguen siendo líneas distintas y comparten el tope inmediato.
- Quitar cantidad a 1 y pulsar “−”: el control está deshabilitado; la línea no se elimina. Quitar es una acción explícita (quitar / papelera). No se deja cantidad 0.
- Imágenes ausentes o lentas: se reserva el hueco; no se usan fotos de zapatillas ni URLs de un demo externo como contenido de la tienda.
- Preferencia de movimiento reducido del sistema: las transiciones no deben impedir usar cantidades, quitar o pagar.
- El panel de administración y el selector de moneda de cabecera no forman parte de este rediseño.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST presentar el carrito de compra real de la tienda (camisetas, tallas, personalización, modalidad, importes) en la página de carrito del comprador, con un listado de líneas y un resumen persistente de recuento y total. MUST NOT añadir una ruta de demostración con productos de muestra.
- **FR-002**: El sistema MUST permitir aumentar, disminuir y quitar líneas desde esa vista, con feedback visual breve al aparecer, cambiar o desaparecer una línea, y al actualizar el total.
- **FR-003**: El sistema MUST usar la misma bolsa de compra que ficha, cabecera y checkout. MUST NOT introducir un carrito de demostración con productos ajenos ni un estado de compra paralelo.
- **FR-004**: El sistema MUST conservar las reglas vigentes de tope de entrega inmediata, bajo encargo, moneda visible (COP/USD) e importes enteros en pesos como base interna.
- **FR-005**: El sistema MUST dirigir la acción de pagar al checkout de invitado existente, sin un flujo de cobro nuevo en el panel.
- **FR-006**: El sistema MUST mostrar textos de esta vista en español (añadir, carrito, total, pagar), coherentes con el resto de la tienda.
- **FR-007**: El sistema MUST mostrar en escritorio el resumen visible al desplazarse el listado. En teléfono MUST apilar listado primero y resumen debajo (total y pagar al final del desplazamiento). MUST NOT usar una barra fija de pago que tape las líneas en teléfono.
- **FR-008**: El sistema MUST reutilizar los controles visuales ya establecidos de la tienda para acciones primarias (no sustituir el sistema de botones existente por una variante incompatible).
- **FR-009**: El sistema MUST conservar envío gratis / umbral y el resto de mensajes de resumen que el carrito ya muestra, actualizándolos cuando cambie el subtotal.
- **FR-010**: El sistema MUST NOT usar aritmética de punto flotante para precios o totales de pedido.
- **FR-011**: Cuando una línea tiene cantidad 1, el sistema MUST deshabilitar disminuir cantidad. MUST NOT eliminar esa línea al pulsar disminuir. Quitar la línea MUST ser una acción explícita distinta.

### Key Entities

- **Línea de carrito**: camiseta concreta (variante, talla, personalización, modalidad, cantidad, importe unitario) de la bolsa de compra del visitante.
- **Resumen de carrito**: recuento de unidades, subtotal/total en la moneda visible y acción de continuar al pago.
- **Bolsa de compra**: única fuente de las líneas entre ficha, carrito, cabecera y checkout.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de aceptación con carrito con ≥ 2 líneas, el 100% de los cambios de cantidad (válidos) actualiza recuento y total en menos de 300 ms percibidos, sin recargar la página.
- **SC-002**: El 100% de las pruebas de tope inmediato y de moneda visible en esta vista coinciden con el comportamiento ya acordado (no más unidades inmediatas que el stock; USD no se ve como COP).
- **SC-003**: El 100% de las pruebas de “pagar” desde el resumen llegan al checkout existente con las mismas líneas, sin un segundo carrito.
- **SC-004**: En viewport de teléfono (~375 px) el listado precede al resumen y no hay barra fija de pago; en escritorio (~1280 px) el resumen permanece visible al hacer scroll. En ambos, el 100% de las acciones cantidad / quitar / pagar son posibles sin recorte de controles.
- **SC-005**: Al menos el 90% de las personas de prueba identifica el total y cómo ir a pagar en menos de 10 segundos al abrir un carrito con artículos, sin instrucciones.

## Assumptions

- El proyecto ya tiene TypeScript, estilos utilitarios y una carpeta de controles reutilizables de interfaz; no hace falta un “setup shadcn” desde cero ni un segundo sistema de botones.
- El componente de referencia (listado + panel, cantidades, total animado) es **inspiración de interacción**, no un catálogo de zapatillas ni un checkout en inglés con precios decimales de muestra.
- La integración ocurre solo en la página de carrito de compra pública y su resumen, no en una ruta de demostración aislada.
- Las fotos son las de cada línea del carrito (o el hueco ya usado); no se rellenan assets de Unsplash de zapatos.
- El checkout de invitado, el ledger y la conversión COP/USD no se rediseñan aquí.
- “Añadir” en el demo se mapea al añadir ya existente en la ficha; esta feature no sustituye la ficha por un listado de productos genéricos.

## Out of Scope

- Pegar un demo autónomo o una ruta de playground con productos Air Max / Ultra Boost u otros ajenos a Flashsport.
- Sustituir o duplicar el control de botón existente de la tienda.
- Un segundo estado de carrito solo en memoria de un componente de UI.
- Nueva pasarela de pago, mini-carrito en cabecera tipo drawer (salvo que se priorice después), o rediseño del formulario de checkout.
- Precios en punto flotante o texto de interfaz en inglés en el flujo de compra.
- Instalar o configurar un proyecto de interfaz desde cero: esta tienda ya tiene TypeScript, estilos utilitarios y controles reutilizables.
