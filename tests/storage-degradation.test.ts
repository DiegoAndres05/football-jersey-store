import assert from "node:assert/strict";
import test from "node:test";
import { readSafe, writeSafe } from "../src/shared/stores/safe-storage";
test("safe storage falls back when browser storage is unavailable", () => { assert.deepEqual(readSafe("missing", [], (value) => Array.isArray(value) ? value : null), []); assert.equal(writeSafe("key", []), false); });