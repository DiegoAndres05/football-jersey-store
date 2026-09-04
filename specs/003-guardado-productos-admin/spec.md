# Especificación de Feature: Edición rápida y guardado de productos en administración

**Feature Branch**: `003-guardado-productos-admin`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Quiero implementar/mejorar algo existente en el panel administrador. Hay muchos botones y acciones que toca hacer por cada camiseta, como colocarle el precio al dorsal a cada una (guardar esa acción por camiseta), colocarle a cada una que esté en estado activado y un botón en general de guardar todo lo puesto en la parte de productos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar rápidamente el recargo y activación de cada camiseta (Priority: P1)

Como administrador del catálogo, quiero modificar desde la lista de productos el precio del dorsal o personalización de cada camiseta y su estado activo, para actualizar la oferta sin abrir múltiples pantallas ni repetir acciones innecesarias.

**Why this priority**: Son los dos datos operativos pedidos explícitamente y afectan tanto la comercialización del producto como el importe que se cobra por personalización.

**Independent Test**: Con varios productos existentes, cambiar el recargo de personalización y el estado activo en distintas filas, guardar el conjunto y comprobar que cada producto conserva exactamente sus valores válidos después de recargar el panel y consultar la tienda.

**Acceptance Scenarios**:

1. **Given** una lista de productos cargada con valores actuales, **When** el administrador cambia el recargo de personalización de una o más camisetas y modifica su estado activo, **Then** cada fila muestra el valor pendiente de guardar y no se altera otra fila sin una edición explícita.
2. **Given** un producto con personalización habilitada, **When** el administrador guarda un recargo entero expresado en pesos colombianos, **Then** el recargo queda persistido y se aplica a la personalización de ese producto según las reglas comerciales existentes.
3. **Given** un producto activo o inactivo, **When** el administrador cambia su estado y guarda correctamente, **Then** el producto queda disponible o deja de aparecer en las superficies públicas conforme al estado guardado, sin modificar variantes ni inventario.
4. **Given** un administrador usa el guardado individual ya existente de una fila, **When** la operación termina correctamente, **Then** la edición individual sigue siendo válida y no obliga a guardar el resto de cambios pendientes de la lista.

### User Story 2 - Guardar todos los cambios pendientes de productos (Priority: P1)

Como administrador, quiero un único comando para guardar los cambios pendientes de los productos que estoy revisando, para completar una actualización operativa en una sola acción y saber qué se guardó y qué no.

**Why this priority**: El ahorro de tiempo solicitado depende de poder consolidar varias ediciones sin pulsar un botón por camiseta.

**Independent Test**: Editar al menos tres filas con combinaciones distintas de recargo y activación, pulsar el guardado general y verificar el resultado por producto, incluyendo una recarga que confirme la persistencia.

**Acceptance Scenarios**:

1. **Given** que no hay cambios pendientes, **When** el administrador revisa la lista, **Then** el guardado general aparece deshabilitado o informa que no hay nada que guardar y no ejecuta una actualización innecesaria.
2. **Given** que hay cambios válidos en varias filas, **When** el administrador solicita guardar todo y confirma la acción si corresponde, **Then** se procesa cada producto incluido, se muestra un resultado comprensible y los cambios guardados dejan de estar pendientes.
3. **Given** que el guardado general termina, **When** el administrador recarga o vuelve a abrir la sección, **Then** ve los valores persistidos y no se duplican ni se pierden por el número de filas editadas.
4. **Given** que el administrador abandona o recarga la página con cambios sin guardar, **When** el navegador puede advertir antes de salir, **Then** se informa que existen cambios pendientes; si continúa, esos cambios no se presentan como guardados.

### User Story 3 - Resolver fallos parciales y datos concurrentes (Priority: P1)

Como administrador, quiero identificar individualmente los productos que no pudieron guardarse, para corregirlos o reintentarlos sin perder los cambios válidos de las demás camisetas ni sobrescribir una actualización más reciente.

**Why this priority**: Un guardado por lote puede mezclar errores de validación, permisos o concurrencia; ocultarlos haría riesgosa la operación del catálogo.

**Independent Test**: Intentar guardar un lote que contenga un valor inválido, un producto eliminado y un producto modificado desde otra sesión; comprobar que los productos válidos se guardan, los demás se reportan por fila y los datos más recientes no son sobrescritos silenciosamente.

**Acceptance Scenarios**:

1. **Given** un lote con filas válidas y una fila con recargo negativo, decimal o fuera del límite permitido, **When** el administrador guarda todo, **Then** las filas válidas se guardan, la fila inválida se rechaza con un mensaje específico y permanece corregible sin marcarse como guardada.
2. **Given** que un producto fue cambiado después de cargar la lista, **When** se intenta guardar una edición basada en datos obsoletos, **Then** esa fila se rechaza como desactualizada, se conservan los datos actuales del producto y el administrador debe revisar antes de reintentar.
3. **Given** que un producto fue eliminado o dejó de ser accesible durante el guardado, **When** se procesa el lote, **Then** no se crea ni se reconstruye el producto, la fila se marca como no disponible y el resto del lote continúa.
4. **Given** que se crea un producto nuevo mientras la lista está abierta, **When** se pulsa el guardado general, **Then** el producto nuevo no se incluye automáticamente en el lote; debe aparecer tras recargar y usarse el flujo de creación existente.
5. **Given** que el servidor o la red falla durante un guardado parcial, **When** el administrador recibe el resultado, **Then** cada producto queda identificado como guardado, fallido o pendiente de confirmación, y el reintento no duplica ni revierte los cambios ya confirmados.

### Edge Cases

- Un recargo vacío se interpreta como cero solo cuando el campo permite dejar explícitamente el producto sin recargo; valores no numéricos, negativos, decimales o superiores al máximo comercial se rechazan con una explicación en la fila correspondiente.
- La unidad visible del recargo es pesos colombianos enteros; no se permiten valores fraccionarios ni operaciones que alteren el valor por redondeo silencioso.
- Desactivar un producto no elimina variantes, precios, imágenes, stock, proveedores ni historial; volver a activarlo debe recuperar la visibilidad que corresponda a las reglas públicas vigentes.
- Un producto con personalización deshabilitada puede conservar su recargo configurado; la feature no cambia automáticamente la habilitación de personalización ni decide si debe cobrarse.
- Si una fila cambia mediante el guardado individual mientras el lote sigue pendiente, el guardado general debe detectar la versión obsoleta o exigir una revisión, no sobrescribirla sin aviso.
- Si una fila fue eliminada por las reglas actuales del catálogo, el resultado debe explicar que no existe y no impedir el procesamiento de las otras filas.
- Doble pulsación, reintento por timeout o respuesta tardía no debe dejar estados ambiguos ni aplicar dos veces una misma intención de cambio.
- Los productos creados después de cargar la pantalla y los productos ya eliminados no forman parte del conjunto inicial de guardado general.
- Un administrador sin sesión válida o sin permisos no puede consultar ni ejecutar esta operación; el intento debe fallar sin revelar datos del catálogo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al administrador editar en la lista de productos, por fila, el recargo entero de dorsal/personalización expresado en COP y el estado activo del producto.
- **FR-002**: El sistema MUST distinguir visualmente entre valores vigentes y cambios pendientes de cada fila.
- **FR-003**: El sistema MUST conservar el guardado individual existente para una camiseta, incluyendo su validación y resultado, sin exigir que se envíen las demás filas.
- **FR-004**: El sistema MUST ofrecer un único comando de guardado general para enviar los cambios pendientes del conjunto de productos cargado en la lista.
- **FR-005**: El sistema MUST incluir en el guardado general únicamente productos existentes que el administrador haya editado y que pertenezcan a la carga vigente; no debe incluir productos nuevos aparecidos después ni reconstruir productos eliminados.
- **FR-006**: El sistema MUST validar cada fila antes de persistirla: el recargo debe ser un entero COP entre cero y el límite comercial vigente, y el estado activo debe ser booleano.
- **FR-007**: El sistema MUST aplicar los cambios válidos de un lote aunque otra fila falle, siempre que pueda determinar el resultado de cada fila sin comprometer la integridad del conjunto.
- **FR-008**: El sistema MUST mostrar por producto un resultado inequívoco de guardado exitoso, validación fallida, producto no encontrado/no accesible, conflicto por datos obsoletos o fallo no confirmado.
- **FR-009**: El sistema MUST conservar como pendientes las filas rechazadas o no confirmadas y permitir corregirlas o reintentarlas sin volver a editar las filas guardadas correctamente.
- **FR-010**: El sistema MUST detectar una modificación concurrente posterior a la carga de la fila, o contar con una comprobación equivalente de vigencia, y MUST evitar sobrescribir datos más recientes sin una confirmación explícita del administrador.
- **FR-011**: El sistema MUST tratar una eliminación concurrente como un resultado de fila no disponible, sin crear un producto sustituto ni detener las actualizaciones independientes.
- **FR-012**: El sistema MUST evitar que doble envío o reintento de la misma operación aplique cambios duplicados o presente como éxito un resultado que no pudo confirmarse.
- **FR-013**: El sistema MUST advertir cuando el administrador intenta abandonar, recargar o cambiar de sección con cambios pendientes, sin afirmar que esos cambios se guardaron si continúa.
- **FR-014**: El sistema MUST requerir autenticación y autorización administrativa en el servidor tanto para el guardado individual como para el general.
- **FR-015**: El sistema MUST mantener separados el recargo de dorsal/personalización y el precio de venta de cada variante; el guardado general de productos no debe editar precios por talla, costos, descuentos, inventario, imágenes, proveedores, equipo, temporada, nombre u otros campos no solicitados.
- **FR-016**: El sistema MUST mantener la creación de productos nuevos en el flujo existente; el guardado general no debe convertir cambios de una fila en una creación implícita.
- **FR-017**: El sistema MUST conservar el comportamiento existente de activación pública, cálculo del recargo y restricciones de eliminación, salvo los cambios explícitos de los campos incluidos en esta feature.
- **FR-018**: El sistema MUST presentar mensajes de error accionables en español y no exponer detalles internos, secretos ni datos de otros contextos.

### Key Entities *(include if feature involves data)*

- **Producto**: camiseta del catálogo con identidad estable, estado activo y datos repetitivos editables desde administración.
- **Recargo de dorsal/personalización**: importe entero en COP asociado al producto y utilizado por el flujo comercial cuando la personalización aplica; no es el precio base de una variante.
- **Cambio pendiente**: edición local aún no confirmada, asociada a un producto existente y diferenciada de los valores vigentes.
- **Lote de guardado**: conjunto de cambios pendientes seleccionado desde la lista cargada, con resultado independiente para cada producto.
- **Resultado de guardado**: estado verificable de cada fila, incluyendo éxito, validación, conflicto, no disponible o fallo no confirmado.
- **Administrador**: persona autenticada y autorizada para modificar el catálogo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de los administradores de prueba puede modificar el recargo y el estado de cinco camisetas y completar el guardado general en menos de 90 segundos.
- **SC-002**: En pruebas de aceptación, el 100% de los cambios válidos enviados por lote queda persistido en el producto correcto y se refleja después de recargar la sección.
- **SC-003**: El 100% de los valores inválidos probados se rechaza antes de persistir esa fila, con un mensaje específico y sin descartar los cambios válidos de las demás filas.
- **SC-004**: El 100% de los conflictos simulados por edición concurrente, producto eliminado o producto nuevo se identifica con el resultado correcto y no sobrescribe ni crea datos silenciosamente.
- **SC-005**: En pruebas de doble envío y timeout, ninguna intención confirmada se aplica más de una vez y el administrador puede distinguir éxito confirmado de resultado no confirmado en el 100% de los casos.
- **SC-006**: Al menos el 95% de los administradores identifica qué filas siguen pendientes después de un lote parcialmente fallido y puede reintentarlas sin modificar las filas exitosas.
- **SC-007**: El 100% de las pruebas de autorización bloquea el guardado individual y general para sesiones no administrativas sin revelar información del catálogo.
- **SC-008**: En una prueba de regresión, el 100% de los precios por variante, costos, inventario, imágenes, proveedores y datos no incluidos permanece sin cambios al usar el guardado general.

## Assumptions

- “Precio del dorsal” se refiere al recargo de personalización existente del producto, expresado en pesos colombianos enteros; el precio base de venta pertenece a cada variante y se gestiona en su pantalla propia.
- El guardado individual actual se conserva como alternativa válida y puede seguir enviando el conjunto completo de campos que ya edita esa operación.
- El guardado general se limita inicialmente al recargo de dorsal/personalización y al estado activo, porque son los datos repetitivos solicitados; no se infiere que todos los campos del formulario deban editarse masivamente.
- El administrador cuenta con una sesión válida y los permisos actuales del panel; no se crea un rol nuevo ni una delegación adicional.
- El conjunto inicial de productos se define al cargar la lista; altas y bajas posteriores requieren recargar o usar sus flujos existentes.
- El sistema dispone de una forma confiable de comparar la versión cargada con la vigente para proteger actualizaciones concurrentes; los detalles de esa forma quedan para planificación.
- Los errores de red o servidor pueden dejar una operación sin confirmación; la interfaz debe hacer visible esa incertidumbre y evitar afirmar éxito.
- Las reglas vigentes de recargo, activación pública, variantes e inventario siguen siendo la fuente de verdad y no se redefinen en esta feature.

## Out of Scope

- Edición masiva de precio de venta, costo, precio tachado, stock, alerta de stock, peso o modalidad bajo pedido de las variantes.
- Edición masiva de nombre, abreviatura, descripción, equipo, liga, temporada, tipo de camiseta, marca, destacado, imágenes, proveedores o variantes.
- Creación, importación, duplicación o eliminación masiva de productos.
- Cambios en inventario, pedidos, checkout, personalización del cliente, cálculo de impuestos, descuentos o políticas comerciales.
- Nuevos roles administrativos, auditoría histórica completa de quién cambió cada campo o recuperación de versiones anteriores.
- Guardado automático silencioso, sincronización entre varias pestañas o resolución automática de conflictos que pueda sobrescribir datos de otro administrador.
