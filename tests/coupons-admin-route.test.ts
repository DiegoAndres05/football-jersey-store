import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const ACTION = "src/app/admin/(dashboard)/cupones/actions.ts";
const PAGE = "src/app/admin/(dashboard)/cupones/page.tsx";
const SERVER_ACTION = "src/features/coupons/server/coupon-actions.ts";

test("coupon admin route delegates every mutation to server actions", () => {
  const action = readFileSync(ACTION, "utf8");
  const page = readFileSync(PAGE, "utf8");
  const serverAction = readFileSync(SERVER_ACTION, "utf8");
  assert.match(action, /createCouponAction|createCoupon/);
  assert.match(action, /toggleCouponAction|toggleCoupon/);
  assert.match(page, /listCoupons/);
  assert.match(serverAction, /No autorizado/);
});
