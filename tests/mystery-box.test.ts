import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  formatPurchaseLineDetail,
  mysteryBoxTier,
} from "../src/features/products/domain/mystery-box";

test("mystery box tiers map fan, player, and retro", () => {
  assert.deepEqual(mysteryBoxTier("fan"), { slug: "fan", level: "Básica", quality: "Fan" });
  assert.deepEqual(mysteryBoxTier("player"), { slug: "player", level: "Estándar", quality: "Player" });
  assert.deepEqual(mysteryBoxTier("retro"), { slug: "retro", level: "Premium", quality: "Retro" });
  assert.equal(mysteryBoxTier("training"), null);
});

test("mystery box purchase line hides the team and keeps quality and size", () => {
  const detail = formatPurchaseLineDetail({
    lineKind: "MYSTERY_BOX",
    teamName: "Interno",
    versionName: "Retro",
    sizeName: "M",
  });
  assert.equal(detail, "Premium · Retro · Talla M");
  assert.equal(detail.includes("Interno"), false);
});

test("jersey purchase line still shows the team", () => {
  assert.equal(
    formatPurchaseLineDetail({
      lineKind: "JERSEY",
      teamName: "Real Madrid",
      versionName: "Fan",
      sizeName: "L",
      quantity: 2,
    }),
    "Real Madrid · Fan · Talla L · x2",
  );
});

test("public surfaces link the mystery box to its section", () => {
  const nav = readFileSync("src/components/layout/nav-links.tsx", "utf8");
  const homepage = readFileSync("src/app/page.tsx", "utf8");
  const card = readFileSync("src/features/products/components/product-card.tsx", "utf8");
  const slugPage = readFileSync("src/app/productos/[slug]/page.tsx", "utf8");
  const orderRepo = readFileSync("src/features/orders/repositories/order-repository.ts", "utf8");

  assert.doesNotMatch(nav, /Caja misteriosa/);
  assert.match(homepage, /href="\/caja-misteriosa"/);
  assert.match(homepage, /Caja misteriosa/);
  assert.match(card, /MYSTERY_BOX/);
  assert.match(card, /\/caja-misteriosa/);
  assert.match(slugPage, /redirect\("\/caja-misteriosa"\)/);
  assert.match(orderRepo, /lineKind: isBox \? "MYSTERY_BOX" : "JERSEY"/);
  assert.match(orderRepo, /teamName: isBox \? "" : variant\.product\.team\.name/);
});
