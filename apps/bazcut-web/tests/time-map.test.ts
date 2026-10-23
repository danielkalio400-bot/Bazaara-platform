import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures.ts";
import {
  applyEdit,
  sourceTime,
  ticks,
  validateProject,
} from "../studio/model.ts";
import {
  TIME_MAP,
  mappedIntervals,
  mappedSpeed,
  timeMapOf,
} from "../studio/time-map.ts";
function remap() {
  const { p, c, a } = fixture();
  c.extensions = {
    [TIME_MAP]: {
      points: [
        { at: 0, source: ticks(8), easing: "hold" },
        { at: ticks(2), source: ticks(8), easing: "easeInOut" },
        { at: ticks(6), source: ticks(2), easing: "linear" },
      ],
    },
  };
  return { p, c, a };
}
test("time curves implement freezes and smooth reverse playback", () => {
  const { p, c } = remap();
  validateProject(p);
  assert.equal(sourceTime(c, ticks(1)), ticks(8));
  assert.equal(sourceTime(c, ticks(4)), ticks(5));
  assert.equal(mappedSpeed(timeMapOf(c)!, ticks(1)), 0);
  assert.equal(mappedSpeed(timeMapOf(c)!, ticks(4)), -2.25);
});
test("time curves preserve source samples through split, trim and slip", () => {
  const { p, c } = remap(),
    q = applyEdit(p, { type: "split", id: c.id, at: ticks(3) });
  assert.equal(sourceTime(q.clips[1]!, ticks(1)), sourceTime(c, ticks(4)));
  const t = applyEdit(p, {
    type: "trim",
    id: c.id,
    start: ticks(1),
    end: ticks(5),
  });
  assert.equal(sourceTime(t.clips[0]!, ticks(3)), sourceTime(c, ticks(4)));
  const slipped = applyEdit(p, { type: "slip", id: c.id, delta: ticks(1) });
  assert.equal(
    sourceTime(slipped.clips[0]!, ticks(4)),
    sourceTime(c, ticks(4)) + ticks(1),
  );
});
test("held jumps request only the source ranges that will be heard", () => {
  const map = {
    points: [
      { at: 0, source: 0, easing: "hold" as const },
      { at: ticks(1), source: ticks(1000), easing: "hold" as const },
      { at: ticks(2), source: ticks(1000), easing: "linear" as const },
    ],
  };
  const ranges = mappedIntervals(map, 0, ticks(2));
  assert.equal(ranges.length, 2);
  assert.equal(ranges[0]![1], 0);
  assert.equal(ranges[1]![0], ticks(1000));
});
test("invalid map extents and incompatible constant-speed edits reject", () => {
  const { p, c } = remap();
  assert.throws(
    () => applyEdit(p, { type: "speed", id: c.id, rate: { num: 2, den: 1 } }),
    /Clear time remapping/,
  );
  timeMapOf(c)!.points[0]!.source = ticks(21);
  assert.throws(() => validateProject(p), /source range/);
  timeMapOf(c)!.points[0]!.source = 0;
  timeMapOf(c)!.points[2]!.at = ticks(5);
  assert.throws(() => validateProject(p), /cover/);
});
