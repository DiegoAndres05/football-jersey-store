# FLASHSPORT — Arquitectura de Proyecto

> Documento oficial de auditoría y arquitectura. Fase 0 — Análisis y documentación.
> Fecha: agosto 2026 · Estado: documento de referencia para Fases 1 en adelante.

---

## 1. Resumen

Flashsport es una tienda online de camisetas de fútbol enfocada inicialmente en
las cinco grandes ligas (Premier League, La Liga, Serie A, Bundesliga, Ligue 1),
con catálogo por encargo vía WhatsApp como complemento del modelo de negocio.

El proyecto ya cuenta con un MVP funcional implementado en **10 fases** previas:
catálogo, detalle de producto, carrito, checkout, pagos simulados, creación de
pedidos, admin con autenticación, inventario, SEO y dirección visual de la Home
(alineada con la referencia "OPCIÓN C — Minimalista").

Esta fase **no implementa nada nuevo**: audita el estado actual y define la
arquitectura objetivo (Supabase, importador, imágenes propias, pasarela real)
para las fases siguientes.

---

## 2. Estado actual

| Área | Estado |
|---|---|
| Catálogo (productos, ligas, equipos) | Implementado con datos reales en BD (PostgreSQL/Supabase) |
| Detalle de producto | Implementado (galería, variantes, tallas, personalización) |
| Carrito | Implementado (zustand persistido) |
| Checkout | Implementado (datos de envío, cliente guest) |
| Pagos | **Simulados** (`processMockPayment`) — no hay pasarela real |
| Pedidos | Implementados (creación, historial de estados, confirmación) |
| Admin | CRUD completo de catálogo, dashboard (ingresos/stock bajo), inventario, login con cookie firmada + rate-limit |
| Importador de camisetas | **No existe** (pendiente Fase futura) |
| Almacenamiento de imágenes | Supabase Storage (bucket `product-images`) — FASE 2; 15 imágenes originales siguen en Unsplash (`storagePath = null`) |
| Base de datos | PostgreSQL en Supabase (FASE 1, validada 1:1 desde SQLite) |
| Autenticación de clientes | No existe (compra guest) — solo auth de admin |
| Tests automatizados | **Unit tests** con `node:test` (20 tests) — sin E2E/CI aún |
| Pasarela de pagos | **No conectada** |
| WhatsApp | Link `wa.me` configurado en `site.ts` (número placeholder) |

---

## 3. Stack actual

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework | Next.js (App Router) | 14.2.18 | Server Components + Server Actions |
| UI | React | 18.3.1 | — |
| Lenguaje | TypeScript | 5.6.3 | — |
| Estilos | Tailwind CSS | 3.4.14 | `tailwindcss-animate`, tokens HSL en `globals.css` |
| Componentes UI | Radix UI primitives | — | accordion, dialog, select, tabs, tooltip, etc. |
| Iconos | lucide-react | 0.454 | — |
| Estado global | zustand | 5.0.1 | Solo carrito (`cart-store.ts`) |
| Formularios | react-hook-form | 7.85 | + `@hookform/resolvers` |
| Validación | zod | 4.4 | Schemas por feature |
| ORM | Prisma | 5.22 | `prisma-client-js` |
| BD | PostgreSQL (Supabase, FASE 1) | 16 | `DATABASE_URL` pooled + `DIRECT_URL`; migrada desde SQLite |
| Storage imágenes | Supabase Storage (FASE 2) | — | bucket `product-images` público de lectura; escritura solo service role |
| Auth admin | Propia (HMAC + cookie) | — | `fs_admin_session`; ver §5 y riesgos |
| Pagos | Mock interno | — | `payments/services` |
| Lint | ESLint (`next lint`) | 8.57 | Config por defecto de Next |
| Build | `next build` | — | 17+ páginas, verificado |
| Testing | — | — | No configurado (pendiente) |
| Seeding | `tsx prisma/seed.ts` | — | `npm run db:seed` |

**Scripts**: `dev`, `build`, `start`, `lint`, `db:push`, `db:generate`, `db:seed`,
`db:reset`, `setup`, `admin:password`, `studio`.

---

## 4. Estructura actual

### Rutas existentes (reales, no asumidas)

```
/                      Home (hero, trust bar, ligas, más buscadas, WhatsApp)
/productos             Catálogo con filtros (liga, equipo, temporada, versión, talla, búsqueda)
/productos/[slug]      Detalle de producto
/ligas                 Página de ligas
/sobre-nosotros        Página estática
/contacto              Página de contacto
/cuenta                Cuenta (placeholder; sin auth de clientes aún)
/carrito               Carrito
/checkout              Checkout (guest)
/pedido/confirmado/[code]  Confirmación de pedido
/admin                 Dashboard (protegido por middleware)
/admin/login           Login de admin
/admin/inventario      Vista de stock por variante
/robots.txt, /sitemap.xml   SEO
```

### Organización de carpetas

```
src/
├── app/                 Rutas del App Router (+ admin/)
├── components/
│   ├── home/            Hero del Home, componentes de sección
│   ├── layout/          Header, NavLinks, Footer
│   └── ui/              Button, Badge, etc.
├── features/            Arquitectura por feature (bounded contexts)
│   ├── products/        Catálogo (actions, components, hooks, repositories, schemas, services, types)
│   ├── cart/            Carrito
│   ├── checkout/        Checkout
│   ├── orders/          Pedidos
│   ├── inventory/       Inventario
│   ├── suppliers/       Proveedores (estructura lista)
│   ├── payments/        Pagos (mock)
│   ├── auth/            Auth de admin (server actions + session)
│   └── admin/           Estructura de feature admin (mayormente vacía; ver §5)
├── lib/                 prisma.ts, utils.ts
├── middleware.ts        Protección de /admin
└── shared/
    ├── config/site.ts   SITE, SHIPPING, whatsappLink
    └── stores/          cart-store.ts (zustand)

prisma/
├── schema.prisma        Modelo de dominio v2 (20 entidades)
├── seed.ts              Datos demo (7 ligas, equipos, productos, inventario)
└── migrations/          Migraciones de SQLite
```

---

## 5. Admin actual

**Cómo está construido**: páginas Server Components de `src/app/admin/*` que
consultan Prisma directamente (sin feature-actions aún). Las carpetas
`src/features/admin/{actions,components,hooks,schemas,services}` existen pero
están vacías: la feature admin es candidata a refactor.

**Rutas**:
- `/admin` — Dashboard: conteo de pedidos (totales, pendientes, pagados) y tabla de pedidos recientes con selector de estado.
- `/admin/login` — Formulario de login (email + contraseña).
- `/admin/inventario` — Tabla de variantes con stock calculado (SUM de `InventoryMovement`) y alerta de stock bajo.

**Autenticación**: propia, sin NextAuth.
- `loginAction` valida email/contraseña contra `User` (`passwordHash`, bcrypt).
- `createSessionCookie` firma el token (HMAC-SHA256 con `NEXTAUTH_SECRET`) y lo guarda en cookie `fs_admin_session`.
- `middleware.ts` valida la firma y redirige a `/admin/login` si es inválida (matcher `/admin/:path*`).
- Usuario admin seed: `admin@footballstore.co` (contraseña configurable vía `npm run admin:password`).

**Conexión a backend**: sí, base de datos real (Prisma/SQLite). **No hay datos mock ni hardcodeados** en el Admin.

**CRUD**: no hay CRUD de productos/ligas/equipos todavía; solo lectura de pedidos y stock.

**Bug conocido**: la cookie se firma con `secure: true` cuando `NODE_ENV=production`, lo que rompe el login en `http://localhost` (`next start`). Pendiente de corregir (fijar `secure` según `NEXTAUTH_URL`).

---

## 6. Home actual

Todo lo visible en la Home está **implementado contra la base de datos real** (no es presentacional):

| Sección | Implementación real |
|---|---|
| Navbar | Header sticky (64/72px), links con gap 32px, buscador, cuenta, carrito, drawer móvil |
| Hero | Texto izquierda + **una fotografía** de producto destacado (imagen real de la BD) con etiqueta "Temporada 25/26" |
| Trust bar | 4 items con iconos: Envíos a todo el país · Pagos seguros · Productos de calidad · Atención personalizada |
| Las grandes ligas | 5 tarjetas (monograma + nombre + nº productos) → `/productos?liga=…` |
| Las más buscadas | Grid de 4 productos destacados (`isFeatured`) + "Ver todas" |
| CTA WhatsApp | "¿No encuentras la camiseta que buscas?" → `wa.me` con mensaje predefinido |
| Footer | Wordmark, links, datos de contacto |

**Único aspecto "placeholder"**: las fotografías de producto provienen del seed
(hotlinks a Unsplash, ver §8). La Home ya quedó preparada para recibir fotografía
de producto real sin cambios de estructura.

---

## 7. Datos actuales (modelo ya existente)

El esquema Prisma v2 (`prisma/schema.prisma`) ya define **20 entidades** organizadas por bounded contexts:

- **Catálogo**: `League`, `Team`, `Player`, `Season`, `Version`, `Size`, `Product`, `ProductImage`, `ProductVariant`
- **Inventario**: `InventoryMovement` (ledger: SUM(quantity) = stock)
- **Proveedores**: `Supplier`, `SupplierProduct`, `SupplierOrder`, `SupplierOrderItem`
- **Clientes**: `Customer`, `Address`
- **Auth**: `User` (rol, passwordHash)
- **Pedidos**: `Order`, `OrderItem`, `OrderStatusHistory`
- **Sistema**: `Setting`

Principios del modelo v2 (ya implementados):
1. Producto y variante desacoplados.
2. Stock como estado derivado del ledger (fuente de verdad).
3. Precios explícitos por variante (`costPrice`, `salePrice`, `compareAtPrice`).
4. Cliente guest sin `User` (checkout sin registro).
5. Imágenes como entidad (múltiples, ordenadas, alt text, `isPrimary`).
6. Enums como `String` (SQLite no soporta enums nativos) validados en capa de aplicación.
7. Sin cascade delete en datos de auditoría.

**Seed actual**: 7 ligas (5 grandes + Liga BetPlay + Selecciones), equipos
(Real Madrid, Barcelona, City, Liverpool, Arsenal, Inter, Milan, etc.),
productos con variantes (versión × talla), jugadores, movimientos de inventario
y usuario admin. Precios en **centavos** (Int).

---

## 8. Arquitectura propuesta

### Catálogo

```
Liga → Equipo → Kit (temporada/versión) → Producto → Variante → Talla
```

Jerarquía que ya soporta el modelo actual; se mantiene sin cambios.

### Importador (conceptual, Fase futura)

```
Football Kit Archive (u otra fuente)
        ↓
Source Adapter      (conecta a la fuente, extrae raw data)
        ↓
Raw Data           (payload normalizado, sin tocar BD)
        ↓
Normalizer         (mapea → Producto/Equipo/Liga/Variante/Imagen candidatos)
        ↓
Preview            (el Admin muestra el resultado del normalizado)
        ↓
Admin Review       (edición y aprobación manual)
        ↓
Producto Flashsport (se persiste como draft)
        ↓
Publish            (isActive = true)
```

Reglas del importador:
- **Importar ≠ publicar**: nada importado se publica automáticamente.
- El Admin revisa y edita antes de publicar.
- No todo lo importado debe publicarse (se puede descartar o guardar como draft).
- Cada importación debe conservar trazabilidad: fuente, fecha, id original, y
  estado (draft/published/discarded).

### Imágenes

```
Fuente externa / propia
        ↓
Image asset        (con atribución: origin = OWN | EXTERNAL | IMPORTED)
        ↓
Supabase Storage   (bucket con políticas de acceso; URLs propias)
        ↓
ProductImage       (url apunta a nuestro storage; se conserva source_url)
```

- `ProductImage` ya existe con `url` y `altText`; se propone añadir campos de
  procedencia (ver §9, imagen) para distinguir `own | external | imported`.
- **Riesgo legal**: no asumir que imágenes externas pueden republicarse
  comercialmente. Solo se usan imágenes con permiso o propias; se conserva
  `source_url` y atribución cuando corresponda.
- Config de Next (`next.config.mjs`) deberá permitir el dominio de Supabase
  Storage cuando se conecte.

### Tienda

```
Supabase (PostgreSQL + Storage + Auth)
        ↓
Next.js (App Router)
        ↓
Catálogo → Producto → Carrito → Checkout → Pedido
```

- Migración de SQLite → PostgreSQL (provider en `schema.prisma` + `DATABASE_URL`).
- Clientes podrán registrarse (Supabase Auth) manteniendo la compra guest.
- Pasarela de pagos real en Fase posterior (ver §11).

### Admin

```
Auth (cookie firmada, ya existente; opcional: Supabase Auth)
        ↓
Dashboard
├── Productos        (listar/crear/editar — pendiente)
├── Importar         (flujo del importador — pendiente)
├── Ligas            (gestión — pendiente)
├── Equipos          (gestión — pendiente)
├── Pedidos          (ya existe: dashboard + cambio de estado)
└── Inventario       (ya existe: stock por variante)
```

---

## 9. Modelo de datos propuesto

Basado en el esquema v2 existente. Se propone **evolución mínima**: añadir lo
necesario para importador, imágenes con procedencia y pagos. No se crean tablas
en esta fase.

### Entidades existentes que se mantienen

| Entidad | Propósito | Relaciones clave |
|---|---|---|
| `League` | Liga (Premier, La Liga…) | 1→N `Team` |
| `Team` | Equipo | N→1 `League`, 1→N `Product`, `Player` |
| `Player` | Jugador (personalización nombre/número) | N→1 `Team`, único por `(teamId, number)` |
| `Season` | Temporada (25/26, retro…) | 1→N `Product` |
| `Version` | Versión (Fan, Player, Retro) | 1→N `ProductVariant` |
| `Size` | Talla (S–XXL) | 1→N `ProductVariant` |
| `Product` | Camiseta | N→1 `Team`, N→1 `Season`, 1→N `ProductVariant`, `ProductImage`, `SupplierProduct` |
| `ProductVariant` | variante = producto × versión × talla; precios, SKU, stock bajo | único `(productId, versionId, sizeId)` |
| `ProductImage` | Imágenes del producto (orden, principal, alt) | N→1 `Product` |
| `InventoryMovement` | Ledger de stock (IN/OUT/SALE/RESERVA/…) | N→1 `ProductVariant` |
| `Supplier` / `SupplierProduct` / `SupplierOrder(Item)` | Proveedores y pedidos de compra | ya implementados |
| `Customer` / `Address` | Cliente guest + direcciones | 1→N `Order` |
| `User` | Usuario con rol (ADMIN…) | 1→1 `Customer` |
| `Order` / `OrderItem` / `OrderStatusHistory` | Pedido completo con línea de estado | ya implementados |
| `Setting` | Parámetros clave/valor | — |

### Entidades nuevas propuestas (Fases futuras — NO crear aún)

| Entidad | Propósito | Campos principales | Relaciones | Restricciones |
|---|---|---|---|---|
| `ImportJob` | Ejecución de importación desde una fuente | fuente, estado, fecha, resumen, id externo de lote | 1→N `ImportItem` | estado: RUNNING/DONE/FAILED |
| `ImportItem` | Registro por producto importado (draft) | datos_raw (JSON), estado (DRAFT/APPROVED/DISCARDED/PUBLISHED), `sourceUrl` | N→1 `ImportJob`; opcional N→1 `Product` | un importado no se publica solo |
| `Product.origin` (campo en `Product`) | Procedencia de la ficha | `OWN \| EXTERNAL \| IMPORTED` + `sourceUrl` | — | se añade al modelo actual |
| `ProductImage.origin` / `sourceUrl` | Procedencia de la imagen | `OWN \| EXTERNAL \| IMPORTED`, `sourceUrl`, `license` | — | permite atribución y filtros legales |
| `Payment` | Pago real (cuando exista pasarela) | método, ref proveedor, estado, monto, moneda | N→1 `Order` | 1 orden → N pagos (reintentos) |
| `Cart` (opcional) | Carrito del lado servidor para clientes logueados | — | N→1 `Customer` | el carrito local (zustand) se conserva para guest |

Nota: mantener los precios en **centavos (Int)** y los enums como `String`
validados en capa de aplicación (compatible SQLite y PostgreSQL).

---

## 10. Arquitectura del importador (detalle)

```
Football Kit Archive
   ↓ HTTP / página / feed
Source Adapter        → estructura por fuente (interfaz `SourceAdapter`)
   ↓
RawData               → JSON normalizado (productos, equipos, ligas, temporadas, imágenes)
   ↓
Normalizer            → valida (zod), mapea nombres/formatos, resuelve equivalencias
                        (liga/equipo existente o nuevo), genera draft
   ↓
ImportJob + ImportItem (BD)
   ↓
Preview               → vista del Admin: productos candidatos con diferencias
                        (nuevo / actualizar / sin cambios)
   ↓
Admin Review          → editar precio, tallas, versión, imágenes; aprobar o descartar
   ↓
Product (draft)       → se persiste (isActive = false) o se actualiza el existente
   ↓
Publish               → isActive = true, visible en tienda
```

Requisitos transversales:
- **Idempotencia**: el mismo `sourceUrl`/id externo no debe duplicar productos
  (se actualiza o se marca "sin cambios").
- **Trazabilidad**: cada producto conserva su `ImportItem` y `sourceUrl`.
- **Imágenes**: nunca se guardan como propias sin verificación de licencia; el
  flujo distingue `own | external | imported`.

---

## 11. Flujo de compra (estado actual)

```
Catálogo → Producto → Carrito (zustand, persistido) → Checkout (guest)
   → MockPayment (SIM-XXXX) → Orden creada (PENDING_PAYMENT)
   → Confirmación /pedido/confirmado/[code] → Inventario descontado
   → Admin: cambio de estado (PAID → VALIDATING → … → DELIVERED)
   → Alternativa WhatsApp cuando el producto no está en catálogo
```

Los pagos online reales se implementarán posteriormente; el mock está
claramente marcado como simulación y nunca cobra.

---

## 12. Fases futuras (orden propuesto)

> Estado: Fases 0–4 y fixes de calidad ya ejecutados y commiteados en `main`
> (ver §2 y §14). El listado siguiente es el roadmap restante como estaba
> planificado, actualizado en su numeración de referencia histórica.

0. **Fase 0 — Arquitectura**: `FLASHSPORT-ARCHITECTURE.md`, organigrama de
   `src/features/*` (realizada).
1. **Fase 1 — Infraestructura**: migración SQLite → PostgreSQL (Supabase),
   `DATABASE_URL` remoto, `next.config` para dominio de storage, fix de cookie
   `Secure` del admin login (realizada).
2. **Fase 2 — Almacenamiento e imágenes**: bucket Supabase Storage, subida
   desde Admin, `ProductImage.storagePath`, fotografía real de producto
   (realizada; faltan las fotos propias del catálogo).
3. **Fase 3 — Admin completo**: CRUD de productos, ligas, equipos, variantes,
   stock (ledger), proveedores, temporadas, tallas y versiones; dashboard con
   ingresos y alertas de stock (realizada).
4. **Fase 4 — Importador**: Source Adapter + Normalizer + ImportJob/ImportItem
   + preview + revisión Admin + publicación.
5. **Fase 5 — Pagos reales**: pasarela (Wompi/PayU/etc. según mercado
   colombiano), `Payment`, webhooks, estados de pago reales.
6. **Fase 6 — Auth de clientes**: Supabase Auth, `Customer` ↔ `User`,
   cuenta con historial de pedidos.
7. **Fase 7 — Calidad**: tests (unit + e2e), CI, logs/observabilidad
   (parcial: unit tests con `node:test`, ver §14.8).
8. **Fase 8 — Escalamiento**: SSR/ISR por catálogo, caché, CDN de imágenes.

---

## 13. Decisiones técnicas

- **Bounded contexts por feature** (`src/features/*`) como organización oficial:
  actions, components, hooks, repositories, schemas, services, types.
- **Ledger de inventario** como fuente de verdad (sin campo `stock`).
- **Precios en centavos** (Int) en toda la app.
- **Enums como String** + validación zod (portable a PostgreSQL).
- **Server Components + Server Actions** como patrón dominante; clientes solo
  donde hay interactividad.
- **Carrito client-side (zustand)** con persistencia local; se mantendrá para
  guest incluso cuando exista auth.
- **Auth de admin propia** (HMAC + cookie) es suficiente para el Admin interno;
  Supabase Auth se reserva para clientes.
- **WhatsApp como canal oficial de catálogo por encargo**: `whatsappLink()`
  centralizado en `shared/config/site.ts` (número placeholder pendiente de
  configuración real).

---

## 14. Riesgos y puntos pendientes

> Estado al cierre de Fases 0–4 + fixes: los ítems marcados con ✔ están
> resueltos; los demás siguen vigentes.

| # | Riesgo / pendiente | Severidad | Estado / acción |
|---|---|---|---|
| 1 | Cookie `secure` rompía login admin sobre `http://localhost` | ~~Alta~~ | ✔ **Resuelto**: `secure` solo cuando `NEXTAUTH_URL` es https (`c11c760`) |
| 2 | Imágenes de producto son hotlinks a Unsplash (no representan el producto real) | Alta | **Parcial**: Storage y subida desde Admin listos (`3d6b89a`); falta fotografía propia del catálogo |
| 3 | Sin pasarela de pagos (solo mock) | Alta | Pendiente (Fase 5) |
| 4 | Licencias de imágenes externas: no asumir republicación comercial | Alta | Pendiente; `storagePath` permite migrar sin romper URLs históricas |
| 5 | `NEXTAUTH_SECRET` con fallback a secreto de desarrollo en `middleware.ts` | Media | Pendiente (revisar en despliegue; `.env` cargado siempre) |
| 6 | Admin sin CRUD de catálogo (solo lectura) | ~~Media~~ | ✔ **Resuelto**: CRUD completo (ligas, equipos, productos, variantes, stock, proveedores, temporadas, tallas, versiones) |
| 7 | Número de WhatsApp placeholder (+57 300 000 0000) | Media | Pendiente: configurar el real en `site.ts` |
| 8 | Sin tests automatizados | ~~Media~~ | ✔ **Resuelto (unit)**: `node:test`, 20 tests (rate-limit, passwords, checkout, pagos mock, filtros, utilidades); E2E y CI pendientes (Fase 7) |
| 9 | SQLite en dev no reflejaba comportamiento PostgreSQL | ~~Media~~ | ✔ **Resuelto**: todo contra Supabase PostgreSQL (Fase 1) |
| 10 | Datos seed demo (precios, productos) no son el catálogo real | Baja | Pendiente: reemplazar por importación real |
| 11 | `features/admin/*` mayormente vacías (páginas con prisma directo) | ~~Baja~~ | ✔ **Resuelto**: catálogo bajo `src/features/catalog/*` con actions y repositories |
| 12 | Rate-limit del login | ~~Media~~ | ✔ **Resuelto**: 5 intentos/15 min en memoria (`5b1cb04`) |
| 13 | Build dependía de Google Fonts (red) | ~~Media~~ | ✔ **Resuelto**: Inter self-hosted local; display condensado con fallback de sistema (`fd1e0c7`) |

---

## 15. Seguridad (auditoría FASE 3 — verificada)

Estado verificado empíricamente (2026-08-14) sobre el proyecto Supabase `xmsreelwxwqjzgtkxcje`:

| Área | Estado | Verificación |
|---|---|---|
| RLS en tablas `public` (21 tablas) | **ON, 0 políticas** | anon no puede leer (`200 []`), insertar (`401`) ni actualizar (`200 []` = 0 filas) vía PostgREST |
| Bucket `product-images` | Lectura pública (diseño), escritura solo service role | anon: upload `403 AccessDenied`, delete denegado, list `[]` (no filtra nombres) |
| Service role | Bypass de RLS | La app (server-only, `src/lib/supabase/server.ts`) sube/reemplaza/borra sin fricción |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No está en el bundle cliente | `.next/static` sin referencias a la URL de Supabase |
| Secretos en git | Ninguno | Solo `.env.example` versionado; `.gitignore` cubre `.env` y variantes |
| Auth admin | Cookie `fs_admin_session` HMAC-SHA256 (`NEXTAUTH_SECRET`), verificada en `middleware.ts` + `getSessionUser` | Middleware redirige `/admin/*` sin token válido |

Pendientes no bloqueantes:
- Login admin **sin rate-limit** (recomendable limitar intentos o protección en deploy).
- Cookie con `secure: true` en producción: requiere HTTPS (en `http://localhost` no se guarda).
- Rol `anon` de Supabase habilitado aunque no se usa (se puede desactivar en el panel de Supabase).

---

## Anexo — Comandos útiles

```bash
npm run dev            # desarrollo (puerto 3001 configurado por el usuario)
npm run build          # build de producción
npm start              # servidor de producción (puerto 3000)
npm run lint           # ESLint
npm run setup          # prisma generate + db push + seed
npm run admin:password -- admin@footballstore.co  # configurar admin
npx prisma studio      # inspección visual de la BD
```
