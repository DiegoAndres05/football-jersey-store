# Reutilización auditada

Se reutilizan los componentes y dominios existentes bajo `src/features/products`,
`src/features/cart`, `src/features/checkout`, `src/features/payments` y
`src/shared/{config,money,stores}`. El esquema existente conserva el checkout
guest, el ledger de inventario y los modelos de pedido. La implementación de
esta fase agrega validadores y cálculos puros sin cambiar rutas públicas ni
archivos bajo `src/app/admin`.

La integración de UI permanece pendiente de una revisión manual de cada ruta
para evitar duplicar lógica existente.
