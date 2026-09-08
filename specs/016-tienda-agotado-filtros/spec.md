# Feature Specification: Tienda — agotado visual y filtros de entrega/talla

**Feature Branch**: `016-tienda-agotado-filtros`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: cuando las camisetas estén agotadas en la tienda, la card debe verse gris (o claramente distinta de una disponible); el filtro debe permitir filtrar por entrega inmediata vs bajo pedido, y también filtrar por tallas.

## Clarifications

### Session 2026-09-07

- Q: ¿Cómo convive el filtro Modalidad con Disponibilidad (Disponible/Agotado)? → A: Option C — redefinir Disponibilidad: Agotado = no comprable; Disponible = comprable (inmediata y/o bajo pedido); Modalidad aparte.
- Q: ¿El filtro “Bajo pedido” incluye productos que también tienen stock inmediato? → A: Option A — sí, todo producto que admita bajo pedido.
- Q: ¿Las cards agotadas siguen siendo clicables? → A: Option A — sí, enlazan a la ficha.
- Q: Al filtrar solo por talla, ¿qué tallas cuentan? → A: Option A — talla comprable (stock inmediato o bajo pedido); con modalidad inmediata exige stock en esa talla.
- Q: ¿Dónde aplica el estilo agotada? → A: Option B — toda superficie con la misma card de listado de tienda; home/carruseles custom fuera.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinguir de un vistazo las camisetas agotadas (Priority: P1)

Como comprador en el catálogo de la tienda, quiero que las camisetas **agotadas** se vean claramente distintas (p. ej. card en gris/atenuada) de las que sí puedo comprar con stock, para no hacer clic pensando que están disponibles.

**Why this priority**: Evita frustración y clics inútiles; es la señal visual pedida de forma explícita.

**Independent Test**: En `/productos` (u otra grilla de tienda equivalente), una card de producto sin stock comprable inmediato ni bajo pedido se ve atenuada/gris y marcada como agotada; una con stock se ve “normal” (colores plenos).

**Acceptance Scenarios**:

1. **Given** un producto sin stock en ninguna talla y sin opción de bajo pedido, **When** el comprador ve la grilla de tienda, **Then** la card se muestra visualmente atenuada (gris u otro tratamiento inequívoco), se identifica como agotada, y **sigue siendo clicable** hacia la ficha.
2. **Given** un producto con al menos una talla con stock de entrega inmediata, **When** ve la misma grilla, **Then** la card se ve como disponible (sin el estilo de agotada) y se distingue de las agotadas sin leer el texto pequeño.
3. **Given** un producto solo disponible bajo pedido (sin stock inmediato), **When** ve la grilla, **Then** no se trata como “disponible inmediata” plena ni se confunde con “agotada total”: queda claro que se puede pedir con demora (distinto de agotada y de stock inmediato).

---

### User Story 2 - Filtrar por modalidad de entrega (Priority: P2)

Como comprador, quiero filtrar el catálogo por **entrega inmediata** y por **bajo pedido**, para ver solo lo que puedo recibir pronto o solo lo que acepta pedido con demora.

**Why this priority**: Hoy el comprador no puede acotar por modalidad; es el hueco funcional principal del filtro.

**Independent Test**: Aplicar filtro “entrega inmediata” → solo productos con al menos una variante comprable inmediata; aplicar “bajo pedido” → solo productos que ofrezcan bajo pedido; quitar el filtro → vuelve el listado sin esa restricción.

**Acceptance Scenarios**:

1. **Given** el catálogo con productos de stock inmediato y de solo bajo pedido, **When** el comprador elige filtro de entrega inmediata, **Then** el listado muestra solo productos con al menos una opción de entrega inmediata.
2. **Given** el mismo catálogo, **When** elige filtro de bajo pedido, **Then** el listado muestra productos que admiten bajo pedido, **incluyendo** los que también tienen stock inmediato.
3. **Given** un producto con stock inmediato y bajo pedido, **When** filtra solo entrega inmediata, **Then** el producto **sí** aparece (tiene opción inmediata).
4. **Given** filtros de liga/equipo u otros ya existentes, **When** combina modalidad con ellos, **Then** el resultado respeta **todas** las restricciones activas a la vez (intersección).
5. **Given** el filtro Disponibilidad = Agotado, **When** aplica, **Then** solo aparecen productos no comprables (sin inmediata y sin bajo pedido) — no productos “solo bajo pedido”.
6. **Given** Disponibilidad = Disponible, **When** aplica, **Then** aparecen productos comprables (inmediata y/o bajo pedido); la Modalidad puede acotar cómo.
7. **Given** un filtro de modalidad activo, **When** lo limpia / elige “todas”, **Then** dejan de aplicarse esas restricciones de modalidad.

---

### User Story 3 - Filtrar por tallas (Priority: P3)

Como comprador, quiero filtrar por **talla** (p. ej. M, L) en la tienda, para ver solo camisetas que ofrezcan esa talla en condiciones comprables según el resto de filtros.

**Why this priority**: El usuario lo pide explícitamente; debe ser usable y coherente con modalidad/disponibilidad.

**Independent Test**: Elegir una talla → solo productos que tengan esa talla disponible para compra según reglas de stock/modalidad aplicables; cambiar o limpiar talla actualiza el listado.

**Acceptance Scenarios**:

1. **Given** productos con distintas tallas, **When** el comprador filtra por una talla concreta sin modalidad, **Then** solo aparecen productos con esa talla comprable (inmediata o bajo pedido).
2. **Given** un filtro de talla activo, **When** lo limpia, **Then** el listado deja de restringir por talla.
3. **Given** talla + modalidad inmediata, **When** aplica, **Then** solo productos con esa talla en stock inmediato (intersección coherente).
4. **Given** talla + modalidad bajo pedido, **When** aplica, **Then** solo productos cuya esa talla admite bajo pedido.

---

### Edge Cases

- Filtro Disponibilidad “Agotado” con la semántica antigua (sin stock pero con bajo pedido) → deja de aplicar; esos productos son “Disponible” + modalidad bajo pedido.
- Producto con algunas tallas agotadas y otras con stock → card de listado se trata como **disponible** (no gris de agotada total); el detalle de tallas sigue resolviéndose en la ficha.
- Producto sin stock inmediato pero con bajo pedido → no usar el mismo estilo “muerto/gris de agotada” que un producto imposible de comprar.
- Filtro de talla sin resultados → mensaje vacío claro; no error técnico.
- Filtros compartidos por URL/enlace → al abrir el enlace se ven los mismos resultados filtrados.
- Catálogo vacío tras combinar muchos filtros → empty state en español.
- Favoritos u otras superficies: si usan la misma card de listado, heredan estilo agotado; si no, fuera de alcance.
- Home / Destacadas / carruseles con layout distinto: fuera de alcance para el estilo agotado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En superficies de tienda que usan la **misma card de listado**, las cards de productos **agotados** (no comprables: sin stock inmediato y sin bajo pedido) MUST verse visualmente distintas de las disponibles — atenuadas/gris u otro tratamiento inequívoco, además de la etiqueta de agotada si aplica. Carruseles/home con layout distinto MUST NOT exigir el mismo tratamiento en este alcance.
- **FR-001b**: Los filtros de modalidad, talla y disponibilidad de esta feature aplican al catálogo de tienda (`/productos` y panel de filtros asociado), no a rediseñar filtros de home.
- **FR-002**: Las cards con stock de entrega inmediata MUST NOT usar el estilo de agotada.
- **FR-003**: Las cards solo bajo pedido MUST ser distinguibles tanto de “disponible inmediata” como de “agotada total” (texto y/o tratamiento visual; no igualarlas al gris de agotada).
- **FR-004**: El comprador MUST poder filtrar el catálogo de tienda por modalidad: **entrega inmediata** y **bajo pedido** (y poder quitar el filtro). Modalidad es independiente del filtro de disponibilidad.
- **FR-004b**: El filtro de disponibilidad MUST interpretarse así: **Disponible** = producto comprable (tiene stock inmediato y/o admite bajo pedido); **Agotado** = no comprable (sin stock inmediato y sin bajo pedido). MUST NOT tratar como “Agotado” un producto solo bajo pedido.
- **FR-005**: El filtro de entrega inmediata MUST incluir solo productos con al menos una variante comprable en inmediata (stock > 0 en alguna talla aplicable).
- **FR-006**: El filtro de bajo pedido MUST incluir productos que admitan compra bajo pedido en al menos una variante, **aunque también tengan** stock de entrega inmediata en otras (o las mismas) variantes. MUST NOT exigir “solo bajo pedido”.
- **FR-006b**: El filtro de entrega inmediata MUST NOT excluir un producto solo porque también admita bajo pedido; basta con que tenga al menos una opción inmediata.
- **FR-007**: El comprador MUST poder filtrar por **talla** y limpiar ese filtro; el control MUST ser visible y usable en el panel de filtros de la tienda.
- **FR-008**: Con filtro de talla (sin modalidad), el producto MUST aparecer solo si esa talla es **comprable** (stock inmediato **o** bajo pedido en esa talla). MUST NOT incluir tallas agotadas sin bajo pedido.
- **FR-008b**: Con filtro de talla **y** modalidad entrega inmediata, la talla MUST tener stock inmediato. Con talla **y** modalidad bajo pedido, esa talla MUST admitir bajo pedido.
- **FR-009**: Los filtros nuevos MUST componerse con los filtros de catálogo ya existentes (liga, equipo, búsqueda, etc.) por intersección.
- **FR-010**: Textos e indicadores de filtro MUST estar en español.
- **FR-011**: MUST NOT romper el flujo de ficha de producto, carrito ni checkout.
- **FR-012**: Productos agotados MUST seguir siendo enlazables a la ficha de producto; la diferenciación es visual en listado (gris/atenuada + etiqueta). MUST NOT exigir ocultarlos del catálogo por defecto.

### Key Entities

- **Producto (card de tienda)**: representación en listado con estado visual de disponibilidad (disponible inmediata / bajo pedido / agotada).
- **Variante / talla**: unidad con stock y posibilidad de bajo pedido.
- **Modalidad de entrega**: entrega inmediata vs bajo pedido.
- **Filtros de catálogo**: criterios combinables (modalidad, talla, y filtros ya existentes).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de QA con al menos un producto agotado total y uno con stock, el 100% de evaluadores distingue agotado vs disponible en listado sin abrir la ficha (señal visual, no solo texto diminuto).
- **SC-002**: Con filtro “entrega inmediata”, el 100% de los resultados tienen al menos una opción inmediata; 0 productos “solo bajo pedido” o agotados totales en ese filtro.
- **SC-003**: Con filtro “bajo pedido”, el 100% de los resultados admiten bajo pedido (pueden incluir también stock inmediato).
- **SC-004**: Con filtro de una talla concreta (sin modalidad), el 100% de los resultados tienen esa talla comprable (stock o bajo pedido); 0 con esa talla totalmente no comprable.
- **SC-005**: Combinar modalidad + talla + un filtro de catálogo existente sigue produciendo la intersección correcta en pruebas de muestra (sin resultados “fantasma”).
- **SC-006**: Tiempo para aplicar o limpiar un filtro de modalidad o talla percibido como inmediato en uso normal de catálogo (sin esperas largas inusuales respecto al filtrado actual).

## Assumptions

- “Agotada” en listado = no se puede comprar ni en inmediata ni bajo pedido (alineado con filtro Disponibilidad → Agotado).
- “Gris / atenuada” es el tratamiento por defecto para agotada total; bajo pedido usa un tratamiento distinto (no el mismo gris muerto).
- Disponibilidad y Modalidad son dos controles: el primero comprable vs no; el segundo cómo se entrega (inmediata vs bajo pedido).
- Filtro “bajo pedido” incluye productos mixtos (inmediata + bajo pedido), no solo “únicamente bajo pedido”.
- El filtro por talla puede ser de una talla a la vez (como patrón habitual de catálogo); no se exige multi-selección de tallas en esta entrega.
- Cards agotadas permanecen clicables hacia la ficha.
- Con filtro solo por talla: cuenta talla comprable (inmediata o bajo pedido); con modalidad, la talla debe cumplir esa modalidad.
- Modalidad de filtro es excluyente en el control (inmediata | bajo pedido | todas), no “ambas a la vez” como checkboxes independientes, salvo que el diseño actual de filtros ya use multi-select genérico — en ese caso se alinea al patrón existente sin romper UX.
- Alcance del estilo agotado: misma card de listado de tienda; no forzar Destacadas/home custom.
- No se pide rediseñar todo el panel de filtros; sí añadir modalidad, redefinir disponibilidad (C) y asegurar talla usable.

## Out of Scope

- Cambiar reglas de inventario, ledger o checkout.
- Multi-selección avanzada de muchas tallas a la vez (salvo que ya exista).
- Ocultar siempre los agotados del catálogo por defecto (solo diferenciación + filtros).
- Rediseñar home/Destacadas/carruseles que no usen la card de listado de tienda.
- Admin de stock / carga de inventario.
- Internacionalización fuera de español.
