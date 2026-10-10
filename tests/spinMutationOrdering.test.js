import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("zero-win Pay releases the mutation lock before Spin returns to ready", () => {
  const source = fs.readFileSync(
    new URL("../src/controllers/spinActions.js", import.meta.url),
    "utf8",
  );
  const awaitedPay = source.search(/await frameApi\s*\.pay\(\{ idCard: result\.idCard/);
  const ready = source.indexOf('setStatus("ready");', awaitedPay);

  assert.notEqual(awaitedPay, -1, "zero-win Pay must be awaited");
  assert.notEqual(ready, -1, "Spin must eventually return to ready");
  assert.ok(awaitedPay < ready, "Pay must finish before the UI accepts another Spin");
  assert.doesNotMatch(
    source,
    /frameApi\s*\.pay\(\{ idCard: result\.idCard[\s\S]*?\)\s*\.catch\(\(\) => \{\}\)/,
    "zero-win Pay must not remain fire-and-forget",
  );
});