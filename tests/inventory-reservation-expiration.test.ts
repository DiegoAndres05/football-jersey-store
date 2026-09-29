import test from "node:test";
import assert from "node:assert/strict";
import { getInventoryReservationTtlMinutes } from "../src/features/orders/services/expiration-config";
import {
  planMissingReservationCancellations,
  planReservationCancellations,
} from "../src/features/orders/repositories/inventory-plan";

test("uses the default and validates reservation TTL", () => {
  assert.equal(getInventoryReservationTtlMinutes(undefined), 30);
  assert.equal(getInventoryReservationTtlMinutes("45"), 45);
  assert.equal(getInventoryReservationTtlMinutes("0"), 30);
  assert.equal(getInventoryReservationTtlMinutes("not-a-number"), 30);
});

test("compensates multiple variants exactly and does not duplicate existing rows", () => {
  const reservations = [
    { variantId: "v1", quantity: -2 },
    { variantId: "v1", quantity: -1 },
    { variantId: "v2", quantity: -4 },
  ];
  assert.deepEqual(planReservationCancellations(reservations), [
    { variantId: "v1", quantity: 3 },
    { variantId: "v2", quantity: 4 },
  ]);
  assert.deepEqual(planMissingReservationCancellations(reservations, [
    { variantId: "v1", quantity: 3 },
  ]), [{ variantId: "v2", quantity: 4 }]);
});
