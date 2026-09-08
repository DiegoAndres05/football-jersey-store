import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  planReservationCancellations,
  shouldReleaseReservations,
} from "@/features/orders/repositories/inventory-plan";

function netStock(movements: { quantity: number }[]): number {
  return movements.reduce((sum, m) => sum + m.quantity, 0);
}

describe("TEST 1: REJECTED restores a single-unit reservation", () => {
  it("PENDING_PAYMENT + REJECTED → PAYMENT_FAILED path + RESERVATION -1 → CANCELLATION +1", () => {
    assert.equal(
      shouldReleaseReservations({
        currentStatus: "PENDING_PAYMENT",
        outcome: "REJECTED",
        existingCancellationCount: 0,
      }),
      true,
    );

    const reservation = { variantId: "v1", quantity: -1 };
    const cancellations = planReservationCancellations([reservation]);
    assert.deepEqual(cancellations, [{ variantId: "v1", quantity: 1 }]);
    assert.equal(netStock([reservation, ...cancellations]), 0);
  });
});

describe("TEST 2: REJECTED with quantity 3", () => {
  it("RESERVATION -3 → CANCELLATION +3", () => {
    const reservation = { variantId: "v1", quantity: -3 };
    const cancellations = planReservationCancellations([reservation]);
    assert.deepEqual(cancellations, [{ variantId: "v1", quantity: 3 }]);
    assert.equal(netStock([reservation, ...cancellations]), 0);
  });
});

describe("TEST 3: several variants each get exact compensation", () => {
  it("compensa por variante sin mezclar cantidades", () => {
    const reservations = [
      { variantId: "va", quantity: -2 },
      { variantId: "vb", quantity: -1 },
      { variantId: "vc", quantity: -5 },
    ];
    const cancellations = planReservationCancellations(reservations);
    const byVariant = new Map(cancellations.map((c) => [c.variantId, c.quantity]));
    assert.equal(byVariant.get("va"), 2);
    assert.equal(byVariant.get("vb"), 1);
    assert.equal(byVariant.get("vc"), 5);
    assert.equal(cancellations.length, 3);
    assert.equal(netStock([...reservations, ...cancellations]), 0);
  });

  it("agrupa dos líneas de la misma variante", () => {
    const reservations = [
      { variantId: "va", quantity: -1 },
      { variantId: "va", quantity: -2 },
    ];
    const cancellations = planReservationCancellations(reservations);
    assert.deepEqual(cancellations, [{ variantId: "va", quantity: 3 }]);
  });
});

describe("TEST 4: REJECTED processed twice → one CANCELLATION", () => {
  it("segunda pasada no libera si ya hay CANCELLATION", () => {
    assert.equal(
      shouldReleaseReservations({
        currentStatus: "PENDING_PAYMENT",
        outcome: "REJECTED",
        existingCancellationCount: 1,
      }),
      false,
    );
  });
});

describe("TEST 5: webhook + reconcile concurrent → single release", () => {
  it("applyBoldPayment bloquea la orden y relee PENDING_PAYMENT dentro de la transacción", () => {
    const apply = readFileSync(
      join(process.cwd(), "src/features/orders/services/apply-bold-payment.ts"),
      "utf8",
    );
    assert.match(apply, /FOR UPDATE/);
    assert.match(apply, /current\.status !== "PENDING_PAYMENT"/);
    assert.match(apply, /existingCancellationCount/);
    assert.match(apply, /if \(!applied\)/);
  });
});

describe("TEST 6: already PAYMENT_FAILED → no CANCELLATION", () => {
  it("no libera si el estado ya no es PENDING_PAYMENT", () => {
    assert.equal(
      shouldReleaseReservations({
        currentStatus: "PAYMENT_FAILED",
        outcome: "REJECTED",
        existingCancellationCount: 0,
      }),
      false,
    );
  });
});

describe("TEST 7: APPROVED/PAID does not change inventory", () => {
  it("shouldReleaseReservations is false for APPROVED", () => {
    assert.equal(
      shouldReleaseReservations({
        currentStatus: "PENDING_PAYMENT",
        outcome: "APPROVED",
        existingCancellationCount: 0,
      }),
      false,
    );
  });

  it("applyBoldPayment only writes CANCELLATION inside outcome === REJECTED", () => {
    const apply = readFileSync(
      join(process.cwd(), "src/features/orders/services/apply-bold-payment.ts"),
      "utf8",
    );
    const rejectedBlock = apply.split('if (outcome === "REJECTED")')[1];
    assert.ok(rejectedBlock, "REJECTED inventory branch exists");
    assert.match(rejectedBlock, /CANCELLATION/);
    const approvedNotify = apply.split('if (toStatus === "PAID")')[1] ?? "";
    assert.doesNotMatch(approvedNotify.slice(0, 400), /CANCELLATION/);
    assert.doesNotMatch(apply, /type:\s*"SALE"/);
  });
});

describe("TEST 8: BAJO_PEDIDO without RESERVATION → no CANCELLATION", () => {
  it("plan vacío no genera movimientos", () => {
    assert.deepEqual(planReservationCancellations([]), []);
  });
});
