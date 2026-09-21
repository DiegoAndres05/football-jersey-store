# Public coupon validation contract

## Input

`validateCoupon({ code, lines, saleCurrency? })` is a server action/application
contract. `code` is trimmed, uppercased, and bounded (2–32 ASCII-friendly
characters). `lines` contains the same typed variant/customization/quantity data
used by checkout; client prices are ignored.

## Success

```ts
{
  ok: true,
  code: string,
  discountType: "PERCENTAGE" | "FIXED",
  discountAmount: number,
  eligibleBase: number,
  shippingFee: number,
  total: number,
  message: string
}
```

## Rejection

```ts
{
  ok: false,
  reason:
    | "INVALID_FORMAT" | "NOT_FOUND" | "INACTIVE" | "NOT_STARTED"
    | "EXPIRED" | "EXHAUSTED" | "NOT_APPLICABLE" | "INVALID_CART"
    | "TEMPORARILY_UNAVAILABLE",
  message: string
}
```

Messages are Spanish and user-safe. No database IDs, usage counts, stack traces, or
customer/order data are returned.
