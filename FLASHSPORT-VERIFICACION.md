# FLASHSPORT — Verificación visual y funcional

> Auditoría de la aplicación existente (Fases 0–4). Sin cambios de código.
> Fecha: 2026-08-16 · Método: instancia Next.js en :3000, CDP/Headless (Brave 151), BD/Supabase como fuente de verdad.
> Screenshots guardados en `/tmp/fs-audit/shots/` (27 capturas en 1440/768/390 px).

## 1. Estado general

- Aplicación completa y estable: Next.js 14 (App Router) + Prisma 5 + PostgreSQL/Supabase + Storage.
- 15 productos, 15 imágenes (1 por producto), 300 variantes (20 por producto), 7 ligas, 13 equipos, 5 temporadas, 5 tallas, 4 versiones, 3 proveedores, 1 pedido (demo), 196 movimientos de inventario (195 IN + 1 RESERVATION), 1 usuario admin.
- Cero datos huérfanos en todas las relaciones verificadas.
- Todas las rutas responden correctamente (200 públicas; 307 → login en `/admin/*`).
- Sin overflow horizontal en 1440/768/390 px en ninguna de las rutas auditadas.
- Tests 20/20 verdes, lint limpio, `tsc --noEmit` sin errores, build exitoso.
- Git: working tree limpio (sin cambios; se respetó la consigna de no modificar nada).

## 2. Home

### Correcto
- Header sticky con logo FLASHSPORT, nav (Inicio/Tienda/Ligas/Sobre nosotros/Contacto), buscador (oculto en <768 px, botón de búsqueda en móvil), iconos de cuenta/carrito con badge de cantidad. Backdrop-blur al hacer scroll. 🟢
- Hero editorial: "VISTE TU / PASIÓN." en display uppercase 72 px (1440), subtítulo, CTA "Comprar ahora" (primario negro) + "Explorar ligas" (outline), foto de producto destacado (hero-product). 🟢
- Trust bar 4 ítems (envíos, pagos seguros, calidad, atención) en grid. 🟢
- Sección "Las grandes ligas" con tarjetas de liga (monograma PL/LAL/SA/BL/L1), conteo de productos, "Ligue 1 · Próximamente". 🟢
- Sección "Las más buscadas" con grid de 4 productos destacados. 🟢
- Sección WhatsApp con CTA y datos de encargo. 🟢
- Footer completo: marca, eslogan, contacto, enlaces, copyright. 🟢
- Paleta alineada con dirección FLASHSPORT: fondo `rgb(252,250,248)` (off-white, HSL 40/33%/98%), texto `rgb(20,20,20)`, acentos negros. 🟢

### Problemas
- Teléfono del footer es placeholder `+57 300 000 0000` (dato de ejemplo, no real). 🟡 Ubicación: `src/shared/config/site.ts` / footer. Impacto: bajo (visual), el enlace WhatsApp usa el número de la app.
- Imágenes de productos son fotos genéricas de Unsplash (misma URL para todos los productos), no camisetas reales. 🟡 Impacto: la promesa visual "producto como protagonista" se cumple parcialmente (hay foto, pero no es la camiseta).

## 3. Catálogo

### Correcto
- `/productos` renderiza 15 tarjetas con imagen (carga real verificada: naturalWidth>0, 0 rotas), equipo · liga, nombre, temporada, versiones, tallas disponibles, "Agotada" cuando corresponde, precio "Desde $89.9K hasta…". 🟢
- Filtros (Disponible/Agotado, liga, temporada, versión) y orden por defecto funcionan vía URL (`?liga=`, `?temporada=`). 🟢
- Estado vacío correcto: "No encontramos camisetas con esos filtros. Prueba con otras opciones." (verificado con `?q=zzzzznada`). 🟢
- Responsive: grid 25vw (1440) / 33vw (768) / 50vw (390) sin overflow. 🟢

### Problemas
- **Búsqueda por texto es case-sensitive en PostgreSQL.** `q=barcelona` (minúscula) devuelve "Sin resultados"; `q=Barcelona` sí encuentra. Ubicación: `src/features/products/repositories/product-repository.ts:275-280` (filtros `contains` sin `mode: "insensitive"`, mientras que el filtro de talla sí lo usa en la línea 301). Comportamiento esperado: búsqueda no sensible a mayúsculas. Actual: depende del caso del término. Impacto: usuarios escriben nombres de equipos en minúscula → resultados vacíos → abandono. **Severidad 🟠**. Propuesta: añadir `mode: "insensitive"` a los tres `contains` (nombre, descripción, equipo).

## 4. Producto

### Correcto
- `/productos/[slug]` muestra nombre (h1), equipo/liga, temporada, precio por versión (Fan/Entrenamiento/Player/Retro, $90K–$120K en AC Milan), selector de tallas (S–XXL), personalización (Sin personalizar / Personalizar), y CTA "Agregar al carrito". 🟢
- Imagen principal carga correctamente (1 por producto). 🟢
- Variantes correctas: versiones y tallas mapean a las 20 variantes reales del producto (5 tallas × 4 versiones). 🟢
- Productos relacionados ("Ver todo", cards de Inter) renderizan. 🟢

### Problemas
- No hay galería de imágenes (solo 1 imagen por producto en BD); el componente `product-gallery` existe pero con una sola foto. 🟡 Impacto: menor dramatismo de producto. Propuesta: subir 2–3 fotos por producto a Supabase Storage (infraestructura ya lista en FASE 2).
- Título "Viste tu pasión." en esta página también aparece como h1 del home; aquí el h1 correcto es el nombre del producto. (No es un defecto real.) — sin problema.
- En vista 390 px el selector de tallas conserva ancho correcto (h-10 min-w-12); sin overflow. 🟢

## 5. Carrito

### Correcto
- Con ítems de prueba (solo localStorage, BD intacta): renderiza líneas con imagen, producto, `equipo · versión · talla`, cantidad editable, personalización, subtotal por línea, "← Seguir comprando". 🟢
- Resumen correcto: subtotal $290.000, envío "Gratis" (> $200.000), total $290.000, "¡Tienes envío gratis!". 🟢
- Persistencia en localStorage (`fjs-cart`, zustand persist v2 con migración de legacy). 🟢
- Carrito vacío: "TU CARRITO ESTÁ VACÍO — Aún no has agregado camisetas. Explora el catálogo…" con CTA "Ver catálogo". 🟢
- Responsive en 1440/768/390 sin overflow; badge del header refleja el conteo. 🟢

### Problemas
- Sin problemas funcionales detectados. Nota 🟡: al ser client-side, el estado vive en localStorage (no sincronizado con BD); correcto para carrito anónimo, pero no hay carrito persistente por usuario (fuera del alcance acordado).

## 6. Checkout

### Correcto
- Flujo de 2 pasos: Paso 1 (contacto + envío) → Paso 2 (pago). 🟢
- Formulario con campos correctos (nombre, email, teléfono, destinatario, dirección, ciudad, departamento, zip, notas) y validación (noValidate + validación manual). 🟢
- Cálculo del total verificado: subtotal $89.900 + envío Nacional $15.000 = **$104.900**; "Te faltan $110.100 para envío gratis"; con subtotal ≥ $200.000, envío gratis. Coincide con la regla de `shippingFee` en `src/shared/config/site.ts`. 🟢
- Creación de pedido transaccional: orden + items + historial + movimiento `RESERVATION` con `quantity: -items` (resta stock real). Fuente: `src/features/orders/repositories/order-repository.ts:129-174`. 🟢
- Pago: mock/demo (`PAYMENT_PROVIDER=MOCK`), sin pasarela conectada (por diseño de la fase). 🟢
- Pantalla de confirmación `/pedido/confirmado/[code]` existe (200). 🟢

### Problemas
- El pedido demo existente (`FS-2026-08-Y0LX`, PENDING_PAYMENT, $104.900) consume 1 unidad de una variante (RESERVATION −1) — correcto y coherente. 🟢
- No se completó un pedido en esta auditoría (habría creado datos reales); el paso 2 no se pudo inspeccionar visualmente (solo por código). 🟡 Limitación metodológica, no defecto.

## 7. Admin

### Correcto
- Protección de rutas: todas las páginas `/admin/*` redirigen (307) a `/admin/login` sin sesión; la cookie `fs_admin_session` (httpOnly, sameSite=lax, path=/, maxAge 12h) se valida por HMAC-SHA256 en `src/middleware.ts`. 🟢
- Login: `/admin/login` 200, formulario con email/contraseña, "Administración" h1, botón "Ingresar". 🟢
- Código de dashboard (`/admin`): stats (ingresos de pagados, pedidos, pendientes, productos activos), sección stock bajo (query agregada con `lowStockAt`, badge "Sin existencias"/"Stock bajo") y pedidos recientes con cambio de estado. 🟢
- CRUD admin (productos, variantes, imágenes, ligas, equipos, temporadas, tallas, versiones, proveedores, inventario) presente en código y rutas (200/307 correctos). 🟢
- Rate-limit de login: 5 fallos/15 min por email (en memoria), cubierto por tests y presente en la server action. 🟢

### Problemas
- **No se pudo auditar visualmente el interior del admin** (requiere contraseña del admin, que no está disponible para el auditor). Se auditó por código y por rutas. 🟡 Limitación metodológica.
- Fallback de secreto en `src/middleware.ts:5`: `NEXTAUTH_SECRET ?? "local-dev-secret-change-me-in-production-please"`. Actualmente `NEXTAUTH_SECRET` está definido en `.env`, así que no se usa; pero si faltara en un deploy, la cookie sería válida con un secreto conocido públicamente (compromete la sesión admin). **Severidad 🟠**. Propuesta: lanzar error en producción si falta `NEXTAUTH_SECRET` (en vez de fallback).

## 8. Responsive

### Desktop (1440 px)
- Header con nav completo, buscador visible, hero en 2 columnas (texto + foto). Todo sin overflow. 🟢
- Grids: ligas 5 columnas, catálogo 4, cards 3:4 con `object-cover`. 🟢
- Checkout 2 pasos y carrito en layout de dos zonas sin roturas. 🟢

### Tablet (768 px)
- Nav principal se oculta (`hidden lg:flex`), aparece botón menú hamburguesa + drawer lateral (w-72) con backdrop; verificado que abre sin overflow. 🟢
- Buscador del header se oculta (aparece botón de búsqueda con panel inferior). 🟢
- Grids adaptan: ligas 3 columnas, catálogo 3. 🟢
- Footer pasa a layout apilado (alto 580 px). 🟢

### Mobile (390 px)
- Header compacto (65 px), buscador por botón, drawer de menú funciona, badge de carrito visible. 🟢
- Hero: texto apilado (h1 48 px), foto debajo; sección 906 px de alto. 🟢
- Grids: ligas 2 columnas, catálogo 2. 🟢
- Carrito/checkout/formularios sin overflow; inputs de ancho completo. 🟢
- Estado vacío del carrito y del catálogo se ven correctos. 🟢

## 9. Seguridad

- Rutas admin protegidas (307 sin sesión). 🟢
- Cookie de sesión: httpOnly, sameSite=lax, path=/, 12 h; `secure` solo si `NEXTAUTH_URL` es https (condicional correcto para entorno local http). 🟢
- Sin secretos en HTML/bundle: verificado en `/` y `/admin/login` (sin NEXTAUTH_SECRET, SUPABASE keys, service_role, etc.). 🟢
- Rate-limit de login presente y testeado (5/15 min). 🟢
- Data fetches de admin y de órdenes son server-side (no expuestos al cliente). 🟢
- **Hallazgo**: fallback de secreto HMAC en middleware (ver §7). 🟠

## 10. Tests técnicos

| Comando | Resultado |
|---|---|
| `npm run test` | ✅ 20/20 (node:test) |
| `npm run lint` | ✅ Sin warnings/errors |
| `npx tsc --noEmit` | ✅ 0 errores |
| `npm run build` | ✅ Build exitoso (EXIT 0, 24 rutas, Middleware 26.7 kB) |

- **Discrepancia encontrada 🟠**: `package.json` → `"test": "node --test tests/rate-limit.test.ts tests/password.test.ts tests/logica.test.ts"` **excluye `tests/helpers.test.ts`** (5 tests: mock payment, whatsappLink, constantes de envío). El script reporta "20 tests" pero el suite completo tiene 25 (verificado ejecutando `node --test tests/helpers.test.ts` → 5/5 verde). Ubicación: `package.json:10`. Impacto: los tests excluidos no corren en CI local con `npm run test`. Propuesta: agregar `tests/helpers.test.ts` al script. (No se modificó en esta fase.)

## 11. Problemas críticos 🔴

No se detectaron problemas críticos de funcionamiento en esta auditoría.

## 12. Problemas importantes 🟠

1. **Búsqueda case-sensitive** — `src/features/products/repositories/product-repository.ts:275-280`. `q=barcelona` devuelve vacío. Impacto alto en UX de catálogo. Propuesta: `mode: "insensitive"`.
2. **Fallback de secreto HMAC en middleware** — `src/middleware.ts:5`. Riesgo si `NEXTAUTH_SECRET` falta en producción. Propuesta: hard-fail en prod.
3. **`tests/helpers.test.ts` excluido del script `npm run test`** — `package.json:10`. Propuesta: incluirlo.

## 13. Mejoras visuales 🟡

- Imágenes de producto genéricas (Unsplash) en lugar de camisetas reales; una sola imagen por producto (sin galería). La infraestructura Storage ya existe (FASE 2).
- Teléfono/footer placeholder (`+57 300 000 0000`, `hola@flashsport.co`) — datos de ejemplo.
- Hero del home usa la primera imagen de producto; depende de la calidad de la foto.
- En el detalle, "Tallas" y precios son correctos; no se observa exceso de elementos que contradiga la dirección minimalista.
- La dirección FLASHSPORT (off-white/negro, display uppercase, producto protagonista) se cumple sustancialmente; las imágenes de Unsplash son el mayor desvío.

## 14. Elementos correctos 🟢

- Estructura de rutas y navegación completas (tienda + admin).
- Sistema de diseño coherente (off-white `40 33% 98%`, negro, grises, display uppercase, tracking) definido en `globals.css`.
- Sin overflow en 1440/768/390 en ninguna ruta.
- Carrito/checkout con cálculo correcto de subtotal, envío (gratis ≥ $200.000) y total.
- Ledger de inventario: stock = SUM(quantity); pedidos restan via RESERVATION; 0 huérfanos; 15 productos con imagen; imágenes cargan (0 rotas).
- Protección admin + rate-limit + cookie httpOnly + sin secretos en HTML.
- Tests (20), lint, tsc y build verdes.

## 15. Recomendación de siguiente paso

Antes de cualquier rediseño o fase nueva:
1. **Corregir la búsqueda case-sensitive** (cambio de 1 línea, alto impacto en UX) — requiere tu autorización.
2. **Incluir `helpers.test.ts` en `npm run test`** (alinear el script con el suite real).
3. **Endurecer el middleware** (hard-fail si falta `NEXTAUTH_SECRET`).
4. Posteriormente, evaluar reemplazo de imágenes Unsplash por fotos reales vía Supabase Storage (la UI y el bucket ya están listos) — esto es lo que más acercaría la tienda a la dirección visual FLASHSPORT.
5. Verificación manual del interior del admin con la contraseña real (únicamente tú), para completar la auditoría visual de §7.

No se realizó ningún cambio. Git quedó limpio. Se espera autorización para corregir.