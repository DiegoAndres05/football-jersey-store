# Contract: JSON-LD

All `url` / `logo` absolute URLs use public origin.

## Organization (root layout)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Flashsport",
  "url": "{origin}",
  "logo": "{origin}/…",
  "contactPoint": { "email": "hola@flashsport.co", "availableLanguage": "Spanish" }
}
```

`logo` only if OG/global asset exists. MUST NOT invent `address`, `sameAs`, or `LocalBusiness`.

## Product (PDP)

- `@type: Product`
- `offers`: array of `@type: Offer` (one per variant), not a single min-price Offer
- Each offer: `sku`, `price` (integer COP as string), `priceCurrency: "COP"`, `availability` (`InStock` | `PreOrder` | `OutOfStock`), `url` (product URL), `seller` Organization Flashsport, `itemCondition` NewCondition
- No `priceValidUntil`, aggregateRating, review, MerchantReturnPolicy, ShippingDetails
- No empty Offer object if there are no variants

## BreadcrumbList

ItemListElement order and names MUST match visible breadcrumb links. Destinations are landing/catalog/product/home paths, never cart/account.
