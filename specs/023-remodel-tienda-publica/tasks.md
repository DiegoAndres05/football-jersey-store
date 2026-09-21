---

# Tasks: Remodel y fixes de la tienda pública Flashsport

**Input**: `specs/023-remodel-tienda-publica/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/checkout-and-payment.md`, `contracts/routes-and-legal.md`, `quickstart.md`)

**Scope guardrails**: preservar rutas públicas, guest checkout y contratos existentes; no modificar `/admin`, no rebrand, no cuentas, no carriers nuevos y no Bold productivo. No se implementa código en esta fase: esta lista describe el trabajo ejecutable.

## Phase 1: Setup

**Purpose**: preparar fixtures, configuración y evidencia sin introducir infraestructura nueva.

- [X] T001 Revisar `AGENTS.md`, `specs/023-remodel-tienda-publica/spec.md` y `specs/023-remodel-tienda-publica/plan.md` y registrar en `DECISIONS.md` los límites de alcance (rutas públicas preservadas, `/admin` fuera de alcance y Bold solo sandbox)
- [X] T002 [P] Auditar `src/app`, `src/features`, `src/shared`, `prisma/schema.prisma` y `tests/` y documentar en `specs/023-remodel-tienda-publica/` los archivos existentes que se reutilizarán
- [X] T003 [P] Crear fixtures deterministas de variante en stock, bajo pedido, agotada, precios/tallas/versiones distintas, imagen faltante, personalización y cupones en `tests/fixtures/public-store-fixtures.ts`
- [X] T004 [P] Añadir variables de ejemplo no secretas (`PAYMENT_PROVIDER=bold-sandbox`, nombres de llaves y URLs/versiones legales ficticias) a `.env.example`, sin valores reales ni exposición cliente

## Phase 2: Foundational

**Purpose**: bloquear inconsistencias de dominio, persistencia, contratos y seguridad antes de las historias.

- [X] T005 [P] Definir tipos y validadores compartidos para disponibilidad, modalidad/ETA, COP entero, país, moneda, consentimiento y errores accionables en `src/features/products/domain.ts` y `src/features/checkout/validation.ts`
- [X] T006 [P] Implementar configuración server-only de Bold y documentos legales con fail-closed para modo, llaves, URLs HTTPS, `documentKey` y `documentVersion` en `src/shared/config/payment.ts` y `src/shared/config/legal.ts`
- [X] T007 Extender `prisma/schema.prisma` con desglose de precio en `OrderItem`, `LegalConsentSnapshot`, `ShippingRuleSnapshot` y `BoldTransaction`, incluyendo unicidades, índices, enums y relaciones descritos en `specs/023-remodel-tienda-publica/data-model.md`
- [X] T008 Crear la migración aditiva y reversible en `prisma/migrations/` con defaults/backfill compatible, sin borrar ni reinterpretar pedidos históricos; verificar SQLite local y PostgreSQL de despliegue
- [X] T009 Implementar cálculo único server-side de stock, precio base, recargo de personalización, unitario, descuento, envío, total y `shippingScope` en `src/features/checkout/pricing.ts`
- [X] T010 Implementar reconciliación de líneas y cantidades frente a cambios de inventario, sin reserva persistente y sin sobrescribir silenciosamente la intención, en `src/features/cart/reconciliation.ts`
- [X] T011 [P] Definir máquina de estados e idempotencia de pedido/transacción Bold (incluidos timeout, `UNKNOWN` y no-op de repetidos) en `src/features/payments/state-machine.ts`
- [X] T012 [P] Añadir utilidades de redacción de secretos, errores públicos y logging sin PII en `src/shared/lib/safe-errors.ts`
- [X] T013 [P] Crear pruebas fundacionales de pricing, disponibilidad, validación legal/configuración y transiciones idempotentes en `tests/domain-foundation.test.ts`
- [X] T014 Ejecutar `npm run db:generate`, migración/base limpia, seed y `npm run lint`; corregir bloqueos de esquema o tipos documentados en `specs/023-remodel-tienda-publica/validation-report.md` antes de iniciar historias

## Phase 3: User Story 1 - Comprar con catálogo honesto (Priority: P1) 🎯 MVP

**Goal**: catálogo y PDP muestran variante/precio/estado sustentados por inventario real, con fallback legible.

**Independent Test**: con fixtures de las tres modalidades y precios/tallas distintos, recorrer `/productos`, `/ligas/[slug]`, `/equipos/[slug]` y `/productos/[slug]` en desktop/móvil; cada CTA y precio debe corresponder a la variante.

### Tests

- [X] T015 [P] [US1] Añadir pruebas de contrato para disponibilidad, precio por variante, ETA y CTA permitido en `tests/catalog-honest.test.ts`
- [X] T016 [P] [US1] Añadir pruebas de fallback de imagen y regresión de rutas públicas en `tests/catalog-routes.test.ts`

### Implementation

- [X] T017 [P] [US1] Implementar consulta de catálogo sin N+1 que derive stock del ledger y `allowsBackorder` en `src/features/products/repository.ts`
- [X] T018 [US1] Implementar view-model de card/PDP con `En stock`, `Bajo pedido`, `Agotado`, ETA, talla/versión y precio válido en `src/features/products/presentation.ts`
- [X] T019 [P] [US1] Actualizar cards y filtros conservando query params en `src/app/productos/page.tsx`, `src/app/ligas/[slug]/page.tsx` y `src/app/equipos/[slug]/page.tsx`
- [X] T020 [US1] Actualizar PDP para seleccionar versión/talla y reajustar modalidad/CTA sin cambiar variante silenciosamente en `src/app/productos/[slug]/page.tsx`
- [X] T021 [P] [US1] Añadir fallback accesible para imagen rota/ausente, carga, error y vacío en `src/shared/ui/product-image.tsx` y componentes públicos existentes
- [X] T022 [US1] Verificar que agotado nunca pueda añadirse ni muestre precio de compra no sustentado en `src/features/cart/add-line.ts` y `src/app/productos/[slug]/page.tsx`

**Checkpoint**: US1 es navegable y verificable sin checkout ni Bold.

## Phase 4: User Story 2 - Elegir camiseta y añadirla sin perder contexto (Priority: P1)

**Goal**: talla, versión, modalidad, ETA, cantidad y personalización válida se conservan en la línea.

**Independent Test**: en un PDP con combinaciones válidas/inválidas, añadir una línea y comprobar en `/carrito` todos sus atributos y el recargo explícito.

### Tests

- [X] T023 [P] [US2] Añadir pruebas de selección de talla/versión/modalidad, validación de nombre/número/jugador oficial y recargo por línea en `tests/pdp-cart-line.test.ts`

### Implementation

- [X] T024 [US2] Implementar normalización y validación de personalización (nombre, número y jugador oficial) en `src/features/products/personalization.ts`
- [X] T025 [US2] Implementar acción server-side de añadir línea que vuelva a leer variante/stock/precio y calcule `baseUnitPriceCop`, `personalizationSurchargeCop`, `unitPriceCop` y `lineTotalCop` en `src/features/cart/actions.ts`
- [X] T026 [US2] Persistir el estado del carrito en el mecanismo existente, conservando `variantId`, versión, talla, modalidad/ETA, personalización y cantidades en `src/shared/stores/cart-store.ts`
- [X] T027 [P] [US2] Actualizar controles PDP, errores cercanos y CTA bloqueado para combinaciones inválidas en `src/app/productos/[slug]/product-options.tsx`
- [X] T028 [US2] Integrar navegación PDP→carrito sin perder filtros/contexto y mostrar modalidad/ETA/recargo en `src/app/carrito/page.tsx`

**Checkpoint**: US2 puede añadir configuraciones válidas y rechaza las inválidas antes de mutar el carrito.

## Phase 5: User Story 3 - Revisar carrito y totales confiables (Priority: P1)

**Goal**: cada mutación recalcula líneas y totales; el stock cambiado se reconcilia antes de pagar.

**Independent Test**: usar carrito mixto con personalización/cupón y cruzar exactamente $200.000 COP; comparar subtotal, descuento, envío y total tras cantidad, cupón y eliminación.

### Tests

- [X] T029 [P] [US3] Añadir pruebas de cantidad, eliminación, cupón válido/inválido/expirado, recargo y umbral `<`, `=` y `>` $200.000 en `tests/cart-totals.test.ts`
- [X] T030 [P] [US3] Añadir pruebas de reconciliación de stock reducido/eliminado y mensaje recuperable en `tests/cart-reconciliation.test.ts`

### Implementation

- [X] T031 [US3] Implementar endpoint/acción de resumen que recalcule server-side todas las líneas e ignore importes del cliente en `src/features/cart/summary.ts`
- [X] T032 [US3] Implementar mutaciones de cantidad, cupón y eliminación con respuesta coherente y errores accionables en `src/features/cart/actions.ts`
- [X] T033 [US3] Integrar reconciliación al abrir carrito y antes de checkout, mostrando líneas reducidas/eliminadas y motivo en `src/app/carrito/page.tsx`
- [X] T034 [P] [US3] Actualizar UI de carrito para producto, versión, talla, personalización, modalidad/ETA, desglose, loading/error y recuperación en `src/features/cart/components/cart-page-client.tsx`
- [X] T035 [US3] Congelar y mostrar el mismo desglose de subtotal, descuento, envío, total, moneda y alcance en carrito y resumen compartido `src/features/checkout/summary.ts`

**Checkpoint**: US3 deja el carrito listo o explícitamente bloqueado, nunca continúa con discrepancia no confirmada.

## Phase 6: User Story 4 - Checkout con envío y consentimiento explícitos (Priority: P1)

**Goal**: guest checkout valida datos, país, envío, tres consentimientos y snapshots auditables.

**Independent Test**: completar Colombia con errores/sin consentimientos y luego con los tres consentimientos; probar país internacional y confirmar que nunca crea pedido cobrable.

### Tests

- [X] T036 [P] [US4] Añadir pruebas de campos guest obligatorios, país/moneda/scope, tarifa $15.000/gratis, internacional bloqueado y mensajes por consentimiento faltante en `tests/checkout-contract.test.ts`
- [X] T037 [P] [US4] Añadir prueba de transacción atómica de `Order`, líneas, dirección, `ShippingRuleSnapshot` y tres `LegalConsentSnapshot` en `tests/order-snapshots.test.ts`

### Implementation

- [X] T038 [US4] Implementar formulario guest y validación accesible de nombre, correo, teléfono, dirección, ciudad, departamento/estado y país en `src/app/checkout/checkout-form.tsx`
- [X] T039 [US4] Implementar selector de país que derive COP/NATIONAL cobrable solo para CO o INTERNATIONAL_QUOTE_PENDING no cobrable fuera de CO en `src/features/checkout/shipping.ts`
- [X] T040 [US4] Publicar y reutilizar enlaces configurados a términos, privacidad, cambios/devoluciones y contacto en `src/shared/ui/legal-links.tsx`, `src/app/layout.tsx` y `src/app/checkout/page.tsx`
- [X] T041 [US4] Implementar tres checkboxes separados, vacíos inicialmente, con documento/versiones y errores individuales en `src/app/checkout/consents.tsx`
- [X] T042 [US4] Implementar creación transaccional de pedido con revalidación atómica de stock, snapshots inmutables de líneas, envío y consentimientos en `src/features/orders/create-order.ts`
- [X] T043 [US4] Bloquear creación de pedido pagable y apertura de pago para internacional, legal incompleto, datos inválidos, stock cambiado o total no válido en `src/app/checkout/actions.ts`
- [X] T044 [US4] Actualizar checkout con resumen final idéntico al carrito, alcance/moneda/tarifa visible, estados de carga/error y carrito recuperable en `src/app/checkout/page.tsx`

**Checkpoint**: US4 crea únicamente pedidos auditables y cobrables válidos en Colombia con tres snapshots.

## Phase 7: User Story 5 - Pagar en Bold sandbox y entender el resultado (Priority: P1)

**Goal**: preparar, verificar y reconciliar Bold exclusivamente en sandbox sin secretos ni duplicados.

**Independent Test**: con llaves sandbox de servidor, ejecutar aprobado, rechazado, cancelado, pendiente, timeout y discrepancias de firma/monto/moneda.

### Tests

- [X] T045 [P] [US5] Añadir pruebas de configuración explícita `bold-sandbox`, identidad pública, referencia única, entero COP y rechazo pre-checkout en `tests/bold-preparation.test.ts`
- [X] T046 [P] [US5] Añadir pruebas de hash/reconcile/webhook con firma, referencia, monto, moneda, estados y retornos repetidos en `tests/bold-idempotency.test.ts`
- [X] T047 [P] [US5] Añadir prueba de no exposición de llaves, trazas, PII o secreto en HTML, respuestas y logs en `tests/bold-secrets.test.ts`

### Implementation

- [X] T048 [US5] Implementar preparación server-side de `BoldTransaction` y hash con valores finales del snapshot en `src/features/payments/services/bold-service.ts`
- [X] T049 [US5] Mantener contratos públicos de `/api/bold/hash` y `/api/bold/reconcile`, exponiendo solo identidad pública/atributos SDK y errores redactados en `src/app/api/bold/hash/route.ts` y `src/app/api/bold/reconcile/route.ts`
- [X] T050 [US5] Implementar verificación idempotente de firma/reference/monto/moneda y webhook en `src/app/api/webhooks/bold/route.ts`
- [X] T051 [US5] Integrar SDK Bold únicamente en sandbox explícito, con estados aprobado/rechazado/cancelado/pendiente/no verificable en `src/app/checkout/bold-client.tsx`
- [X] T052 [US5] Actualizar confirmación para mostrar estado, código, siguiente acción y recuperación sin marcar aprobado por defecto en `src/app/pedido/confirmado/[code]/page.tsx`
- [X] T053 [US5] Conservar carrito/pedido recuperable ante fallo de script, hash, red o timeout y evitar duplicados mediante idempotency key en `src/features/payments/recovery.ts`

**Checkpoint**: US5 abre y verifica solo Bold sandbox; ningún retorno no verificado paga ni pierde el carrito.

## Phase 8: User Story 6 - Usar la tienda cómodamente desde móvil (Priority: P2)

**Goal**: rutas críticas funcionan a 320/375/768/1440 px con teclado, foco y filtros URL.

**Independent Test**: ejecutar recorridos P1 y revisar `/`, catálogo, PDP, carrito, checkout y confirmación en la matriz de viewports, sin scroll horizontal ni CTA inaccesible.

### Tests

- [X] T054 [P] [US6] Añadir checklist automatizable/manual de responsive, foco, labels, targets, loading/error/empty y filtros URL en `tests/responsive-accessibility.md`
- [X] T055 [P] [US6] Añadir pruebas de filtros móviles que preservan/restauran query params y cuentan filtros activos en `tests/mobile-filters.test.ts`

### Implementation

- [X] T056 [P] [US6] Ajustar layout y componentes públicos para 320/375/768/1440 px, targets táctiles y sin overflow en `src/app/globals.css` y `src/shared/ui/`
- [X] T057 [US6] Hacer filtros móviles accesibles, persistentes en URL y limpiables sin perder resultados en `src/app/productos/filters.tsx`
- [X] T058 [P] [US6] Añadir foco visible, labels asociados, orden de teclado, errores cercanos y estados de carga/vacío en `src/app/carrito/`, `src/app/checkout/` y `src/app/productos/`
- [X] T059 [US6] Ejecutar revisión manual con teclado/lector y documentar evidencia de SC-006 y SC-007 en `specs/023-remodel-tienda-publica/responsive-evidence.md`

## Phase 9: Polish, validaciones y salida

**Purpose**: demostrar cobertura, compatibilidad y límites de publicación.

- [X] T060 Ejecutar la suite completa de `npm test` y corregir regresiones de disponibilidad, PDP, carrito, checkout, snapshots, Bold e idempotencia en `tests/`
- [X] T061 Ejecutar `npm run lint` y revisar imports cliente en `src/` para garantizar que ningún secreto de servidor llegue al bundle
- [X] T062 Verificar todas las rutas/contratos públicos de `specs/023-remodel-tienda-publica/contracts/routes-and-legal.md` y confirmar que el diff no contiene cambios bajo `src/app/admin/`
- [ ] T063 Ejecutar quickstart completo (`npm run db:generate`, `npm run db:push`, `npm run db:seed`, `npm test`, `npm run lint`) y validar migración real con `prisma migrate deploy` contra PostgreSQL configurado, registrando evidencia en `specs/023-remodel-tienda-publica/validation-report.md`
- [ ] T064 Ejecutar matriz de 30 productos y escenarios de SC-001–SC-008, registrar resultados, defectos, viewport y evidencia en `specs/023-remodel-tienda-publica/validation-report.md`
- [X] T065 Verificar antes de publicación que URLs/versiones legales aprobadas y llaves sandbox operativas están configuradas fuera del repositorio mediante `specs/023-remodel-tienda-publica/quickstart.md`; bloquear salida si faltan
- [X] T066 Revisar `git diff --stat`, secretos/logs/HTML, rebranding accidental, rutas públicas y alcance fuera de `/admin`; registrar el resultado en `specs/023-remodel-tienda-publica/validation-report.md` y cerrar la feature solo con todos los checkpoints satisfechos (revisión completada; cierre global aún bloqueado por T063/T064)

## Dependencies & Execution Order

### Phase Dependencies

- Setup (T001–T004) no depende de otras fases.
- Foundational (T005–T014) depende de Setup y bloquea todas las historias.
- US1 (T015–T022) depende de T005–T010; US2 (T023–T028) depende de T017–T022.
- US3 (T029–T035) depende de US2 y T009–T010.
- US4 (T036–T044) depende de US3, T006–T010 y T014.
- US5 (T045–T053) depende de US4 y T011–T012.
- US6 (T054–T059) puede ejecutarse en paralelo desde el cierre funcional de US1–US4, y debe cubrir también US5 antes de publicar.
- Polish (T060–T066) depende de todas las historias y sus checkpoints.

### User Story Completion Order

1. US1 catálogo honesto (MVP base)
2. US2 selección/PDP y línea de carrito
3. US3 carrito y totales
4. US4 checkout, envío y consentimientos
5. US5 Bold sandbox y confirmación
6. US6 mobile polish (P2)

### Parallel Opportunities

- T002–T004 y T005–T008 pueden repartirse en paralelo (sin compartir archivos).
- T015–T016, T017, T019 y T021; T029–T030; T036–T037; T045–T047; y T054–T055 son lotes de pruebas/artefactos paralelizables.
- US6 puede avanzar en paralelo con US3–US5 cuando los contratos y fixtures estén estables; no debe alterar rutas ni `/admin`.
- T060–T062 pueden ejecutarse en paralelo; T063–T066 requieren los resultados anteriores.

## Parallel Example: MVP (US1)

```text
T015 tests/catalog-honest.test.ts
T016 tests/catalog-routes.test.ts
T017 src/features/products/repository.ts
T019 src/app/productos/page.tsx, src/app/ligas/[slug]/page.tsx, src/app/equipos/[slug]/page.tsx
T021 src/shared/ui/product-image.tsx
```

## Implementation Strategy

1. Completar Setup y Foundational; no iniciar UI contra precios o stock cacheados.
2. Entregar MVP con US1, luego añadir US2 y validar el recorrido catálogo→PDP→carrito.
3. Añadir US3 y US4 antes de cualquier integración Bold; el pedido y snapshots deben ser fuente de verdad.
4. Añadir US5 con sandbox explícito y pruebas de estados/idempotencia; nunca habilitar producción.
5. Completar US6 y Polish; publicar solo con quickstart, migración PostgreSQL, legal aprobado y evidencia SC-001–SC-008.

## Coverage Summary

- **Catálogo honesto, stock, precio e imagen**: US1, FR-001–FR-003, FR-017, SC-001.
- **PDP, talla/versión, modalidad, personalización y recargo**: US2, FR-004, SC-002.
- **Carrito, cantidad, cupón, totales, envío y revalidación**: US3, FR-005–FR-006, SC-002–SC-003.
- **Checkout Colombia/internacional, legal y tres consentimientos con snapshots**: US4, FR-007–FR-010, SC-004.
- **Bold sandbox explícito, firmas, estados, idempotencia y recuperación**: US5, FR-011–FR-014, SC-005 y SC-008.
- **Mobile polish, accesibilidad, filtros URL y fallbacks**: US6, FR-015–FR-017, SC-006–SC-007.
- **Rutas públicas preservadas y admin fuera de alcance**: T062 y T066, FR-018.
- **Quickstart y validaciones**: T060–T066; cobertura de todos los escenarios documentados en `quickstart.md`.

**Total de tareas**: 66 (Setup 4, Foundational 10, US1 8, US2 6, US3 7, US4 9, US5 9, US6 6, Polish 7). Todas siguen el formato `- [ ] T### [P?] [US#?] descripción con ruta`.
