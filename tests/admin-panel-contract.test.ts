import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

test("admin shell keeps the protected navigation contract", () => {
  const layout = read("src/app/admin/(dashboard)/layout.tsx");
  assert.match(layout, /getSessionUser/);
  assert.match(layout, /redirect\("\/admin\/login"\)/);
  assert.match(layout, /AdminBreadcrumbs/);
  assert.match(layout, /logoutAction/);
});

test("order filters and detail preserve URL context", () => {
  const list = read("src/app/admin/(dashboard)/pedidos/page.tsx");
  const detail = read("src/app/admin/(dashboard)/pedidos/[id]/page.tsx");
  assert.match(list, /modalidad/);
  assert.match(list, /getTelegramConfig/);
  assert.match(detail, /backHref/);
  assert.match(detail, /couponSnapshot/);
});

test("dashboard and inventory use bounded projections", () => {
  const dashboard = read("src/features/orders/repositories/admin-dashboard-repository.ts");
  const inventory = read("src/features/inventory/server/admin-inventory-projection.ts");
  assert.match(dashboard, /30/);
  assert.match(dashboard, /Promise\.all/);
  assert.match(inventory, /inventoryMovement\.groupBy/);
  assert.match(inventory, /allowsBackorder/);
});

test("admin UI does not expose Telegram secrets", () => {
  const detail = read("src/app/admin/(dashboard)/pedidos/[id]/page.tsx");
  assert.doesNotMatch(detail, /TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID/);
});
