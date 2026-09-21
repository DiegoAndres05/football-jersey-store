# Evidencia de validación — Spec 022

Fecha: 2026-09-20. Navegador previsto para revisión manual: Chromium estable,
viewport 320×800 y escritorio 1440×900.

## Automatizada

- `npx tsc --noEmit`: correcto.
- `npx eslint 'src/app/admin/(dashboard)/**/*.ts' 'src/app/admin/(dashboard)/**/*.tsx' ...`: correcto.
- `NEXT_PUBLIC_SITE_URL=https://flashsport.co npm run build`: correcto; las rutas
  administrativas existentes se compilan sin cambios de contrato.
- `npm run lint`: no ejecutable con Next 16 porque `next lint` interpreta `lint`
  como directorio. Se conserva la configuración y se validó con ESLint directo.
- La suite focalizada ejecuta los contratos existentes; un test preexistente de
  almacenamiento de imágenes falla al importar `server-only` desde el runner
  Node, fuera del panel remodelado.

## Escenarios manuales

1. Acceso protegido: verificar sesión válida/redirección a `/admin/login`.
2. Shell móvil: verificar menú, escape, skip-link, foco y ausencia de scroll
   horizontal a 320 px.
3. Dashboard: verificar ventana de 30 días, agregados COP, estados de inventario
   y enlaces operativos.
4. Pedidos: verificar filtros URL, retorno conservando `modalidad`, snapshots,
   cupón y modalidades.
5. Errores: verificar id inexistente/error de lectura con recuperación segura.
6. Telegram: sin configuración se oculta; configurado muestra estado y permite
   reintento idempotente.
7. Catálogo/inventario: verificar acciones diferenciadas, bajo pedido, suma del
   ledger y conservación del historial.

## Seguridad y contratos

No se añadió migración ni saldo mutable. Los tokens Telegram solo se leen en
servidor y nunca se serializan. El detalle usa snapshots persistidos y los
errores no muestran trazas. Las rutas existentes permanecen: `/admin`,
`/admin/pedidos`, `/admin/pedidos/[id]`, `/admin/productos`,
`/admin/productos/[slug]/variantes`, `/admin/productos/[slug]/imagenes`,
`/admin/inventario` y las subrutas administrativas previas.
