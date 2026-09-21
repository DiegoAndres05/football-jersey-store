# Feature Specification: Precio válido para productos agotados

**Feature Branch**: `019-precio-agotado`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Corregir el precio mostrado en productos que aparece como "$0 COP" en el catálogo de FlashSport. Cuando un producto no tiene ninguna variante (talla) con stock disponible, el precio no debe mostrarse como cero — debe mostrarse el último precio válido del producto junto al indicador "Agotado", o bien ocultarse el precio por completo mientras se muestra el badge de agotado. Esto debe corregirse tanto en las tarjetas de listado (destacadas, más buscadas, catálogo) como en la página de detalle del producto. El objetivo es que ningún cliente vea nunca un precio de $0 en la tienda, sin importar el estado de stock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver productos agotados sin precio cero (Priority: P1)

Como cliente que navega por FlashSport, quiero reconocer que un producto está agotado sin ver un precio engañoso de `$0 COP`, para poder interpretar correctamente su disponibilidad y decidir si continuar explorando.

**Why this priority**: El precio cero es información incorrecta en el principal punto de descubrimiento de productos y puede hacer que el cliente desconfíe de la tienda o espere comprar a un precio inexistente.

**Independent Test**: Crear o seleccionar un producto cuyas variantes no tengan stock disponible y revisar de forma independiente las tarjetas de destacados, más buscados y catálogo; cada tarjeta muestra el estado agotado y nunca presenta `$0 COP`.

**Acceptance Scenarios**:

1. **Given** un producto con al menos una variante sin stock, pero sin ninguna variante disponible para compra, **When** el cliente ve una tarjeta de destacados, más buscados o catálogo, **Then** la tarjeta muestra el badge o indicador `Agotado` y muestra el último precio válido del producto en COP, o bien omite el precio sin mostrar ningún valor cero.
2. **Given** un producto con todas sus variantes agotadas y un último precio válido mayor que cero, **When** el cliente observa la tarjeta, **Then** el precio mostrado, si se muestra, corresponde al último precio válido del producto y no a un cálculo derivado de stock disponible.
3. **Given** un producto con al menos una variante disponible, **When** el cliente ve su tarjeta, **Then** se mantiene el precio vigente de la oferta disponible y el producto no se marca como `Agotado`.

### User Story 2 - Consultar el detalle de un producto agotado (Priority: P1)

Como cliente que abre el detalle de un producto agotado, quiero ver claramente su estado de disponibilidad sin que el precio se convierta en `$0 COP`, para entender que no puedo añadirlo al carrito en este momento.

**Why this priority**: La página de detalle es el punto donde el cliente valida la compra; una inconsistencia entre tarjeta y detalle puede provocar intentos fallidos de compra y una percepción de error en el catálogo.

**Independent Test**: Abrir directamente el detalle de un producto sin variantes disponibles y verificar que el estado `Agotado` es visible, que no aparece `$0 COP`, y que las acciones de compra no permiten seleccionar una opción no disponible.

**Acceptance Scenarios**:

1. **Given** un producto sin variantes con stock disponible, **When** el cliente abre su página de detalle, **Then** la página muestra `Agotado` y el último precio válido del producto, o no muestra precio, pero nunca muestra `$0 COP`.
2. **Given** un producto sin variantes con stock disponible, **When** el cliente revisa las tallas y las acciones de compra, **Then** las opciones no disponibles y la acción de añadir al carrito permanecen deshabilitadas o impedidas según el comportamiento existente, sin crear una compra a precio cero.
3. **Given** un producto cuyo último precio persistido no está disponible o no es mayor que cero, **When** el cliente abre la tarjeta o el detalle, **Then** se muestra `Agotado` y se omite el precio, sin inventar un importe ni mostrar cero.

### User Story 3 - Mantener consistencia en todos los estados de stock (Priority: P2)

Como responsable de catálogo, quiero que la regla de presentación del precio sea uniforme en todos los lugares públicos donde se muestran productos, para evitar que una misma camiseta tenga valores contradictorios según la pantalla.

**Why this priority**: La consistencia reduce consultas de soporte y evita que un componente futuro vuelva a exponer el valor técnico cero cuando el inventario cambie.

**Independent Test**: Comparar un mismo producto agotado en destacados, más buscados, catálogo y detalle, y repetir la comparación después de cambiar su estado entre disponible y agotado.

**Acceptance Scenarios**:

1. **Given** el mismo producto agotado aparece en varias superficies públicas, **When** el cliente navega entre ellas, **Then** todas muestran `Agotado` y aplican la misma política de precio válido u oculto.
2. **Given** el stock de una variante cambia entre disponible y agotado, **When** se vuelve a cargar el catálogo o detalle, **Then** el precio visible nunca cae a `$0 COP` durante el estado agotado ni permanece oculto cuando vuelve a existir una oferta válida.

### Edge Cases

- Un producto puede tener variantes con stock cero, stock negativo derivado o estado no disponible; todas deben contar como no disponibles para esta regla.
- Si existen varias variantes históricamente válidas con precios distintos, debe utilizarse el último precio válido definido para el producto según el orden vigente del catálogo; nunca debe sumarse, promediarse ni reemplazarse por cero.
- Si no existe un último precio válido mayor que cero, el precio debe omitirse y solo debe mostrarse el indicador `Agotado`.
- Un producto archivado, inactivo o no encontrado sigue las reglas actuales de visibilidad y errores; esta funcionalidad no debe hacerlo aparecer en el catálogo.
- Los cambios de estado no deben permitir añadir al carrito una variante agotada ni generar un total de pedido igual a cero por falta de oferta.

## Clarifications

### Session 2026-09-20

- La política de presentación para un producto agotado queda resuelta así: si existe un último precio válido mayor que cero a nivel de producto, se muestra junto al badge `Agotado`; si no existe un precio válido confiable, se oculta el importe y se mantiene solo `Agotado`; nunca se renderiza `$0 COP` ni se deriva un valor de una lista vacía de variantes disponibles. La misma regla se aplica de forma consistente en tarjetas y en la página de detalle.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST determinar la disponibilidad del producto a partir de si existe al menos una variante comprable con stock disponible.
- **FR-002**: Cuando un producto no tenga ninguna variante disponible, el sistema MUST mostrar un indicador visible `Agotado` en las tarjetas de destacados, más buscados y catálogo.
- **FR-003**: Cuando un producto agotado tenga un último precio válido mayor que cero, el sistema MUST mostrar ese precio en COP junto al indicador `Agotado`, sin derivarlo de un conjunto vacío de variantes disponibles.
- **FR-004**: Cuando un producto agotado no tenga un último precio válido mayor que cero, el sistema MUST ocultar el importe y MUST seguir mostrando `Agotado`.
- **FR-005**: El sistema MUST aplicar la misma política de precio y disponibilidad en la página de detalle del producto.
- **FR-006**: Ninguna superficie pública de tienda MUST renderizar `$0 COP` como precio de un producto, independientemente de su estado de stock o de la ausencia de variantes disponibles.
- **FR-007**: El sistema MUST conservar el precio vigente de una oferta disponible cuando al menos una variante comprable tenga stock, sin marcar el producto como agotado.
- **FR-008**: Las opciones de talla y acciones de compra MUST respetar la disponibilidad existente y MUST impedir añadir al carrito una variante agotada o un producto sin oferta comprable.
- **FR-009**: La regla MUST usar importes enteros positivos en pesos colombianos y MUST tratar valores ausentes, cero o inválidos como no aptos para mostrar precio.
- **FR-010**: El cambio MUST cubrir las superficies públicas actuales de tarjetas y detalle sin alterar las reglas de visibilidad de productos activos, archivados o inexistentes.

### Key Entities

- **Producto**: Artículo público del catálogo con nombre, estado de visibilidad y uno o más precios históricos o vigentes.
- **Variante**: Combinación comprable del producto, normalmente una talla, con su disponibilidad de inventario y precio asociado.
- **Precio válido**: Importe entero positivo en COP que puede presentarse al cliente como referencia del producto, incluso cuando actualmente no haya una variante con stock.
- **Estado de disponibilidad**: Resultado derivado que distingue entre producto comprable y producto agotado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de las tarjetas públicas de destacados, más buscados y catálogo revisadas con productos sin variantes disponibles, aparece `Agotado` y aparece un precio positivo válido o no aparece ningún precio; `$0 COP` aparece en 0 casos.
- **SC-002**: En el 100% de las páginas de detalle revisadas con productos agotados, aparece `Agotado` y `$0 COP` aparece en 0 casos.
- **SC-003**: En una prueba de regresión con productos disponibles y agotados, el 100% conserva su estado correcto y los productos disponibles mantienen su precio vigente.
- **SC-004**: Ningún intento de añadir un producto sin variante comprable produce una línea de carrito o total de pedido con precio cero.
- **SC-005**: Al menos el 95% de los usuarios de prueba identifica correctamente que un producto sin stock está agotado, sin interpretar el precio como una oferta gratuita, en una evaluación de cinco tareas de navegación.

## Assumptions

- Se conserva el indicador visual existente para productos agotados y solo se ajusta su contenido de precio cuando sea necesario.
- La opción preferida para un producto agotado es mostrar el último precio válido positivo junto a `Agotado`; ocultar el precio es el fallback cuando ese valor no existe o no es confiable.
- El último precio válido se obtiene de la información de producto ya disponible para el catálogo, sin crear una nueva política de descuentos ni modificar precios persistidos.
- La disponibilidad y el precio se validan nuevamente en las acciones de compra existentes; este cambio no amplía el alcance a administración, pagos ni históricos de pedidos.
- Los importes se presentan en pesos colombianos enteros y siguen el formato monetario ya utilizado por la tienda.
