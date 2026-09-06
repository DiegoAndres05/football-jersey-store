# Feature Specification: Carrusel de camisetas destacadas en el inicio

**Feature Branch**: `008-carrusel-camisetas-inicio`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: crear un carrusel de fotos de las mejores camisetas en la página de inicio, a partir de un componente de referencia tipo coverflow 3D (platos de restaurante, inglés, fotos externas, “View Menu”).

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde va el carrusel en el inicio? → A: Sección nueva; se mantiene la grilla “Las más buscadas”. No reemplaza el hero ni esa grilla.
- Q: ¿En qué hueco del inicio va la sección nueva? → A: Después de la barra de confianza y antes de “Las grandes ligas”.
- Q: ¿Cuántas camisetas entran en el carrusel? → A: Hasta 5 destacadas con foto.
- Q: ¿Qué pasa con 0 o 1 destacada con foto? → A: Ocultar el carrusel si hay menos de 2; el resto del inicio se mantiene.
- Q: ¿El overlay muestra precio? → A: No. Solo foto, nombre y acción a la ficha; el precio sigue en la grilla y en la ficha.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recorrer las mejores camisetas al llegar al inicio (Priority: P1)

Como visitante de la tienda, quiero ver en la página de inicio un carrusel de fotos de las camisetas destacadas, con una al frente y las vecinas a los lados, para inspirarme y pasar de una a otra sin entrar aún al catálogo completo.

**Why this priority**: Es el valor del componente de referencia (escenario de fotos en profundidad). Sin esto, copiar un demo de restaurante no mejora el inicio de Flashsport.

**Independent Test**: Abrir el inicio con al menos tres camisetas destacadas que tengan foto de catálogo; comprobar que el carrusel muestra hasta cinco de esas camisetas (nombre de equipo/producto, no platos), se puede avanzar y retroceder, y la acción principal lleva a la ficha de esa camiseta.

**Acceptance Scenarios**:

1. **Given** hay camisetas destacadas activas con imagen de catálogo, **When** una persona abre la página de inicio, **Then** ve el carrusel **después de la barra de confianza y antes de las ligas**, además de “Las más buscadas” más abajo, y **no** un menú de restaurante (Butter Chicken, Paneer Tikka, “View Menu”, “BEST SELLERS” en inglés ni fotos de comida).
2. **Given** el carrusel visible, **When** avanza o retrocede (flechas, puntos, o gesto de deslizar en teléfono), **Then** otra camiseta pasa al frente con una transición breve y el resto se reacomoda a los lados.
3. **Given** una camiseta al frente, **When** pulsa la acción de verla, **Then** llega a la ficha de **esa** camiseta en el catálogo existente, no a un enlace vacío ni a un menú de muestra.
4. **Given** el avance automático activo, **When** deja el carrusel sin usarlo, **Then** las diapositivas cambian solas a un ritmo pausado; si pone el cursor encima o lo usa, el avance automático no le pelea el control.

---

### User Story 2 - Usar el carrusel en teléfono sin perder el inicio (Priority: P2)

Como visitante en un teléfono, quiero recorrer las fotos de camisetas sin que el carrusel tape la marca, los botones de comprar o el resto del inicio, para poder inspirarme y seguir navegando.

**Why this priority**: El patrón de referencia es de escritorio (tarjetas laterales anchas). Sin adaptación, el inicio empeora en el tráfico móvil habitual.

**Independent Test**: Abrir el inicio en ~375 px y en ~1280 px; en ambos se ve al menos la camiseta del frente, se puede pasar de foto y llegar a la ficha; en teléfono nada recorta de forma permanente “Comprar ahora” ni el resto de secciones.

**Acceptance Scenarios**:

1. **Given** un viewport de escritorio, **When** mira el carrusel, **Then** percibe profundidad (camiseta central más grande o al frente, vecinas a los lados) sin tapar de forma permanente la navegación de la tienda.
2. **Given** un viewport de teléfono, **When** recorre el carrusel, **Then** ve con claridad la camiseta del frente, puede deslizar o usar controles, y el resto del inicio (marca, comprar, ligas, **Las más buscadas**) sigue accesible. No hace falta ver cinco tarjetas a la vez.

---

### User Story 3 - Confiar en que son camisetas de esta tienda (Priority: P3)

Como visitante, quiero que nombres, fotos y destino coincidan con el catálogo, para no sentir que el inicio es un anuncio genérico o un demo pegado.

**Why this priority**: El demo de referencia trae platos, textos en inglés y fotos de un CDN ajeno. En esta tienda el valor es mostrar **el** catálogo destacado.

**Independent Test**: Cada diapositiva del carrusel corresponde a una camiseta destacada real; el título y la foto coinciden con su ficha; no hay URLs de comida ni copy de restaurante.

**Acceptance Scenarios**:

1. **Given** una diapositiva del carrusel, **When** compara con la ficha de esa camiseta, **Then** el nombre (o equipo + versión) y la foto son los del catálogo, no un título inventado de menú, y **no** muestra precio en el carrusel.
2. **Given** una camiseta destacada sin foto usable, **When** se arma el carrusel, **Then** esa pieza no se rellena con una foto de stock de comida ni de Unsplash ajena al catálogo.

---

### Edge Cases

- Si hay **menos de dos** camisetas destacadas con foto usable, el carrusel **no se muestra**. El inicio conserva hero, barra de confianza, ligas y “Las más buscadas”. MUST NOT caer al demo de restaurante ni fingir un coverflow vacío.
- Fotos lentas o rotas: se reserva el hueco; no se sustituyen por las URLs del demo de comida.
- Preferencia de movimiento reducido: el avance automático no debe forzar animaciones; seguir debe ser posible con flechas o puntos.
- El carrusel no sustituye el checkout, el carrito ni el panel de administración.
- Pulsar una tarjeta lateral (no la del frente) puede traerla al frente; no debe llevar a otra tienda ni a “#”.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en la **página de inicio pública** un carrusel de fotos de camisetas de fútbol del catálogo de esta tienda. MUST NOT añadir una ruta de demostración con platos, “View Menu” o productos ajenos.
- **FR-002**: Cada diapositiva MUST representar una camiseta real (foto de catálogo, nombre reconocible). MUST NOT usar como contenido permanente las fotos ni los textos del componente de restaurante de referencia.
- **FR-003**: El visitante MUST poder avanzar, retroceder y saltar a una diapositiva concreta. En la pieza del frente MUST existir una acción en español que abre la ficha de esa camiseta.
- **FR-004**: El conjunto de camisetas del carrusel MUST ser las ya marcadas como destacadas en el catálogo, **solo las que tengan imagen usable**, con un **máximo de 5** diapositivas. El carrusel MUST ocultarse si hay **menos de 2** de esas piezas. “Las más buscadas” MAY seguir mostrando hasta 4. MUST NOT inventar un segundo ranking de ventas en esta entrega.
- **FR-005**: El sistema MUST añadir el carrusel como **sección nueva** en la página de inicio, **después de la barra de confianza** (envíos, pagos, calidad, atención) y **antes de “Las grandes ligas”**. MUST NOT reemplazar el hero (“Viste tu pasión” + foto) ni la grilla “Las más buscadas”. Esa grilla MUST seguir mostrando destacados como hoy.
- **FR-006**: Los textos visibles de esta pieza MUST estar en español, coherentes con el resto de la tienda (p. ej. “Destacadas”, “Ver camiseta”), no “BEST SELLERS” / “View Menu”.
- **FR-007**: El sistema MUST NOT depender de un catálogo de imágenes externas de muestra como fuente de las camisetas. Las fotos MUST ser las del almacenamiento de producto ya usado por la tienda.
- **FR-008**: Con varias diapositivas, el sistema MAY avanzar solo; MUST pausar ese avance cuando la persona interactúa o cuando ha pedido menos movimiento. MUST NOT impedir usar flechas, puntos o la ficha.
- **FR-009**: En viewport estrecho el carrusel MUST seguir usable (frente claro + paso de foto). MUST NOT exigir el mismo número de tarjetas laterales que en escritorio.
- **FR-010**: El sistema MUST NOT sustituir el sistema de botones ni la identidad visual global de la tienda por la paleta oscura y dorada del demo de restaurante como tema de toda la página. El carrusel MAY tener un escenario propio, pero el resto del inicio (marca “Viste tu pasión”, comprar, ligas) MUST seguir siendo el de la tienda.
- **FR-011**: Las diapositivas MUST NOT mostrar precio. El visitante ve foto, título y la acción a la ficha; el importe permanece en “Las más buscadas” y en la ficha, con el formato de moneda de la tienda.

### Key Entities

- **Camiseta destacada**: producto activo del catálogo marcado como destacado, con al menos una imagen usable, nombre, y destino a su ficha pública.
- **Diapositiva del carrusel**: una de como máximo cinco camisetas destacadas con foto, presentada en el escenario (frente o lado) con título y acción hacia la ficha, **sin importe**.
- **Página de inicio**: orden público: hero → barra de confianza → **carrusel de destacadas** → grandes ligas → más buscadas → contacto. El carrusel no sustituye bloques existentes ni vive en un playground.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de aceptación con ≥ 3 camisetas destacadas con foto, el 100% de las diapositivas del carrusel corresponden a esas camisetas, hay **como máximo 5**, **ninguna muestra precio**, y no hay platos ni copy en inglés de restaurante.
- **SC-002**: El 100% de las acciones “ver camiseta” (o equivalente) desde la pieza del frente abren la ficha correcta de esa camiseta.
- **SC-003**: En ~375 px y ~1280 px, el 100% de las pruebas de avanzar/retroceder y de abrir ficha son posibles sin recorte permanente de la navegación, de “Comprar ahora” o de “Las más buscadas”.
- **SC-004**: Al menos el 90% de las personas de prueba identifica en menos de 10 segundos que el carrusel muestra camisetas de fútbol de esta tienda, no un menú de comida.
- **SC-005**: Si hay **menos de 2** camisetas destacadas con foto, el 100% de las visitas al inicio **no ven el carrusel**, ni el demo de restaurante, ni un bloque vacío fingido; el resto del inicio sí se ve.

## Assumptions

- El componente de referencia (coverflow 3D, autoplay, flechas, puntos, deslizamiento) es **inspiración de interacción**, no un catálogo de comida ni un playground en inglés.
- La tienda ya tiene TypeScript, estilos utilitarios y controles reutilizables; no hace falta un setup de interfaz desde cero ni copiar el demo a una carpeta genérica de “ui” como si fuera un segundo sitio.
- “Las mejores camisetas” en esta entrega son las ya marcadas como destacadas en administración, **hasta 5 con foto** en el carrusel; no un recuento nuevo de pedidos.
- La acción de cada pieza va a la ficha pública existente (`/productos/…`), no al carrito ni a un checkout paralelo.
- El carrusel **no muestra precios**; el importe se ve en “Las más buscadas” y en la ficha.
- Iconos: se reutilizan los de la tienda (flechas ya usadas en el resto del sitio), no hace falta un juego de SVG inline de restaurante.
- OpenCode ejecutará la implementación tras plan/tareas; Cursor no pega el TSX del demo en `/components/ui`.
- El carrusel es un bloque **adicional** entre la barra de confianza y “Las grandes ligas”; “Las más buscadas” no se elimina.

## Out of Scope

- Pegar el demo autónomo (Butter Chicken, Tandoori Chops, Unsplash/CDN de comida, “View Menu”).
- Crear `/demo` o una ruta de playground solo para el coverflow.
- Sustituir toda la página de inicio por un fondo `#0c0a09` de restaurante.
- Reemplazar el hero o eliminar “Las más buscadas”.
- Nuevo ranking por ventas, nueva entidad de “slide” en administración, o editor de carrusel aparte (se reutiliza destacado).
- Mini-carrito, checkout, añadir al carrito **o precios** desde el carrusel (salvo que se priorice después).
- Instalar un proyecto de interfaz desde cero.
