# Quickstart de validación — Menú de navegación desktop

**Feature**: `013-menu-navbar-desktop`

Guía de ejecución posterior a la implementación. No contiene cuerpos de
componentes ni migraciones; solo comprueba el comportamiento descrito en
`spec.md`, `plan.md` y `data-model.md`.

## Prerrequisitos

- Node.js 18+ (20 LTS recomendado) y npm.
- Dependencias instaladas (`npm install`).
- Variables de entorno locales disponibles según `.env.example`; la
  navegación no requiere credenciales.

## Preparar y ejecutar

Desde la raíz del repositorio:

```bash
npm install
npm run setup
npm run dev
```

Abrir `http://localhost:3000`. El `Header` público aparece en `/`, `/productos`,
`/ligas`, `/sobre-nosotros`, `/contacto`, `/favoritos` y las demás rutas de la
tienda. No usar `/admin` como superficie de esta feature.

## Verificación automatizada

En otra terminal:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

La prueba focalizada planificada será
`tests/navbar-desktop-ui.test.ts`. La regresión especialmente relevante es:

```bash
node --import tsx --env-file=.env --test \
  tests/navbar-desktop-ui.test.ts \
  tests/favorites-accessibility.test.ts \
  tests/favorites-ui.test.ts \
  tests/recently-viewed-accessibility.test.ts \
  tests/recently-viewed-ui.test.ts
```

Si el entorno no tiene Node disponible, registrar la limitación; no sustituir
el runner por una herramienta nueva durante esta feature.

## Matriz manual de viewport

Usar DevTools o redimensionar la ventana y comprobar:

| Viewport | Resultado esperado |
|---|---|
| 1280 px (`xl`) | Cinco enlaces horizontales, acciones actuales, botón hamburguesa desktop y popover. Iconos directos de Favoritos/Vistos siguen disponibles. |
| 1024 px (`lg`) | Cinco enlaces, búsqueda/cuenta/carrito/moneda según disponibilidad, botón hamburguesa; el popover ofrece Favoritos y Vistos sin overflow ni solapamiento. |
| 900 px (`md`/tablet) | No aparece el botón/popover desktop; permanece el botón `Menú` y el drawer lateral actual. |
| 640 px o menor | Drawer móvil, búsqueda móvil y acciones móviles siguen siendo utilizables. |

## Escenario A — Navegación principal y estado activo

1. En 1280 px, confirmar que se identifican Inicio, Tienda, Ligas, Sobre
   nosotros y Contacto en menos de cinco segundos.
2. Abrir cada destino.
3. Confirmar ruta exacta y que el enlace correspondiente tiene el estado
   activo/foco visual.
4. Desde `/productos/[slug]` y una URL bajo `/ligas`, confirmar que Tienda o
   Ligas, respectivamente, conservan `aria-current="page"`/estado activo.

## Escenario B — Popover desktop

1. En 1280 px y después en 1024 px, enfocar el botón de tres líneas.
2. Confirmar nombre accesible, foco visible y que el icono es decorativo.
3. Activar con Enter y con Space; confirmar popover visible debajo del botón.
4. Confirmar los links **Favoritos** y **Vistos recientemente**.
5. Activar Favoritos y confirmar `/favoritos`; volver y activar Vistos para
   confirmar `/productos#vistos-recientemente` y el anclaje.
6. Repetir con click fuera y con Escape; en ambos casos el foco debe volver al
   trigger y el scroll de la página debe seguir habilitado.
7. Abrir, recorrer links con Tab/Shift+Tab y cerrar desde teclado sin quedar
   atrapado fuera del contenido.

## Escenario C — No regresión de acciones

Con el popover abierto y cerrado, comprobar en desktop:

- búsqueda envía a `/productos` o `/productos?q=...`;
- cuenta conserva `/cuenta`;
- carrito conserva `/carrito` e indicador de cantidad;
- selector de moneda sigue cambiando moneda y no queda tapado;
- Favoritos conserva su destino/indicador en `xl` y su acceso dentro del
  popover en `lg`;
- Vistos recientes conserva su ancla y contenido.

No modificar datos del carrito, favoritos, vistos ni moneda para realizar esta
prueba.

## Escenario D — Transiciones responsive (10 iteraciones)

Repetir diez veces:

1. En 900 px, abrir el drawer móvil y confirmar overlay + scroll lock.
2. Redimensionar a 1024/1280 px.
3. Confirmar que drawer y overlay desaparecen, el body vuelve a desplazarse y
   aparece solo el patrón desktop.
4. Abrir el popover desktop.
5. Redimensionar a 900 px.
6. Confirmar que el popover portal desaparece, no hay overlay desktop y el
   patrón móvil vuelve a estar disponible.

Resultado requerido: 10/10 iteraciones terminan con un único patrón visible y
sin bloqueo de scroll residual.

## Escenario E — Superficie administrativa

Visitar `/admin` y una subruta administrativa. Confirmar que sigue usando
`src/components/layout/admin-layout.tsx` y que no aparece el botón/popover del
navbar público ni cambia el sidebar.

## Evidencia y fallos

Registrar viewport, ruta, interacción, resultado esperado/observado y
captura/log si existe. Un fallo que afecte foco, Escape, overflow, rutas o
checkout bloquea la aceptación aunque `npm test` pase.
