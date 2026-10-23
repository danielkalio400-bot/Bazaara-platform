import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures.ts";
import {
  applyEdit,
  newClip,
  ticks,
  validateProject,
  unsupportedFeatures,
} from "../studio/model.ts";
import { MATTE, matteCoverage, matteOf } from "../studio/matte.ts";

test("alpha and luma matte coverage includes transparency and inversion", () => {
  assert.equal(matteCoverage(0, 0, 0, 255, "alpha"), 255);
  assert.equal(matteCoverage(0, 0, 0, 255, "luma"), 0);
  assert.equal(matteCoverage(255, 255, 255, 128, "luma"), 128);
  assert.equal(matteCoverage(255, 0, 0, 255, "luma"), 54);
  for (const mode of ["alpha-inverted", "luma-inverted"] as const) {
    assert.equal(matteCoverage(255, 255, 255, 0, mode), 255);
    assert.equal(matteCoverage(255, 255, 255, 255, mode), 0);
  }
});

test("mattes survive clip splitting and reject dangling or cyclic references", () => {
  const { p, c } = fixture();
  const mask = newClip(c.trackId, 0, undefined, "shape");
  p.clips.push(mask);
  c.extensions = { [MATTE]: { id: mask.id, mode: "luma", hideSource: true } };
  validateProject(p);
  assert.deepEqual(unsupportedFeatures(p), []);
  const split = applyEdit(p, { type: "split", id: c.id, at: ticks(1) });
  assert.equal(
    split.clips.filter((clip) => matteOf(clip)?.id === mask.id).length,
    2,
  );
  assert.throws(
    () => applyEdit(p, { type: "delete", ids: [mask.id] }),
    /matte source/,
  );
  mask.extensions = { [MATTE]: { id: c.id, mode: "alpha", hideSource: false } };
  assert.throws(() => validateProject(p), /acyclic/);
  mask.extensions = undefined;
  c.extensions[MATTE] = { id: "missing", mode: "alpha", hideSource: true };
  assert.throws(() => validateProject(p), /matte source/);
});

test("matte dependencies have a bounded render depth and reject unsupported modes", () => {
  const { p, c } = fixture();
  let previous = c;
  for (let i = 0; i < 8; i++) {
    const source = newClip(c.trackId, 0, undefined, "shape");
    previous.extensions = {
      [MATTE]: { id: source.id, mode: "alpha", hideSource: true },
    };
    p.clips.push(source);
    previous = source;
  }
  validateProject(p);
  const extra = newClip(c.trackId, 0, undefined, "shape");
  p.clips.push(extra);
  previous.extensions = {
    [MATTE]: { id: extra.id, mode: "alpha", hideSource: true },
  };
  assert.throws(() => validateProject(p), /8 layers/);
  previous.extensions = undefined;
  c.extensions![MATTE] = {
    id: extra.id,
    mode: "unsupported",
    hideSource: true,
  };
  assert.throws(() => validateProject(p), /supported mode/);
});
