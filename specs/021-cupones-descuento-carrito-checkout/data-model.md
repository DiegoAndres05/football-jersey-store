# Data model

## Coupon

Owned by `features/coupons`. Fields: `id`, normalized unique `code`, `discountType`
(`PERCENTAGE` or `FIXED`), integer `value`, `startsAt`, optional `endsAt`,
optional non-negative integer `maxUses`, `isActive`, `createdAt`, `updatedAt`.
Validate `1..100` for percentage, positive fixed values, `endsAt > startsAt`, and
`maxUses >= 1` when present. Deactivation is soft state, never deletion of history.

## CouponUsage

Auditable usage record with `id`, `couponId`, `orderId` (unique per order/coupon),
state (`RESERVED`, `CONFIRMED`, `RELEASED`), `reservedAt`, `expiresAt`,
`confirmedAt`, `releasedAt`, and release reason. Foreign keys to coupon/order are
restrictive for historical records. Index `(couponId, state, expiresAt)` supports
availability and cleanup.

State transitions:

```text
RESERVED --approved payment--> CONFIRMED
RESERVED --reject/cancel/expiry--> RELEASED
CONFIRMED --anything--> CONFIRMED
RELEASED --anything--> RELEASED
```

## Order coupon snapshot

Prefer typed nullable fields on `Order` (or a one-to-one immutable
`OrderCouponSnapshot` if schema conventions require normalization):
`couponCodeSnapshot`, `couponDiscountTypeSnapshot`, `couponValueSnapshot`,
`couponEligibleBase`, `couponDiscountAmount`, and `couponAppliedAt`.
`couponUsageId` links the reservation for audit but rendering must use snapshots.
For no coupon, all snapshot fields are null and totals retain the existing
undiscounted semantics.

## Existing entities affected

- `Order.subtotal` remains product plus customization subtotal.
- `Order.shippingFee` remains outside the discount base.
- `Order.total` becomes `subtotal + shippingFee - couponDiscountAmount`.
- `OrderItem` remains the immutable product/customization/price snapshot.
- `InventoryMovement` reservation lifecycle is unchanged.

## Integrity rules

1. Normalize codes before lookup and persist only normalized codes.
2. Never trust client subtotal, discount, or total; re-read variants and coupon in
   the order transaction.
3. Lock coupon row before deciding available usage; lock order row before payment
   resolution.
4. At most one usage row per order/coupon; confirmation/release updates require the
   expected prior state.
5. Snapshot fields are write-once after order creation; admin edits affect only
   future orders.
