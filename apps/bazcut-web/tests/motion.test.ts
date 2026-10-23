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
import {
  EFFECTS,
  PARENT,
  effectFilter,
  worldTransform,
} from "../studio/motion.ts";
test("ordered effect animation survives a split and remains exportable", () => {
  const { p, c } = fixture();
  c.extensions = {
    [EFFECTS]: [
      {
        id: "dark",
        type: "brightness",
        enabled: true,
        amount: 1,
        keyframes: [
          { at: 0, value: 0, easing: "easeInOut" },
          { at: ticks(6), value: 2, easing: "linear" },
        ],
      },
      { id: "invert", type: "invert", enabled: true, amount: 1, keyframes: [] },
    ],
  };
  validateProject(p);
  assert.deepEqual(unsupportedFeatures(p), []);
  const q = applyEdit(p, { type: "split", id: c.id, at: ticks(2) }),
    right = q.clips[1]!;
  assert.equal(effectFilter(right, ticks(1)), effectFilter(c, ticks(3)));
  assert.match(effectFilter(c, 0), /^brightness\(0\) invert\(1\)$/);
});
test("parent transforms compose with optional inherited opacity", () => {
  const { p, c } = fixture();
  const parent = newClip(c.trackId, 0, undefined, "shape");
  parent.x = 0.25;
  parent.rotation = 90;
  parent.scale = 2;
  parent.opacity = 0.5;
  c.x = 0.1;
  c.opacity = 0.8;
  c.extensions = { [PARENT]: { id: parent.id, inheritOpacity: true } };
  p.clips.push(parent);
  validateProject(p);
  const result = worldTransform(p, c, 0);
  assert.ok(Math.abs(result.matrix[4] - p.width * 0.75) < 1e-6);
  assert.ok(Math.abs(result.matrix[5] - (p.height / 2 + p.width * 0.2)) < 1e-6);
  assert.equal(result.opacity, 0.4);
  c.extensions[PARENT] = { id: parent.id, inheritOpacity: false };
  assert.equal(worldTransform(p, c, 0).opacity, 0.8);
});
test("invalid effects and cyclic parents reject the whole edit", () => {
  const { p, c } = fixture();
  c.extensions = { [PARENT]: { id: c.id, inheritOpacity: true } };
  assert.throws(() => validateProject(p), /acyclic/);
  c.extensions = {
    [EFFECTS]: [
      { id: "bad", type: "blur", amount: 101, enabled: true, keyframes: [] },
    ],
  };
  assert.throws(() => validateProject(p), /parameters/);
});
