# Quickstart: Personal de tienda y venta en efectivo

Validación manual después de implementar. No aplica migraciones ni envía correos de campaña.

## Requisitos

- Un administrador de prueba con invitación aceptada.
- Un vendedor de prueba con invitación aceptada.
- Una variante con al menos dos unidades de entrega inmediata.
- La tienda pública y `/admin` levantadas en local.

## 1. Acceso

1. Abrir `/admin` sin sesión. Debe ir a `/admin/login`.
2. Entrar con una contraseña incorrecta. El mensaje no dice si el correo existe.
3. Entrar con el administrador. Debe ver gestión de personal y pedidos en línea.
4. Salir. `/admin/pedidos` vuelve a pedir acceso.
5. Entrar con el vendedor. No debe ver gestión de personal, cupones ni un pedido de tarjeta o PSE, ni abriendo su dirección directa.

## 2. Invitación

1. Como administrador, crear un vendedor con un correo nuevo.
2. Repetir el mismo correo. Debe rechazarse.
3. Aceptar la invitación y definir la contraseña fuera de la vista del administrador.
4. Entrar con esa cuenta.

## 3. Venta

1. Como vendedor, armar una línea con una unidad disponible y un nombre de comprador.
2. Confirmar con el efectivo igual al total.
3. Ver el código en el panel, el stock reducido en uno y el método Efectivo.
4. Pulsar confirmar otra vez con la misma clave. Sigue habiendo un solo pedido y un solo descuento.
5. Intentar vender más unidades de las disponibles. No cambia el stock.
6. Abrir `/pedido/confirmado/{code}` sin sesión de personal. La página no muestra el pedido.
7. En el checkout público, comprobar que solo aparecen tarjeta y PSE.

## 4. Último administrador

1. Intentar desactivar al único administrador activo. Debe rechazarse.
2. Desactivar al vendedor. Esa cuenta ya no entra y su venta sigue mostrando su correo como autora.

## Comandos

```bash
node --import tsx --test tests/staff-auth.test.ts tests/cash-sale.test.ts
npx tsc --noEmit
npx eslint src/features/auth src/features/orders src/app/admin
```

Los nombres de prueba son el objetivo de la implementación. Hasta que existan, el plan no se considera ejecutado.
