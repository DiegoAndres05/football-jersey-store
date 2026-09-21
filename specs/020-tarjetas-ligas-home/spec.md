# Feature Specification: Tarjetas consistentes en Las grandes ligas

**Feature Branch**: `020-tarjetas-ligas-home`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Corregir la sección 'Las grandes ligas' en la página de inicio de FlashSport, donde Serie A se muestra como enlace de texto plano ('/ligas/serie-a') en lugar de una tarjeta visual con logo, nombre y cantidad de productos, como Premier League y La Liga. Toda liga listada debe mostrarse siempre como tarjeta completa y consistente. Si falta el logo de alguna liga en el futuro, mostrar ícono o estilo genérico de respaldo, nunca degradar a enlace de texto sin formato."

## Clarifications

- **Fallback visual de logo (2026-09-20)**: cuando una liga no tenga logo o el logo no pueda cargarse, se usará un ícono genérico neutral y accesible dentro del mismo contenedor visual estándar de las tarjetas con logo. Se conservarán el nombre, la cantidad de productos y la navegación de la liga.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver todas las ligas como tarjetas completas (Priority: P1)

Como visitante de FlashSport, quiero que cada liga de “Las grandes ligas”, incluida Serie A, aparezca como una tarjeta visual completa para reconocerla y acceder a su catálogo sin encontrar un enlace de texto roto o inconsistente.

**Why this priority**: Corrige la experiencia visible y el defecto actual que impide que una liga se presente como parte del conjunto.

**Independent Test**: Abrir la página de inicio y revisar cada liga listada; cada una debe tener el mismo tipo de tarjeta, con área visual, nombre, cantidad de productos y enlace a su catálogo.

**Acceptance Scenarios**:

1. **Given** la página de inicio muestra Premier League, La Liga, Serie A u otra liga configurada, **When** la persona observa la sección “Las grandes ligas”, **Then** cada liga aparece como una tarjeta visual completa y ninguna aparece como una URL o enlace de texto plano.
2. **Given** la tarjeta de Serie A, **When** la persona la observa y la selecciona, **Then** ve su logo o representación visual, el nombre “Serie A”, la cantidad de productos disponible y llega al catálogo filtrado de Serie A.
3. **Given** varias ligas listadas, **When** la persona compara sus tarjetas, **Then** todas conservan la misma estructura, jerarquía de información y comportamiento de navegación.

### User Story 2 - Mantener una representación visual segura cuando falte un logo (Priority: P2)

Como responsable de la tienda, quiero que una liga sin logo disponible conserve una tarjeta completa mediante un ícono o estilo genérico de respaldo, para que la sección nunca se degrade a un enlace sin formato.

**Why this priority**: Evita que futuros datos incompletos vuelvan a producir una presentación inconsistente o confusa.

**Independent Test**: Simular o revisar una liga configurada sin logo y comprobar que conserva el contenedor visual, nombre, cantidad de productos y destino de navegación, mostrando el respaldo definido.

**Acceptance Scenarios**:

1. **Given** una liga listada no tiene logo disponible, **When** se renderiza la sección, **Then** su tarjeta muestra un ícono o estilo genérico de respaldo dentro del área visual, junto con nombre y cantidad de productos.
2. **Given** una liga sin logo, **When** la persona la selecciona, **Then** navega al mismo catálogo filtrado que tendría con logo y nunca ve la ruta como contenido visible de la tarjeta.
3. **Given** algunas ligas tienen logo y otra usa respaldo, **When** se muestra la sección, **Then** todas siguen siendo tarjetas del mismo tamaño y estructura sin huecos ni elementos ocultos.

### Edge Cases

- Una liga nueva agregada a la lista no tiene logo: usa el respaldo visual y conserva todos los datos de la tarjeta.
- El nombre o la cantidad de productos de una liga está vacío o no disponible: la tarjeta mantiene su estructura y muestra un texto de disponibilidad comprensible sin revelar una URL.
- El logo tiene proporciones distintas o no puede cargarse: se conserva su proporción cuando sea posible y se usa el respaldo visual si no puede mostrarse.
- La sección se visualiza en móvil o escritorio: ninguna tarjeta se convierte en enlace plano ni rompe el diseño responsive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La sección “Las grandes ligas” MUST renderizar cada liga listada como una tarjeta visual completa, sin excepciones por liga, incluyendo Serie A.
- **FR-002**: Cada tarjeta MUST mostrar un área visual para la liga, su nombre, la cantidad de productos (o un estado comprensible si no está disponible) y un destino navegable al catálogo filtrado de esa liga.
- **FR-003**: La tarjeta MUST ocultar las rutas internas, como `/ligas/serie-a`, como texto visible; la ruta solo puede funcionar como destino de navegación.
- **FR-004**: Cuando una liga tenga un logo disponible, la tarjeta MUST mostrarlo dentro de su área visual sin deformarlo ni alterar la estructura común.
- **FR-005**: Cuando falte un logo o no pueda cargarse, la tarjeta MUST mostrar un ícono o estilo genérico de respaldo y MUST conservar nombre, cantidad de productos, estructura visual y navegación.
- **FR-006**: Todas las tarjetas MUST compartir una estructura, jerarquía visual, tamaño aproximado, espaciado y estados interactivos consistentes, tanto en móvil como en escritorio.
- **FR-007**: La solución MUST conservar el enlace de cada liga hacia su catálogo correspondiente, sin cambiar el filtro o destino funcional existente.
- **FR-008**: La corrección MUST limitarse a la presentación y robustez de las tarjetas de “Las grandes ligas” y no alterar otras secciones de la página de inicio ni el catálogo fuera del comportamiento necesario para esos enlaces.

### Key Entities

- **Liga listada**: liga mostrada en “Las grandes ligas”, con nombre, identificador de navegación, logo opcional y cantidad de productos.
- **Tarjeta de liga**: representación visual uniforme de una liga, compuesta por área de logo o respaldo, nombre, cantidad y acceso al catálogo.
- **Respaldo visual**: ícono genérico neutral y accesible que ocupa el área estándar del logo cuando el logo no está disponible o falla.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En el 100% de las revisiones de la página de inicio, cada liga listada se presenta como tarjeta visual completa; 0 ligas aparecen como URL o enlace de texto plano.
- **SC-002**: En una revisión con la configuración actual, el 100% de las tarjetas (incluida Serie A) muestra área visual, nombre, cantidad de productos y navegación al catálogo correcto.
- **SC-003**: En una revisión con al menos una liga sin logo, el 100% de las ligas conserva una tarjeta completa y la liga sin logo muestra el respaldo visual, sin huecos ni degradación a texto plano.
- **SC-004**: En vistas móvil y escritorio, al menos el 95% de las personas de prueba identifica cada liga y su cantidad de productos sin confundir una tarjeta con un enlace de texto aislado.

## Assumptions

- La lista de “Las grandes ligas” seguirá siendo la fuente actual de ligas; esta especificación no agrega ni elimina ligas.
- La cantidad de productos puede ser cero y debe seguir siendo un dato visible y comprensible.
- El respaldo genérico no necesita representar la marca oficial de una liga; su objetivo es preservar la estructura y la comprensión de la tarjeta.
- Los destinos actuales de cada liga son válidos y solo deben conservarse, no rediseñarse.

## Out of Scope

- Rediseñar la página de inicio completa, otras secciones o la navegación global.
- Cambiar los filtros, productos o reglas de inventario del catálogo.
- Crear o sustituir logos oficiales de las ligas.
