# UI and Local State Contract

## Size guide

**Entry point:** product detail exposes an accessible control with visible invitation such as `¿No sabes qué talla eres?`.

**Input contract:** exactly two values, `heightCm` and `weightKg`, numeric and labeled `cm`/`kg`. Empty, non-numeric, zero, negative and implausible values return field-level Spanish errors. No alternate units are required.

**Result contract:** typed result with status, primary size, optional alternative, availability, explanation and optional garment measurements. It states that it is an orientation, not a fit guarantee. Missing table, unavailable size, unsupported Player size or ambiguous match produces an actionable warning and leaves purchase usable.

**Selection contract:** applying a recommended size changes only product detail size selection when a matching available variant exists. It must not set version, customization, quantity or delivery mode implicitly.

**Accessibility contract:** dialog has title/description, keyboard-close behavior, focus management from Radix Dialog, `aria-invalid`/described errors and a live region for the recommendation. Icon-only controls have accessible names and pressed state.

## Favorites

**Local record:** `{ productId, slug, savedAt }`. Storage key/version is implementation detail but must be namespaced and independently recoverable.

**Operations:** `isFavorite(productId)`, `toggleFavorite(reference)`, `removeFavorite(productId)`, ordered list and optional `clearFavorites()`. Toggle/remove are idempotent from the user perspective.

**Surfaces:** product card, product detail, header access and `/favoritos`. A card control must stop link activation when toggled. Confirmation uses the existing toast pattern.

## Recently viewed

**Local record:** `{ productId, slug, lastViewedAt }`; maximum 12 unique products, newest first.

**Operations:** `recordViewed(reference)`, `removeViewed(productId)`, `clearViewed()`, ordered list. Record occurs after an active detail is loaded.

## Hydration and failure contract

Local records are references only. UI resolves current name, image, price and availability through existing catalog data paths. Missing/inactive records render as unavailable or can be removed without rejecting the rest. Read, parse, migration and write failures are caught per store; fallback memory state is allowed for the current session. No local data is sent to Prisma, admin routes, analytics or other customers.
