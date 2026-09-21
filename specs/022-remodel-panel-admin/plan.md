# Plan técnico: Remodel del panel de administración de Flashsport

**Rama**: `022-remodel-panel-admin` | **Fecha**: 2026-09-20 | **Especificación**: [spec.md](./spec.md)

## Resumen

Remodelar la presentación y navegación del panel existente sin cambiar rutas ni
contratos operativos (alcance B). El trabajo se concentra en el layout protegido,
dashboard, pedidos, productos/variantes/imágenes e inventario, reutilizando las
acciones y repositorios actuales. El dashboard mostrará pedidos de los últimos
30 días e inventario derivado del ledger en su estado actual. Los errores del
detalle de pedido serán recuperables dentro de la ruta; el bloque de Telegram solo
se renderizará cuando `getTelegramConfig()` indique que la integración está
configurada.

## Contexto técnico

**Lenguaje/versión**: TypeScript 5.6, React 18, Next.js 16.3 App Router  
**Dependencias primarias**: Prisma 5.22, PostgreSQL/Supabase, Tailwind CSS,
Zod, lucide-react, server actions  
**Almacenamiento**: PostgreSQL mediante Prisma (`DATABASE_URL`/`DIRECT_URL`);
movimientos de inventario en `InventoryMovement`  
**Pruebas**: Node test runner con `tsx`, tests de contrato/UI por lectura de
fuentes y tests de integración contra Prisma local; `npm run lint`, `npm run
build`  
**Plataforma**: servidor Next.js y navegadores de escritorio/móvil desde 320 px  
**Tipo de proyecto**: aplicación web full-stack con Server Components/Actions  
**Objetivos de rendimiento**: una carga del dashboard con consultas paralelas,
sin consultas por fila; navegación principal utilizable en ≤2 interacciones  
**Restricciones**: no cambiar autenticación, autorización, rutas públicas/admin,
totales, snapshots, estados ni ledger; no exponer trazas; importes enteros COP  
**Escala/alcance**: 7 rutas administrativas principales y sus subrutas, 13
enlaces del shell existente, sin nuevas entidades persistidas

## Constitution Check — antes de investigación

- **I. Límites de dominio**: PASS. Presentación en `src/app/admin`; reglas
  permanecen en `src/features/auth`, `orders`, `catalog`, `products`,
  `notifications`.
- **II. Integridad auditable**: PASS. El plan solo proyecta stock sumando
  `InventoryMovement`, conserva snapshots de `OrderItem` y no agrega borrado.
- **III. Contratos tipados/validados**: PASS CONDICIONADO. Se conservarán Zod y
  acciones existentes; cualquier filtro, estado de UI o resumen nuevo tendrá
  tipos explícitos y validación en el borde.
- **IV. Mínimo privilegio**: PASS. `AdminLayout`, middleware y
  `getSessionUser()` siguen siendo la frontera; no se mueven secretos al cliente.
- **V. Entrega verificada**: PASS CONDICIONADO. Se agregan pruebas focalizadas de
  shell, URL de filtros, dashboard de 30 días, errores recuperables, Telegram y
  accesibilidad además de lint/build.

No hay violaciones que requieran Complexity Tracking.

## Decisiones de diseño (Phase 0/1)

1. Mantener las rutas existentes, incluyendo `/admin`, `/admin/pedidos`,
   `/admin/pedidos/[id]`, `/admin/productos`, subrutas de variantes/imágenes e
   `/admin/inventario`; los enlaces adicionales del shell actual se conservan.
2. Extraer consultas de dashboard a una función de lectura tipada que aplique
   `createdAt >= now - 30 días` para pedidos y calcule stock desde el ledger.
   No se crea una tabla de indicadores.
3. Representar filtros de pedidos con `searchParams.modalidad` y enlaces
   canónicos; “Todos” elimina el parámetro.
4. Proyectar el detalle desde snapshots persistidos, incluido el cupón; nunca
   consultar el registro mutable `Coupon` para reconstruir el pedido.
5. Sustituir `notFound()`/errores no controlados del detalle por una vista
   administrativa recuperable (retorno al listado y reintento cuando aplique),
   sin mostrar mensajes internos.
6. Consultar `getTelegramConfig()` antes de renderizar cualquier tarjeta o
   acción de Telegram. Configuración ausente significa bloque oculto, no error.
7. No se requiere migración Prisma: todos los datos necesarios ya existen y el
   alcance es de presentación/lectura. Solo justificar una migración futura si
   una prueba demuestra que falta una consulta/indexación.

## Estructura real afectada

```text
src/app/admin/(dashboard)/
├── layout.tsx
├── page.tsx
├── loading.tsx
├── pedidos/page.tsx
├── pedidos/[id]/page.tsx
├── productos/page.tsx
├── productos/[slug]/variantes/page.tsx
├── productos/[slug]/imagenes/page.tsx
└── inventario/page.tsx
src/features/
├── auth/server/{session,actions}.ts
├── orders/{repositories/admin-order-repository.ts,server/admin-order-actions.ts}
├── catalog/server/*.ts
├── products/{repositories,services,server}/*.ts
└── notifications/{config,services,repositories}/*.ts
prisma/schema.prisma
tests/
└── tests existentes de admin, orders, notifications, inventory y catálogo
```

## Estrategia de implementación (para `/speckit.implement`)

1. **Shell y estados compartidos**: crear navegación agrupada responsive,
   breadcrumb/skip-link, estado activo derivado de pathname, foco visible,
   menú móvil sin scroll horizontal y mensajes de carga/error accesibles.
2. **Consultas de dashboard**: encapsular agregados de 30 días y lectura de
   inventario; mostrar tarjetas con alcance temporal, estados vacío/carga/error y
   enlaces a las fuentes. Mantener mutaciones de estado existentes.
3. **Pedidos**: preservar `modalidad` en URL, mejorar tabla/lista para móvil,
   estados de modalidad/notificación, retorno al filtro y detalle con cliente,
   snapshots, cupón, total COP e historial. Agregar boundary de error
   recuperable y reintento idempotente de notificación.
4. **Catálogo e inventario**: conectar acciones de producto con edición,
   imágenes y variantes; presentar visibilidad, conteos, bajo pedido, umbral y
   stock derivado; mantener ocultar en lugar de borrar cuando existan referencias.
5. **Validación**: ejecutar tests focalizados y suite, typecheck implícito en
   build, lint y build; validar manualmente 320 px, teclado y lector de pantalla.

## Migraciones

**Ninguna prevista.** `Order`, `OrderItem`, `NotificationAttempt`,
`ProductVariant`, `InventoryMovement` y sus índices cubren el contrato. No
editar saldos ni agregar columnas de “stock actual”. Si la consulta de 30 días
requiere optimización después de medir, una migración de índice será una
decisión separada, no parte del MVP.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El esquema documenta PostgreSQL, pero tests locales usan `prisma/dev.db` histórico | Mantener consultas compatibles con Prisma; probar contra el entorno configurado y no introducir SQL específico sin contrato |
| Consultas actuales traen todos los pedidos y calculan filtros en memoria | Limitar por fecha y modo en repositorio, medir antes de optimizar y preservar resultados inclusivos |
| Errores parciales al leer pedido o reintentar Telegram | Capturar errores en boundary/acción, no mutar hasta validar, devolver estado seguro y revalidar rutas |
| Shell con 13 enlaces no cabe en 320 px | Navegación colapsable, agrupación y foco gestionado; prueba de viewport móvil |
| Stock negativo o movimientos huérfanos | Mostrar estado explicable, no corregir automáticamente ni ocultar el valor derivado |
| Cambios concurrentes en listas | Acciones vuelven a validar estado actual y usan revalidación; no confiar en datos renderizados |

## Contratos y artefactos

- [Contrato UI y servidor](./contracts/admin-ui-server.md)
- [Modelo de datos](./data-model.md)
- [Guía de validación](./quickstart.md)
- Investigación y decisiones: [research.md](./research.md)

## Constitution Check — después del diseño

- **I, II, IV**: PASS; no se mueven límites, auditoría ni seguridad.
- **III**: PASS; filtros/resúmenes/estados tienen tipos y los inputs de acciones
  siguen Zod/validación existente.
- **V**: PASS CONDICIONADO A IMPLEMENTACIÓN; el quickstart exige tests,
  accesibilidad, lint y build, y no incluye migraciones innecesarias.

No quedan clarificaciones abiertas en la especificación. Riesgos operativos
residuales están listados arriba y no bloquean el plan.
