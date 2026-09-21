# Modelo de datos y snapshots

El diseño extiende el dominio existente; no introduce un carrito persistente ni una reserva de inventario durante la navegación. Los precios que llegan del cliente son una intención y se vuelven a leer desde Prisma antes de calcular o persistir un pedido.

## Entidades y extensiones

| Entidad | Campos/reglas |
|---|---|
| Producto/Variante | producto, versión, talla, imágenes/alt, precio; el precio/disponibilidad vienen de la variante. |
| Inventario | stock derivado del ledger y `allowsBackorder`; positivo = inmediato, cero + backorder = bajo pedido, cero sin backorder = agotado. |
| CartLine | `variantId`, versión, talla, cantidad, modalidad/ETA, personalización normalizada, `baseUnitPriceCop`, `personalizationSurchargeCop`, `unitPriceCop`, `lineTotalCop`. |
| CheckoutSummary | líneas recalculadas, `currency`, subtotal, descuento, envío, total, país, alcance y versión de regla. |
| OrderLineSnapshot | copia inmutable de variante, modalidad/ETA, personalización, base, recargo, unitario, descuento y total de línea. |
| LegalConsentSnapshot | `type` (`TERMS`, `PRIVACY`, `DATA_PROCESSING`), `documentKey`/URL, `documentVersion`, `acceptedAt` UTC, required/accepted. Tres filas por pedido. |
| ShippingRuleSnapshot | país, alcance, moneda, umbral, tarifa, versión y `chargeable`. |
| BoldTransaction | pedido, referencia externa única, monto COP entero, moneda, firma/hash no reversible, modo sandbox, estado normalizado, resultado verificado, idempotency key y timestamps; nunca `BOLD_SECRET_KEY`. |

Para Colombia, envío 0 si subtotal ≥ 200000, si no 15000; internacional es `INTERNATIONAL_QUOTE_PENDING` y `chargeable=false`. Cantidades/precios son enteros; total nunca negativo.

## Transiciones

`Variant → CartLine → CheckoutSummary → Order + snapshots → BoldTransaction`.

1. Añadir valida variante, personalización y stock.
2. Carrito/checkout recalcula server-side y reconcilia cambios.
3. Confirmar revalida stock en transacción atómica y crea pedido/snapshots.
4. Preparar Bold valida país/configuración/monto y firma en servidor.
5. Retorno/webhook verifica y transiciona idempotentemente `PREPARED → APPROVED | REJECTED | CANCELLED | PENDING | UNKNOWN`.
6. Error conserva pedido/carrito recuperable y nunca marca aprobado sin verificación.

## Relaciones y reglas de persistencia

- `Product 1—N ProductVariant`; `ProductVariant 1—N InventoryMovement`. El stock disponible es la proyección del ledger, no un campo editable desde la UI pública.
- `Order 1—N OrderItem`, `Order 1—N LegalConsentSnapshot`, `Order 1—0..1 ShippingRuleSnapshot` y `Order 1—0..1 BoldTransaction`.
- `OrderItem` debe conservar `baseUnitPrice`, `personalizationSurcharge`, `unitPrice`, `subtotal`, datos de personalización y `deliveryMode`; `Order.personalizationFee` sigue siendo el total agregado para compatibilidad.
- `LegalConsentSnapshot` requiere unicidad `(orderId, consentType)` y una versión/URL no nula. Los tres tipos (`TERMS`, `PRIVACY`, `DATA_PROCESSING`) se escriben en la misma transacción que el pedido.
- `ShippingRuleSnapshot` conserva país, alcance (`NATIONAL`/`INTERNATIONAL_QUOTE_PENDING`), moneda, umbral, tarifa, versión de regla y `chargeable`; evita recalcular pedidos históricos.
- `BoldTransaction` requiere unicidad por `orderId` y `externalReference`; las transiciones repetidas son no-op y solo una transición verificada puede marcar `PAID`.

## Migraciones

Usar migración aditiva para:

1. agregar a `OrderItem` los campos de desglose del precio y, si aplica, `deliveryEtaSnapshot`;
2. crear `LegalConsentSnapshot`, `ShippingRuleSnapshot` y `BoldTransaction`;
3. agregar índices/constraints de idempotencia y defaults compatibles;
4. hacer backfill de `OrderItem.unitPrice/subtotal` desde los valores actuales y de `Order.personalizationFee` sin alterar históricos.

No borrar ni reescribir pedidos históricos. Ejecutar `prisma migrate deploy` contra el proveedor configurado (el `schema.prisma` declara PostgreSQL; `prisma/dev.db` no prueba otro provider), `prisma generate`, seed, base limpia y prueba sobre copia de datos. Si local requiere `db push`, documentarlo solo como atajo no productivo y comprobar la migración real en PostgreSQL.
