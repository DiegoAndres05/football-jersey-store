# Football Jersey Store — Project Brief

> **Versión:** 1.0 — Julio 2026
> **Propósito:** Documento ejecutivo del producto. Define visión, alcance y roadmap.

---

## Visión del producto

Plataforma de e-commerce especializada en camisetas de fútbol que permite a clientes
en Colombia comprar camisetas originales con personalización (nombre, número,
jugador oficial), con múltiples proveedores y disponibilidad semántica (stock local
o bajo pedido).

---

## Usuarios objetivo

| Perfil | Descripción | Prioridad |
|---|---|---|
| **Comprador casual** | Aficionado que busca la camiseta de su equipo favorito. Compra sin registro (guest checkout). Paga con tarjeta, PSE, Nequi o Daviplata. | Alta |
| **Coleccionista** | Busca ediciones especiales, retros, versiones Player. Valora la personalización. | Media |
| **Administrador** | Gestiona productos, pedidos, inventario y proveedores. Opera desde el panel `/admin`. | Alta |

---

## MVP — Funcionalidades incluidas

### Catálogo (Sprint 1)
- Home con hero, ligas destacadas, productos destacados
- Catálogo con filtros: liga, equipo, temporada, versión, talla, disponibilidad
- Detalle de producto con galería de imágenes, versión (Fan/Player/Retro), talla
- Personalización: nombre + número, jugador oficial
- Precios: precio de venta, precio de referencia (tachado), badge de disponibilidad

### Checkout (Sprint 2)
- Carrito persistente (localStorage via Zustand)
- Checkout guest: datos de contacto + dirección de envío
- Métodos de pago mock: Tarjeta, PSE, Nequi, Daviplata
- Cálculo de envío (gratis > $200.000 COP)
- Confirmación de pedido con código y timeline de estado

### Gestión de pedidos (Sprint 3)
- Página pública de seguimiento con código de pedido
- Timeline visual de estados: PENDING_PAYMENT → PAID → VALIDATING → RESERVED
  → SUPPLIER_REQUESTED → IN_TRANSIT → PREPARING → SHIPPED → DELIVERED → COMPLETED

### Panel administrativo (Sprint 4)
- Dashboard con KPIs: ingresos, pedidos, productos, clientes
- CRUD de productos con imágenes, variantes, precios
- Gestión de pedidos: cambio de estado, notas, tracking
- Visualización de inventario con alertas de stock bajo

### Operaciones (Sprint 5)
- Gestión de proveedores (CRUD)
- Órdenes a proveedor (SupplierOrder)
- Movimientos de inventario (InventoryMovement ledger)

---

## Lo que NO está en el MVP

| Funcionalidad | Motivo |
|---|---|
| **Login/registro** | Guest checkout es prioritario. NextAuth se agrega después del MVP |
| **Pasarela de pagos real** | MVP usa mock payment. Integrar Wompi/Mercado Pago en V2 |
| **Brand como entidad** | Solo 3 marcas en seed. String en Product es suficiente |
| **Colecciones** | Sin casos de uso reales. Se agregan en V2 |
| **Promociones/Cupones** | Sin lógica de negocio. `discountAmount` en Order está preparado |
| **ShippingMethod como entidad** | Envío hardcodeado (Nacional). Se agrega con múltiples carriers |
| **Notificaciones email** | Requiere Resend/SendGrid. MVP usa solo pantalla de confirmación |
| **Tests E2E** | Playwright se agrega antes de producción, no en desarrollo inicial |
| **Búsqueda full-text** | Meilisearch/Algolia en V2 |

---

## Roadmap

| Sprint | Feature | Depende de |
|---|---|---|
| Sprint -1 | UX: wireframes, flujos, mapa de navegación | — |
| Sprint 0a | Infraestructura: Next.js + Prisma + seed data | Sprint -1 |
| Sprint 0b | Sistema de UI: Button, Input, Select, Badge, etc. | Sprint 0a |
| Sprint 0c | Layout: Header, Footer, Sidebar, Loading, Error | Sprint 0b |
| Sprint 1 | Catálogo + Detalle de producto | Sprint 0c |
| Sprint 2 | Carrito + Checkout | Sprint 1 |
| Sprint 3 | Gestión de pedidos + Confirmación | Sprint 2 |
| Sprint 4 | Panel admin (Dashboard + CRUD) | Sprint 3 |
| Sprint 5 | Operaciones (Inventario + Proveedores) | Sprint 4 |
| Sprint 6 | Dashboard admin + Optimización + Deploy | Sprint 5 |

---

## V2 — Roadmap futuro

| Funcionalidad | Prioridad |
|---|---|
| NextAuth + login/registro | Alta |
| Pasarela de pagos real (Wompi/Mercado Pago/Stripe) | Alta |
| Notificaciones por email (Resend) | Alta |
| Brand como entidad | Media |
| Colecciones + Promociones + Cupones | Media |
| ShippingMethod como entidad con múltiples carriers | Media |
| Búsqueda full-text (Meilisearch/Algolia) | Baja |
| Tests E2E (Playwright) | Alta (antes de producción) |
| Multi-moneda | Baja |
