# Research: Tarjetas consistentes en Las grandes ligas

## Decision: reutilizar `getLeagues` como única fuente de tarjetas

- **Rationale:** `src/features/products/repositories/product-repository.ts` ya
  devuelve `slug`, `name` y `productCount` calculado con productos activos. La home
  ya filtra esa colección por `BIG_LEAGUE_SLUGS`, por lo que no hace falta una
  consulta, modelo o migración adicional.
- **Alternatives considered:** introducir una lista de presentación separada
  (riesgo de desincronizar Serie A/cantidades); consultar cada liga individualmente
  (más latencia y duplicación).

## Decision: una sola estructura de tarjeta para todas las ligas

- **Rationale:** un `map` común sobre las ligas evita una rama especial para Serie A
  y garantiza jerarquía, tamaños, estados hover/focus y CTA consistentes en móvil y
  escritorio.
- **Alternatives considered:** reparar solo el enlace de Serie A; rechazado porque
  no protege contra futuras ligas incompletas ni cumple FR-001/FR-006.

## Decision: fallback visual neutral dentro del mismo contenedor

- **Rationale:** `leagueLogoSrc` puede devolver `null` y un asset también puede fallar
  en runtime. El fallback debe ocupar las mismas dimensiones, no revelar una ruta y
  exponer un nombre accesible como “Logo no disponible para {liga}”.
- **Alternatives considered:** monograma textual como única solución (no comunica
  explícitamente estado neutral y puede parecer marca); ocultar el área o renderizar
  el href (rompe la estructura y la accesibilidad); depender de una URL CDN externa
  (contradice la abstracción de media local).

## Decision: `next/image` con `object-contain` y error cerrado

- **Rationale:** preserva proporciones de logos distintos y el estado de error puede
  cambiar a fallback sin modificar el enlace ni los datos de la tarjeta.
- **Alternatives considered:** `<img>` sin control de dimensiones; `object-cover`,
  que puede recortar logos; assets remotos, que añaden configuración y dependencia.

## Decision: verificación enfocada, no E2E externo

- **Rationale:** el repositorio usa `node:test` + `tsx` y ya contiene
  `tests/home-league-logos.test.ts`. Las pruebas estáticas/dominio pueden asegurar
  invariantes de JSX, rutas, alt y fallback sin base de datos ni navegador externo;
  `tsc --noEmit` cubre tipos.
- **Alternatives considered:** crawler o prueba E2E completa; excesiva para un
  cambio de presentación y no necesaria para la aceptación local.
