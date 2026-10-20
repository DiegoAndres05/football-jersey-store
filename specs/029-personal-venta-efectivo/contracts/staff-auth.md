# Contract: Acceso del personal

## Entrar

- **Quién**: cualquier persona en `/admin/login`.
- **Entrada**: correo y contraseña.
- **Éxito**: sesión httpOnly del proveedor de identidad y redirección al panel. El servidor resuelve `User` por `authUserId` o, en el primer ingreso tras la invitación, por el correo normalizado, y guarda el vínculo.
- **Rechazo**: cuenta inexistente, contraseña incorrecta, `isActive` falso, rol `CUSTOMER` o sin fila `User`. El mensaje visible es siempre "Correo o contraseña inválidos."
- **Bloqueo**: cinco fallos en quince minutos para el mismo correo. El mensaje dice que debe esperar 15 minutos.
- **Caducidad**: la sesión deja de autorizar a las 12 horas o al salir.

## Salir

- **Quién**: personal con sesión.
- **Efecto**: se borra la sesión nueva. Durante el corte también se borra `fs_admin_session`.

## Corte

- Antes del corte, una cookie `fs_admin_session` válida de un administrador activo sigue entrando.
- Después del corte, esa cookie no autoriza ninguna ruta `/admin`.
- El corte solo se activa cuando el administrador actual tiene `authUserId` y ha entrado al menos una vez con la cuenta nueva.

## Invitación

- **Quién**: administrador activo.
- **Entrada**: nombre, correo, rol `ADMIN` o `VENDOR`.
- **Efecto**: fila `User` activa sin `passwordHash` usable, invitación enviada, `authUserId` se completa cuando la persona acepta.
- **Rechazo**: correo duplicado, rol distinto de los dos permitidos, o sesión que no es administrador.
- El servicio de identidad se llama solo en el servidor con la clave de servicio. El navegador no la recibe.
