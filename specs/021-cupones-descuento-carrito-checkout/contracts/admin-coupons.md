# Admin coupon contract

All operations require an authenticated admin session and server-side authorization.

```ts
type CouponInput = {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: string;
  endsAt?: string | null;
  maxUses?: number | null;
  isActive: boolean;
};
```

Create/update validates with Zod, normalizes the code, and rejects duplicate codes,
invalid ranges, invalid date ordering, and invalid usage limits. Toggle changes only
`isActive`; it never mutates order snapshots or usage history.

Actions return `{ok:true, coupon}` or `{ok:false, reason, message}` with stable
Spanish messages. List/detail may show confirmed and reserved counts to admins only.
