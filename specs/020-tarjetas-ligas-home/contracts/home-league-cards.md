# UI contract: Home league cards

## Surface

`src/app/page.tsx`, sección con heading **Las grandes ligas**.

## Contract

For every league selected by `BIG_LEAGUE_SLUGS` and returned by `getLeagues`:

- Render exactly one complete visual card, including Serie A.
- Card destination is `/ligas/{slug}` and remains the only navigation contract.
- Visible content includes league name and product count/status.
- Logo area always exists. It contains the local logo with preserved proportions or
  a neutral accessible fallback when unavailable/unloadable.
- The internal URL is not visible as card content.
- Shared card structure and responsive grid apply at mobile and desktop widths.

## Accessibility contract

- Logo images have non-empty, league-specific alt text.
- Fallback has an accessible label/name and is not the sole carrier of league
  identity; name and count remain visible.
- The card link has a discernible accessible name from its visible content.
- Keyboard focus and hover states remain visible without changing layout.

## Non-contracts

This feature does not change catalog filtering, league landing routes, repository
queries, inventory, pricing, or the global navigation.
