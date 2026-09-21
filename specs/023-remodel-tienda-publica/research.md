# Research: tienda pública Flashsport

## Evidencia

Se revisaron `AGENTS.md`, `.ai/constitution.md`, `.ai/project/*`, `package.json`, `src/app`, `src/features`, `src/shared`, `prisma/schema.prisma`, migraciones, tests, `spec.md` y `checklists/requirements.md`. El stack real es Next.js/TypeScript + Prisma, con checkout guest y `node:test`; no se asume E2E configurado.

## Decisiones

### Disponibilidad, precio y personalización

- **Decisión**: derivar por variante/inventario los estados `En stock`, `Bajo pedido` (`allowsBackorder`) y `Agotado`; validar al añadir y revalidar atómicamente antes de crear pedido/abrir Bold, sin reserva persistente.
- **Precio**: calcular server-side `baseUnitPriceCop`, `personalizationSurchargeCop`, `unitPriceCop` y `lineTotalCop`; el recargo explícito cambia solo la línea afectada y se congela en el snapshot.
- **Alternativas descartadas**: stock cacheado en cliente, reserva durante navegación, recargo solo visual y recalcular pedidos históricos desde catálogo.

### Envío y checkout

- **Decisión**: solo Colombia es cobrable; COP, $15.000 bajo $200.000 y gratis desde el umbral inclusive. Internacional se etiqueta cotización pendiente y bloquea pedido pagable/Bold.
- **Alternativa descartada**: convertir moneda o cobrar tarifa aproximada, porque no existe carrier/regla aprobada.

### Consentimientos

- **Decisión**: tres consentimientos obligatorios, explícitos y no preseleccionados (términos, privacidad, tratamiento necesario); persistir documento, versión y timestamp UTC por separado.
- **Alternativas descartadas**: checkbox combinado o booleanos sin versión.

### Bold

- **Decisión**: únicamente `PAYMENT_PROVIDER=bold-sandbox`, llaves `BOLD_IDENTITY_KEY`/`BOLD_SECRET_KEY` server-only, referencia única, monto entero COP y firma con valores finales. Estados y webhooks idempotentes; aprobado solo tras verificar firma/reference/monto/moneda.
- **Alternativas descartadas**: inferir sandbox por `NODE_ENV`, llaves en cliente y abrir modal antes de persistir referencia.

### Legal, marca y móvil

- Reutilizar footer/rutas informativas y URLs/versiones aprobadas; si faltan, bloquear sin inventar texto.
- Reutilizar tokens/componentes actuales, conservar filtros en URL, foco/labels/targets accesibles y estados de carga/error. No introducir framework ni rebrand.

## Suposiciones y bloqueos operativos

1. La tarifa/umbral COP de la spec es la regla vigente.
2. SQLite de desarrollo y proveedor de despliegue deben aceptar la misma migración.
3. Negocio debe entregar antes de producción URLs/versiones de términos, privacidad, cambios/devoluciones y contacto.
4. Operaciones cargará llaves sandbox solo en el entorno servidor.
5. Moneda soportada aquí es COP; combinaciones restantes se rechazan.
6. Se conserva guest checkout y contratos de rutas observados.

No quedan `NEEDS CLARIFICATION`; las entradas no verificables son bloqueos explícitos, no decisiones inventadas.
