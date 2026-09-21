# Research: Precio válido para productos agotados

## Fuente de verdad del precio visible

- **Decision**: El precio mostrado para un producto agotado debe ser el último precio válido positivo ya persistido para ese producto, no un valor calculado desde variantes sin stock. Si no existe un precio confiable mayor a cero, la UI debe ocultar el importe y mantener el badge `Agotado`.
- **Rationale**: El requisito define explícitamente que `$0 COP` es una presentación incorrecta y que el valor debe provenir de un precio histórico o actual válido, nunca de la ausencia de variantes disponibles. El sistema ya conoce `salePrice` por variante y los aggregates de `minPrice/maxPrice`; la solución debe reutilizar esa fuente, no inventar nuevas reglas de descuento ni stock.
- **Alternatives considered**: Derivar el precio de `variantInfos.filter(stock>0)` (rechazado porque al vaciarse la lista el valor cae a cero); ocultar siempre el precio en agotadas (rechazado porque la especificación permite mostrar el último precio válido si existe); mostrar el precio mínimo entre todas las variantes (rechazado porque puede ser cero o depender de una talla sin stock).

## Estado de disponibilidad y derivación visual

- **Decision**: Mantener el `availability` actual del producto (`AVAILABLE` / `ON_DEMAND` / `OUT_OF_STOCK`) como fuente del estado de compra y agregar una política de render de precio visible solo en la capa de presentación.
- **Rationale**: El catálogo ya distingue stock real, bajo pedido y agotado, y la corrección es una cuestión de qué se imprime en precio cuando la disponibilidad es `OUT_OF_STOCK`, no un cambio de negocio de inventario.
- **Alternatives considered**: Reescribir la semántica de availability (rechazado porque cambia la lógica existente y puede impactar filtros/checkout); crear un segundo estado de “agotado con precio histórico” en persistence (rechazado por no ser necesario y por ampliar el alcance).

## Reutilización de aggragados y UI

- **Decision**: Centralizar la política en un helper puro de dominio y usarlo desde `ProductCard` y la página de detalle. El repositorio ya aporta `getPriceRangesByProductIds`/`getVariantInfosByProductIds`, así que la corrección se integra en el mismo camino de datos de catálogo y detalle.
- **Rationale**: El proyecto prioriza dominio y presentación en `src/features/products`, con tests unitarios y sin acoplamiento a checkout o admin. Esto minimiza duplicación y garantiza consistencia entre cards y detalle.
- **Alternatives considered**: Manejar el tema solo en la UI de cada componente (rechazado porque abre riesgo de inconsistencia y dificulta regresiones); tocar la base de datos o migraciones (rechazado por alcance y por la restricción del spec).

## Contract-level validation

- **Decision**: La guardrail del precio debe estar en la capa de render y en los helpers, con evaluación explícita: `displayPrice === null` o `displayPrice > 0` únicamente; `priceText` nunca puede ser `"$0 COP"` ni derivarse de cero.
- **Rationale**: Permite pruebas simples y cubre los edge cases de la especificación: precio nulo, precio cero, stock cero, backorder y producto disponible.
- **Alternatives considered**: Validar solo al render del componente (rechazado por falta de testabilidad); validar en la DB (rechazado por acoplar lógica de presentación a persistencia).
