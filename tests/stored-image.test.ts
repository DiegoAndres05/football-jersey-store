import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { asStoredImage } from "../src/features/products/services/image-storage.ts";

test("asStoredImage convierte AVIF a WebP para Supabase", async () => {
  const avif = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#2244aa" },
  })
    .avif()
    .toBuffer();

  const stored = await asStoredImage(avif, "image/avif");

  assert.equal(stored.contentType, "image/webp");
  assert.equal(stored.extension, "webp");
  assert.equal(stored.buffer.subarray(0, 4).toString("ascii"), "RIFF");
});
