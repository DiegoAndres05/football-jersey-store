# Contract: public origin

**Env:** `NEXT_PUBLIC_SITE_URL`  
**No:** `NEXTAUTH_URL`, hardcoded hostname, fallback silencioso en production.

## Production (`NODE_ENV=production`)

| Input | Result |
|---|---|
| unset / empty | throw |
| `http://example.com` | throw (HTTP inválido) |
| `https://localhost` / `127.0.0.1` | throw |
| `https://shop.example/path` | throw (path no vacío) |
| `https://shop.example/` | `https://shop.example` |
| `https://shop.example` | `https://shop.example` |

Consumers MUST use the helper: `layout` `metadataBase`, `robots.ts`, `sitemap.ts`, JSON-LD, Open Graph `url`.

Local `next build` without a valid HTTPS origin MUST fail. Set the env in CI/hosting.

## Development

Missing URL MAY resolve to `http://localhost:3000`.
