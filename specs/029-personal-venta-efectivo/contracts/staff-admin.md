# Contract: Gestión de personal

## Listar

- **Quién**: administrador.
- **Resultado**: nombre, correo, rol visible (administrador o vendedor), estado activo y si la invitación sigue pendiente.
- **No incluye**: hash, clave de servicio, identificador secreto de sesión ni contraseña.

## Cambiar rol

- **Quién**: administrador.
- **Entrada**: trabajador y rol destino `ADMIN` o `VENDOR`.
- **Rechazo**: si el cambio dejaría cero administradores activos.

## Desactivar

- **Quién**: administrador.
- **Efecto**: `isActive = false` y la cuenta de identidad no puede iniciar sesión.
- **Conserva**: pedidos, líneas, historial y movimientos `SALE`.
- **Rechazo**: último administrador activo. Un administrador no puede desactivarse a sí mismo si es el último.

## Autorización del vendedor

- Puede abrir la venta en efectivo, buscar variantes activas con disponible inmediato y listar o abrir pedidos `CASH`.
- Una ruta o acción de pedidos con `paymentMethod` distinto de `CASH` responde como no permitida, también si escribe la dirección directa.
- No puede abrir gestión de personal, productos, cupones, ajustes ni configuración de pagos.
