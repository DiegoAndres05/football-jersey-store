# Payment confirmation and usage contract

`applyBoldPayment` remains the single payment resolution boundary.

1. Start a transaction and lock the order row.
2. If order is not `PENDING_PAYMENT`, return an idempotent no-op.
3. On `APPROVED`, transition order to `PAID`, set `paidAt`, and transition its
   `RESERVED` coupon usage to `CONFIRMED` in the same transaction.
4. On `REJECTED`, transition to `PAYMENT_FAILED`, release the `RESERVED` usage in
   the same transaction, and preserve the snapshot.
5. Repeated webhook/return/reconcile calls do not create another usage or history
   transition.

The order total and payment amount are the server-persisted snapshot values; the
provider callback never accepts a client-provided discount.
