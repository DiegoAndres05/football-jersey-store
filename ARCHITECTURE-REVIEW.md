# Football Jersey Store — Revisión Crítica de Arquitectura

> **Revisor:** Principal Software Architect (externo al diseño original)
> **Fecha:** Julio 2026
> **Documento:** Revisión del modelo de dominio v2 propuesto

---

## Resumen Ejecutivo

El diseño v2 representa una mejora significativa sobre el original en términos de
separación de concerns y preparación para crecimiento futuro. Sin embargo,
presenta **4 hallazgos críticos**, **8 de alta severidad** y **12 de severidad media**
que deben resolverse antes de considerar este modelo como estable.

La sobreingeniería es el patrón dominante: el modelo saltó de 11 a 29 entidades
(+164%) en una sola iteración sin que el negocio lo demande aún. Varias entidades
son prematuras y agregarán costo de mantenimiento sin valor inmediato.

---

## 1. Hallazgos Críticos

### C-1: InventoryMovement.quantity con signo + type implícito = duplicación de estado

**Dónde:** `InventoryMovement.quantity: Int` (firmado) + `MovementType` enum

**Problema:**
El campo `quantity` usa valores firmados (positivo = entrada, negativo = salida),
PERO el `MovementType` también codifica la dirección (`IN`/`RETURN` suman,
`OUT`/`SALE`/`RESERVATION` restan). Esto crea dos fuentes de verdad
mutuamente redundantes:

| type | quantity | ¿Válido? | Problema |
|---|---|---|---|
| `IN` | +5 | ✅ | OK |
| `SALE` | -3 | ✅ | OK |
| `IN` | -5 | ❌ | Ambiguo: ¿es una entrada de -5 o una salida mal tipada? |
| `RETURN` | -2 | ❌ | RETURN siempre suma, pero quantity dice que resta |

**Riesgo:** Inconsistencias de datos silenciosas. Una consulta `SUM(quantity)` mal
construida dará stocks incorrectos y pedidos que se envían sin inventario real.

**Solución propuesta:**
- `quantity` debe ser `Int` **siempre positivo** (absoluto)
- La dirección se deriva ÚNICAMENTE de `MovementType` en la capa de aplicación
- `IN`, `RETURN`, `CANCELLATION` → suman al stock
- `OUT`, `SALE`, `RESERVATION` → restan del stock
- `ADJUSTMENT` → necesita un campo `direction` booleano o un subtipo

```prisma
model InventoryMovement {
  quantity  Int           // SIEMPRE positivo. Dirección determinada por type
  type      MovementType
  adjustmentDirection String? // "INCREMENT" | "DECREMENT" — solo para ADJUSTMENT
}
```

---

### C-2: ProductVariant.availability como columna almacenada = estado derivado mutable

**Dónde:** `ProductVariant.availability: Availability`

**Problema:**
`availability` es estado derivado: debería computarse del inventario actual
(`SUM(movements)`) combinado con los `SupplierProduct` activos. Al almacenarlo
como columna, se garantiza que en algún momento estará desincronizado:

1. Llega un pedido → se crean movimientos SALE → stock baja → availability
   debió cambiar a `ON_DEMAND` u `OUT_OF_STOCK`, pero la columna sigue en
   `AVAILABLE`
2. Un admin corrige stock manualmente → olvida actualizar availability
3. Llega stock nuevo de proveedor → movements reflejan IN, pero availability
   sigue en `ON_DEMAND`

**Solución:**
- `availability` debe ser una **propiedad computada** (getter en la app), no una columna
- O, si se mantiene como columna por razones de query performance, debe
  actualizarse mediante un proceso **asíncrono gobernado por eventos** (ej., job
  que recalcula después de cada InventoryMovement y SupplierProduct update)

> **Nota:** Si se mantiene como columna, documentar explícitamente que es un
> cache de lectura y puede tener hasta N segundos de desfase.

---

### C-3: Cross-context FK coupling en InventoryMovement y StockReservation

**Dónde:** `InventoryMovement.orderId → Order`, `InventoryMovement.userId → User`,
`StockReservation.orderId → Order`

**Problema:**
En DDD, agregados de distintos bounded contexts NO deberían tener relaciones
directas por FK. El contexto de Inventory references directamente entidades de
Order (FK) y User (FK). Esto:

1. Crea acoplamiento físico entre schemas de distintos contextos
2. Impide que los contextos evolucionen independientemente
3. Genera problemas en despliegues con bases de datos separadas en el futuro
4. Viola el principio de que un aggregate solo debe referenciar a otro por su ID

**Solución:**
- Mantener `orderId` y `userId` como **strings referenciales** (sin FK en Prisma)
- La integridad referencial se garantiza a nivel de aplicación
- O crear un **domain event** `StockAdjusted` que el contexto Order escuche

```prisma
model InventoryMovement {
  orderReference String?  // order code, no FK
  userReference  String?  // user email or id, no FK
}
```

---

### C-4: Cascade delete en InventoryMovement destruye auditoría

**Dónde:** `ProductVariant → InventoryMovement` (`onDelete: Cascade`)

**Problema:**
Si un `ProductVariant` se elimina (ej., se descontinúa una talla), Prisma borrará
en cascada todos sus `InventoryMovement`. Esto **destruye el libro mayor de
inventario** para siempre. Es equivalente a quemar los registros contables.

**Riesgo:** En una auditoría real, no se podrá demostrar cuánto stock se vendió,
perdió o ajustó de esa variante. Dependiendo de la jurisdicción, esto puede
ser un problema legal/contable.

**Solución:**
```prisma
model ProductVariant {
  // Sin onDelete: Cascade en movements ni reservations
  movements       InventoryMovement[]
  stockReservations StockReservation[]
}
```

Y en InventoryMovement:
```prisma
model InventoryMovement {
  variantId String
  // Sin @relation — solo el ID, para evitar cascade y permitir soft-delete
}
```

O alternativamente, usar `isActive`/`isArchived` en ProductVariant en lugar de
eliminar registros.

---

## 2. Hallazgos de Alta Severidad

### H-1: StockReservation es redundante con InventoryMovement

**Dónde:** `StockReservation` entidad vs `InventoryMovement.type = RESERVATION`

**Problema:**
Ambos modelan el mismo concepto: "apartar stock para un pedido".
`StockReservation` tiene `quantity`, `orderId`, `expiresAt`. `RESERVATION`
en InventoryMovement también.

La existencia de ambas crea:
- Dos fuentes de verdad para las reservas activas
- Lógica duplicada de creación/liberación/expiración
- Riesgo de inconsistencia: una reserva puede tener movimiento pero no
  entidad, o viceversa

**Solución propuesta:**
Eliminar `StockReservation`. El tipo `RESERVATION` en `InventoryMovement` ya
cubre el caso. Si se necesita el concepto de "expiración", agregar `expiresAt`
directamente en `InventoryMovement`.

---

### H-2: Product.basePrice es huérfano semántico

**Dónde:** `Product.basePrice: Int`

**Problema:**
En el diseño v2, los precios reales están en `ProductVariant.costPrice` y
`salePrice`. `Product.basePrice` queda como un "precio ancla" sin uso claro
en queries o lógica de negocio. No se usa para calcular nada, no tiene
equivalente en la UI (no hay un "precio base del producto" distinto del precio
de la variante más barata).

**Riesgo:** Confusión en el equipo: "¿actualizo basePrice o salePrice?"
Inconsistencias: Product.basePrice puede divergir de ProductVariant.salePrice.

**Solución:**
Eliminar `Product.basePrice`. Si se necesita un precio de referencia para el
listing, computarlo como `MIN(salePrice)` del pool de variantes activas.

---

### H-3: Promotion.scope es redundante con las join tables

**Dónde:** `Promotion.scope: String ("ALL" | "PRODUCT" | "COLLECTION")`

**Problema:**
`scope` es metadata duplicada. Los datos reales están en:
- `PromotionProduct` (si tiene productos asignados)
- `PromotionCollection` (si tiene colecciones asignadas)
- Ambas vacías → ALL

El campo `scope` puede decir `PRODUCT` mientras `PromotionProduct` está vacío,
o `ALL` mientras `PromotionProduct` tiene registros. No hay restricción
check que valide la consistencia.

**Solución:**
Eliminar `scope`. Determinar el alcance en la lógica de aplicación:
```typescript
function getPromotionScope(promotion: Promotion): 'ALL' | 'PRODUCT' | 'COLLECTION' {
  if (promotion.products.length > 0) return 'PRODUCT'
  if (promotion.collections.length > 0) return 'COLLECTION'
  return 'ALL'
}
```

---

### H-4: Cascade delete en Order → OrderItem/OrderStatusHistory

**Dónde:** `Order → OrderItem`, `Order → OrderStatusHistory` (`onDelete: Cascade`)

**Problema:**
Si alguien elimina una Order (error, bug, depuración), se pierden:
- Los items vendidos (historial de ventas)
- El historial de cambios de estado
- Los movimientos de inventario asociados
- Las reservas de stock

En un sistema real, **los pedidos nunca se eliminan**. Se cancelan, se
reembolsan, pero no se borran.

**Solución:**
- Eliminar el cascade delete. En su lugar, marcar Order como `isArchived` o
  forzar cancelación vía cambio de estado.
- Documentar que la eliminación de Orders no está permitida en la capa de
  aplicación.

---

### H-5: Relación bidireccional Product ↔ OrderItem (cross-context)

**Dónde:**
```prisma
model Product {
  orderItems OrderItem[]
}

model OrderItem {
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
}
```

**Problema:**
`Product.orderItems[]` es una navegación inversa desde el contexto Catalog hacia
el contexto Order. Esto permite hacer `product.orderItems` en una query, lo que
parece útil pero acopla dos bounded contexts que deberían evolucionar
independientemente.

Además, puede causar problemas de performance: cargar un producto con todos
sus orderItems es peligroso.

**Solución:**
Eliminar `orderItems[]` de Product. La relación existe en una sola dirección:
`OrderItem → Product` (referencia débil, solo para lectura).

---

### H-6: OrderItem.sourceType como String sin restricciones

**Dónde:**
```prisma
model OrderItem {
  sourceType String @default("LOCAL")
}
```

**Problema:**
`sourceType` acepta cualquier string. Si en un `OrderItem.create` se escribe
`locale`, `local `, o `Local`, se crean datos inconsistentes. Es un bug
silencioso que no se detecta hasta que un reporte intente agrupar por
`sourceType`.

**Solución:**
```prisma
enum SourceType {
  LOCAL
  SUPPLIER
}
```

---

### H-7: Order.paymentMethod como String

**Dónde:**
```prisma
model Order {
  paymentMethod String @default("CARD")
}
```

**Problema:** El mismo problema que H-6: "card", "CARD ", "credit_card" son
todos distintos para la base de datos.

Ya existe `CustomizationType`, `MovementType`, etc. como enums. PaymentMethod
debería seguir el mismo patrón.

**Solución:**
```prisma
enum PaymentMethod {
  CARD
  PSE
  NEQUI
  DAVIPLATA
  CASH
  TRANSFER
}
```

---

### H-8: Overengineering — 18 entidades nuevas para un MVP

**Dónde:** Todo el modelo v2

**Problema:**
El diseño original tenía 11 entidades para un negocio que está en fase MVP.
La v2 propone 29 entidades. El análisis de impacto:

| Entidad | ¿Necesaria para MVP? | Justificación |
|---|---|---|
| Brand | ❌ No | Un string con validación basta hasta tener 20+ marcas |
| Collection | ❌ No | Agrupaciones ad-hoc en el admin resuelven el problema |
| ProductCollection | ❌ No | Solo si existe Collection |
| Promotion | ❌ No | Diseño prematuro. Promociones manuales vía descuento directo en salePrice |
| PromotionProduct | ❌ No | Solo si existe Promotion |
| PromotionCollection | ❌ No | Solo si existe Promotion |
| Coupon | ❌ No | Diseño prematuro. Sin lógica implementada, son tablas muertas |
| ShippingMethod | ⚠️ Opcional | Puede ser enum + precio hardcodeado en checkout por ahora |
| InventoryMovement | ✅ Sí | Core del negocio, necesario desde el día 1 |
| StockReservation | ❌ No | Redundante con InventoryMovement |
| ProductImage | ✅ Sí | Reemplazo correcto de imageUrl/galleryUrls |

**Costo de la sobreingeniería:**
- 7-8 tablas sin uso real durante meses
- Migraciones más complejas
- Seed data más costoso de mantener
- Curva de aprendizaje más alta para nuevos desarrolladores
- Cada join table es código admin que hay que escribir y testear

**Solución:**
Marcar estas entidades como `// TODO: V2 — no implementar aún` en el schema.
Mantenerlas diseñadas pero no migradas.

---

## 3. Hallazgos de Severidad Media

### M-1: Versión.surcharge debería llamarse priceOffset

`Version.surcharge` sugiere "recargo" (algo negativo), pero es un ajuste de
precio que puede ser positivo o negativo. `priceOffset` comunica mejor la
intención. O simplemente `priceAdjustment`.

---

### M-2: Collection.startsAt/endsAt son responsabilidad incorrecta

Las colecciones son agrupaciones **categóricas** (Euro 2024, Retro, Champions).
Las fechas de vigencia son conceptos **campaña/promoción**. Tener fechas en
Collection sugiere que una colección "expira", lo cual no es cierto: una
colección "Retro" es permanente.

Si la intención es modelar colecciones temporales (Black Friday), usar
Promotion o un campo `type: "PERMANENT" | "TEMPORARY"` en Collection.

---

### M-3: Currency por variante es granularidad excesiva

Tener `currency` en `ProductVariant` sugiere que una variante puede tener
moneda distinta de otra del mismo producto. Esto es inusual. Normalmente la
moneda es:

1. A nivel de **tienda** (una tienda vende en COP)
2. A nivel de **pedido** (el cliente selecciona moneda al checkout)
3. A nivel de **proveedor** (el proveedor factura en USD)

Mover `currency` a una configuración global o a `Supplier.currency` sería
más realista.

---

### M-4: kitType como String

`Product.kitType` tiene valores conocidos y fijos: `local`, `visitante`,
`tercera`, `entrenamiento`, `especial`. Debería ser un enum.

---

### M-5: User.role como String

`User.role` acepta cualquier string y es un concepto crítico de seguridad.
Debería ser enum `Role { CUSTOMER, ADMIN, SUPER_ADMIN }`.

---

### M-6: Índices faltantes en join tables y FKs

Revisando el schema, estas columnas no tienen índice explícito y serán
usadas frecuentemente en queries:

| Tabla | Columna | Query típica |
|---|---|---|
| PromotionProduct | `productId` | "Buscar promociones activas para este producto" |
| PromotionCollection | `collectionId` | "Buscar promociones para esta colección" |
| Order | `couponId` | "Buscar pedidos que usaron este cupón" |
| Order | `shippingMethodId` | "Reporte de métodos de envío más usados" |
| SupplierOrder | `supplierId` | "Buscar pedidos de este proveedor" |

Prisma crea índices automáticos para `@@id()` y `@unique`, pero no para
FKs simples.

---

### M-7: OrderItem.supplierId como String sin relación

`OrderItem.supplierId` es un String suelto. Si se quiere reportar "ventas
por proveedor", no se puede hacer join sin convertir/reconstruir la relación.
Debería ser `Supplier?` opcional, o al menos documentar que es una referencia
débil (como `orderReference`).

---

### M-8: Sin campo taxAmount ni taxRate en Order

Para e-commerce en Colombia, el IVA (19%) es obligatorio. No tener campo de
impuestos en Order significa que:

- `total` no puede desglosarse en subtotal + impuestos + envío
- Las facturas electrónicas no se pueden generar sin modificar el modelo
- Los reportes contables requieren assumptions

Agregar:
```prisma
model Order {
  taxAmount  Int  @default(0)
  taxRate    Int  @default(0) // en basis points: 1900 = 19%
}
```

---

### M-9: Sin updatedAt en OrderItem

`OrderItem` tiene `createdAt` pero no `updatedAt`. Si se implementan
devoluciones parciales o cambios en items, no hay forma de rastrear cuándo
se modificó.

---

### M-10: Sin OrderItem.notes

Para personalización hay `customizationName`/`customizationNumber`, pero no
hay un campo de notas generales para el item. Un cliente podría querer dejar
una nota para un producto específico (ej., "firma del jugador", "incluir
estuche").

---

### M-11: La dirección de Customer debería tener cascade delete o ser obligatoria

```prisma
model Address {
  customerId String?
  customer   Customer? @relation(...)
}
```

`customerId` es opcional, lo que permite direcciones huérfanas. Si se elimina
un Customer (GDPR, derecho al olvido), las direcciones hijas deberían
eliminarse también.

---

### M-12: SupplierOrder.orderedAt y receivedAt son mejorables

En lugar de dos campos sueltos, sería más consistente usar el patrón
`OrderStatusHistory` que ya existe para `Order`:

- `SupplierOrderStatusHistory` permitiría trackear fechas exactas de cada
  transición (PENDING → SENT → CONFIRMED → SHIPPED → RECEIVED)
- Los campos `orderedAt`/`receivedAt` duplican información que ya está en
  la transición de estado

---

## 4. Problemas de DDD Identificados

### 4.1 Bounded Contexts violados por relaciones FK

| FK | Contexto origen | Contexto destino | Problema |
|---|---|---|---|
| `InventoryMovement.orderId → Order` | Inventory | Order | Acoplamiento físico |
| `InventoryMovement.userId → User` | Inventory | Auth | Acoplamiento físico |
| `StockReservation.orderId → Order` | Inventory | Order | Acoplamiento físico |
| `Product.orderItems[]` | Catalog | Order | Navegación inversa cross-context |
| `Address.orders[]` | Customer | Order | Navegación inversa |
| `ShippingMethod.orders[]` | Shipping | Order | Navegación inversa |

**Causa raíz:** Prisma fomenta relaciones explícitas con FK. En DDD puro,
diferentes bounded contexts se comunican por eventos o servicios de
aplicación, no por FKs en la base de datos.

**Solución pragmática:** Para un MVP con base de datos única, las FKs son
aceptables siempre que:
1. Sean opcionales (no bloquean la evolución independiente)
2. Se documenten como "cross-context references" para futura extracción
3. No tengan `onDelete: Cascade` que pueda destruir datos de otro contexto

### 4.2 Agregados con responsabilidades mezcladas

**ProductVariant**
- Pertenece al contexto Catalog (qué se vende)
- Es el root del contexto Inventory (stock, movimientos)
- Tiene responsabilidad de Pricing (costPrice, salePrice)

Un aggregate root no debería pertenecer a dos contextos. `ProductVariant`
es el punto de integración entre Catalog e Inventory, lo cual es válido,
pero la línea es delgada. Recomendación: mantenerlo como "entidad compartida"
documentando que es el borde entre contextos.

### 4.3 Value Objects no modelados como tales

En DDD, estos deberían ser Value Objects (inmutables, sin identidad propia):

| Campo | Ubicación actual | Debería ser VO | Razón |
|---|---|---|---|
| `Address` | Entity | Potencialmente VO | Si es inmutable y intercambiable |
| `Size` | Entity con id | VO | XS, S, M, L no cambian |
| `Season` | Entity con id | VO | Una temporada no cambia de nombre |

En Prisma, no hay forma directa de modelar VOs (necesitarías JSON embebido
o tablas separadas). Es aceptable mantenerlos como entities ligeras, pero
documentar su naturaleza de Value Object.

---

## 5. Sobreingeniería — Resumen y Plan de Acción

### Entidades que deberían marcarse como "V2 — No implementar"

| Entidad | Costo actual | Valor actual | Acción |
|---|---|---|---|
| Brand | Migración + CRUD admin | Bajo (3 marcas en seed) | Marcar como V2 |
| Collection | Migración + CRUD admin + join table | Bajo (sin UI) | Marcar como V2 |
| ProductCollection | Idem | Bajo | Marcar como V2 |
| Promotion | 3 tablas + migración | Cero (sin lógica) | Marcar como V2 |
| PromotionProduct | 1 tabla | Cero | Marcar como V2 |
| PromotionCollection | 1 tabla | Cero | Marcar como V2 |
| Coupon | 1 tabla + migración | Cero (sin lógica) | Marcar como V2 |
| ShippingMethod | 1 tabla + migración | Bajo (hardcode funciona) | Marcar como V2 |
| StockReservation | 1 tabla + migración | Cero (redundante) | Eliminar del schema |

### Entidades core para MVP (prioridad ALTA)

| Entidad | Prioridad |
|---|---|
| Product, ProductImage, ProductVariant | P0 |
| League, Team, Season, Version, Size | P0 |
| Customer, Address, User | P0 |
| Order, OrderItem, OrderStatusHistory | P0 |
| Supplier, SupplierProduct, SupplierOrder, SupplierOrderItem | P0 |
| InventoryMovement | P1 (sin esto, stock no tiene ledger) |

### Totales finales recomendados

| Métrica | v1 original | v2 propuesta | v2 corregida (MVP) |
|---|---|---|---|
| Entidades | 11 | 29 | 19 |
| Tablas join | 0 | 4 | 1 (ProductCollection si se implementa) |
| Enums | 0 | 6 | 6 |
| Cross-context FKs | 2 | 8 | 8 (documentadas) |
| Funcionalidad nueva real | — | 7 cambios | 4 cambios core |

---

## 6. Resumen de Acciones Requeridas

### 🔴 Corregir antes de implementar

| ID | Acción |
|---|---|
| C-1 | Cambiar `quantity` a siempre positivo, dirección solo por `type` |
| C-2 | Eliminar columna `availability`, reemplazar por getter computado |
| C-3 | Eliminar FKs cross-context en InventoryMovement y StockReservation |
| C-4 | Eliminar `onDelete: Cascade` en ProductVariant → InventoryMovement |
| H-1 | Eliminar `StockReservation`, usar `RESERVATION` type en movements |
| H-2 | Eliminar `Product.basePrice` o documentar que es deprecado |
| H-3 | Eliminar `Promotion.scope`, computar desde join tables |
| H-4 | Eliminar cascade de Order → OrderItem y Order → OrderStatusHistory |
| H-5 | Eliminar `Product.orderItems[]` (relación bidireccional) |

### 🟡 Simplificar/Marcar como aplazado

| ID | Acción |
|---|---|
| H-6 | Convertir `sourceType` a enum |
| H-7 | Convertir `paymentMethod` a enum |
| H-8 | Marcar Brand, Collection, Promotion, Coupon, ShippingMethod como V2 |
| M-1 | Renombrar `Version.surcharge` → `priceAdjustment` |
| M-4 | Convertir `kitType` a enum |
| M-5 | Convertir `User.role` a enum |
| M-6 | Agregar índices faltantes |

### 🟢 Mejoras recomendadas (bajo esfuerzo)

| ID | Acción |
|---|---|
| M-8 | Agregar `taxAmount` y `taxRate` a Order |
| M-9 | Agregar `updatedAt` a OrderItem |
| M-10 | Agregar `notes` a OrderItem |
| M-11 | Hacer `Address.customerId` obligatorio (no-null) |
| M-12 | Considerar SupplierOrderStatusHistory en vez de campos sueltos |

---

## 7. Conclusión

El diseño v2 introduce mejoras reales y necesarias — especialmente el ledger
de InventoryMovement, la separación Customer/User, y ProductImage como entidad.
Sin embargo, adolece de tres problemas sistémicos:

1. **Sobreingeniería defensiva:** ~8 entidades que no son necesarias para el
   MVP y agregarán costo de mantenimiento. Marcar como V2.

2. **Acoplamiento cross-context por FKs:** Aunque pragmático para una DB única,
   las relaciones entre Inventory, Order y Auth a través de FKs directas deben
   minimizarse y documentarse.

3. **Redundancia de estado:** El patrón de "duplicar información en tipo +
   campo" (quantity signed + type, scope + join tables, StockReservation +
   RESERVATION type) introduce riesgos de inconsistencia que son difíciles de
   depurar.

**Calificación del diseño:** 6.5/10 — sólido en concepto, sobreingeniería en
ejecución, requiere simplificación antes de implementar.
