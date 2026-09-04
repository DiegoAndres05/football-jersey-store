# Feature Specification: Moneda COP/USD, carga percibida y confirmación de guardado en administración

**Feature Branch**: `004-moneda-carga-feedback`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Quiero adaptar la tienda para que el usuario pueda elegir la moneda, ya sea cop o usd, ademas de eso me gustaría hacer una optimizacion a la pagina en tiempo de cargas, muestra de mensajes en la parte de admin, donde al darle algun boton de guardar, salga guardado exitoso o fallido"

## Clarifications

### Session 2026-09-04

- Q: ¿Qué significa “elegir moneda” en el checkout? → A: B, con COP como moneda base interna. USD es moneda de venta para clientes internacionales. No hay segundo catálogo de precios: la conversión USD sale del precio base COP. El checkout registra la moneda elegida. Alcance mínimo; la integración del proveedor de pagos USD se define después.
- Q: Cuando el cliente confirma en USD, ¿qué debe quedar persistido en el pedido? → A: B. Código de moneda de venta, importes base en COP y la tasa vigente al confirmar; el USD histórico se recalcula con esa tasa congelada.
- Q: ¿Cómo se calcula el total visible en USD en carrito y checkout? → A: B. Convertir una sola vez el total COP a USD; ese es el total oficial. Las líneas se muestran convertidas solo como detalle.
- Q: ¿Cómo se expresa la tasa que carga el administrador? → A: A. 1 USD = X COP; el admin carga cuántos pesos equivalen a un dólar (ej. 4000).
- Q: ¿Dónde se muestra al cliente la tasa (1 USD = X COP)? → A: B. Junto al selector de moneda y en el resumen de checkout; no en cada precio del catálogo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver y elegir precios en COP o USD (Priority: P1)

Como comprador (incluido quien compra como invitado), quiero elegir si compro viendo precios en pesos colombianos o en dólares estadounidenses, para que la tienda me cobre conceptualmente en la moneda de venta que elegí, sin que administración cargue un segundo catálogo de precios.

**Why this priority**: Es la capacidad comercial nueva solicitada y afecta catálogo, ficha, carrito y checkout. Sin ella, las otras mejoras no cambian la oferta que ve el cliente.

**Independent Test**: En un navegador sin cuenta, cambiar entre COP y USD, recorrer inicio, listado, ficha, carrito y checkout, y comprobar que todos los importes visibles usan la moneda elegida, que al volver a COP los valores coinciden con los originales, y que al confirmar el pedido quedan registrados la moneda de venta, los importes base en COP y la tasa usada en ese momento.

**Acceptance Scenarios**:

1. **Given** una persona visita la tienda por primera vez, **When** aún no ha elegido moneda, **Then** ve los precios en pesos colombianos y un control visible para pasar a dólares o volver a pesos.
2. **Given** la persona elige USD, **When** navega por inicio, catálogo, ficha de producto, carrito y resumen de compra, **Then** cada precio, recargo, envío y descuento visible se muestra en dólares, y el total oficial en dólares es la conversión del total en COP, no la suma de las líneas convertidas.
3. **Given** la persona elige COP de nuevo, **When** revisa las mismas pantallas, **Then** los importes vuelven a pesos colombianos y coinciden con los valores base vigentes, sin recargos silenciosos por haber cambiado de moneda.
4. **Given** la persona eligió una moneda, **When** cierra y vuelve a abrir el sitio en el mismo navegador, **Then** se conserva su elección y no se le exige iniciar sesión para mantenerla.
5. **Given** hay una tasa de conversión vigente, **When** se muestra un precio en USD, **Then** ese valor es una conversión redondeada del precio base en pesos colombianos y no un segundo precio independiente cargado por el catálogo.
6. **Given** no hay tasa vigente, la tasa es inválida o es cero, **When** la persona intenta ver o elegir USD, **Then** se mantiene o se vuelve a COP, se explica que los dólares no están disponibles y no se muestran importes en cero o engañosos.
7. **Given** la persona confirma un pedido con USD seleccionado, **When** el checkout termina, **Then** el pedido registra USD como moneda de venta, los importes base en COP y la tasa usada al confirmar, y no exige un proveedor de pagos en dólares para considerarse registrado.
8. **Given** un pedido ya confirmado en USD, **When** administración cambia la tasa vigente, **Then** el catálogo público usa la tasa nueva y el pedido conservado sigue usando la tasa congelada al confirmar.
9. **Given** la vista está en USD, **When** la persona usa el selector o llega al resumen de checkout, **Then** ve la tasa como 1 USD = X COP (o su vigencia) junto al selector y otra vez en el checkout, y no la ve repetida en cada precio del catálogo o la ficha.

---

### User Story 2 - Confirmar si un guardado de administración tuvo éxito o falló (Priority: P2)

Como administrador, quiero ver un mensaje claro de “guardado exitoso” o “guardado fallido” después de pulsar un botón de guardar, para saber si debo continuar, corregir o reintentar sin dudar si el cambio quedó persistido.

**Why this priority**: El panel ya permite persistir datos, pero la falta de confirmación genera retrabajo y riesgo de asumir un éxito que no ocurrió. Es independiente de la moneda y entrega valor operativo inmediato.

**Independent Test**: En al menos tres secciones distintas del panel, ejecutar un guardado válido, uno rechazado por validación y uno que falle por red o servidor; comprobar que cada caso muestra un resultado inequívoco y que un fallo no se presenta como éxito.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado con un cambio válido, **When** pulsa Guardar y la operación se confirma, **Then** ve un mensaje de guardado exitoso en español, visible sin desplazarse a otra página para interpretarlo, y los datos persistidos coinciden con lo enviado.
2. **Given** un cambio inválido o incompleto, **When** pulsa Guardar, **Then** ve un mensaje de guardado fallido o de corrección necesaria, el dato inválido no se persiste y puede corregirlo sin perder el resto de la edición cuando el formulario lo conserve.
3. **Given** un fallo de red, de sesión o del servidor, **When** termina el intento de guardar, **Then** ve un mensaje de fallo o de resultado no confirmado, no se afirma éxito y puede reintentar sin que un doble envío cree registros duplicados cuando la operación es la misma intención.
4. **Given** un guardado que redirige o recarga la misma sección, **When** la pantalla vuelve a mostrarse, **Then** el resultado (éxito o fallo) sigue siendo perceptible y no desaparece de forma silenciosa antes de que el administrador pueda leerlo.
5. **Given** una acción que no persiste datos (filtros, navegación, cancelar), **When** el administrador la usa, **Then** no se muestra un mensaje de guardado exitoso.

---

### User Story 3 - Percibir las páginas públicas más rápidas (Priority: P3)

Como comprador, quiero que las páginas de la tienda muestren contenido útil más pronto, para explorar y decidir sin esperas que interrumpan la compra.

**Why this priority**: Mejora la experiencia de todo el tráfico, pero no introduce una capacidad comercial nueva; puede entregarse y medirse sin moneda ni mensajes de administración.

**Independent Test**: Medir, antes y después, el tiempo hasta contenido útil en inicio, catálogo y ficha de producto en una conexión típica de hogar, y verificar que precios, nombres e imágenes principales aparecen sin bloquearse mutuamente de forma innecesaria.

**Acceptance Scenarios**:

1. **Given** una visita nueva a inicio o catálogo, **When** la página termina de ofrecer contenido útil, **Then** el visitante puede leer la propuesta y ver al menos una camiseta identificable (nombre y precio) sin esperar a que cargue todo el resto de la página.
2. **Given** una ficha de producto, **When** la persona llega desde el catálogo, **Then** el nombre, el precio en la moneda elegida y la acción de compra son utilizables aunque alguna imagen secundaria aún no haya terminado.
3. **Given** una visita repetida a las mismas páginas públicas, **When** el contenido no ha cambiado, **Then** el tiempo hasta contenido útil es menor que en la primera visita para la mayoría de los intentos medidos.
4. **Given** una imagen de producto lenta o ausente, **When** el resto de la ficha o del listado ya puede mostrarse, **Then** la página no queda en blanco: se reserva el espacio visual y el visitante sigue viendo nombre, precio y acciones.

---

### Edge Cases

- La moneda por defecto es COP porque la tienda opera para clientes en Colombia; USD es moneda de venta convertida desde el precio base COP, no una lista de precios paralela.
- Cambiar de moneda con artículos en el carrito no debe alterar cantidades, tallas, personalización ni el importe base en pesos; cambia la moneda de venta mostrada y, al confirmar, la moneda y la tasa registradas en el pedido.
- Un pedido confirmado no debe recalcularse con una tasa posterior; la tasa congelada al confirmar es la única válida para reconstruir su USD histórico.
- Un total en USD no se obtiene sumando líneas ya redondeadas: el total oficial es la conversión, una sola vez, del total base en COP. Las líneas convertidas son detalle y pueden diferir en céntimos respecto de ese total.
- Un importe en pesos tan pequeño que al convertir redondee a cero dólares no debe mostrarse como “gratis”; se muestra el mínimo representable en USD y la página permanece en la moneda elegida.
- La tasa 1 USD = X COP se muestra junto al selector y en el resumen de checkout cuando la vista está en USD; no se repite en cada precio. La tasa de catálogo puede quedar desactualizada respecto del mercado; administración puede actualizarla sin republicar cada producto.
- Un valor de tasa invertido (dólares por peso) o sin unidad visible se rechaza o se evita presentándolo como COP por 1 USD; no se interpreta en silencio.
- Un administrador sin sesión o sin permiso que intenta guardar recibe un fallo sin datos internos ni del catálogo de otros contextos.
- Un guardado exitoso seguido de un segundo clic no debe crear un duplicado ni mostrar dos éxitos para una sola intención cuando la operación no es una creación nueva.
- La confirmación de guardado no sustituye los resultados por fila ya definidos para el guardado masivo de productos; en esa pantalla el detalle por producto sigue siendo la fuente de verdad y el mensaje general no debe contradecirlo.
- La mejora de carga no debe ocultar errores: si el catálogo no puede obtenerse, el visitante ve un estado de fallo o vacío comprensible, no una página que parece completa con datos inventados.
- Elegir USD no cambia el idioma de la tienda (sigue en español) ni exige registro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a cualquier visitante elegir entre COP y USD desde un control persistente y comprensible en las páginas públicas.
- **FR-002**: El sistema MUST mostrar en la moneda elegida todos los importes que el cliente usa para decidir o pagar: precio de listado, precio tachado si aplica, recargo de personalización, envío, descuentos y totales de carrito y checkout.
- **FR-003**: El sistema MUST tratar el peso colombiano como moneda base interna: catálogo, cálculos comerciales y pedidos conservan importes enteros en COP. USD es moneda de venta derivada de esa base; MUST NOT existir un segundo catálogo de precios manual.
- **FR-004**: El sistema MUST convertir cada importe de línea visible en USD a partir del precio base COP vigente y de la tasa de la tienda, con redondeo explícito y el mismo resultado al repetir la conversión del mismo importe. El total oficial en USD MUST ser la conversión, una sola vez, del total base en COP; MUST NOT ser la suma de líneas ya convertidas.
- **FR-005**: El sistema MUST conservar la moneda elegida en el mismo navegador para visitas posteriores, incluido el checkout de invitado, y MUST volver a COP si la preferencia guardada es inválida.
- **FR-006**: El sistema MUST usar COP cuando no exista tasa vigente, la tasa no sea un número positivo o la conversión no pueda completarse, e informar que USD no está disponible.
- **FR-007**: El sistema MUST permitir a un administrador autenticado consultar y actualizar la tasa vigente expresada como pesos colombianos por un dólar (1 USD = X COP), su fecha de vigencia y un estado activo/inactivo. X MUST ser un número positivo. La unidad (COP por 1 USD) MUST ser visible al cargar y al consultar la tasa.
- **FR-008**: El sistema MUST dejar la captura de precios, costos, recargos, envíos y umbrales comerciales en COP dentro de administración; la elección de moneda del cliente no cambia esos formularios.
- **FR-009**: El sistema MUST identificar de forma visible la moneda mostrada (código o símbolo) para que COP y USD no se confundan.
- **FR-010**: Cuando la vista está en USD, el sistema MUST mostrar la tasa vigente como 1 USD = X COP (o su fecha de vigencia) junto al selector de moneda y en el resumen de checkout. MUST NOT repetir esa tasa en cada precio del catálogo o la ficha.
- **FR-011**: Tras cada acción administrativa explícita de persistir (guardar o crear), el sistema MUST comunicar un resultado intencional de éxito o fallo en español, sin exponer detalles internos, secretos ni trazas.
- **FR-012**: El sistema MUST distinguir éxito confirmado, rechazo por validación y fallo no confirmado (red, sesión o servidor), y MUST NOT presentar como exitoso un resultado que no pudo confirmarse.
- **FR-013**: El sistema MUST mantener visible el resultado el tiempo suficiente para leerlo, incluso si la pantalla recarga o redirige a la misma sección.
- **FR-014**: El sistema MUST aplicar FR-011 a las secciones del panel que ya tienen un botón de guardar o crear, incluyendo al menos productos, variantes, imágenes, equipos, ligas, temporadas, tallas, versiones y proveedores.
- **FR-015**: El sistema MUST exigir autenticación y autorización administrativas en el servidor para guardar datos del panel y para cambiar la tasa de conversión.
- **FR-016**: Las páginas públicas de inicio, catálogo y ficha MUST presentar contenido útil (identidad del producto y precio en la moneda elegida) antes de que terminen recursos no esenciales, y MUST reservar espacio para imágenes ausentes o lentas en lugar de dejar la página en blanco.
- **FR-017**: El sistema MUST conservar el comportamiento existente de disponibilidad, personalización, envío, checkout de invitado e inventario al añadir moneda de venta o al acelerar la carga percibida.
- **FR-018**: El sistema MUST rechazar una moneda, una tasa o un resultado de guardado inválidos con un estado de error estable y comprensible, sin exponer detalles internos.
- **FR-019**: Al confirmar el checkout, el sistema MUST persistir en el pedido la moneda de venta elegida (COP o USD), los importes base en COP y la tasa de conversión vigente en ese instante. MUST NOT exigir en esta entrega un proveedor de pagos en dólares. Pedidos posteriores a un cambio de tasa MUST conservar la tasa congelada del momento de confirmación.

### Key Entities *(include if feature involves data)*

- **Preferencia de moneda**: elección del visitante entre COP y USD como moneda de venta, asociada al navegador o a la sesión de compra, no a una cuenta obligatoria.
- **Tasa de conversión**: cantidad positiva de pesos colombianos que equivalen a un dólar (1 USD = X COP), definida por administración, con vigencia y estado activo. No se expresa como dólares por peso.
- **Importe base**: cantidad enteramente expresada en COP que sigue siendo la fuente interna de verdad de precios, recargos, envío, descuentos y totales calculados.
- **Moneda de venta del pedido**: COP o USD registrada al confirmar el checkout, derivada de la preferencia vigente y no de un segundo catálogo.
- **Tasa congelada del pedido**: copia de la tasa vigente en el instante de confirmación, usada para reconstruir el USD histórico de ese pedido y no sustituida por tasas posteriores.
- **Importe de venta**: cantidad mostrada al cliente en la moneda elegida, derivada del importe base y de la tasa vigente (o de la tasa congelada, si se consulta un pedido ya confirmado). El total de venta en USD se deriva del total base COP, no de la suma de líneas convertidas.
- **Resultado de guardado administrativo**: estado comunicable de una persistencia (éxito, validación fallida, no autorizado, no confirmado), independiente del dato de negocio que se intentó guardar.
- **Administrador**: persona autenticada y autorizada para operar el panel y la tasa de conversión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de las personas de prueba localiza el selector de moneda y completa el cambio COP → USD o USD → COP en menos de 10 segundos, sin instrucciones previas.
- **SC-002**: En una pasada de aceptación que cubra inicio, catálogo, ficha, carrito y checkout, el 100% de los importes visibles usa la moneda elegida; al volver a COP coincide con los valores base originales; y, en USD, la tasa 1 USD = X COP aparece junto al selector y en el checkout, no en cada precio.
- **SC-003**: En el 100% de las pruebas de carrito y checkout, cambiar de moneda no altera cantidades, tallas, personalización ni el total base en COP; el pedido resultante registra la moneda de venta y la tasa vigentes al confirmar; y el total USD visible coincide con convertir una vez ese total COP, no con la suma de líneas convertidas.
- **SC-004**: El 100% de las pruebas con tasa ausente, cero o negativa deja la tienda en COP y muestra una explicación; ningún precio aparece como gratis por un redondeo a cero dólares.
- **SC-005**: Tras actualizar la tasa vigente, el 100% de los precios públicos en USD reflejan la nueva tasa en la siguiente consulta del cliente, sin reeditar cada producto, y el 100% de los pedidos ya confirmados conserva la tasa congelada original.
- **SC-006**: En una muestra de al menos diez acciones de guardar o crear del panel, el 100% comunica éxito o fallo de forma perceptible, y el 100% de los fallos inducidos (validación, sesión o red) no se presenta como éxito.
- **SC-007**: Al menos el 90% de los administradores de prueba identifica correctamente si el último guardado quedó persistido o no, en una sola mirada y en menos de 3 segundos después de ver el resultado.
- **SC-008**: En mediciones de aceptación sobre inicio y catálogo con conexión típica de hogar, el 90% de las primeras visitas muestra contenido útil (al menos una camiseta con nombre y precio) en menos de 3 segundos, y el 90% de las visitas repetidas a la misma página lo hace en menos de 2 segundos.
- **SC-009**: En fichas de producto, el 90% de las visitas de prueba permite leer nombre y precio y usar la acción de compra en menos de 3 segundos, aunque una imagen secundaria aún no haya terminado.
- **SC-010**: El 100% de las pruebas de autorización bloquea el cambio de tasa y los guardados del panel para sesiones no administrativas, sin revelar datos internos.

## Assumptions

- COP es la moneda base interna de precios, cálculos y persistencia de importes; USD es moneda de venta para clientes internacionales, convertida desde esa base.
- Esta entrega registra en el checkout la moneda elegida, los importes base en COP y la tasa usada al confirmar; muestra importes de venta en USD. No integra un proveedor de pagos en dólares. El flujo de pago existente (incluido el mock) se reutiliza.
- La tasa de conversión la define administración de forma manual como pesos por un dólar (1 USD = X COP); no se consume un servicio de mercado en tiempo real.
- La moneda por defecto es COP; no se infiere USD por ubicación, idioma del navegador ni cuenta.
- Los precios, costos y umbrales (por ejemplo envío gratis) se siguen capturando y evaluando en COP; el USD de venta se obtiene convirtiendo el resultado ya calculado.
- El redondeo de USD usa la convención habitual de dos decimales para importes de venta. El total oficial en USD se obtiene convirtiendo una vez el total base COP; no se recalcula el total COP desde dólares ni se arma sumando líneas ya redondeadas.
- “Botón de guardar” cubre las acciones explícitas de persistir o crear en el panel, no filtros, búsquedas ni navegación. Las eliminaciones pueden reutilizar el mismo patrón de éxito/fallo, pero el alcance mínimo son guardar y crear.
- El guardado masivo de productos con resultado por fila (feature `003-guardado-productos-admin`) conserva su detalle; esta feature añade confirmación global coherente y cubre el resto de secciones del panel.
- “Tiempo de carga” se evalúa como tiempo hasta contenido útil para el comprador, no como un indicador interno de infraestructura.
- La mejora de carga se limita a superficies públicas de descubrimiento y ficha; el panel administrativo no es el objetivo de esta optimización.
- Un importe que al convertir redondearía a 0,00 USD se muestra como el mínimo representable en dólares; no se etiqueta como gratis ni se mezcla COP en una vista USD.
- El idioma de la interfaz permanece en español, incluidos mensajes de moneda y de guardado.

## Out of Scope

- Mostrar la tasa de conversión en cada precio del catálogo o la ficha.
- Instantánea de importes USD por línea en el pedido (el USD histórico se recalcula con la tasa congelada).
- Integrar, autorizar o liquidar un proveedor de pagos en USD; esa integración se definirá después.
- Un segundo catálogo o lista de precios en dólares mantenida a mano.
- Monedas distintas de COP y USD, detección automática por país o conversión en vivo contra un mercado de divisas.
- Recalcular envío, impuestos, descuentos o umbrales comerciales como si las reglas se hubieran definido en USD.
- Cambiar la forma en que administración captura precios, costos o recargos (siguen en COP).
- Rediseñar el guardado masivo por fila de productos ni ampliar qué campos se editan en lote.
- Optimización de carga del panel administrativo, de importaciones masivas o de reportes.
- Nuevos roles, historial completo de quién cambió la tasa, o mensajes de marketing personalizados por moneda.
