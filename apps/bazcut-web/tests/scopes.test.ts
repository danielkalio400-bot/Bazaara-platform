import test from "node:test";
import assert from "node:assert/strict";
import { analyzeScopes, previewChroma } from "../studio/scopes.ts";

test("preview chroma separates primary colors and leaves neutral gray centered", () => {
  assert.deepEqual(previewChroma(0, 0, 0), { y: 0, cb: 0, cr: 0 });
  const white = previewChroma(1, 1, 1),
    gray = previewChroma(0.5, 0.5, 0.5);
  assert.ok(
    Math.abs(white.y - 1) < 1e-12 &&
      Math.abs(gray.cb) < 1e-12 &&
      Math.abs(gray.cr) < 1e-12,
  );
  const red = previewChroma(1, 0, 0),
    blue = previewChroma(0, 0, 1);
  assert.equal(red.y, 0.2126);
  assert.equal(blue.y, 0.0722);
  assert.equal(red.cr, 0.5);
  assert.equal(blue.cb, 0.5);
});
test("ramp histogram and waveform preserve levels and horizontal position", () => {
  const pixels = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) pixels.set([i, i, i, 255], i * 4);
  const data = analyzeScopes(pixels, 256, 1, 256);
  assert.equal(data.samples, 256);
  assert.equal(data.min, 0);
  assert.ok(
    Math.abs(data.max - 1) < 1e-12 && Math.abs(data.mean - 0.5) < 1e-12,
  );
  for (let i = 0; i < 256; i++) {
    assert.equal(data.histogram[0]![i], 1);
    assert.equal(data.waveform[(255 - i) * 256 + i], 1);
    for (const channel of data.parade)
      assert.equal(channel[(255 - i) * 256 + i], 1);
  }
});
test("scope samples ignore invisible RGB and bound hostile dimensions", () => {
  const data = analyzeScopes(
    new Uint8ClampedArray([255, 0, 0, 0, 0, 255, 0, 255]),
    2,
    1,
    8,
  );
  assert.equal(data.samples, 1);
  assert.equal(data.mean, 0.7152);
  assert.equal(data.histogram[0]![255], 0);
  assert.equal(data.histogram[1]![255], 1);
  assert.equal(data.parade[1]![4], 1);
  assert.throws(
    () => analyzeScopes(new Uint8ClampedArray(4), 2, 1),
    /dimensions/,
  );
  assert.throws(
    () => analyzeScopes(new Uint8ClampedArray(4), 1, 1, 99999),
    /dimensions/,
  );
  const empty = analyzeScopes(new Uint8ClampedArray(4), 1, 1);
  assert.deepEqual(
    [empty.samples, empty.min, empty.max, empty.mean],
    [0, 0, 0, 0],
  );
});
