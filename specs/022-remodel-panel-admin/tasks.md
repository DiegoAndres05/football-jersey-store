---
description: "Tareas de implementación para el remodel del panel administrativo"
---

# Tasks: Remodel del panel de administración de Flashsport

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/admin-ui-server.md` y `quickstart.md`.

**Alcance**: mantener las rutas y contratos existentes (alcance B), sin migración
Prisma, sin cambios de autenticación/autorización y sin implementar capacidades
fuera de la especificación.

**Inventario confirmado (T001)**: además de las siete rutas principales, el
repositorio conserva las subrutas administrativas existentes de cupones, ligas,
equipos, proveedores, temporadas, tallas, versiones, importar y ajustes. No se
renombró ni eliminó ninguna ruta.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar el inventario de rutas, pruebas y convenciones compartidas
sin modificar todavía el comportamiento de negocio.

- [X] T001 Confirmar en `src/app/admin/(dashboard)/` el inventario de rutas existentes y documentar en `specs/022-remodel-panel-admin/tasks.md` cualquier diferencia sin renombrar rutas
- [X] T002 [P] Revisar `src/features/auth/server/session.ts`, `src/middleware.ts` y `src/app/admin/(dashboard)/layout.tsx` para fijar las fronteras de sesión/autorización que no se pueden mover
- [X] T003 [P] Revisar `src/features/orders/repositories/admin-order-repository.ts`, `src/features/orders/server/admin-order-actions.ts` y `src/features/notifications/config/telegram-config.ts` para catalogar entradas/salidas que deben conservarse
- [X] T004 [P] Identificar en `tests/` los fixtures y patrones reutilizables para admin, pedidos, productos, variantes, notificaciones e inventario sin crear una fuente de datos paralela
- [X] T005 [P] Registrar en `specs/022-remodel-panel-admin/quickstart.md` o en la evidencia de ejecución los comandos de validación previstos (`npm test`, `npm run lint`, `npm run build`) y sus prerrequisitos de entorno

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: establecer tipos, proyecciones y utilidades comunes que todas las
historias necesitan. No se inicia una historia hasta terminar esta fase.

- [X] T006 Definir tipos explícitos para navegación, breadcrumbs, estados de pantalla, filtros de modalidad y estados de stock en `src/app/admin/(dashboard)/admin-ui-types.ts`
- [X] T007 [P] Crear utilidades de presentación accesibles para estado, foco, formato COP entero y etiquetas de modalidad en `src/app/admin/(dashboard)/admin-ui-formatters.ts`, reutilizando `formatPrice`/`formatPriceShort`
- [X] T008 [P] Crear una proyección de stock firmada desde `InventoryMovement` (sin saldo mutable, sin editar movimientos y tolerando stock negativo/huérfano) en `src/features/inventory/server/admin-inventory-projection.ts`
- [X] T009 Crear la lectura tipada del dashboard con consultas paralelas, fecha `now - 30 días`, estados pagados del dominio, variantes bajo umbral y productos activos en `src/features/orders/repositories/admin-dashboard-repository.ts`
- [X] T010 [P] Definir el resultado seguro `loaded`/`not-found`/`incomplete`/`read-error` para pedidos y la validación de entrada de reintento en `src/features/orders/server/admin-order-ui-contract.ts`
- [X] T011 [P] Añadir helpers de URL para `searchParams.modalidad`, aceptando solo `INMEDIATA`/`BAJO_PEDIDO` y tratando cualquier otro valor como Todos, en `src/app/admin/(dashboard)/pedidos/admin-order-filters.ts`
- [X] T012 Verificar que no se modifica `prisma/schema.prisma`, que no se añaden saldos de stock y que las acciones existentes conservan autorización, validación, idempotencia y `revalidatePath` en `src/features/orders/server/admin-order-actions.ts` y `src/features/products/server/`

## Phase 3: User Story 1 - Orientarse y navegar el panel (Priority: P1) 🎯 MVP

**Goal**: entregar un shell protegido, agrupado, accesible y responsive que
conserve todas las subrutas administrativas y el contexto de navegación.

**Independent Test**: con y sin sesión, comprobar redirección a `/admin/login`,
sección activa, breadcrumbs, “Ver tienda”, “Salir”, skip-link, menú móvil a
320 px y navegación por teclado/lector de pantalla.

### Tests for User Story 1

- [X] T013 [P] [US1] Añadir pruebas de protección, rutas, sección activa y acciones “Ver tienda”/“Salir” en `tests/admin-shell.test.ts`
- [X] T014 [P] [US1] Añadir pruebas de accesibilidad del shell, skip-link, foco y menú responsive sin scroll horizontal en `tests/admin-shell-accessibility.test.ts`

### Implementation for User Story 1

- [X] T015 [US1] Remodelar el layout protegido, navegación agrupada, usuario actual, acciones globales y landmarks accesibles en `src/app/admin/(dashboard)/layout.tsx` sin cambiar `getSessionUser()` ni las rutas
- [X] T016 [US1] Crear el componente de navegación móvil con foco gestionado, cierre por teclado y nombres accesibles en `src/app/admin/(dashboard)/admin-navigation.tsx`
- [X] T017 [US1] Crear breadcrumbs y derivación de sección activa para subrutas en `src/app/admin/(dashboard)/admin-breadcrumbs.tsx`
- [X] T018 [US1] Ajustar estilos Tailwind del shell para 320 px, tablet y escritorio, estados no dependientes solo de color y ausencia de scroll horizontal en `src/app/globals.css`
- [X] T019 [US1] Definir estados compartidos de carga, vacío, error, no encontrado y éxito con foco visible y texto español en `src/app/admin/(dashboard)/admin-page-states.tsx`
- [X] T020 [US1] Integrar loading y error accesibles del grupo admin, sin trazas ni secretos, en `src/app/admin/(dashboard)/loading.tsx` y `src/app/admin/(dashboard)/error.tsx`

**Checkpoint**: US1 funciona de forma independiente en escritorio y móvil, y
las rutas existentes siguen entrando por la misma frontera de autorización.

## Phase 4: User Story 2 - Revisar operaciones desde el dashboard (Priority: P1)

**Goal**: mostrar un resumen accionable de pedidos de los últimos 30 días y del
inventario actual, con estados explicables y enlaces a sus fuentes.

**Independent Test**: con pedidos dentro/fuera de 30 días, cero datos, stock
negativo y variantes bajo umbral, verificar métricas, alcance visible, enlaces
y que ninguna carga modifica registros.

### Tests for User Story 2

- [X] T021 [P] [US2] Cubrir ventana móvil de 30 días, estados pagados, suma COP entera, productos activos y consultas paralelas en `tests/admin-dashboard.test.ts`
- [X] T022 [P] [US2] Cubrir estados vacío/carga/error, stock cero/negativo, movimientos huérfanos y enlaces accionables en `tests/admin-dashboard-ui.test.ts`

### Implementation for User Story 2

- [X] T023 [US2] Implementar la lectura del dashboard usando `admin-dashboard-repository.ts` y la proyección de inventario, sin recalcular totales en UI, en `src/app/admin/(dashboard)/page.tsx`
- [X] T024 [US2] Crear tarjetas y lista de alertas con etiqueta “Últimos 30 días”, estado actual de inventario, explicación de umbral y enlaces a `/admin/pedidos`/`/admin/inventario` en `src/app/admin/(dashboard)/admin-dashboard-cards.tsx`
- [X] T025 [US2] Integrar estados vacío, carga, error y reintento contextual del dashboard en `src/app/admin/(dashboard)/page.tsx` y `src/app/admin/(dashboard)/error.tsx`
- [X] T026 [US2] Verificar que las consultas del dashboard no hacen N+1 ni alteran pedidos, snapshots, movimientos o historial en `src/features/orders/repositories/admin-dashboard-repository.ts`

**Checkpoint**: US2 se puede validar entrando solo a `/admin`; inventario
representa el estado actual y pedidos solo los últimos 30 días.

## Phase 5: User Story 3 - Gestionar pedidos con contexto (Priority: P1)

**Goal**: ofrecer lista filtrable y detalle recuperable con snapshots, importes
COP, modalidad y notificación Telegram condicional.

**Independent Test**: filtrar Todos/Entrega inmediata/Bajo pedido, recargar para
confirmar URL, abrir detalle y volver conservando filtro; probar id inexistente,
datos incompletos, error de lectura, Telegram ausente y reintento idempotente.

### Tests for User Story 3

- [X] T027 [P] [US3] Extender el contrato de lista y filtros persistidos en URL para Todos/INMEDIATA/BAJO_PEDIDO en `tests/orders-admin.test.ts`
- [X] T028 [P] [US3] Añadir pruebas de detalle con snapshots, cupón, total COP, modalidad, estados loaded/not-found/incomplete/read-error y retorno al filtro en `tests/admin-order-detail.test.ts`
- [X] T029 [P] [US3] Añadir pruebas de ocultamiento total de Telegram sin configuración, estados SENT/pendiente/fallido y reintento idempotente configurado en `tests/notifications-admin-ui.test.ts`
- [X] T030 [P] [US3] Añadir pruebas responsive/accesibles de lista, tabla móvil, confirmaciones y mensajes de acción en `tests/orders-admin-ui.test.ts`

### Implementation for User Story 3

- [X] T031 [US3] Aplicar `admin-order-filters.ts` a `searchParams.modalidad`, enlaces canónicos y restablecimiento del filtro en `src/app/admin/(dashboard)/pedidos/page.tsx`
- [X] T032 [US3] Remodelar lista de pedidos con modalidad, estado, importe COP entero, estados vacío/error y layout legible a 320 px en `src/app/admin/(dashboard)/pedidos/page.tsx`
- [X] T033 [US3] Añadir retorno a `/admin/pedidos` conservando `modalidad` y breadcrumbs desde el detalle en `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [X] T034 [US3] Proyectar exclusivamente snapshots persistidos de cliente, líneas, producto/versión/talla, cantidad, personalización, cupón, total e historial en `src/features/orders/repositories/admin-order-repository.ts`
- [X] T035 [US3] Implementar vista de error recuperable para `not-found`, `incomplete` y `read-error`, con mensaje seguro, enlace al listado y reintento cuando aplique, en `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [X] T036 [US3] Consultar `getTelegramConfig()` antes de renderizar tarjeta/columna/acción y mostrar estados operativos en español sin tokens ni “No configurado” cuando falte configuración en `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [X] T037 [US3] Conectar `retryOrderNotification({ orderId })` con confirmación, resultado seguro, idempotencia y revalidación sin mutación parcial en `src/features/orders/server/admin-order-actions.ts`
- [X] T038 [US3] Añadir estados de carga/error y foco para filtros y reintento, limitando Client Components a interacción de navegador, en `src/app/admin/(dashboard)/pedidos/order-list-controls.tsx` y `src/app/admin/(dashboard)/pedidos/notification-retry-control.tsx`

**Checkpoint**: US3 conserva los contratos de lista, detalle y acción de
notificación; ningún error expone trazas, secretos ni datos de otros clientes.

## Phase 6: User Story 4 - Gestionar catálogo, variantes e inventario (Priority: P2)

**Goal**: conectar productos con edición, imágenes, variantes e inventario, y
mostrar disponibilidad derivada sin borrar ni reescribir el ledger.

**Independent Test**: desde `/admin/productos` navegar a las tres acciones,
identificar visibilidad/conteos y estados de variantes, registrar un ajuste y
comprobar que el historial permanece intacto; verificar regla de ocultar en vez
de eliminar cuando existan referencias.

### Tests for User Story 4

- [X] T039 [P] [US4] Extender visibilidad, conteos y acciones diferenciadas de producto en `tests/admin-product-visibility-ui.test.ts`
- [X] T040 [P] [US4] Añadir pruebas de variantes con stock disponible/bajo/agotado, bajo pedido, umbral, enlaces y estados de error/no encontrado en `tests/admin-variants-ui.test.ts`
- [X] T041 [P] [US4] Añadir pruebas de inventario que verifiquen suma firmada, ajuste como movimiento, stock negativo y conservación del historial en `tests/admin-inventory-ui.test.ts`

### Implementation for User Story 4

- [X] T042 [US4] Remodelar listado de productos con visibilidad, conteos de imágenes/variantes/proveedores y acciones de editar, imágenes, variantes y ocultar/eliminar según reglas actuales en `src/app/admin/(dashboard)/productos/page.tsx`
- [X] T043 [US4] Conectar estados y navegación de imágenes conservando acciones y almacenamiento existente en `src/app/admin/(dashboard)/productos/[slug]/imagenes/page.tsx`
- [X] T044 [US4] Remodelar variantes con producto, versión, talla, SKU, precios COP, umbral, `allowsBackorder` y estado derivado consistente en `src/app/admin/(dashboard)/productos/[slug]/variantes/page.tsx`
- [X] T045 [US4] Integrar acciones existentes de variantes para que todo ajuste cree un `InventoryMovement`, valide sesión/entrada y nunca edite o borre saldo/historial en `src/features/products/server/` y `src/features/inventory/server/`
- [X] T046 [US4] Remodelar inventario con agrupación operativa, filtros/presentación de estados, movimientos huérfanos visibles y enlaces al producto/variante en `src/app/admin/(dashboard)/inventario/page.tsx`
- [X] T047 [US4] Añadir estados de carga, vacío, error y no encontrado a productos, imágenes, variantes e inventario sin cambiar sus rutas en `src/app/admin/(dashboard)/productos/error.tsx`, `src/app/admin/(dashboard)/productos/[slug]/imagenes/error.tsx`, `src/app/admin/(dashboard)/productos/[slug]/variantes/error.tsx` y `src/app/admin/(dashboard)/inventario/page.tsx`
- [X] T048 [US4] Verificar que eliminación/ocultamiento conserva confirmaciones, referencias, proveedores, imágenes, variantes y ledger en `src/features/products/services/` y `src/features/products/server/`

**Checkpoint**: US4 permite operar catálogo e inventario sin crear una segunda
fuente de verdad ni alterar historial protegido.

## Phase 7: Polish & Cross-Cutting Validation

**Purpose**: cerrar accesibilidad, regresiones, rendimiento y evidencia de salida.

- [X] T049 [P] Ejecutar y corregir la suite focalizada de `tests/orders-admin.test.ts`, `tests/admin-product-visibility-ui.test.ts`, `tests/notifications.test.ts`, `tests/plan-inventory-movements.test.ts` y las pruebas nuevas del panel
- [X] T050 [P] Ejecutar `npm run lint` y corregir errores de TypeScript/React/Tailwind sin introducir cambios de contrato en `src/`
- [X] T051 [P] Ejecutar `npm run build` para validar tipos, rutas App Router y producción en todo el proyecto
- [X] T052 Realizar los siete escenarios manuales de `specs/022-remodel-panel-admin/quickstart.md` en viewport 320 px y escritorio, documentando navegador, datos y resultados en `specs/022-remodel-panel-admin/validation-notes.md`
- [X] T053 Verificar con búsqueda/diff final que no se exponen `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, trazas, hashes o datos ajenos al detalle y que no hubo cambios en `prisma/schema.prisma` en `specs/022-remodel-panel-admin/validation-notes.md`
- [X] T054 Confirmar que las rutas/contratos de `specs/022-remodel-panel-admin/contracts/admin-ui-server.md` y las restricciones de `specs/022-remodel-panel-admin/data-model.md` siguen cubiertas por las pruebas y registrar cualquier desviación bloqueante en `specs/022-remodel-panel-admin/validation-notes.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** no depende de otra fase y puede ejecutarse en paralelo por tarea.
- **Phase 2** depende de Phase 1 y bloquea todas las historias.
- **US1, US2 y US3** dependen de Phase 2; pueden ejecutarse en paralelo si se
  evitan conflictos en `layout.tsx` y utilidades compartidas.
- **US4** depende de Phase 2 y puede ejecutarse en paralelo con US2/US3 cuando
  sus cambios se limiten a catálogo/inventario.
- **Polish** depende de todas las historias elegidas para la entrega.

### User Story Dependencies

- **US1 (P1)**: solo depende de Phase 2; es el MVP recomendado.
- **US2 (P1)**: solo depende de Phase 2 y reutiliza tipos/formatters comunes.
- **US3 (P1)**: solo depende de Phase 2 y de los contratos existentes de pedidos.
- **US4 (P2)**: solo depende de Phase 2 y de las acciones/repositorios existentes.

### Parallel Execution Examples

#### User Story 1

```text
T013 tests/admin-shell.test.ts
T014 tests/admin-shell-accessibility.test.ts
T016 src/app/admin/(dashboard)/admin-navigation.tsx
T017 src/app/admin/(dashboard)/admin-breadcrumbs.tsx
```

#### User Story 2

```text
T021 tests/admin-dashboard.test.ts
T022 tests/admin-dashboard-ui.test.ts
T024 src/app/admin/(dashboard)/admin-dashboard-cards.tsx
```

#### User Story 3

```text
T027 tests/orders-admin.test.ts
T028 tests/admin-order-detail.test.ts
T029 tests/notifications-admin-ui.test.ts
T030 tests/orders-admin-ui.test.ts
```

#### User Story 4

```text
T039 tests/admin-product-visibility-ui.test.ts
T040 tests/admin-variants-ui.test.ts
T041 tests/admin-inventory-ui.test.ts
```

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Completar US1 (shell y protección) y validarlo de forma independiente.
3. Detenerse en el checkpoint para demo del MVP, sin tocar autenticación ni
   contratos de datos.

### Incremental Delivery

1. Añadir US2 para convertir `/admin` en punto de entrada operativo.
2. Añadir US3 para el flujo crítico de pedidos y Telegram condicional.
3. Añadir US4 para catálogo, variantes e inventario.
4. Ejecutar Phase 7 únicamente después de las historias incluidas.

### Reglas de ejecución

- Cada tarea es una unidad concreta, con ID secuencial, etiqueta de historia
  cuando corresponde y al menos una ruta de archivo explícita.
- Las pruebas se escriben antes de la implementación de su historia y deben
  cubrir contratos, seguridad, estados y regresiones indicadas por `quickstart.md`.
- No crear migraciones, entidades de indicadores, saldo mutable ni rutas nuevas.
- Mantener textos en español, importes COP enteros, snapshots y ledger
  inmutables.
