---

description: "Implementation tasks for consistent home league cards"
---

# Tasks: Tarjetas consistentes en Las grandes ligas

**Input**: Design documents from `/specs/020-tarjetas-ligas-home/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/home-league-cards.md`, and `quickstart.md`

**Tests**: Included because the feature specification and request explicitly require focused rendering, fallback, navigation, responsive/accessibility, type, and build validation.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing Next.js/TypeScript test surface and establish the feature-specific validation entry points without changing runtime behavior.

- [X] T001 Review the existing home, league-logo domain, repository, and test conventions in `src/app/page.tsx`, `src/features/products/domain/league-logos.ts`, `src/features/products/repositories/product-repository.ts`, and `tests/`
- [X] T002 [P] Confirm the focused test command and TypeScript configuration used by this feature in `package.json` and `tsconfig.json`
- [X] T003 [P] Inventory the existing local league logo assets and their paths under `public/leagues/` to define available-logo and missing-logo test fixtures

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared typed/data invariants that both stories rely on before changing the home card markup.

**⚠️ CRITICAL**: No user story implementation should begin until the common league-card contract and test fixtures are agreed.

- [X] T004 Define the shared league-card data and visual-state expectations (slug, name, product count/status, optional logo, fallback label, and `/ligas/{slug}` href) in `src/features/products/domain/league-logos.ts`
- [X] T005 [P] Add or update reusable test fixtures for configured leagues, including Serie A, zero-product leagues, missing-logo leagues, and logo-load-error cases in `tests/home-league-cards.test.ts`
- [X] T006 [P] Preserve the existing `getLeagues`/`BIG_LEAGUE_SLUGS` integration and verify no repository, persistence, inventory, or catalog-filter changes are required in `src/features/products/repositories/product-repository.ts`

**Checkpoint**: Shared data, fallback, and navigation invariants are testable before story-specific UI work begins.

---

## Phase 3: User Story 1 - Ver todas las ligas como tarjetas completas (Priority: P1) 🎯 MVP

**Goal**: Render every configured league in “Las grandes ligas”, including Serie A, through one complete visual card structure with logo area, name, product count/status, CTA, and preserved catalog navigation.

**Independent Test**: Run the focused home-card tests and inspect `/` at mobile and desktop widths; every displayed league has the same card structure, Serie A is a visual card, no URL is visible as card content, and each card navigates to `/ligas/{slug}`.

### Tests for User Story 1

- [X] T007 [P] [US1] Add a Serie A rendering assertion that `src/app/page.tsx` maps Serie A through the same card branch as the other leagues in `tests/home-league-cards.test.ts`
- [X] T008 [P] [US1] Add structural assertions for the shared visual area, league name, product count/“Próximamente” state, CTA, one link destination, and absence of visible `/ligas/serie-a` text in `tests/home-league-cards.test.ts`
- [X] T009 [P] [US1] Add navigation-preservation assertions for every `BIG_LEAGUE_SLUGS` entry and its `/ligas/{slug}` destination in `tests/home-league-cards.test.ts`
- [X] T010 [P] [US1] Add responsive and accessibility assertions for shared grid/card classes, visible keyboard focus state, discernible link naming, and league-specific logo alt text in `tests/home-league-cards.test.ts`

### Implementation for User Story 1

- [X] T011 [US1] Normalize the “Las grandes ligas” mapping in `src/app/page.tsx` so Serie A and every configured league render one identical card tree without a text-link fallback
- [X] T012 [US1] Implement the shared card visual hierarchy and responsive grid states in `src/app/page.tsx`, retaining the existing product count wording, CTA, hover behavior, and focus-visible behavior
- [X] T013 [US1] Keep each card’s single `Link` destination as `/ligas/${league.slug}` and ensure the route is never rendered as visible card text in `src/app/page.tsx`
- [X] T014 [US1] Run the focused home-card and league-logo tests with `node --import tsx --env-file=.env --test tests/home-league-logos.test.ts tests/home-league-cards.test.ts` and fix any failed US1 assertions

**Checkpoint**: User Story 1 is independently demonstrable with all current leagues, including Serie A, and no catalog route behavior changed.

---

## Phase 4: User Story 2 - Mantener una representación visual segura cuando falte un logo (Priority: P2)

**Goal**: Keep a complete, consistent, neutral, accessible card when a league logo is absent or fails to load, while preserving its name, count/status, and navigation.

**Independent Test**: Render a configured league with `logoSrc` absent and simulate an image error; the same visual logo container remains with a neutral accessible fallback, the league identity/count remain visible, no URL is exposed, and clicking still reaches `/ligas/{slug}`.

### Tests for User Story 2

- [X] T015 [P] [US2] Add missing-logo assertions for a neutral fallback icon/style, accessible label, preserved visual-container dimensions, visible league name, and visible count/status in `tests/home-league-cards.test.ts`
- [X] T016 [P] [US2] Add logo-load-error assertions proving the fallback replaces the failed image without removing the card, changing its structure, or changing its href in `tests/home-league-cards.test.ts`
- [X] T017 [P] [US2] Extend logo-domain assertions for typed optional logo resolution and neutral fallback behavior without reintroducing monogram-only or URL-visible output in `tests/home-league-logos.test.ts`

### Implementation for User Story 2

- [X] T018 [US2] Centralize optional logo resolution and neutral fallback metadata in `src/features/products/domain/league-logos.ts` with typed labels suitable for accessible rendering
- [X] T019 [US2] Render the available-logo state with `next/image` and `object-contain`, and switch missing/error states to the same-size neutral accessible fallback inside the shared visual container in `src/app/page.tsx`
- [X] T020 [US2] Preserve league name, product count/status, CTA, focus/hover states, and `/ligas/${league.slug}` navigation across available, missing, and failed-logo states in `src/app/page.tsx`
- [X] T021 [US2] Run the focused fallback and navigation tests with `node --import tsx --env-file=.env --test tests/home-league-logos.test.ts tests/home-league-cards.test.ts` and fix any failed US2 assertions

**Checkpoint**: User Stories 1 and 2 both remain independently testable; incomplete logo data never degrades a league to a plain URL or unstructured link.

---

## Phase 5: Polish & Cross-Cutting Validation

**Purpose**: Validate the complete feature against the quickstart, accessibility contract, type safety, and repository build/test gates without expanding scope.

- [X] T022 [P] Run the complete repository test suite with `npm test` from the `package.json` test script and record/fix regressions limited to the home league-card change
- [X] T023 [P] Run the TypeScript validation with `npx tsc --noEmit` using `tsconfig.json` and resolve type errors in the touched files
- [X] T024 [P] Run `npm run lint` from the `package.json` lint script and resolve lint/accessibility diagnostics for the home card and fallback implementation
- [X] T025 [P] Run `npm run build` from the `package.json` build script and verify the App Router production build succeeds without changing unrelated home sections or catalog routes
- [X] T026 Execute the manual smoke scenarios from `specs/020-tarjetas-ligas-home/quickstart.md` at mobile and desktop widths, including keyboard focus, Serie A navigation, zero products, missing logo, and image-load failure
- [X] T027 Review the final diff against `spec.md`, `specs/020-tarjetas-ligas-home/data-model.md`, and `specs/020-tarjetas-ligas-home/contracts/home-league-cards.md` to confirm scope is limited to league-card presentation and robustness

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T002 and T003 can run in parallel after T001's convention review.
- **Foundational (Phase 2)**: Depends on Phase 1; T005 and T006 can run in parallel, while T004 establishes the shared typed contract.
- **User Story 1 (Phase 3)**: Depends on Phase 2; T007–T010 can run in parallel, then T011–T013 implement against those assertions, followed by T014.
- **User Story 2 (Phase 4)**: Depends on the shared card structure from US1 and Phase 2; T015–T017 can run in parallel, then T018–T020, followed by T021.
- **Polish (Phase 5)**: Depends on the desired user stories; T022–T025 can run in parallel after implementation, then T026–T027 complete the release check.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational; no dependency on another user story. This is the MVP.
- **User Story 2 (P2)**: Depends on the shared card structure delivered by US1, but is independently testable by supplying missing/error logo states.

### Within Each User Story

- Tests are written before implementation and should fail for the missing behavior.
- Shared domain/type contracts precede UI use.
- Card structure precedes fallback-state integration.
- Focused tests run before repository-wide validation.

---

## Parallel Execution Examples

### User Story 1

```text
Task T007: Serie A rendering assertion in tests/home-league-cards.test.ts
Task T008: Consistent card structure assertions in tests/home-league-cards.test.ts
Task T009: Navigation assertions in tests/home-league-cards.test.ts
Task T010: Responsive/accessibility assertions in tests/home-league-cards.test.ts
```

These tests target one test file and should be coordinated as a single test-file change if executed by one worker; they are logically parallel acceptance slices but must not be merged concurrently without coordination.

### User Story 2

```text
Task T015: Missing-logo fallback assertions in tests/home-league-cards.test.ts
Task T016: Logo-load-error assertions in tests/home-league-cards.test.ts
Task T017: Typed logo/fallback assertions in tests/home-league-logos.test.ts
```

T017 can run independently from the card-markup assertions because it targets the domain test file; T015 and T016 should be coordinated if they edit the same test file.

### Cross-cutting validation

```text
Task T022: npm test
Task T023: npx tsc --noEmit
Task T024: npm run lint
Task T025: npm run build
```

These commands can run in parallel after implementation, provided the workspace can support concurrent Node processes.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Add the US1 tests for Serie A, common structure, navigation, responsive behavior, and accessibility.
3. Normalize the home league-card mapping and shared visual structure.
4. Run T014 and stop for an independent MVP review.

### Incremental Delivery

1. Add US2 fallback metadata and missing/error logo tests.
2. Implement the neutral fallback without changing card dimensions or navigation.
3. Run T021 for independent fallback acceptance.
4. Complete T022–T027 for repository and release validation.

### Scope Guard

Do not modify catalog filtering, league landing routes, repository queries, inventory/pricing rules, global navigation, or unrelated home sections.

---

## Notes

- `[P]` marks work that can proceed in parallel without depending on incomplete tasks; same-file test tasks should be coordinated despite being logically independent.
- `[US1]` and `[US2]` map directly to the priorities in `spec.md`.
- Every task includes an actionable file path or command target and is limited to implementation of `specs/020-tarjetas-ligas-home`.
