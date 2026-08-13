# Football Jersey Store ⚽

> Plataforma de e-commerce para vender camisetas de fútbol con **múltiples proveedores**, **disponibilidad semántica** (entrega inmediata / bajo pedido / agotada) y **personalización** (nombre, número o jugador oficial).

Construido con **Next.js 14 + TypeScript + Prisma + SQLite + Tailwind CSS**. Diseñado para correr en local sin instalar nada más que Node.js.

---

## ✨ Características

### Tienda (cliente)
- 🏠 Home con hero, ligas y destacados
- 🛍️ Catálogo con filtros (liga, equipo, temporada, versión, talla, disponibilidad)
- 📄 Página de producto con selector de versión, talla y personalización
- 🛒 Carrito persistente (localStorage)
- 💳 Checkout guest (sin registro obligatorio) con tarjeta / PSE / Nequi / Daviplata
- ✅ Confirmación de pedido con timeline del estado

### Panel administrativo (`/admin`)
- 📊 Dashboard con KPIs y pedidos recientes
- 👕 Gestión de productos
- 📦 Gestión de pedidos (cambio de estado)
- 📈 Inventario por variante
- 🏭 Gestión de proveedores
- 👥 Clientes

### Modelo de dominio
- **Producto ↔ Variante** desacoplados (sin duplicación por talla)
- **Disponibilidad semántica**: `AVAILABLE` · `ON_DEMAND` · `OUT_OF_STOCK` · `COMING_SOON`
- **Proveedores** como entidad de primera clase con `SupplierProduct` (comparación de costos)
- **Ciclo de vida del pedido** con historial de transiciones
- **Generación automática de SupplierOrder** cuando un item es bajo pedido

---

## 🚀 Quick start (5 minutos)

### Requisitos
- **Node.js 18+** (recomendado 20 LTS)
- **npm** (incluido con Node)

### Instalación

```bash
# 1. Clonar o descargar el proyecto, luego:
cd football-jersey-store

# 2. Instalar dependencias
npm install

# 3. Generar el cliente Prisma y crear la base de datos SQLite con datos de ejemplo
npm run setup
# Esto ejecuta: prisma generate && prisma db push && tsx prisma/seed.ts

# 4. Arrancar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

**Credenciales y datos de prueba:**
- La tienda está disponible para cualquiera como invitado
- El panel admin está en [/admin](http://localhost:3000/admin) (en el MVP no tiene login — agrega NextAuth cuando lo necesites)
- Datos seed: 6 ligas, 12 equipos, 15 productos, 300+ variantes, 3 proveedores

---

## 📁 Estructura del proyecto

```
football-jersey-store/
├── prisma/
│   ├── schema.prisma          # Modelo de dominio completo
│   ├── seed.ts                # Datos de ejemplo realistas
│   └── dev.db                 # SQLite (se genera con db push)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home
│   │   ├── productos/         # Catálogo + detalle
│   │   ├── carrito/           # Carrito
│   │   ├── checkout/          # Checkout
│   │   ├── pedido/[code]/     # Confirmación + tracking
│   │   ├── admin/             # Panel administrativo
│   │   └── api/               # Endpoints REST
│   ├── components/
│   │   ├── ui/                # Componentes base (Button, Input, Badge, Toaster)
│   │   ├── storefront/        # Header, Footer, ProductCard, ProductDetail
│   │   └── admin/             # OrderRowActions
│   └── lib/
│       ├── prisma.ts          # Cliente Prisma singleton
│       ├── cart.ts            # Estado del carrito (Zustand + persist)
│       ├── orders.ts          # Generación de códigos
│       └── utils.ts           # Formatters, badges, disponibilidad
├── .env.example               # Variables de entorno (plantilla)
├── tailwind.config.ts         # Design system
└── package.json
```

---

## 🗃️ Modelo de base de datos

```
┌────────────┐       ┌─────────────┐       ┌──────────────┐
│   League   │◀──────│    Team     │◀──────│   Product    │
└────────────┘       └─────────────┘       └──────┬───────┘
                                                  │
                       ┌────────────┐             │ has many
                       │  Season    │◀────────────┤
                       └────────────┘             │
                                                  ▼
┌────────────┐       ┌─────────────────────────────┐
│  Supplier  │◀──────│   ProductVariant            │
└─────┬──────┘       │  (sku, price, stock,        │
      │              │   availability)             │
      │              └─────────────┬───────────────┘
      │                            │
      │       ┌────────────────────┘
      ▼       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐
│ SupplierProduct  │    │     Order        │───▶│  OrderItem   │
│ (cost, avail)    │    │ (lifecycle)      │    │  (snapshot)  │
└──────────────────┘    └────────┬─────────┘    └──────────────┘
                                │
                                ▼
                       ┌────────────────────┐
                       │ OrderStatusHistory │
                       └────────────────────┘
```

### Estados del pedido

```
PENDING_PAYMENT → PAID → VALIDATING → RESERVED → SUPPLIER_REQUESTED
   → IN_TRANSIT → PREPARING → SHIPPED → DELIVERED → COMPLETED

Excepciones: CANCELLED · REFUNDED · RETURNED · PAYMENT_FAILED
```

### Disponibilidad de variante

- `AVAILABLE` — stock local > 0 (entrega inmediata)
- `ON_DEMAND` — sin stock local, se pide al proveedor (15-20 días)
- `OUT_OF_STOCK` — agotado temporalmente
- `COMING_SOON` — disponible próximamente

---

## 🛠️ Scripts disponibles

| Script              | Descripción                                          |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Inicia el servidor de desarrollo en :3000            |
| `npm run build`     | Compila para producción                              |
| `npm run start`     | Inicia el servidor de producción                     |
| `npm run setup`     | Genera Prisma + crea DB + carga datos de ejemplo     |
| `npm run db:push`   | Sincroniza el schema con la base de datos            |
| `npm run db:seed`   | Ejecuta el seed (datos de ejemplo)                   |
| `npm run db:reset`  | Borra la DB, recrea el schema y carga el seed        |
| `npm run studio`    | Abre Prisma Studio (inspector visual de la DB)       |

---

## 🔌 Endpoints API

| Método | Endpoint                                  | Descripción                       |
|--------|-------------------------------------------|-----------------------------------|
| `GET`  | `/api/products`                           | Listar productos                  |
| `POST` | `/api/checkout`                           | Crear pedido desde el carrito     |
| `GET`  | `/api/orders/[code]`                      | Obtener detalle de un pedido      |
| `PATCH`| `/api/admin/orders/[id]/status`           | Cambiar estado de un pedido       |

---

## 🎨 Stack técnico

- **Next.js 14** (App Router) — Server Components + Server Actions
- **TypeScript** — Tipado estricto en todo el dominio
- **Prisma 5** — ORM con schema declarativo
- **SQLite** — Cero configuración, ideal para dev y MVP
- **Tailwind CSS 3** — Utility-first, design system en `tailwind.config.ts`
- **Zustand** — Estado del carrito con persistencia en `localStorage`
- **Lucide React** — Iconos consistentes
- **Inter (Google Fonts)** — Tipografía

### Por qué SQLite para local
- No requiere instalar ni configurar un servidor de base de datos
- El archivo vive en `prisma/dev.db` — fácil de commitear si quieres, fácil de ignorar
- Para producción en Railway/Render/Fly.io, cambia `DATABASE_URL` a Postgres (cambia `provider` en `schema.prisma`)

---

## 📋 Roadmap (lo que NO está en el MVP)

Esto es lo que dejamos fuera intencionalmente para validar el negocio rápido:

- [ ] Login con email/Google (NextAuth) — actualmente el admin no tiene auth
- [ ] Integración real de pagos (Wompi / Mercado Pago / Stripe)
- [ ] Webhooks de proveedor para sync de inventario
- [ ] Notificaciones por email (Resend)
- [ ] Tracking de envío real (coordinadora, interrapidisimo, etc.)
- [ ] Programa de fidelización / puntos
- [ ] Lista de deseos
- [ ] Comparador de productos
- [ ] Búsqueda full-text con Meilisearch o Algolia
- [ ] Multi-idioma (i18n)
- [ ] Tests E2E con Playwright

---

## 🚢 Despliegue

### Variables de entorno de producción
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="<random-32-chars>"
NEXTAUTH_URL="https://tudominio.com"
PAYMENT_PROVIDER="wompi" # o el que elijas
```

### Cambiar de SQLite a PostgreSQL
1. En `prisma/schema.prisma`: cambia `provider = "sqlite"` por `provider = "postgresql"`
2. Cambia el `DATABASE_URL`
3. Corre `npx prisma migrate deploy`

### Plataformas recomendadas
- **Vercel** + **Neon** (Postgres serverless gratis)
- **Railway** (todo incluido)
- **Render** (con plan pago)

---

## 🤝 Contribuir

El proyecto sigue una arquitectura preparada para escalar. Antes de hacer cambios grandes:

1. Lee el `prisma/schema.prisma` para entender el dominio
2. Mantén `Product` y `ProductVariant` desacoplados
3. No introduzcas stock numérico para proveedores externos — usa `availability` semántica
4. Cada cambio de estado de pedido debe ir con un `OrderStatusHistory`

---

## 📄 Licencia

MIT

---

Hecho con ⚽ para tiendas que quieren vender camisetas sin quebraderos de cabeza.
