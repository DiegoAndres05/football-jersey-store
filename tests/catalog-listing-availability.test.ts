import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  deriveListingAvailability,
  listingAvailabilityFromCardFlags,
} from "../src/features/products/domain/listing-availability.ts";

describe("deriveListingAvailability", () => {
  it("IN_STOCK when any variant has stock", () => {
    assert.equal(
      deriveListingAvailability([
        { stock: 0, allowsBackorder: true },
        { stock: 2, allowsBackorder: false },
      ]),
      "IN_STOCK",
    );
  });

  it("BACKORDER_ONLY when no stock but backorder exists", () => {
    assert.equal(
      deriveListingAvailability([{ stock: 0, allowsBackorder: true }]),
      "BACKORDER_ONLY",
    );
  });

  it("SOLD_OUT when no stock and no backorder", () => {
    assert.equal(
      deriveListingAvailability([{ stock: 0, allowsBackorder: false }]),
      "SOLD_OUT",
    );
    assert.equal(deriveListingAvailability([]), "SOLD_OUT");
  });
});

describe("listingAvailabilityFromCardFlags", () => {
  it("maps card flags", () => {
    assert.equal(
      listingAvailabilityFromCardFlags({ availability: "AVAILABLE", canBackorder: false }),
      "IN_STOCK",
    );
    assert.equal(
      listingAvailabilityFromCardFlags({ availability: "OUT_OF_STOCK", canBackorder: true }),
      "BACKORDER_ONLY",
    );
    assert.equal(
      listingAvailabilityFromCardFlags({ availability: "OUT_OF_STOCK", canBackorder: false }),
      "SOLD_OUT",
    );
  });
});

describe("ProductCard sold-out treatment (source)", () => {
  const src = readFileSync(
    join(process.cwd(), "src/features/products/components/product-card.tsx"),
    "utf8",
  );

  it("mutes only SOLD_OUT and keeps Link to /productos/", () => {
    assert.match(src, /listingAvailabilityFromCardFlags|SOLD_OUT|grayscale|opacity-/);
    assert.match(src, /href=\{`\/productos\/\$\{product\.slug\}`\}|href=\{"\/productos\/"/);
    assert.match(src, /\/productos\//);
    assert.match(src, /Bajo pedido/);
    assert.match(src, /Agotada/);
  });
});
