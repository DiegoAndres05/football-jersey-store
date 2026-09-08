# Quickstart: 017

```bash
npx tsc --noEmit
node --import tsx --env-file=.env --test tests/bold-*.test.ts
```

Esperado: tests de `resolveReturnPersistence` (hint ignorado), seguridad P0, inventario REJECTED (1–8), copy “Pago aprobado” en `page.tsx`.

Manual: pago Bold aprobado → confirmación → “Pago aprobado” solo si Bold confirma. Query `approved` falsa no paga. Rechazo → catálogo recupera stock inmediata (tras revalidate / navegación nueva).
