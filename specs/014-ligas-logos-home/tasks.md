# Tasks: Logos oficiales en Las grandes ligas

**Input**: Design documents from `/specs/014-ligas-logos-home/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/home-league-logos.md`

**Tests**: Obligatorios (constitution V). Estilo: `node:test` + asserts de dominio y lectura de `src/app/page.tsx`.

**Organization**: Tareas por user story. Prefijo SpecKit **T00n**. OpenCode opcional: `.ai/tasks/TASK-014-XXX`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/`, `public/`, `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Incorporar assets del dueño. Sin deps npm nuevas. Sin Google.

- [x] T001 Crear `public/leagues/` y copiar desde `~/Desktop/webfs/diseno/` los archivos `premier_league.png`, `la_liga.png`, `serie_a.png`, `bundesliga.png`, `ligue_1.png` hacia `public/leagues/` (mismos nombres)
- [x] T002 [P] Crear esqueleto `src/features/products/domain/league-logos.ts` exportando `leagueLogoSrc` y `leagueMonogram` (cuerpo placeholder permitido) y esqueleto `tests/home-league-logos.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mapa slug→path y monogramas de fallback. Bloquea la UI.

**⚠️ CRITICAL**: Las user stories de UI no empiezan hasta completar esta fase.

- [x] T003 En `tests/home-league-logos.test.ts`: para cada slug `premier-league`, `la-liga`, `serie-a`, `bundesliga`, `ligue-1`, `leagueLogoSrc` devuelve el path `/leagues/….png` del contrato; slug desconocido → `null`; `leagueMonogram("premier-league")` → `PL` (y equivalentes LAL/SA/BL/L1)
- [x] T004 Implementar el mapa y helpers en `src/features/products/domain/league-logos.ts` hasta que T003 pase

**Checkpoint**: Dominio testeable sin JSX.

---

## Phase 3: User Story 1 - Reconocer cada liga por su logo (Priority: P1) 🎯 MVP

**Goal**: En “Las grandes ligas”, el bloque superior muestra logo por slug (no monograma si hay asset); nombre debajo; link intacto.

**Independent Test**: `/` — 5 logos; nombres debajo; click → `/productos?liga=…`.

### Tests for User Story 1

- [x] T005 [US1] En `tests/home-league-logos.test.ts`: `src/app/page.tsx` importa `leagueLogoSrc` (o el helper); usa `/leagues/`; MUST NOT depender solo de mostrar `PL`/`LAL` cuando hay logo; MUST NOT emoji; conserva texto “Las grandes ligas” y `liga=`

### Implementation for User Story 1

- [x] T006 [US1] En `src/app/page.tsx`, en el contenedor `h-11 w-11` de cada tarjeta de grandes ligas: si `leagueLogoSrc(slug)`, renderizar imagen del logo; si no, monograma vía `leagueMonogram`; conservar nombre debajo y `href={`/productos?liga=${league.slug}`}`; MUST NOT tocar Destacadas/hero/“Las más buscadas”

**Checkpoint**: Logos visibles. MVP.

---

## Phase 4: User Story 2 - Logos bien proporcionados (Priority: P2)

**Goal**: Contenedor ~igual; `object-contain`; sin deformar; grid responsive intacto.

**Independent Test**: ~390 px y desktop — logos caben sin estirar; grid 2/3/5 columnas.

### Tests for User Story 2

- [x] T007 [US2] En `tests/home-league-logos.test.ts`: `src/app/page.tsx` contiene `object-contain` y `h-11 w-11` en el bloque de ligas; conserva `grid-cols-2` / `md:grid-cols-3` / `xl:grid-cols-5`

### Implementation for User Story 2

- [x] T008 [US2] Ajustar el markup del logo en `src/app/page.tsx` (padding interno si hace falta, `object-contain`, contenedor relativo) sin cambiar tipografía ni bordes de la tarjeta

**Checkpoint**: US1 + US2.

---

## Phase 5: User Story 3 - Asociación correcta y fallback (Priority: P3)

**Goal**: Asociación por slug; fallback monograma; sin inventar assets; resto de home intacto.

**Independent Test**: Slug correcto ↔ archivo; quitar un path mentalmente → monograma; otras secciones iguales.

### Tests for User Story 3

- [x] T009 [US3] En `tests/home-league-logos.test.ts`: fallback monograma documentado/testeado; `page.tsx` no importa `cdn.21st.dev`; archivos existen bajo `public/leagues/` (assert `existsSync` de los 5 PNG)

### Implementation for User Story 3

- [x] T010 [US3] Revisar `src/app/page.tsx` y `src/features/products/domain/league-logos.ts`: monograma solo como fallback; eliminar mapa inline `LEAGUE_MONOGRAMS` de `page.tsx` si quedó duplicado (mover a dominio); confirmar que no se tocaron otras secciones

**Checkpoint**: Asociación + fallback OK.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gates y quickstart.

- [x] T011 Ejecutar `specs/014-ligas-logos-home/quickstart.md`: existencia de PNG, `npx tsx --test tests/home-league-logos.test.ts`, `npx tsc --noEmit`, pasada visual en `/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 ∥ T002
- **Foundational**: T003 → T004 (tras Setup)
- **US1**: Tras T004 — **MVP**
- **US2**: Tras T006
- **US3**: Tras T006 / T008
- **Polish**: Último

### Parallel Opportunities

- T001 ∥ T002
- T007 puede redactarse en paralelo a T008 solo si no pisan el mismo hunk de test

---

## Implementation Strategy

### MVP First (User Story 1)

1. Copiar assets + dominio
2. Wire logos en `page.tsx`
3. **STOP**: validar visual
4. object-contain → fallback/tests → gates

### Delegación (opcional)

| SpecKit | OpenCode |
|---------|----------|
| T001–T011 | `/ai-task TASK-014-00n` |

---

## Notes

- Assets solo del dueño (`webfs/diseno`)
- Format validation: checkbox, ID, `[USn]`, ruta de archivo
