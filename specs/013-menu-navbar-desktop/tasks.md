---

description: "Implementation tasks for the desktop public navbar menu"
---

# Tasks: Menú de navegación en navbar desktop

**Input**: Design documents from `specs/013-menu-navbar-desktop/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, and `quickstart.md` are available. No `contracts/` directory is required because this feature exposes no API, Server Action, CLI, or service contract. No database migration is required.

**Scope guard**: Work is limited to the public store header. Do not modify the mobile navigation pattern, admin navigation, routes, stores, catalog, cart, checkout, authentication, currency behavior, or persistence.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing application, UI primitives, routes, and test runner that the feature will reuse. No new dependency, route, API contract, migration, or storage layer is introduced.

- [x] T001 Verify the existing Next.js, React, Radix Popover, Lucide, Tailwind, and Node test-runner scripts in `package.json`
- [x] T002 [P] Confirm the public header inclusion boundary in `src/components/layout/app-layout.tsx` and the separate admin boundary in `src/components/layout/admin-layout.tsx`
- [x] T003 [P] Confirm the existing public destinations and UI primitives in `src/components/layout/nav-links.tsx`, `src/components/ui/popover.tsx`, `src/components/ui/button.tsx`, `src/app/favoritos/page.tsx`, and `src/app/productos/page.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the behavior and ownership constraints that all story work must preserve.

**Critical**: Complete this phase before implementing any user story.

- [x] T004 Audit the existing mobile drawer state, body-scroll cleanup, and `lg` breakpoint behavior in `src/components/layout/header.tsx`
- [x] T005 [P] Verify `NAV_ITEMS`, exact/prefix active-state rules, and `aria-current` behavior in `src/components/layout/nav-links.tsx`
- [x] T006 [P] Verify Radix focus, dismissal, portal, and `Button` focus-visible behavior in `src/components/ui/popover.tsx` and `src/components/ui/button.tsx`

**Checkpoint**: Existing public navigation, accessibility primitives, and responsive ownership are understood; no work is required in Prisma or API contracts.

---

## Phase 3: User Story 1 - Acceder a la navegación principal desde desktop (Priority: P1) 🎯 MVP

**Goal**: Add an identifiable desktop hamburger trigger and anchored popover containing `Favoritos` and `Vistos recientemente`, while preserving the five visible public links and accessible keyboard behavior.

**Independent Test**: At a desktop viewport (`lg`, 1024px or wider), identify the five public links, activate the three-line trigger with click/Enter/Space, verify both quick-link destinations, and close with selection, outside click, or `Escape` while focus remains predictable.

**Acceptance criteria and validation**:

- The desktop trigger is a single accessible button with a decorative three-line icon, visible from `lg`, and does not replace `NavLinks`.
- The anchored popover contains `Favoritos` → `/favoritos` and `Vistos recientemente` → `/productos#vistos-recientemente`.
- `Inicio`, `Tienda`, `Ligas`, `Sobre nosotros`, and `Contacto` retain their existing routes and active-state semantics.
- Keyboard focus is visible, links are reachable in logical order, and Radix dismissal returns focus to the trigger.

### Tests for User Story 1

- [x] T007 [P] [US1] Add the focused static navbar contract test for trigger icon, Radix Popover usage, accessible labels, quick-link text, and exact destinations in `tests/navbar-desktop-ui.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement the controlled desktop hamburger trigger and anchored quick-links popover with `Menu`, `Heart`, `History`, `Popover`, and `Button` in `src/components/layout/header.tsx`
- [x] T009 [P] [US1] Preserve the five `NAV_ITEMS`, active-section matching, and `aria-current` behavior while exposing the existing public links in `src/components/layout/nav-links.tsx`
- [x] T010 [US1] Run the focused structural test and the keyboard/navigation acceptance steps against `src/components/layout/header.tsx`, `src/components/layout/nav-links.tsx`, and `tests/navbar-desktop-ui.test.ts`

**Checkpoint**: User Story 1 is independently demonstrable at desktop width without changing any mobile or admin surface.

---

## Phase 4: User Story 2 - Conservar las acciones actuales del navbar (Priority: P2)

**Goal**: Keep search, account, favorites, recently viewed, cart, quantity indicators, and currency selection usable and unchanged while the desktop popover is open or closed.

**Independent Test**: At desktop widths, exercise every existing header action with the popover both open and closed, then verify the existing destinations, indicators, query/hash behavior, and currency interaction remain unchanged.

**Acceptance criteria and validation**:

- Search, account, cart, quantity indicators, and currency controls retain their current destinations and behavior.
- Favorites and recently viewed remain available through their existing controls where space allows and through the new popover at `lg`.
- Opening the popover does not add a body scroll lock, hide checkout access, or alter stores.
- Desktop-wide spacing avoids overlap between brand, five public links, search, currency, actions, cart, and the new trigger.

### Tests for User Story 2

- [x] T011 [US2] Extend the focused regression assertions for search, account, favorites, recently viewed, cart, quantity indicators, currency, and popover coexistence in `tests/navbar-desktop-ui.test.ts`

### Implementation for User Story 2

- [x] T012 [US2] Adjust only the narrow-desktop visibility, spacing, and ordering needed to fit the new trigger while preserving existing action destinations in `src/components/layout/header.tsx`
- [x] T013 [US2] Verify that favorites, recently viewed, cart, and currency stores and destinations remain untouched and compatible with the header in `src/shared/stores/favorites-store.ts`, `src/shared/stores/recently-viewed-store.ts`, `src/shared/stores/cart-store.ts`, and `src/features/system/components/currency-selector-server.tsx`
- [x] T014 [US2] Run the focused navbar test plus the existing favorites/recently-viewed UI and accessibility regression tests in `tests/navbar-desktop-ui.test.ts`, `tests/favorites-accessibility.test.ts`, `tests/favorites-ui.test.ts`, `tests/recently-viewed-accessibility.test.ts`, and `tests/recently-viewed-ui.test.ts`

**Checkpoint**: User Stories 1 and 2 work independently; existing purchasing actions and indicators are unchanged.

---

## Phase 5: User Story 3 - Mantener paridad responsive (Priority: P3)

**Goal**: Ensure only the correct navigation pattern is visible while resizing across `lg`: mobile keeps its existing drawer and desktop keeps the popover, with no residual overlay, portal, or body scroll lock.

**Independent Test**: Repeat the mobile-to-desktop and desktop-to-mobile transitions ten times at 900px, 1024px, and 1280px; verify one navigation pattern is visible at each endpoint and scrolling/focus are restored.

**Acceptance criteria and validation**:

- Below `lg`, the existing mobile `Menú` drawer remains the only menu and the desktop trigger/popover is unavailable.
- At or above `lg`, the mobile drawer and overlay are closed and the desktop popover is the only quick-navigation menu.
- Resizing never leaves `document.body` locked, a stale portal, a mobile overlay, or two visible menus.
- The admin layout remains unchanged and never receives the public desktop trigger.

### Tests for User Story 3

- [x] T015 [US3] Add static assertions for `lg` visibility, mobile/desktop separation, breakpoint cleanup, and preserved admin boundary in `tests/navbar-desktop-ui.test.ts`

### Implementation for User Story 3

- [x] T016 [US3] Synchronize `matchMedia("(min-width: 1024px)")` transitions so the mobile drawer closes on desktop entry and the desktop popover closes below `lg` in `src/components/layout/header.tsx`
- [x] T017 [US3] Verify the mobile drawer, overlay, and body-scroll cleanup remain scoped to the existing mobile behavior in `src/components/layout/header.tsx`
- [x] T018 [US3] Execute the responsive viewport matrix and ten resize-transition iterations from `specs/013-menu-navbar-desktop/quickstart.md` without changing `src/components/layout/admin-layout.tsx`

**Checkpoint**: All three user stories are independently testable, and responsive transitions leave one usable navigation pattern with no residual state.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run the complete validation matrix and quality gates without expanding scope.

- [x] T019 [P] Run the complete Node test suite, including the focused navbar and existing regression tests, using the scripts declared in `package.json`
- [x] T020 [P] Run lint and resolve only feature-caused diagnostics in `package.json` and `src/components/layout/header.tsx`
- [x] T021 [P] Run TypeScript validation with `npx tsc --noEmit` using `tsconfig.json`
- [x] T022 Run the production build and verify App Router integration using the build script in `package.json`
- [x] T023 Run every acceptance scenario, accessibility check, responsive check, and admin-surface check in `specs/013-menu-navbar-desktop/quickstart.md`
- [x] T024 Verify the final diff contains no API contract, migration, Prisma, store, route, checkout, authentication, or admin changes in `prisma/schema.prisma`, `src/components/layout/admin-layout.tsx`, `src/shared/stores/favorites-store.ts`, `src/shared/stores/recently-viewed-store.ts`, `src/shared/stores/cart-store.ts`, and `src/app/`

---

## Dependencies & Execution Order

### Dependency graph

```text
T001 ─┬─> T004 ─┬─> T007 ─> T008 ─> T010 ─> T011 ─> T012 ─> T014
T002 ─┤         ├─> T005 ─> T009 ───────────────┘       │
T003 ─┘         └─> T006                                └─> T015 ─> T016 ─> T018
                                                          T017 ────────┘
T019, T020, T021, T022, T023, T024 depend on the completed desired stories.
```

### Phase dependencies

- **Setup (Phase 1)**: No dependencies; repository and existing boundaries can be inspected in parallel.
- **Foundational (Phase 2)**: Depends on Setup; blocks all story implementation.
- **User Story 1 (P1)**: Depends on Foundational; MVP and the base for later stories.
- **User Story 2 (P2)**: Depends on User Story 1 because it regresses the newly integrated popover against existing actions.
- **User Story 3 (P3)**: Depends on User Story 1 and the action layout from User Story 2 because breakpoint synchronization must cover the complete header.
- **Polish (Phase 6)**: Depends on all desired story checkpoints; no task introduces API contracts or migrations.

### Parallel opportunities by story

- **US1**: Run T007 after foundational review; T009 can proceed in parallel with T008 because it owns `src/components/layout/nav-links.tsx`, then T010 follows both.
- **US2**: T011 can be prepared before T012; T013 is independent of the test-file edits and can run in parallel, while T014 follows T011–T013.
- **US3**: T015 can be prepared before T016; T017 reviews the existing cleanup in the same header after T016, and T018 is the final manual validation.

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and the blocking Phase 2.
2. Complete T007–T010 for the desktop trigger, popover, public links, routes, focus behavior, and focused test.
3. Stop and validate User Story 1 independently using the acceptance criteria and the desktop sections of `specs/013-menu-navbar-desktop/quickstart.md`.
4. Demo or deploy only after the focused test and keyboard checks pass.

### Incremental delivery

1. Add User Story 2 to prove no regression in the existing shopping actions.
2. Add User Story 3 to prove responsive state cleanup across ten viewport transitions.
3. Run Phase 6 quality gates and the full quickstart acceptance matrix.

### Out-of-scope safeguards

- Do not create `contracts/`, endpoints, Server Actions, migrations, Prisma entities, new routes, or stores.
- Do not alter `src/components/layout/admin-layout.tsx` or redesign the existing mobile drawer.
- Keep `Favoritos` and `Vistos recientemente` as links to existing public destinations, including the literal `#vistos-recientemente` hash.

## Notes

- Every implementation task names the exact repository file it acts on or validates.
- `[P]` is used only when the task can run independently without editing the same file as another parallel task.
- Tests are required by the feature specification and plan; the focused test uses the repository's existing static `node:test` + `readFileSync` pattern.
