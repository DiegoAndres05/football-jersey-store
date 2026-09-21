# Especificación de Feature: Remodel del panel de administración de Flashsport

**Feature Branch**: `022-remodel-panel-admin`

**Created**: 2026-09-20

**Status**: Draft

**Input**: Remodel del panel de administración de Flashsport según la auditoría UX proporcionada, respetando las rutas y restricciones reales del repositorio. Esta fase produce únicamente especificación.

## Clarifications

### Session 2026-09-20

- Q: ¿Debe el remodel conservar las rutas y contratos reales existentes, rediseñando el shell, el dashboard y las páginas actuales dentro de esas rutas? → A: Opción B — mantener las rutas y contratos reales, rediseñando el shell, dashboard y páginas existentes dentro de esas rutas.
- Q: ¿Qué período debe utilizar el dashboard para resumir los pedidos? → A: Opción B — pedidos de los últimos 30 días e inventario como estado actual.
- Q: Cuando un pedido no pueda abrir su detalle por datos incompletos o un error, ¿qué comportamiento debe tener? → A: Mostrar una página de detalle con estado de error y acciones de recuperación, sin exponer detalles internos.
- Q: ¿Qué comportamiento debe quedar para los avisos de Telegram cuando no estén configurados? → A: Ocultar el bloque si Telegram no está configurado y mostrarlo solo cuando esté disponible.

## User Scenarios & Testing

### User Story 1 - Orientarse y navegar el panel (Priority: P1)

Como persona administradora, quiero identificar rápidamente el estado de la tienda y llegar a cualquier área administrativa desde una navegación clara, para completar tareas sin perder contexto ni recorrer una lista plana de enlaces.

**Why this priority**: El shell compartido afecta todas las tareas y es el principal punto de fricción observado; mejorarlo entrega valor a todos los flujos.

**Independent Test**: Con una sesión autenticada, la persona reconoce la página actual, abre Panel, Pedidos, Productos e Inventario, vuelve a la tienda y cierra sesión desde escritorio y móvil.

**Acceptance Scenarios**:

1. **Given** una sesión válida en cualquier ruta bajo `/admin`, **When** la persona observa el shell, **Then** ve marca, usuario actual, navegación agrupada, sección activa y acciones “Ver tienda” y “Salir”.
2. **Given** una pantalla estrecha, **When** la persona abre el panel, **Then** accede a todas las secciones sin enlaces cortados, superpuestos ni zoom.
3. **Given** una persona no autenticada, **When** intenta abrir una ruta administrativa, **Then** es enviada a `/admin/login` sin ver contenido administrativo.

### User Story 2 - Revisar operaciones desde el dashboard (Priority: P1)

Como persona administradora, quiero ver un resumen accionable de pedidos e inventario, para decidir qué atender primero sin abrir varias páginas manualmente.

**Why this priority**: `/admin` debe ser un punto de entrada operativo y no solo un título; un resumen reduce el tiempo de diagnóstico.

**Independent Test**: Con pedidos e inventario bajo de prueba, la persona identifica los indicadores y abre el detalle correspondiente con un máximo de un clic por indicador.

**Acceptance Scenarios**:

1. **Given** pedidos e inventario existentes, **When** la persona abre `/admin`, **Then** ve métricas de pedidos y alertas de inventario con alcance claro y enlaces a `/admin/pedidos` o `/admin/inventario`.
2. **Given** no hay datos para una métrica, **When** consulta el dashboard, **Then** ve un estado vacío explícito y una acción útil, no una tarjeta rota.
3. **Given** datos que cambian entre cargas, **When** recarga el dashboard, **Then** los indicadores reflejan el estado actual sin alterar registros.

### User Story 3 - Gestionar pedidos con contexto (Priority: P1)

Como persona administradora, quiero filtrar y revisar pedidos desde una lista legible y navegar al detalle conservando contexto, para procesarlos con menos búsquedas y confusiones entre entrega inmediata y bajo pedido.

**Why this priority**: Pedidos es un flujo operativo crítico y la ruta actual solo expone filtros de modalidad.

**Independent Test**: Con pedidos de ambas modalidades y distintos estados, la persona filtra, identifica un pedido y abre `/admin/pedidos/[id]`, donde interpreta líneas, cupón, total y estado de notificación.

**Acceptance Scenarios**:

1. **Given** pedidos de varias modalidades, **When** selecciona “Todos”, “Entrega inmediata” o “Bajo pedido”, **Then** la lista conserva el filtro en la URL y muestra los pedidos correspondientes.
2. **Given** un pedido listado, **When** lo abre, **Then** el detalle muestra cliente, total COP, líneas con producto/versión/talla/cantidad/modalidad, cupón si existe y estado del aviso, con retorno claro a la lista.
3. **Given** un pedido inexistente, datos incompletos o una acción no permitida, **When** intenta acceder o reintentar una notificación, **Then** permanece dentro de una página de detalle administrativa con error comprensible, acciones de recuperación y sin detalles internos ni mutaciones parciales.

### User Story 4 - Gestionar catálogo, variantes e inventario (Priority: P2)

Como persona administradora, quiero pasar de un producto a sus imágenes y variantes, y desde allí entender y ajustar existencias con señales consistentes, para mantener el catálogo vendible sin romper el historial.

**Why this priority**: Productos, variantes e inventario están relacionados pero hoy se recorren como páginas separadas; conectarlos reduce errores de navegación.

**Independent Test**: Con un producto con varias variantes y movimientos, la persona identifica stock bajo/agotado, edita una variante o registra un ajuste y verifica el resultado sin borrar historial.

**Acceptance Scenarios**:

1. **Given** un producto en `/admin/productos`, **When** abre sus acciones, **Then** llega de forma distinguible a edición, imágenes y variantes, y ve si está visible u oculto.
2. **Given** variantes con stock positivo, bajo, agotado o vendible bajo pedido, **When** consulta productos o `/admin/inventario`, **Then** cada estado tiene etiqueta y explicación consistente.
3. **Given** una variante existente, **When** registra un ajuste, **Then** el stock refleja la suma de movimientos y el historial no se elimina ni reescribe.
4. **Given** un producto con variantes, proveedores, imágenes o movimientos, **When** intenta eliminarlo, **Then** el panel explica la regla y ofrece ocultarlo cuando aplique.

### Edge Cases

- La navegación funciona con pocas o muchas secciones sin depender de una anchura fija.
- El dashboard tolera cero pedidos, cero variantes, stock negativo derivado de movimientos o movimientos sin variante visible, mostrando estados explicables.
- Un pedido puede no tener cupón o configuración de notificación; el detalle distingue “sin configurar” de “falló”.
- Los datos pueden cambiar mientras se visualiza una lista; las acciones validan el estado actual y evitan sobrescribir cambios ajenos.
- Productos con muchas variantes o nombres largos siguen siendo legibles e identificables.
- El acceso directo a subrutas conserva shell y breadcrumb.
- Los errores no muestran trazas, credenciales, datos de otros clientes ni permiten mutaciones parciales.

## Scope

### In Scope

- Remodel visual y de interacción del shell compartido de `/admin`: navegación, sección activa, responsive, jerarquía y estados, dentro de la ruta y el contrato existentes.
- Rediseño del dashboard `/admin` con resumen operativo de pedidos e inventario y enlaces accionables, sin sustituir su ruta ni sus contratos.
- Rediseño de la presentación y navegación de `/admin/pedidos` y `/admin/pedidos/[id]`, conservando filtros y acciones existentes.
- Rediseño de la presentación y navegación de `/admin/productos`, `/admin/productos/[slug]/variantes` y `/admin/productos/[slug]/imagenes`.
- Rediseño de la presentación de `/admin/inventario`, incluyendo señales y agrupación que reduzcan la carga de revisión.
- Consistencia de mensajes, formatos COP, confirmaciones y accesibilidad.
- Conservación de autenticación, autorización, ledger inmutable, snapshots y reglas de no eliminación destructiva.

### Out of Scope

- Cambiar permisos, autenticación, sesiones o credenciales.
- Rediseñar tienda pública, checkout, pagos, notificaciones externas o login fuera de estados de entrada.
- Cambiar reglas de precios, descuentos, modalidades, reservas, disponibilidad o transiciones.
- Añadir reportes avanzados, analítica histórica, compras a proveedores, roles multiusuario o auditoría nueva.
- Migrar datos, sustituir Prisma, cambiar almacenamiento de imágenes o reemplazar el ledger.
- Implementar código: esta fase solo define el contrato para planificación.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE proteger las rutas bajo `/admin` mediante la sesión y autorización existentes, redirigiendo a `/admin/login` sin sesión válida.
- **FR-002**: El shell DEBE mostrar navegación agrupada, sección activa, breadcrumbs o equivalente en subrutas y acciones “Ver tienda” y “Salir”, manteniendo la ruta y el contrato de cada página existente.
- **FR-003**: El shell DEBE ser usable con teclado y lector de pantalla, con foco visible, nombres accesibles, orden lógico y salto al contenido principal.
- **FR-004**: El shell DEBE adaptarse a móvil, tablet y escritorio sin pérdida de enlaces, solapamientos ni scroll horizontal involuntario; los estados no dependerán solo del color.
- **FR-005**: Deben conservarse `/admin`, `/admin/pedidos`, `/admin/pedidos/[id]`, `/admin/productos`, `/admin/productos/[slug]/variantes`, `/admin/productos/[slug]/imagenes` y `/admin/inventario`.
- **FR-006**: El dashboard DEBE presentar un resumen accionable de los pedidos de los últimos 30 días y de las existencias en su estado actual, con alcance temporal explícito, estados vacío/carga/error y enlaces a la vista fuente.
- **FR-007**: La lista de pedidos DEBE distinguir y filtrar “Todos”, “Entrega inmediata” y “Bajo pedido”, manteniendo el filtro en la URL y permitiendo restablecerlo.
- **FR-008**: El detalle DEBE conservar cliente, total COP, líneas, versión, talla, cantidad, modalidad, cupón y estado de notificación, con retorno a la lista.
- **FR-009**: Las acciones de pedido DEBEN dar confirmación o error entendible, ser idempotentes cuando corresponda y no exponer información técnica.
- **FR-009a**: El panel NO DEBE mostrar ruido permanente de “Telegram no configurado”; el bloque de avisos se mostrará únicamente cuando la integración esté disponible y, cuando lo esté, expondrá su estado operativo en español.
- **FR-010**: Productos DEBE mostrar visibilidad, conteos de imágenes/variantes/proveedores y acciones diferenciadas para editar, imágenes, variantes y ocultar/eliminar según reglas actuales.
- **FR-011**: Variantes e inventario DEBEN mostrar producto, versión, talla, stock derivado, umbral, disponibilidad bajo pedido y estado consistente.
- **FR-012**: Los ajustes DEBEN registrarse mediante el movimiento existente; nunca se ofrecerá editar destructivamente el saldo o historial.
- **FR-013**: Precios y totales seguirán siendo importes enteros en pesos colombianos y tendrán formato coherente.
- **FR-014**: Cada pantalla remodelada DEBE definir estados de carga, vacío, error, no encontrado y éxito con recuperación orientada a tarea.
- **FR-015**: La presentación conservará contratos, validación de servidor, autorización y confirmación para acciones destructivas.
- **FR-016**: La entrega DEBE incluir pruebas de shell, navegación, responsive/accesibilidad y flujos de pedidos, productos, variantes e inventario, además de tipos, lint y build.

### Key Entities

- **Sesión administrativa**: Identidad autorizada que consulta y muta el panel.
- **Pedido**: Compra con cliente, total COP, líneas, modalidad, cupón y notificación; conserva snapshots.
- **Producto**: Artículo con visibilidad, imágenes, variantes y proveedores.
- **Variante**: Combinación de versión y talla cuyo stock y umbral se muestran.
- **Movimiento de inventario**: Registro inmutable del que se deriva el stock.
- **Indicador operativo**: Resumen calculado que no crea una nueva fuente de verdad.

## Success Criteria

### Measurable Outcomes

- **SC-001**: En pruebas con las rutas definidas, al menos 95% llega a Pedidos, Productos o Inventario en máximo 2 interacciones desde cualquier pantalla.
- **SC-002**: Al menos 90% identifica correctamente estado de pedido y nivel de stock de una variante en la primera visita.
- **SC-003**: La revisión lista → detalle → retorno de un pedido conocido tarda menos de 60 segundos.
- **SC-004**: La revisión de una variante concreta, incluyendo estado de stock y acceso a su producto, tarda menos de 45 segundos.
- **SC-005**: Pruebas de teclado y lector de pantalla no encuentran controles principales inaccesibles, foco perdido ni información solo por color.
- **SC-006**: En viewport móvil de 320 px, 100% de las funciones del alcance es accesible sin zoom ni scroll horizontal involuntario.
- **SC-007**: La regresión mantiene 100% de protección de rutas, totales/snapshots y conservación del ledger.

## Assumptions

- La funcionalidad está dirigida a personas administradoras autenticadas, no a clientes.
- Se reutilizan Next.js App Router, TypeScript, Prisma, Tailwind, las acciones/repositorios actuales y features bajo `src/features/*`.
- Las rutas y contratos observados son el contrato operativo; se puede reorganizar la presentación del shell, dashboard y páginas existentes, pero no renombrar, eliminar ni sustituir esas rutas o contratos sin decisión posterior.
- “Ajustar stock” significa registrar un movimiento, no editar un total.
- Los estados y textos siguen en español y los importes en COP.
- La auditoría UX mencionada no aparece como archivo independiente en el repositorio. Se toman como base los problemas observables del shell actual (navegación plana, falta de contexto, responsive, estados y conexión entre módulos); cualquier prioridad visual no documentada deberá confirmarse antes del plan.
- Se asume conectividad suficiente; los estados de error y reintento cubren fallos transitorios sin modo offline.
- Los errores del detalle de pedido deben resolverse dentro de la ruta administrativa mediante una vista recuperable con reintento y retorno al listado, no mediante una pantalla genérica del framework.

## Constraints and Dependencies

- La frontera de seguridad es `src/features/auth/server/session.ts` y `src/app/admin/(dashboard)/layout.tsx`.
- Pedidos dependen de `src/features/orders/repositories/admin-order-repository.ts` y `src/features/orders/server/admin-order-actions.ts`.
- Catálogo, variantes e inventario dependen de acciones/repositorios bajo `src/features/catalog`, `src/features/products` y el esquema Prisma.
- No se eliminará ni sobrescribirá información protegida por la Constitución: snapshots de pedido, movimientos de inventario, estados de pago o auditoría.
