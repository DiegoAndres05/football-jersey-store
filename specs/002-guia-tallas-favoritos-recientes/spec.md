# Feature Specification: Guía de tallas, favoritos y vistos recientemente

**Feature Branch**: `002-guia-tallas-favoritos-recientes`

**Created**: 2026-09-03

**Status**: Draft

**Input**: User description: "Guía de tallas interactiva, favoritos y productos vistos recientemente para reducir dudas y facilitar la comparación, incluso sin registro."

## Clarifications

### Session 2026-09-03

- Q: ¿Cómo debe calcularse la recomendación de talla? → A: Usar la tabla existente de altura y peso, diferenciando camisetas Fan y Player.
- Q: ¿Cómo debe presentarse la guía al cliente? → A: Mostrar una invitación dinámica en la ficha; al abrirla solicita altura y peso y recomienda la talla.
- Q: ¿Qué datos contiene la tabla Fan existente? → A: Rangos de altura y peso para adulto masculino, con tolerancia de medición de 1 cm, desde S hasta 4XL; también contiene largo, pecho, manga corta, ancho de puño y manga larga.
- Q: ¿Cómo resolver el solapamiento de altura entre 3XL y 4XL? → A: Priorizar el peso cuando la altura coincida con dos tallas.
- Q: ¿Qué datos contiene la tabla Player existente? → A: Rangos de altura y peso para adulto masculino desde S hasta 2XL, con medidas físicas de la prenda; 3XL y 4XL no tienen datos de recomendación.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar la talla recomendada (Priority: P1)

Como comprador de una camiseta, quiero abrir una ayuda visible que me pregunte mi altura y peso para recibir una recomendación de talla contextualizada, de modo que pueda comprar con mayor confianza y reducir el riesgo de cambios o devoluciones por una talla inadecuada.

**Why this priority**: La incertidumbre sobre el ajuste afecta directamente la decisión de compra y puede generar devoluciones; resolverla es el mayor valor inmediato de la feature.

**Independent Test**: Con cualquier producto que tenga tallas disponibles, una persona puede abrir la guía, introducir altura y peso válidos, obtener una recomendación y usarla para seleccionar una talla sin depender de favoritos, historial ni registro.

**Acceptance Scenarios**:

1. **Given** una persona está en la ficha de un producto con variantes de varias tallas, **When** pulsa una invitación como "¿No sabes qué talla eres?" y completa altura y peso válidos, **Then** recibe una talla recomendada y una explicación breve orientada a la decisión.
2. **Given** la persona ya recibió una recomendación, **When** cambia su altura o peso, **Then** la recomendación se actualiza y la interfaz deja claro cuál es la recomendación vigente.
3. **Given** la recomendación corresponde a una talla que no está disponible para la versión elegida, **When** la persona consulta el resultado, **Then** se informa la indisponibilidad y se ofrecen las tallas disponibles de esa combinación sin presentar la talla agotada como opción de compra.
4. **Given** la persona introduce valores ausentes, no numéricos o fuera de los límites razonables, **When** intenta solicitar la recomendación, **Then** recibe un mensaje específico, conserva sus datos corregibles y no se muestra una recomendación engañosa.

### User Story 2 - Guardar y comparar favoritos (Priority: P2)

Como comprador que está comparando camisetas, quiero guardar productos como favoritos y consultarlos después, para retomar mi selección sin tener que buscarlos de nuevo.

**Why this priority**: Comparar opciones es una conducta habitual antes de comprar; conservar la selección reduce fricción y apoya una decisión más informada después de resolver la talla.

**Independent Test**: Una persona no registrada puede marcar y desmarcar productos desde el catálogo o una ficha, abrir su lista de favoritos y volver a la ficha de cualquiera de ellos sin que el carrito sea necesario.

**Acceptance Scenarios**:

1. **Given** una persona visita un producto que no está guardado, **When** activa el control de favorito, **Then** el producto queda guardado, el control refleja el nuevo estado y se ofrece una confirmación accesible.
2. **Given** una persona tiene varios productos guardados, **When** abre la vista de favoritos, **Then** ve cada producto con su imagen, nombre, precio vigente y estado de disponibilidad, ordenado del más recientemente guardado al más antiguo.
3. **Given** un producto está guardado, **When** la persona vuelve a activar su control de favorito, **Then** deja de aparecer en la lista y el resto de favoritos permanece intacto.
4. **Given** la persona no ha iniciado sesión, **When** cierra y vuelve a abrir el sitio en el mismo navegador, **Then** sus favoritos siguen disponibles y no se le exige crear una cuenta para usarlos.
5. **Given** un favorito dejó de estar activo o disponible, **When** la persona consulta su lista, **Then** el producto se identifica como no disponible y puede retirarlo sin que la lista falle.

### User Story 3 - Recuperar productos vistos recientemente (Priority: P3)

Como comprador que explora el catálogo, quiero volver rápidamente a productos que vi antes, para continuar comparando sin depender de recordar nombres o repetir filtros.

**Why this priority**: El historial mejora la navegación y la comparación, pero es posterior a resolver la talla y conservar intenciones explícitas de compra mediante favoritos.

**Independent Test**: Una persona no registrada visita varias fichas y puede ver y abrir una lista de productos vistos recientemente, sin alterar el contenido del carrito ni requerir autenticación.

**Acceptance Scenarios**:

1. **Given** una persona abre una ficha de producto activa, **When** termina de cargarla, **Then** el producto se incorpora a vistos recientemente con su imagen, nombre, precio vigente y enlace a la ficha.
2. **Given** la persona visita de nuevo un producto ya registrado, **When** vuelve a la lista de vistos recientemente, **Then** aparece una sola vez y ocupa la posición más reciente.
3. **Given** la persona ha visto más productos que el límite establecido, **When** consulta la lista, **Then** se muestran únicamente los productos más recientes dentro del límite y los más antiguos se descartan automáticamente.
4. **Given** un producto visto ya no está activo o no puede cargarse, **When** la persona abre la lista, **Then** el resto de la lista funciona y el producto no disponible se marca o se puede retirar sin error.
5. **Given** la persona no está registrada, **When** vuelve al sitio en el mismo navegador, **Then** puede recuperar sus vistos recientes sin iniciar sesión.

### Edge Cases

- La altura y el peso deben aceptar unidades habituales para clientes en Colombia, mostrar claramente la unidad esperada y rechazar valores negativos, cero o físicamente inverosímiles.
- La guía debe funcionar cuando el producto tiene una sola talla, variantes incompletas o ninguna variante comprable; en esos casos debe explicar la limitación en lugar de inventar una recomendación.
- Si los datos caen entre dos tallas o la combinación de altura y peso entra en conflicto con la tabla disponible, la guía debe indicar la incertidumbre y presentar una recomendación principal con una alternativa cercana cuando corresponda.
- Un producto puede cambiar de precio, imagen, disponibilidad o estado después de guardarse o verse; la lista debe mostrar la información vigente y no conservar datos de compra obsoletos.
- La eliminación de datos locales, el bloqueo de almacenamiento del navegador o un dato guardado corrupto no debe impedir navegar, consultar el catálogo, usar el carrito ni completar el checkout invitado.
- Favoritos y vistos recientes no deben incluir variantes, personalización, cantidades ni modalidad de entrega: guardan productos y la decisión de variante se toma al volver a la ficha.
- Los datos de altura, peso, favoritos y vistos recientes son privados del navegador o de la sesión del comprador y no deben exponerse a otros clientes ni al área administrativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar en la ficha de producto una invitación clara, como "¿No sabes qué talla eres?", que abra la guía de tallas y permita introducir altura y peso.
- **FR-002**: El sistema MUST validar cada dato de entrada, indicar la unidad utilizada y mostrar errores comprensibles antes de calcular una recomendación.
- **FR-003**: El sistema MUST producir una talla recomendada a partir de los datos válidos y de la tabla existente correspondiente a Fan o Player, y explicar que se trata de una orientación, no de una garantía de ajuste.
- **FR-004**: El sistema MUST actualizar la recomendación cuando cambien la altura o el peso y MUST considerar las tallas y variantes realmente disponibles para el producto consultado.
- **FR-005**: El sistema MUST comunicar cuando no puede recomendar una talla con fiabilidad y MUST ofrecer la información de tallas disponibles o una vía de ayuda sin bloquear la compra.
- **FR-006**: El sistema MUST permitir guardar y quitar un producto de favoritos desde las superficies de catálogo y ficha de producto.
- **FR-007**: El sistema MUST mostrar una vista de favoritos con imagen, nombre, precio vigente, disponibilidad y enlace de retorno a cada producto guardado.
- **FR-008**: El sistema MUST permitir usar favoritos sin registro y conservarlos al regresar en el mismo navegador, sin crear una identidad de cliente implícita.
- **FR-009**: El sistema MUST permitir retirar favoritos individualmente y mostrar un estado vacío útil cuando no existan productos guardados.
- **FR-010**: El sistema MUST registrar un producto activo como visto recientemente al abrir su ficha y mantener una lista consultable desde la experiencia de compra.
- **FR-011**: El sistema MUST evitar duplicados en vistos recientemente, mover al inicio el producto vuelto a visitar y conservar solo los 12 productos más recientes.
- **FR-012**: El sistema MUST permitir recuperar vistos recientemente sin registro y MUST degradar la lista de forma controlada si el navegador no puede conservarla.
- **FR-013**: El sistema MUST reflejar la disponibilidad y el precio vigentes al mostrar favoritos o vistos recientes, sin prometer una variante o reserva que ya no exista.
- **FR-014**: El sistema MUST mantener independientes la guía, favoritos y vistos recientes: una falla o ausencia de datos en una capacidad no debe impedir las otras ni el catálogo, carrito o checkout invitado.
- **FR-015**: El sistema MUST proteger los datos de uso personal de modo que no sean visibles para otros compradores ni para personal administrativo salvo que una futura necesidad explícita lo autorice.
- **FR-016**: El sistema MUST ofrecer controles con nombre accesible, estado perceptible y comportamiento usable con teclado y pantallas pequeñas.

### Key Entities

- **Perfil de medidas**: datos temporales de altura y peso introducidos por el comprador para orientar la elección de talla; no representa una cuenta ni un diagnóstico corporal.
- **Recomendación de talla**: resultado contextual que relaciona un perfil de medidas con una talla y las variantes disponibles de un producto, incluyendo la explicación o advertencia necesaria.
- **Favorito de producto**: referencia privada a un producto que el comprador desea conservar para comparar o visitar después, con su orden de guardado y estado vigente al consultarlo.
- **Producto visto recientemente**: referencia privada a un producto cuya ficha fue visitada, con la fecha de última visita y posición en el historial limitado.
- **Producto y variante**: producto comercial del catálogo y combinación de versión/talla que determina precio, disponibilidad y posibilidad de compra; sirven como fuente vigente para las tres capacidades.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de las personas que introducen datos válidos obtienen una recomendación o una explicación accionable en menos de 60 segundos.
- **SC-002**: En pruebas moderadas, al menos el 85% de las personas puede identificar y seleccionar la talla recomendada sin pedir ayuda adicional.
- **SC-003**: La tasa de errores de selección de talla reportados en cambios o devoluciones disminuye al menos un 15% entre compradores que usan la guía, comparada con la línea base previa de la tienda.
- **SC-004**: Al menos el 90% de las personas puede guardar, consultar y retirar un favorito en menos de 30 segundos, sin registro.
- **SC-005**: Al menos el 90% de las personas puede volver desde vistos recientemente a un producto previamente abierto en menos de 15 segundos.
- **SC-006**: En una sesión sin registro, favoritos y vistos recientes se conservan correctamente en al menos el 95% de los navegadores compatibles cuando el almacenamiento local está disponible.
- **SC-007**: Ninguna de las tres capacidades impide completar una navegación de catálogo o un checkout invitado cuando sus datos están vacíos, desactualizados o no pueden conservarse.
- **SC-008**: En una prueba de accesibilidad de las superficies incluidas, el 100% de los controles de abrir, calcular, guardar, retirar y volver tiene nombre accesible, estado comunicable y operación por teclado.

## Assumptions

- La tabla existente de altura y peso es la fuente interna de recomendación y diferencia entre camisetas Fan y Player; el cliente no necesita consultar la tabla manualmente para obtener una recomendación.
- La tabla Fan proporcionada corresponde a `adult_men_fan_version_jersey`, usa centímetros y kilogramos, y define estos rangos de recomendación: S (160-170 cm, 60-65 kg), M (170-175 cm, 66-70 kg), L (175-180 cm, 71-75 kg), XL (180-185 cm, 76-80 kg), 2XL (185-190 cm, 81-87 kg), 3XL (190-195 cm, 88-95 kg) y 4XL (190-199 cm, 96-105 kg).
- La tabla Player proporcionada corresponde a `adult_men_player_version_jersey`, usa centímetros y kilogramos, y define estos rangos: S (160-165 cm, 55-60 kg), M (165-170 cm, 60-70 kg), L (170-175 cm, 70-80 kg), XL (175-185 cm, 80-92.5 kg), 2XL (185-190 cm, 90-95 kg). Player 3XL y 4XL no tienen rangos ni medidas, por lo que no deben producir una recomendación automática.
- La tabla Fan incluye una tolerancia de medición de 1 cm y medidas físicas de la prenda; estas últimas pueden mostrarse como información complementaria, pero la recomendación inicial se basa en altura y peso. Cuando la altura coincida con dos tallas, se prioriza la coincidencia del peso.
- La tabla Player incluye una tolerancia de medición de 1 cm y medidas físicas de la prenda; la misma regla de priorizar el peso se aplica cuando los rangos de altura se solapen.
- Las unidades predeterminadas serán centímetros para altura y kilogramos para peso, con etiquetas visibles y una conversión clara si se admiten otras unidades.
- Se utilizará una política inicial de hasta 12 vistos recientes; el comprador podrá retirar entradas individuales y limpiar la lista completa si la interfaz lo ofrece.
- Favoritos y vistos recientes se conservarán para el visitante en el mismo navegador; no se sincronizarán entre dispositivos ni se asociarán automáticamente a la cuenta administrativa existente.
- Una futura cuenta de cliente podría sincronizar estas preferencias, pero esa migración y cualquier pantalla de cuenta quedan fuera de esta feature.
- Los precios, imágenes, nombres y estados de disponibilidad se volverán a consultar al mostrar una referencia guardada, y nunca se interpretarán como una reserva.
- El catálogo, las fichas de producto, variantes, carrito persistente y checkout invitado existentes seguirán siendo las superficies de compra de referencia.
- La recomendación se evaluará con la tabla existente de altura y peso, diferenciada para camisetas Fan y Player; la feature no promete precisión médica ni un ajuste perfecto.

## Out of Scope

- Crear cuentas de cliente, autenticación de compradores o sincronización de favoritos/vistos entre dispositivos.
- Guardar medidas corporales en un perfil permanente, analizarlas con fines de marketing o exponerlas al personal administrativo.
- Sustituir la tabla de tallas, modificar precios, inventario, variantes, políticas de cambios o flujo de checkout.
- Recomendar productos distintos por estilo corporal o realizar asesoría humana automática; la guía se limita a orientar la talla del producto consultado.
- Comparación avanzada lado a lado, alertas de precio o disponibilidad, notificaciones, compartir favoritos y listas colaborativas.
- Cambiar el contrato visual o funcional del carrito, la personalización de camisetas y la modalidad de entrega.
