# Football Jersey Store — Decisiones Arquitectónicas

> Registro de decisiones de diseño (ADR) — Julio 2026

---

## Convenciones

| Estado | Significado |
|---|---|
| ✅ **Adoptado** | Decisión implementada en el schema actual |
| ❌ **Rechazado** | Decisión evaluada y descartada |
| 🔜 **Pospuesto** | Decisión válida pero diferida a V2 |

---

## Decisiones

### D1: Customer como entidad separada de User

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía User como única entidad para clientes y admins, con `isAdmin` como flag. El guest checkout creaba pedidos huérfanos sin relación con User. |
| **Alternativas** | 1. Mantener User único con `isGuest` flag. 2. Customer + User separados. |
| **Motivo** | Un Customer existe para comprar. Un User existe para autenticarse. Son dos conceptos distintos. Guest checkout crea Customer sin User. Cuando el guest se registra, se vincula Customer → User. Esto permite que un cliente tenga historial de pedidos antes de registrarse. |
| **Impacto** | +1 entidad (+9 líneas). Es la entidad más valiosa del cambio. Sin esto, guest checkout es frágil. |

---

### D2: InventoryMovement como reemplazo de stock Int

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía `ProductVariant.stock: Int?` mutable. Sin auditoría ni trazabilidad. |
| **Alternativas** | 1. Mantener stock Int. 2. InventoryMovement con quantity firmado. 3. InventoryMovement con quantity siempre positivo. |
| **Motivo** | El stock es estado derivado, no almacenado. Cada movimiento se registra con tipo, cantidad, referencia y motivo. El stock actual es `SUM(quantity)` con dirección según MovementType. Es la mejora más importante para un negocio real: permite detectar pérdidas, reconciliar inventario y auditar el pasado. |
| **Impacto** | +1 entidad (+15 líneas). Reemplaza un campo Int. El cálculo de stock requiere una query SUM en lugar de leer un campo. Para MVP con cientos de variantes, el impacto es despreciable. |
| **Riesgo mitigado** | R1 del diseño original (stock sin historial). |

---

### D3: quantity siempre positivo, dirección por MovementType

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 proponía `quantity: Int` firmado. Esto permitía inconsistencias (IN con quantity negativo). |
| **Alternativas** | 1. Quantity firmado. 2. Quantity siempre positivo + dirección por type. |
| **Motivo** | Elimina la fuente de redundancia: IN siempre suma, SALE siempre resta. ADJUSTMENT tiene un campo `adjustmentDirection` explícito. No hay ambigüedad posible. |
| **Impacto** | El cálculo de stock requiere CASE WHEN en lugar de SUM directo. |
| **Hallazgo corregido** | C-1 (quantity redundante). |

---

### D4: availability eliminada como columna

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 almacenaba `ProductVariant.availability` como columna a pesar de ser estado derivado. |
| **Alternativas** | 1. Columna + job de recálculo. 2. Computado en la app. |
| **Motivo** | El availability se puede computar de forma trivial: stock actual + proveedores activos + fecha de lanzamiento. Almacenarlo garantiza desincronización. Para MVP, el costo de cómputo es irrelevante. |
| **Impacto** | Menos datos stale. El frontend siempre ve el estado correcto. |
| **Hallazgo corregido** | C-2 (availability derivada). |

---

### D5: Sin FK de Inventory a Order/User

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 tenía `InventoryMovement.orderId → Order` y `InventoryMovement.userId → User`. |
| **Alternativas** | 1. FK directas. 2. String references (orderReference, userReference). |
| **Motivo** | Inventory, Order y Auth son bounded contexts distintos. Una FK entre ellos crea acoplamiento físico. Usar strings referenciales mantiene la integridad a nivel de aplicación sin acoplar los schemas. |
| **Impacto** | No hay integridad referencial a nivel DB. La aplicación debe validar que orderReference exista antes de crear el movimiento. Para MVP, el código de aplicación es quien crea estos registros, no hay riesgo real. |
| **Hallazgo corregido** | C-3 (cross-context FK). |

---

### D6: Sin cascade delete en datos de auditoría

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía `onDelete: Cascade` en relaciones que nunca deberían eliminar datos (InventoryMovement, OrderItem, OrderStatusHistory). |
| **Alternativas** | 1. Cascade. 2. Restrict. 3. Sin FK. |
| **Motivo** | Los movimientos de inventario, items de pedido e historial de estados son registros contables. Nunca deben eliminarse automáticamente. Restrict evita la eliminación accidental a nivel DB. |
| **Impacto** | El admin no puede eliminar un producto con variantes que tengan movimientos (debe desactivarlo en lugar de borrarlo). Esto es correcto. |
| **Hallazgo corregido** | C-4 (cascade destructivo). |

---

### D7: StockReservation eliminado

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 proponía StockReservation como entidad separada además de MovementType.RESERVATION. |
| **Alternativas** | 1. Entidad separada + MovementType. 2. Solo MovementType. |
| **Motivo** | MovementType.RESERVATION + un campo `expiresAt` opcional en InventoryMovement cubre el mismo caso sin duplicar lógica. |
| **Impacto** | -1 entidad, -10 líneas. |
| **Hallazgo corregido** | H-1 (StockReservation redundante). |

---

### D8: Product.basePrice eliminado

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía `Product.basePrice` como precio ancla. Con `costPrice` y `salePrice` en ProductVariant, este campo quedó huérfano. |
| **Alternativas** | 1. Mantenerlo. 2. Eliminarlo. |
| **Motivo** | No hay código que lo use de forma significativa. Los precios reales están en ProductVariant. Si se necesita un precio de referencia para el listing, se usa `MIN(salePrice)` del pool de variantes. |
| **Impacto** | -1 campo. El seed debe ajustarse para no referenciar basePrice. |
| **Hallazgo corregido** | H-2 (basePrice huérfano). |

---

### D9: Brand como string en Product (V2 como entidad)

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado (como string) · 🔜 Pospuesto (como entidad) |
| **Contexto** | El diseño v2 proponía Brand como entidad. El seed tiene 3 marcas (Nike, Adidas, Puma). |
| **Alternativas** | 1. Entidad Brand (con CRUD admin, migraciones, seed). 2. `brand: String?` en Product. |
| **Motivo** | 3 marcas no justifican una tabla. Una string con validación en el admin resuelve el problema. Cuando haya 20+ marcas y se necesiten filtros, páginas de marca o logos, se promueve a entidad con una migración trivial: crear Brand desde los strings existentes y reemplazar `brand` por `brandId`. |
| **Impacto** | -1 entidad, -1 join table. Ahorro de ~20 líneas y un CRUD completo. |
| **Riesgo** | Strings sueltos pueden tener variaciones ("Nike" vs "nike"). Mitigación: Select dropdown en el admin en lugar de text input libre. |
| **Costos futuros** | Migración de string a FK. Bajo: se crea tabla Brand, se insertan valores únicos, se actualiza Product. |

---

### D10: Collection + ProductCollection eliminados (V2)

| Campo | Valor |
|---|---|
| **Decisión** | ❌ Rechazado para MVP · 🔜 Pospuesto a V2 |
| **Contexto** | El diseño v2 proponía Collection como entidad con N:M a Product. |
| **Alternativas** | 1. Entidad Collection. 2. Eliminar. |
| **Motivo** | No hay casos de uso reales en MVP. Las agrupaciones se manejan por liga, equipo y temporada. Collection es valioso para campañas de marketing (Euro 2024, Black Friday), pero eso es V2. |
| **Impacto** | -2 entidades (Collection + ProductCollection). Ahorro de ~25 líneas. |

---

### D11: Promotion + Coupon eliminados (V2)

| Campo | Valor |
|---|---|
| **Decisión** | ❌ Rechazado para MVP · 🔜 Pospuesto a V2 |
| **Contexto** | El diseño v2 proponía Promotion (con 2 join tables) + Coupon. |
| **Alternativas** | 1. Mantenerlas diseñadas. 2. Eliminar. |
| **Motivo** | Son 4 tablas sin lógica de negocio implementada. No hay casos de uso en MVP. Cuando se necesiten descuentos, se implementan como entidades nuevas. El campo `discountAmount` en Order ya está preparado para recibir el valor. |
| **Impacto** | -4 entidades (Promotion, PromotionProduct, PromotionCollection, Coupon). Ahorro de ~50 líneas. |

---

### D12: ShippingMethod eliminado (V2)

| Campo | Valor |
|---|---|
| **Decisión** | ❌ Rechazado para MVP · 🔜 Pospuesto a V2 |
| **Contexto** | El diseño v2 proponía ShippingMethod como entidad. |
| **Alternativas** | 1. Entidad. 2. `shippingMethod: String` en Order. |
| **Motivo** | Para MVP con un país (Colombia) y un carrier, una entidad es sobreingeniería. El nombre del método se guarda como string en Order. El precio se calcula con lógica hardcodeada (free > $200k). Cuando haya múltiples carriers y zonas geográficas, se promueve a entidad. |
| **Impacto** | -1 entidad. +1 campo String en Order. |

---

### D13: OrderItem.sourceType como enum

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original lo tenía como String. |
| **Alternativas** | 1. String. 2. Enum. |
| **Motivo** | SourceType solo tiene 2 valores (LOCAL, SUPPLIER). Es un concepto de dominio con valores fijos. Un enum previene errores tipográficos y hace el código más expresivo. |
| **Impacto** | +1 enum. Migración trivial. |
| **Hallazgo corregido** | H-6 (sourceType sin tipo). |

---

### D14: Order.paymentMethod como enum

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original lo tenía como String. |
| **Alternativas** | 1. String. 2. Enum. |
| **Motivo** | Los métodos de pago son conocidos y fijos para MVP: CARD, PSE, NEQUI, DAVIPLATA. El enum garantiza que solo estos valores se almacenen. |
| **Impacto** | +1 enum (PaymentMethod). |
| **Hallazgo corregido** | H-7 (paymentMethod sin tipo). |

---

### D15: Product.kitType como enum

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original lo tenía como String. |
| **Alternativas** | 1. String. 2. Enum. |
| **Motivo** | Los tipos de camiseta son fijos: local, visitante, tercera, entrenamiento, especial. Un enum evita valores inválidos. |
| **Impacto** | +1 enum (KitType). |
| **Hallazgo corregido** | M-4 (kitType sin tipo). |

---

### D16: User.role como enum

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original lo tenía como String. |
| **Alternativas** | 1. String. 2. Enum. |
| **Motivo** | Los roles de usuario son fijos y críticos para seguridad. CUSTOMER, ADMIN, SUPER_ADMIN. Un enum evita que un bug asigne un rol inexistente. |
| **Impacto** | +1 enum (UserRole). |
| **Hallazgo corregido** | M-5 (role sin tipo). |

---

### D17: Version.surcharge renombrado a priceAdjustment

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original usaba `surcharge` que lingüísticamente implica un recargo adicional. |
| **Alternativas** | 1. Mantener surcharge. 2. priceAdjustment. |
| **Motivo** | `priceAdjustment` comunica mejor que puede ser positivo o negativo. Una versión "Fan" puede costar menos que la base, una "Player" más. No es un "recargo", es un "ajuste". |
| **Impacto** | Renombre. Sin cambios funcionales. |
| **Hallazgo corregido** | M-1 (naming). |

---

### D18: OrderItem sin cascade delete desde Order

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía Cascade en Order → OrderItem y Order → OrderStatusHistory. |
| **Alternativas** | 1. Cascade. 2. Restrict. |
| **Motivo** | Los items de pedido e historial de estados son registros contables. Si se elimina una Order (por error), no deben perderse. Restrict previene la eliminación. Para "eliminar" un pedido se usa el estado CANCELLED. |
| **Impacto** | No se puede borrar una Order con items. Para depuración, hay que cancelar (cambio de estado), no eliminar. |
| **Hallazgo corregido** | H-4 (cascade en Order). |

---

### D19: Product → OrderItem bidireccional eliminada

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 tenía `Product.orderItems[]` como navegación inversa. |
| **Alternativas** | 1. Mantener bidireccional. 2. Solo OrderItem → Product. |
| **Motivo** | Catalog no debe tener una relación directa a Order. Son bounded contexts distintos. Si se necesita saber qué pedidos incluyen un producto, se consulta OrderItem filtrado por productId. |
| **Impacto** | Una query adicional para el reporte. Sin impacto en performance para MVP. |
| **Hallazgo corregido** | H-5 (bidireccional cross-context). |

---

### D20: Address.customerId como obligatorio

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía `customerId: String?` opcional, permitiendo direcciones huérfanas. |
| **Alternativas** | 1. Opcional. 2. Obligatorio con cascade. |
| **Motivo** | Una dirección sin Customer no tiene propósito. Si el Customer se elimina (GDPR), las direcciones deben eliminarse con él. |
| **Impacto** | Toda address debe pertenecer a un Customer. En guest checkout, se crea Customer primero. |
| **Riesgo mitigado** | M-11 (addresses huérfanas). |

---

### D21: Setting mantenido

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | Entidad existente en el diseño original. |
| **Alternativas** | 1. Mantener. 2. Eliminar (usar env vars + config file). |
| **Motivo** | Es una tabla simple clave-valor (5 líneas). Útil para configuración admin sin deploy (ej., umbral de stock bajo, tiempo de entrega por defecto). No justifica eliminarla. |
| **Impacto** | 1 entidad, 4 líneas. Cero costo de mantenimiento. |

---

### D22: Address mantenida como entidad

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño original tenía Address como entidad. Se consideró eliminarla y usar solo campos snapshot en Order. |
| **Alternativas** | 1. Entidad. 2. Solo snapshot en Order. |
| **Motivo** | Aunque el guest checkout guarda la dirección en Order (snapshot), tener Address como entidad permite que un cliente recurrente recupere su dirección sin reescribirla. Es un ahorro de fricción significativo en el checkout. |
| **Impacto** | +1 entidad, +15 líneas. |
| **Dato** | El seed puede precargar direcciones de ejemplo para clientes de prueba. |

---

### D23: InventoryMovement sin FK a ProductVariant

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | El diseño v2 tenía `onDelete: Cascade` en ProductVariant → InventoryMovement. |
| **Alternativas** | 1. Cascade. 2. Restrict. 3. Sin FK. |
| **Motivo** | Se eliminó la FK para evitar cascade delete destructivo. `variantId` queda como string referencial. La aplicación garantiza que apunte a un variant existente. |
| **Impacto** | Sin integridad referencial a nivel DB. La app es la única fuente de creación de movimientos, por lo que el riesgo es mínimo. |
| **Hallazgo corregido** | C-4 (cascade destructivo). |

---

### D24: inventory_movement type ADJUSTMENT con direction explícita

| Campo | Valor |
|---|---|
| **Decisión** | ✅ Adoptado |
| **Contexto** | ADJUSTMENT puede incrementar O decrementar el stock. Sin un campo de dirección, no se puede distinguir. |
| **Alternativas** | 1. Dos tipos separados (ADJUSTMENT_IN, ADJUSTMENT_OUT). 2. Un campo `adjustmentDirection`. |
| **Motivo** | Un solo tipo ADJUSTMENT + `adjustmentDirection` es más limpio que multiplicar tipos. El campo solo es requerido cuando type = ADJUSTMENT (validación en la app). |
| **Impacto** | +1 campo opcional. Validación extra en la app. |

---

## Resumen por tipo de decisión

| Tipo | Cantidad |
|---|---|
| ✅ Adoptado | 20 |
| ❌ Rechazado para MVP | 3 (Collection, Promotion, Coupon) |
| 🔜 Pospuesto a V2 | 3 (Brand como entidad, Collection, Promotion/Coupon) |
| **Total** | **24 decisiones documentadas** |

---

## Entidades: estado final

### Mantenidas (20)

League, Team, Season, Version, Size, Product, ProductImage, ProductVariant, InventoryMovement, Supplier, SupplierProduct, SupplierOrder, SupplierOrderItem, Customer, Address, User, Order, OrderItem, OrderStatusHistory, Setting

### Eliminadas del MVP (8)

Brand (→ string), Collection, ProductCollection, Promotion, PromotionProduct, PromotionCollection, Coupon, ShippingMethod, StockReservation

### Neto vs diseño original

| Métrica | v1 original | v2 propuesta | v2 consolidada (MVP) |
|---|---|---|---|
| Entidades | 11 | 29 | **20** |
| Tablas join | 0 | 4 | **0** |
| Enums | 0 | 6 | **8** |
| Cross-context FKs | 2 | 8 | **0** (solo strings) |
| Cascade delete en auditoría | Sí | Sí | **No** |
| Código semántico duplicado | — | 3 casos | **0** |
