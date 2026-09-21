# Especificación de Feature: Remodel y fixes de la tienda pública Flashsport

**Feature Branch**: `023-remodel-tienda-publica`

**Created**: 2026-09-20

**Status**: Draft — lista para planificación

**Input**: Remodel/fixes de la tienda pública Flashsport, inspeccionando el repositorio real. Se excluyen el panel admin y un rediseño total de marca.

## Contexto y objetivo

La tienda pública ya cuenta con rutas reales para home, catálogo, PDP, carrito, checkout, confirmación de pedido y páginas informativas. Esta feature corrige las fricciones que pueden producir una compra desinformada o incompleta y aplica un polish responsive, sin cambiar la identidad visual base ni los contratos de las rutas existentes. El resultado debe ser una experiencia honesta: el cliente entiende qué está comprando, cuándo lo recibe, cuánto paga, qué acepta y qué ocurre con el pago.

## Clarificaciones

### Session 2026-09-21

- Q: ¿Cómo debe validarse el stock inmediato durante el recorrido de compra? → A: Validar disponibilidad al añadir al carrito y revalidar atómicamente antes de crear el pedido/abrir Bold, sin reserva persistente durante la navegación.
- Q: ¿Cómo debe reflejarse el precio de la personalización? → A: Aplicar un recargo explícito por línea de personalización, incluido en el precio unitario y congelado en carrito, checkout y snapshot del pedido.
- Q: ¿Qué destinos deben permitir un checkout cobrable? → A: Solo Colombia; los destinos internacionales se muestran como cotización pendiente y bloquean la creación de un pedido pagable y la apertura de Bold.
- Q: ¿Cómo debe capturarse y evidenciarse el consentimiento legal? → A: Tres consentimientos separados, obligatorios y no preseleccionados, guardando para cada uno versión, fecha/hora y documento aceptado junto al pedido.
- Q: ¿Cómo debe activarse y protegerse Bold sandbox? → A: Usar `PAYMENT_PROVIDER=bold-sandbox` de forma explícita, mantener las llaves sandbox solo en servidor y bloquear el pago si faltan llaves o el modo configurado no coincide.

## Alcance

### In Scope

- Catálogo público (`/`, `/productos`, `/ligas/[slug]`, `/equipos/[slug]`): disponibilidad, precios, tallas, imágenes, filtros y estados vacíos coherentes con datos reales.
- Detalle de producto (`/productos/[slug]`): galería, variantes, tallas, personalización, modalidad de entrega, precio y CTA de carrito.
- Carrito (`/carrito`): líneas, personalización, stock inmediato, cupones existentes, envío y total recalculados de forma consistente.
- Checkout guest (`/checkout`): datos de contacto y envío, desglose de subtotal/descuento/envío/total, moneda y validaciones.
- Consentimiento y acceso a información legal antes de crear el pedido o abrir el pago.
- Bold en modo sandbox/pruebas, incluyendo configuración segura, firma, redirección y estados de éxito/fallo sin cobros de producción.
- Confirmación (`/pedido/confirmado/[code]`): estado comprensible del pedido y del pago, especialmente cuando el resultado es pendiente o no verificable.
- Mobile polish en las rutas públicas: navegación, filtros, cards, formularios, botones, tablas/resúmenes, foco y targets táctiles.
- Pruebas de regresión de dominio/UI existentes y escenarios manuales responsive.

### Out of Scope

- Cualquier ruta, layout, CRUD, autenticación o comportamiento del panel `/admin`.
- Rediseño total de marca, logotipo, paleta, tipografía principal, tono o arquitectura de navegación completa.
- Registro/login de clientes, cuenta persistente o historial autenticado.
- Nuevos carriers, tarifas dinámicas, múltiples métodos de envío o tracking logístico real.
- Integración productiva de Bold, conciliación financiera avanzada o cambio de proveedor de pagos.
- Importador de catálogo, nuevo modelo de producto, nuevas promociones o búsqueda full-text.
- Cambios destructivos de datos, migraciones de inventario no requeridas por un bug de compra.

## User Scenarios & Testing

### User Story 1 - Comprar con catálogo honesto (Priority: P1)

Como comprador casual, quiero distinguir claramente entre stock inmediato, bajo pedido y agotado, y ver un precio válido para la variante elegida, para no iniciar una compra basada en una promesa falsa.

**Why this priority**: La confianza en disponibilidad, precio y plazo es el requisito previo de todo el embudo público.

**Independent Test**: Con productos de las tres modalidades y variantes con precios/tallas distintos, recorrer catálogo y PDP en desktop y móvil; cada estado debe permitir solo la acción compatible y mostrar la información correspondiente.

**Acceptance Scenarios**:

1. **Given** una variante con stock positivo, **When** se muestra en catálogo y PDP, **Then** aparece “En stock”, la talla disponible y el plazo de despacho inmediato configurado.
2. **Given** una variante sin stock pero con `allowsBackorder`, **When** se muestra, **Then** aparece “Bajo pedido” con plazo estimado visible y el CTA no lo presenta como entrega inmediata.
3. **Given** una variante sin stock y sin backorder permitido, **When** se muestra, **Then** aparece “Agotado”, no se puede añadir al carrito y no se promete un precio de compra inexistente.
4. **Given** un producto con variantes de precios diferentes, **When** se selecciona versión y talla, **Then** el precio mostrado corresponde a esa combinación y el precio de referencia solo aparece si es válido.
5. **Given** un producto sin imagen primaria o con una imagen no disponible, **When** se carga una card o PDP, **Then** se muestra un fallback legible, no una imagen rota ni texto engañoso.

### User Story 2 - Elegir una camiseta y añadirla sin perder contexto (Priority: P1)

Como comprador, quiero seleccionar versión, talla, personalización y modalidad disponibles, para añadir exactamente la línea que pretendo comprar.

**Why this priority**: Evita errores de talla, personalización o modalidad antes de comprometer stock.

**Independent Test**: Abrir un PDP con varias combinaciones, intentar añadir configuraciones válidas e inválidas y verificar la línea resultante en `/carrito`.

**Acceptance Scenarios**:

1. **Given** una combinación válida, **When** se selecciona talla, modalidad y personalización válida, **Then** el CTA permite añadir y el carrito conserva todos los atributos de la línea.
2. **Given** una combinación sin stock inmediato pero vendible bajo pedido, **When** se selecciona “Bajo pedido”, **Then** se conserva esa modalidad y su ETA en carrito y checkout.
3. **Given** personalización activada, **When** falta nombre/número requerido o el jugador oficial no existe, **Then** el CTA permanece bloqueado o muestra un error accionable.
4. **Given** el usuario cambia versión o talla, **When** la combinación anterior deja de estar disponible, **Then** la modalidad y el CTA se reajustan sin añadir una variante distinta silenciosamente.

### User Story 3 - Revisar carrito y totales confiables (Priority: P1)

Como comprador, quiero ver un desglose verificable del pedido y recibir avisos cuando el stock cambie, para decidir antes de pagar.

**Why this priority**: Los totales y la reserva de stock son el último control contra sorpresas de pago.

**Independent Test**: Usar un carrito con líneas inmediatas, bajo pedido, personalización, cupón válido/inválido y subtotal a ambos lados del umbral de envío.

**Acceptance Scenarios**:

1. **Given** un carrito con líneas, **When** se abre `/carrito`, **Then** se muestran producto, versión, talla, personalización, modalidad/ETA, cantidades, subtotal, descuento, envío y total.
2. **Given** subtotal menor a $200.000 COP, **When** se recalcula el resumen, **Then** el envío nacional es $15.000 COP; al alcanzar o superar $200.000 COP, es gratis.
3. **Given** que se cambia cantidad, cupón o se elimina una línea, **When** termina la operación, **Then** subtotal, descuento, envío y total se actualizan sin valores de una versión anterior.
4. **Given** que el stock inmediato disminuye por debajo de la cantidad del carrito, **When** se valida el carrito o checkout, **Then** se reduce la cantidad o se impide el pago con un mensaje claro y el carrito queda coherente.
5. **Given** un cupón inválido, expirado o no aplicable, **When** se intenta usar, **Then** no se descuenta importe y se explica el motivo sin romper el resto del carrito.

### User Story 4 - Completar checkout con envío y consentimiento explícitos (Priority: P1)

Como comprador guest, quiero saber a dónde se envía, qué acepto y cuánto pagaré antes de abrir el pago, para completar el pedido con consentimiento informado.

**Why this priority**: El checkout combina datos personales, obligación comercial y dinero; un flujo ambiguo o sin consentimiento no es publicable.

**Independent Test**: Completar checkout en Colombia y seleccionar un destino internacional disponible, con campos inválidos, sin consentimiento y con consentimiento válido.

**Acceptance Scenarios**:

1. **Given** un carrito no vacío, **When** se completa el formulario, **Then** se validan nombre, correo, teléfono, dirección, ciudad, departamento/estado, país y campos requeridos antes del paso de pago.
2. **Given** destino Colombia, **When** se revisa el resumen, **Then** la moneda es COP y el método/alcance “Nacional” y tarifa aplicable son visibles.
3. **Given** destino fuera de Colombia soportado por el formulario, **When** se revisa el resumen, **Then** se identifica como destino internacional, no se presenta como envío nacional gratuito y se muestra la limitación/tarifa definida por negocio.
4. **Given** que no se marca la aceptación de términos, política de privacidad y tratamiento necesario de datos, **When** se intenta continuar, **Then** no se crea el pedido ni se abre Bold y se indican los enlaces y la acción faltante.
5. **Given** consentimiento válido, **When** se continúa, **Then** el resumen final coincide con carrito y el pedido conserva la moneda, totales, dirección y versión de términos aceptada.

### User Story 5 - Pagar en Bold sandbox y entender el resultado (Priority: P1)

Como comprador y operador de pruebas, quiero abrir Bold con credenciales sandbox y recibir un resultado seguro, para validar el flujo sin cobrar tarjetas reales.

**Why this priority**: Bold es el punto de conversión; el modo de pruebas debe ser reproducible y no debe mezclar secretos ni transacciones de producción.

**Independent Test**: Con el par de llaves de prueba configurado, ejecutar una tarjeta aprobada, una rechazada, cancelar/cerrar el modal y simular una respuesta tardía o no verificable.

**Acceptance Scenarios**:

1. **Given** `PAYMENT_PROVIDER` configurado para sandbox y llaves Bold de prueba, **When** el usuario confirma un checkout válido, **Then** se crea/prepara una referencia de pedido, se genera la firma en servidor y se abre Bold sin exponer el secreto.
2. **Given** cualquier monto o moneda no admitida por la configuración, **When** se prepara el pago, **Then** se rechaza antes de abrir Bold y no se crea una orden pagable con total inválido.
3. **Given** pago aprobado, rechazado, cancelado o pendiente, **When** Bold retorna o el usuario vuelve a confirmación, **Then** se muestra el estado correspondiente, el código de pedido y la siguiente acción sin marcar aprobado un estado no confirmado.
4. **Given** fallo de script, hash, red o configuración sandbox, **When** se intenta pagar, **Then** se conserva el carrito/pedido recuperable, se muestra un mensaje accionable y no se revela secreto, stack trace o datos internos.
5. **Given** entorno productivo, **When** se despliega esta feature, **Then** nunca se usan llaves sandbox ni se presenta un cobro de producción como prueba; el modo activo queda visible para validación operativa.

### User Story 6 - Usar la tienda cómodamente desde móvil (Priority: P2)

Como comprador móvil, quiero navegar, filtrar, revisar y pagar sin zoom horizontal ni controles difíciles de tocar, para completar la tarea con una mano.

**Why this priority**: La mayoría del tráfico esperado es móvil y los fixes deben ser utilizables, no solo correctos en escritorio.

**Independent Test**: Ejecutar los escenarios P1 en anchos 320, 375 y 768 CSS px, con teclado y lector de pantalla cuando aplique.

**Acceptance Scenarios**:

1. **Given** viewport de 320–375 px, **When** se navega home, catálogo, PDP, carrito y checkout, **Then** no existe scroll horizontal accidental ni contenido superpuesto/cortado.
2. **Given** filtros de catálogo en móvil, **When** se abren, aplican y limpian, **Then** el panel es alcanzable, conserva filtros en URL y permite cerrar sin perder el contexto.
3. **Given** formularios y CTAs, **When** se usan con toque o teclado, **Then** los controles tienen foco visible, etiquetas asociadas, mensajes de error próximos y targets táctiles cómodos.
4. **Given** una red lenta, **When** se cargan imágenes, estados o pago, **Then** se muestran estados de carga/error y el layout no salta de forma que oculte acciones.

### Edge Cases

- Producto activo sin variantes, sin precio válido, sin imágenes o con todas las variantes agotadas.
- Cambio de stock entre PDP, carrito, creación del pedido y retorno desde Bold.
- Carrito abandonado durante la navegación sin reserva persistente de stock; la disponibilidad debe confirmarse nuevamente antes del pedido/pago.
- Carrito persistido con datos de una versión anterior del producto, precio, moneda o modalidad.
- Mezcla de líneas inmediatas y bajo pedido, incluyendo personalización con recargo y cupón.
- Cambio o eliminación de personalización después de mostrar el precio; el recargo debe actualizarse solo en la línea afectada y quedar congelado al crear el snapshot del pedido.
- Subtotal exactamente igual a $200.000 COP y subtotal cercano al umbral por descuento.
- País internacional seleccionado: debe mostrarse “cotización pendiente” y bloquearse el pedido pagable y la apertura de Bold.
- Doble clic en continuar/pagar, refresh durante el modal Bold, cierre del modal, timeout y retorno sin referencia.
- `PAYMENT_PROVIDER` ausente o distinto de `bold-sandbox`, o llaves sandbox faltantes: el pago debe bloquearse antes de abrir Bold sin exponer secretos.
- Webhook o consulta Bold repetida, firma inválida, monto/moneda que no coincide y estado desconocido.
- Consentimiento desmarcado después de validar el formulario, enlaces legales inaccesibles o texto legal no publicado; cada uno de los tres consentimientos debe bloquear el avance de forma independiente.
- Nombres largos, cantidades de dos dígitos, zoom del navegador, teclado virtual y orientación horizontal en móvil.
- Fallo de imagen externa, script de Bold o API de stock sin exponer información sensible.

## Requirements

### Functional Requirements

- **FR-001**: La tienda pública MUST calcular y mostrar disponibilidad por variante usando stock real y `allowsBackorder`, distinguiendo “En stock”, “Bajo pedido” y “Agotado”.
- **FR-002**: La tienda pública MUST impedir añadir o pagar una variante agotada y MUST evitar presentar stock bajo pedido como despacho inmediato.
- **FR-003**: La tienda pública MUST mostrar el precio de la variante seleccionada y ocultar precios inválidos o de referencia no sustentados por datos reales.
- **FR-004**: El PDP MUST conservar versión, talla, modalidad, personalización, recargo explícito por línea y cantidad al crear una línea de carrito; el precio unitario resultante MUST incluir ese recargo y mantenerse idéntico en carrito, checkout y snapshot del pedido.
- **FR-005**: El carrito MUST recalcular subtotal, descuento, envío y total después de cada mutación y MUST aplicar la regla nacional vigente de $15.000 COP o envío gratis desde $200.000 COP.
- **FR-006**: La tienda MUST validar la disponibilidad al añadir una línea al carrito y MUST revalidar atómicamente el stock inmediato antes de crear el pedido o abrir Bold; no se mantendrá una reserva persistente durante la navegación. Si el stock cambió, MUST reconciliar cantidades sin sobrescribir silenciosamente la intención del comprador.
- **FR-007**: El checkout MUST validar los datos guest obligatorios y MUST mostrar país, alcance de envío, moneda, desglose y total final antes del pago.
- **FR-008**: El checkout cobrable MUST limitarse a Colombia. Para destinos no colombianos, el formulario MUST mostrar “cotización pendiente”, diferenciar el envío internacional de la tarifa nacional y bloquear la creación de un pedido pagable y la apertura de Bold.
- **FR-009**: El checkout MUST exigir tres consentimientos separados, explícitos, obligatorios y no preseleccionados para términos/condiciones, política de privacidad y tratamiento necesario de datos. Para cada consentimiento MUST guardar junto al pedido el documento aceptado, su versión y fecha/hora.
- **FR-010**: La interfaz MUST publicar enlaces accesibles a términos, política de privacidad, cambios/devoluciones y contacto desde footer y checkout, sin inventar datos legales no confirmados.
- **FR-011**: El flujo de pago MUST activarse únicamente con `PAYMENT_PROVIDER=bold-sandbox` explícito para esta feature, usar exclusivamente llaves sandbox mantenidas en servidor y bloquear el pago con un error operativo accionable si faltan llaves o el modo configurado no coincide; la firma MUST generarse con el pedido, monto y moneda finales.
- **FR-012**: El flujo Bold MUST aceptar solo referencias, montos enteros y monedas soportadas; MUST rechazar discrepancias antes de abrir el checkout.
- **FR-013**: La confirmación MUST representar aprobado, rechazado, pendiente, cancelado y no verificable como estados distintos, y MUST ser idempotente ante retornos o webhooks repetidos.
- **FR-014**: Un error de pago o red MUST conservar una vía de recuperación, no limpiar el carrito antes de una preparación exitosa y no mostrar secretos, trazas ni datos de otros clientes.
- **FR-015**: Las rutas públicas MUST ser utilizables en 320–375 px sin scroll horizontal involuntario, y sus controles MUST ser navegables por teclado con foco visible y etiquetas asociadas.
- **FR-016**: Los filtros móviles MUST conservar el estado en la URL, mostrar cantidad de filtros activos y permitir limpiar/restaurar resultados sin perder el contexto.
- **FR-017**: Las imágenes, cargas, errores y estados vacíos MUST tener fallback legible y no bloquear la exploración o la recuperación del usuario.
- **FR-018**: La feature MUST conservar las rutas públicas, el guest checkout, el esquema de dominio y la navegación de marca existente, sin modificar `/admin`.

### Key Entities

- **Producto/Variante**: Camiseta pública con equipo, temporada, versión, talla, imágenes, precio, disponibilidad y reglas de personalización.
- **Línea de carrito**: Selección concreta de variante, cantidad, modalidad y personalización con precio calculado.
- **Carrito/Resumen de checkout**: Conjunto temporal de líneas y desglose de subtotal, descuento, envío, moneda y total.
- **Pedido**: Compra guest con datos de contacto/envío, snapshot de líneas y precios, modalidad, consentimiento y estado de pago.
- **Consentimiento**: Evidencia de aceptación de documentos legales con identificador/versión y momento.
- **Transacción Bold**: Referencia externa, moneda, monto, firma, estado y resultado verificable del pago.
- **Configuración de envío**: Regla nacional vigente, umbral, tarifa y cobertura internacional explícita.

## Dependencias reales

- Rutas y componentes actuales bajo `src/app` y `src/features/{products,cart,checkout,orders,payments}`.
- Prisma/PostgreSQL y modelos existentes de producto, variante, inventario, pedido y cliente guest.
- `src/shared/config/site.ts` para país, contacto y regla nacional de envío; requiere fuente de verdad para cobertura internacional.
- Variables `PAYMENT_PROVIDER`, `BOLD_IDENTITY_KEY`, `BOLD_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_*` y el script público de Bold.
- Endpoints existentes `/api/bold/hash`, `/api/bold/reconcile` y `/api/webhooks/bold`, más contratos de estados y firma ya cubiertos por pruebas de dominio.
- Contenido legal aprobado por el negocio y URL pública HTTPS para términos, privacidad, cambios/devoluciones y contacto.
- Base de datos/seed con variantes representativas de stock, backorder, precio, imágenes y personalización.
- Validación existente con `npm`/TypeScript, ESLint y tests `node:test`; no se asume suite E2E configurada.

## Success Criteria

### Measurable Outcomes

- **SC-001**: En pruebas con 30 productos y al menos una variante por estado, el 100% de cards y PDP muestran el estado de disponibilidad y precio que corresponde a los datos de inventario/precio.
- **SC-002**: En 20 recorridos de compra válidos, al menos 19 muestran el mismo subtotal, descuento, envío y total en carrito, checkout y pedido creado; ninguna discrepancia supera $1 COP por redondeo.
- **SC-003**: En 20 intentos con stock insuficiente o cambiado, 100% bloquea/reconcilia el pago antes de abrir Bold y deja un mensaje recuperable.
- **SC-004**: En 15 intentos de checkout sin consentimiento, 0 crea pedido pagable o abre Bold; con consentimiento válido, 100% guarda la evidencia esperada.
- **SC-005**: En una matriz de 12 escenarios Bold sandbox (aprobado, rechazado, cancelado, pendiente, timeout, firma/monto/moneda inválidos), cada resultado se presenta con estado correcto y 0 secretos en HTML, logs de cliente o respuesta pública.
- **SC-006**: En viewport de 320, 375, 768 y 1440 px, 100% de las rutas públicas críticas pasa una revisión sin scroll horizontal accidental, CTA cortado ni control inaccesible por teclado.
- **SC-007**: Al menos 90% de cinco compradores de prueba puede explicar antes de pagar si su camiseta es inmediata o bajo pedido, el total final y qué documentos acepta.
- **SC-008**: La tasa de recuperación tras error de pago en pruebas manuales es al menos 90% sin perder líneas del carrito ni duplicar pedidos.

## Assumptions

- El negocio seguirá operando inicialmente en Colombia; la tarifa nacional de $15.000 COP y envío gratis desde $200.000 COP son la regla vigente.
- La disponibilidad se valida al añadir al carrito y mediante una revalidación atómica antes de crear el pedido/abrir Bold; no se reserva stock de forma persistente durante la navegación.
- El checkout cobrable se limita a Colombia. Los países internacionales que ya aparecen en el formulario se muestran como “cotización pendiente” y bloquean el pedido pagable y la apertura de Bold hasta contar con una regla aprobada.
- “Catálogo honesto” significa derivar disponibilidad y precio desde la variante/ledger real, no mostrar datos de marketing que contradigan esos datos.
- La personalización aplica un recargo explícito por línea; dicho recargo forma parte del precio unitario mostrado y se congela en el snapshot del pedido.
- La aceptación legal será obligatoria para crear el pedido mediante tres consentimientos separados, no preseleccionados, para términos/condiciones, privacidad y tratamiento necesario de datos; cada uno conservará documento, versión y fecha/hora. El texto y las versiones concretas los proporciona el negocio antes de producción.
- Bold sandbox se activa únicamente con `PAYMENT_PROVIDER=bold-sandbox`, usando el par de identidad/secreto de pruebas exclusivamente en servidor y tarjetas de prueba del proveedor; si faltan llaves o el modo no coincide, se bloquea el pago. Producción queda para otra feature.
- Se mantiene checkout sin cuenta, moneda COP para Colombia y la conversión existente solo donde el flujo internacional esté soportado.
- Las mejoras visuales reutilizan tokens y componentes actuales; no requieren una nueva marca.

## Ambigüedades reportadas (no bloqueantes para planificar)

1. El repositorio lista países internacionales pero solo define una tarifa nacional; producto/legal debe confirmar cobertura, transportadora y cálculo internacional antes de habilitar cobro fuera de Colombia.
2. Deben entregarse las URLs y versiones oficiales de términos, privacidad y cambios/devoluciones; la especificación exige el comportamiento, no inventa el texto legal.
3. El entorno local contiene llaves Bold vacías y el proveedor activo puede variar por despliegue; la planificación debe confirmar el procedimiento de carga de llaves sandbox y la bandera de entorno.
4. La matriz de dispositivos objetivo exacta y el umbral de accesibilidad automatizada no están documentados; se propone 320/375/768/1440 px y revisión de teclado como baseline.
