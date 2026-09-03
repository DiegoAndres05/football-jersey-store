<!--
Sync Impact Report
- Version change: template → 1.0.0
- Modified principles: none; all five principles are established for the first time
- Added sections: Additional Constraints; Development Workflow
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md
- Command templates: ✅ reviewed; command guidance is generic and has no outdated agent-specific references
- Follow-up TODOs: none
-->

# Football Jersey Store Constitution

## Core Principles

### I. Domain Boundaries and Feature Ownership
The application MUST organize business behavior by bounded context under `src/features/*`.
Each feature MUST keep its domain rules, validation, services, repositories, and actions
close to the owning context. Cross-context relationships MUST use explicit application
contracts or weak references rather than introducing unnecessary database coupling.
This preserves the existing Catalog, Inventory, Supplier, Customer, Order, Auth, and
System boundaries and keeps changes local and independently testable.

### II. Auditable Domain Integrity
Inventory MUST be represented by an immutable movement ledger; current stock and
availability MUST be derived from recorded movements, supplier data, and launch rules.
Order totals MUST be calculated from persisted integer amounts in Colombian pesos,
with explicit treatment of shipping, personalization, discounts, and payment state.
Order items and status history MUST preserve historical snapshots, and destructive
operations MUST NOT cascade into accounting, inventory, or audit records.
These rules make stock, pricing, and order lifecycle decisions explainable after the
fact.

### III. Typed and Validated Contracts
All new domain inputs, server actions, API payloads, and persisted enum-like values
MUST have explicit TypeScript types and runtime validation at trust boundaries.
Server Components and Server Actions SHOULD be the default; client components MUST be
limited to interaction or browser-state needs. Public routes and admin routes MUST
return stable, intentional success and error states rather than exposing implementation
details.

### IV. Least-Privilege Security and Privacy
Administrative operations MUST require authenticated, authorized server-side access.
Secrets MUST remain server-only and MUST be supplied through environment configuration;
development fallbacks MUST NOT be accepted in production. Cookies carrying sessions
MUST use appropriate HTTP-only, same-site, and secure settings for the deployment
environment. Customer and order data MUST be collected and exposed only as required
for the current workflow.

### V. Verified, Incremental Delivery
Every behavior change MUST have a focused verification path: unit tests for pure
domain logic, integration tests for persistence or cross-context contracts, and
route-level or end-to-end coverage when a user journey is affected. A change MUST
pass the applicable test suite, type checking, linting, and build checks before it is
considered complete. New complexity MUST be justified by a concrete product or domain
need, and deferred capabilities MUST remain outside the MVP until their use case is
defined.

## Additional Constraints

- The product is a Spanish-language football-jersey e-commerce application for
	customers in Colombia, with guest checkout as the default buying path.
- The implementation MUST remain compatible with the established stack: Next.js App
	Router, TypeScript, Prisma, PostgreSQL/Supabase, Tailwind CSS, and Zustand where
	client persistence is required.
- Monetary values MUST use integer Colombian-peso amounts; floating-point arithmetic
	MUST NOT be used for prices or order totals.
- MVP payment flows MAY use a mock provider, but payment behavior MUST be isolated
	behind a provider boundary so a real gateway can be added without rewriting checkout.
- Catalog media MUST use the existing product-image storage abstraction when available;
	external image URLs MUST NOT become an implicit permanent dependency.
- Inventory and order lifecycle transitions MUST be explicit and idempotent where a
	retry could otherwise duplicate a reservation, sale, or status change.

## Development Workflow

- Every feature specification MUST state independently testable user stories,
	acceptance scenarios, edge cases, measurable success criteria, and assumptions.
- Every implementation plan MUST include a Constitution Check before research and
	again after design, documenting any justified exception in Complexity Tracking.
- Tasks MUST be dependency-ordered, grouped by user story, and reference exact project
	paths. Tests are mandatory whenever the feature changes business rules, persistence,
	security, or a user-facing workflow.
- Reviews MUST check domain ownership, data integrity, authorization, validation,
	test coverage, and regressions in checkout, inventory, and order lifecycle behavior.
- Documentation MUST be updated when an architectural decision, public workflow, data
	contract, or operational command changes.

## Governance

This constitution is the governing quality and architecture contract for the project.
When another document conflicts with it, the conflict MUST be resolved in favor of
this constitution or recorded as an explicit amendment. Amendments require a proposed
text change, a rationale, an impact review of source code and Speckit templates, and
an updated Sync Impact Report. Each amendment MUST bump the version using semantic
versioning: MAJOR for incompatible principle changes or removals, MINOR for new or
materially expanded principles or sections, and PATCH for clarifications or wording
refinements.

Every plan and review MUST verify compliance with the principles and record justified
exceptions. The project owner or reviewer MUST complete the applicable test, type,
lint, and build gates before merging. Runtime project guidance is maintained in
`.github/copilot-instructions.md` and the current plan artifacts; those documents
MUST remain consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-09-02 | **Last Amended**: 2026-09-02
