# Contract: Venta en efectivo

## Confirmar

- **Quién**: administrador o vendedor con sesión vigente.
- **Entrada**:
  - clave de idempotencia nueva para esa confirmación;
  - líneas con variante, cantidad, precio esperado y personalización opcional;
  - nombre del comprador;
  - teléfono opcional;
  - efectivo recibido, entero en COP.
- **Éxito**: un `Order` `PAID` con `paymentMethod = CASH`, totales en COP, envío 0, sin cupón, un `SALE` por línea y el código visible solo en el panel.
- **Repetición**: la misma clave devuelve el mismo código y no crea otro pedido ni otro movimiento.
- **Rechazo sin escritura**:
  - efectivo distinto del total calculado en el servidor;
  - cantidad mayor que el disponible inmediato;
  - variante inactiva o inexistente;
  - personalización inválida;
  - nombre vacío;
  - cualquier cupón o costo de envío.
- **Concurrencia**: dos confirmaciones de la última unidad dejan una sola venta. La otra recibe el rechazo de disponibilidad.

## Consultar

- **Administrador**: el pedido aparece en `/admin/pedidos` y en su detalle, marcado como Efectivo, con autor.
- **Vendedor**: lo ve en esa misma lista filtrada a efectivo.
- **Público**: `GET` de `/pedido/confirmado/{code}` se comporta como pedido no encontrado. No hay correo al comprador ni notificación de pedido pagado.

## Lo que no hace

- No llama a Bold, no crea `BoldTransaction` y no cambia un pedido que ya nació con tarjeta, PSE u otro medio en línea.
- No ofrece efectivo en el checkout público.
