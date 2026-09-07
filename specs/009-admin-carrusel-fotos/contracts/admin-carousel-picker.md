# Contract: Bloque de fotos del carrusel en Productos

UI + acción admin. No es API HTTP pública.

## Superficie

- MUST vivir **arriba** de la lista en `/admin/productos`.
- MUST NOT añadir ítem al menú del admin (ni “Carrusel” ni Ajustes).
- MUST NOT controlar Destacado ni “Las más buscadas”.
- MUST NOT subir, recortar ni filtrar fotos.

## Galería

- MUST mostrar todas las fotos de productos **visibles** (`isActive`), varias por producto si hay.
- MUST NOT listar fotos de productos ocultos.
- Cada miniatura MUST ser clicable (marcar / desmarcar). Sin checkbox Destacado como fuente.
- Sin fotos elegibles: mensaje claro; el botón Guardar puede persistir lista vacía.

## Interacción

- Un solo botón de persistir (p. ej. “Guardar carrusel”).
- Clic: usa la regla de toggle del dominio (añadir al final / quitar).
- Sexto clic en foto no marcada: no se marca; aviso “máximo 5”.
- Tras guardar: `AdminSaveResult` (toast u homólogo); MUST NOT 500 por throw.
- Al recargar Productos: las fotos guardadas que sigan visibles aparecen marcadas, en el orden persistido.

## Seguridad

- Solo sesión admin. Sin cookie admin: no persistir (SC-004).
- El servidor MUST validar: ≤ 5 IDs únicos, cada uno existe y su producto está visible.
- Payload de más de 5 o IDs ajenos: error de validación, lista previa intacta.

## Copy

Español. Sin “BEST SELLERS”, “View Menu” ni demo de restaurante.
