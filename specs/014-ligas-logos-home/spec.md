# Feature Specification: Logos oficiales en Las grandes ligas

**Feature Branch**: `014-ligas-logos-home`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: en la sección “Las grandes ligas” de la homepage, reemplazar las abreviaturas (PL, LAL, SA, BL, L1) por el logo oficial de cada liga, manteniendo tarjetas y layout; nombre debajo; sin emojis ni logos inventados; reutilizar assets si existen; el usuario tiene las imágenes en una carpeta.

## Clarifications

### Session 2026-09-06

- Q: ¿Dónde están los logos y cómo se llaman? → A: Escritorio `webfs/diseno` (`~/Desktop/webfs/diseno`): `premier_league.png`, `la_liga.png`, `serie_a.png`, `bundesliga.png`, `ligue_1.png`. Se copiarán al proyecto (p. ej. bajo `public/`) y se asociarán por liga/slug.
- Q: Si falta un logo, ¿qué mostrar? → A: Volver al monograma actual (PL, LAL, etc.) solo en ese caso.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconocer cada liga por su logo (Priority: P1)

Como visitante en el inicio, quiero ver el logo oficial de Premier League, La Liga, Serie A, Bundesliga y Ligue 1 en el bloque superior de cada tarjeta de “Las grandes ligas”, para identificar la liga de un vistazo sin leer solo PL/LAL/SA/BL/L1.

**Why this priority**: Es el cambio visible pedido: sustituir monogramas por logos reales.

**Independent Test**: Abrir `/`; en “Las grandes ligas”, cada una de las cinco tarjetas muestra un logo (no abreviatura de texto) en el contenedor superior; el nombre de la liga sigue debajo; el bloque sigue enlazando al catálogo filtrado por esa liga.

**Acceptance Scenarios**:

1. **Given** el inicio con las cinco grandes ligas, **When** mira el contenedor superior de cada tarjeta, **Then** ve el logo oficial de esa liga (no PL/LAL/SA/BL/L1 como texto, ni emoji).
2. **Given** Premier League, **When** mira su logo, **Then** ve el logo oficial (incl. león si forma parte del logo) **sin** escribir “Premier League” dentro del contenedor del icono.
3. **Given** cualquier tarjeta de liga, **When** mira debajo del logo, **Then** el nombre de la liga sigue visible como hoy (y el conteo / “Ver liga” si ya existían).
4. **Given** una tarjeta, **When** la pulsa, **Then** llega al catálogo filtrado por esa liga (mismo destino que hoy).

---

### User Story 2 - Logos bien proporcionados y consistentes (Priority: P2)

Como visitante (móvil o escritorio), quiero que todos los logos se vean con un tamaño visual parecido, sin deformarse, dentro de un contenedor similar al bloque actual, para que la sección no se vea rota.

**Why this priority**: Logos con proporciones distintas no deben romper el grid.

**Independent Test**: Revisar las cinco tarjetas en ~390 px y escritorio: contenedor ~mismo tamaño que el monograma actual; logos sin estirar; grid y tipografía de tarjeta intactos.

**Acceptance Scenarios**:

1. **Given** las cinco tarjetas, **When** compara los contenedores del logo, **Then** tienen tamaño aproximado al bloque actual (cuadrado ~mismo alto/ancho) y aspecto visual consistente entre ligas.
2. **Given** un logo más ancho o más alto que otro, **When** se muestra, **Then** no se deforma (cabe dentro del contenedor respetando proporciones).
3. **Given** viewport estrecho, **When** mira la sección, **Then** el grid responsive actual se mantiene (p. ej. 2 columnas en móvil).

---

### User Story 3 - Asociación correcta y sin inventar assets (Priority: P3)

Como dueño de la tienda, quiero que cada logo corresponda a la liga correcta y que se usen mis archivos (carpeta / storage), no imágenes aleatorias ni emojis, para no mostrar marcas falsas.

**Why this priority**: Evita errores de marca y assets ilegítimos.

**Independent Test**: Cada slug (premier-league, la-liga, serie-a, bundesliga, ligue-1) muestra su logo asociado; no hay emoji como logo; no se usaron URLs inventadas de Google.

**Acceptance Scenarios**:

1. **Given** los datos de ligas del catálogo, **When** se renderiza la sección, **Then** el logo se asocia por liga (p. ej. por slug o URL de logo de esa liga), no por índice fijo suelto sin relación.
2. **Given** assets en el proyecto (copiados desde `webfs/diseno`), **When** faltara un logo, **Then** esa tarjeta muestra el monograma de texto actual (PL, LAL, etc.) solo para esa liga.3. **Given** la entrega, **When** se revisa el alcance, **Then** no cambiaron Destacadas, hero, “Las más buscadas” ni otras secciones.

---

### Edge Cases

- Logo ausente para una de las cinco: monograma de texto como fallback; el resto con logo.- Logo muy rectangular: cabe sin recorte agresivo que lo haga irreconocible.
- Liga en la lista de “grandes” sin fila en BD: la sección sigue las reglas actuales de filtrado.
- Dark/light de fondo del contenedor: el logo debe seguir siendo reconocible (contraste razonable).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: En “Las grandes ligas” del inicio, el bloque superior de cada tarjeta MUST mostrar el logo oficial de esa liga en lugar de la abreviatura de texto (PL, LAL, SA, BL, L1).
- **FR-002**: El nombre de la liga MUST seguir mostrándose debajo del logo, como hoy. MUST NOT añadir el nombre de la liga **dentro** del contenedor del logo salvo que el propio archivo del logo ya lo incluya gráficamente.
- **FR-003**: MUST NOT usar emojis como logo. MUST NOT inventar ni descargar logos genéricos de terceros al azar.
- **FR-004**: MUST usar los logos oficiales del dueño ubicados en `~/Desktop/webfs/diseno` (`premier_league.png`, `la_liga.png`, `serie_a.png`, `bundesliga.png`, `ligue_1.png`), copiados al proyecto para servirlos. MUST NOT descargar logos de Google ni inventarlos.
- **FR-005**: La asociación logo↔liga MUST ser dinámica respecto a la liga (slug / dato de liga). Mapeo de archivos: `premier-league` ← `premier_league.png`, `la-liga` ← `la_liga.png`, `serie-a` ← `serie_a.png`, `bundesliga` ← `bundesliga.png`, `ligue-1` ← `ligue_1.png`.
- **FR-006**: El contenedor del logo MUST conservar aproximadamente el tamaño del bloque de monograma actual; los logos MUST verse con tamaño visual consistente y sin deformación.
- **FR-007**: MUST conservar layout, bordes, espaciado, tipografía y comportamiento responsive de las tarjetas y de la sección.
- **FR-008**: MUST NOT modificar otras secciones de la homepage ni el resto del catálogo fuera de esta sección.
- **FR-009**: Si no hay logo disponible para una liga de la sección, el sistema MUST mostrar el monograma de texto actual (PL, LAL, SA, BL, L1 o iniciales) solo para esa liga. MUST NOT dejar un hueco vacío ni ocultar la tarjeta por falta de logo.
### Key Entities

- **Liga (grande)**: una de las cinco ligas mostradas (slug + nombre + conteo); puede tener URL/ruta de logo.
- **Logo de liga**: asset oficial asociado a esa liga; se muestra en el contenedor superior de la tarjeta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una pasada de revisión, 5/5 tarjetas de grandes ligas muestran logo (no monograma de texto) cuando el asset está disponible.
- **SC-002**: El 100% de las revisiones confirman nombre de liga debajo del logo y sin texto inventado dentro del icono.
- **SC-003**: En móvil (~390 px) y escritorio, el 100% ve grid intacto y logos sin deformación evidente.
- **SC-004**: 0 emojis usados como logo; 0 logos inventados/descargados al azar.

## Assumptions

- La sección afectada es solo el bloque “Las grandes ligas” de la homepage (no `/ligas` admin salvo que ya alimente `logoUrl`).
- Los datos de liga ya se obtienen del catálogo; hoy el monograma es un mapa local de slug → texto. El logo debe ligarse al mismo slug/liga.
- Los cinco PNG ya existen en el Escritorio (`webfs/diseno`) y se incorporarán al repo para servirlos estáticamente; no se inventan ni se descargan.
- Las cinco ligas objetivo son: Premier League, La Liga, Serie A, Bundesliga, Ligue 1 (slugs actuales del inicio).

## Out of Scope

- Rediseñar tarjetas, tipografía o el resto de la home.
- Sustituir logos por emojis o iconos genéricos.
- Descargar imágenes aleatorias de buscadores.
- Cambiar filtros del catálogo o páginas de admin de ligas (salvo lo mínimo si hace falta persistir `logoUrl`).
