# Research: Retorno Bold aprobado sin esperar webhook

## Fallback de persistencia cuando la API no cierra

- **Decision**: Tras consultar la API de Bold, persistir `PAID` si (a) el outcome de API es `APPROVED`, o (b) el outcome es `PENDING`/`UNAVAILABLE` **y** `bold-tx-status` normaliza a `APPROVED`. Extraer la decisión a una función pura (`resolveReturnPersistence`) testeable sin Prisma. Nunca persistir `PAYMENT_FAILED` desde la query sola.
- **Rationale**: Spec 017 / clarificación A: Bold en modo pruebas no envía webhook; la API suele devolver vacío/`NO_TRANSACTION_FOUND`. El comprador no puede quedar en “Confirmando…”. Constitution II/III: se consulta al proveedor **antes**; un rechazo verificado gana a la URL; solo se transiciona desde `PENDING_PAYMENT`.
- **Alternatives considered**: Confiar en la query sin llamar a la API (más rápido, viola FR-006); esperar solo webhook (bug actual); restringir el fallback a sandbox (clarificación A rechazada).

## Fuente de auditoría (`BoldPaymentSource`)

- **Decision**: Ampliar `BoldPaymentSource` con `"return"`. `createdBy` = `bold-return:{providerRef|unknown}` cuando el pagado sale del hint `approved` (API no definitiva). API `APPROVED` sigue `source: "reconcile"`. Webhook sigue `"webhook"`. Los tres llaman `applyBoldPayment`.
- **Rationale**: Constitution II — el historial debe explicar *por qué* se marcó pagado sin webhook. Idempotencia: el segundo camino (`NOT_PENDING`) no duplica notify.
- **Alternatives considered**: Reusar `"reconcile"` para ambos (menos rastro); inventar un estado de pedido nuevo (fuera de alcance).

## Relación con 015

- **Decision**: 015 permanece como camino API + webhook. 017 **supera** la regla “la query nunca persiste” **solo** para `APPROVED` sin contradicción de API. El contrato 015 de “query no es autoridad de rechazo” se mantiene (clarificación B).
- **Rationale**: Mismo `applyBoldPayment`; cambio localizado en `reconcileBoldOrder` + copy de confirmación.
- **Alternatives considered**: Reescribir webhook; mockear webhook en pruebas; segundo servicio de transición.

## Copy “Pago aprobado”

- **Decision**: En `uiMode === "paid"`, el `<h1>` y el `<dd>` de Estado dicen exactamente `Pago aprobado`. No usar `¡Pago confirmado!` ni `Pago confirmado` en esos rótulos. El párrafo de cuerpo/banner MAY quedar (spec: cuerpo opcional).
- **Rationale**: Clarificación A de copy; SC-001/SC-005 son asserts de string.
- **Alternatives considered**: Solo el estado; frase libre de éxito.

## “Confirmando…” tras `approved`

- **Decision**: Si el fallback (o la API) deja el pedido `PAID`, no hay modo `confirming`. El soft-retry de 015 (~2s × 3–4) **solo** corre cuando tras reconcile el pedido sigue `PENDING_PAYMENT` **y** el hint **no** era `APPROVED` persistible (p. ej. `rejected` sin API). Un retorno `approved` MUST NOT terminar en confirming.
- **Rationale**: US3 / FR-008. El retry breve queda para el caso no-approved (fuera del persist-from-URL).
- **Alternatives considered**: Poll infinito; marcar fallido por timeout (prohibido en 015/017).
