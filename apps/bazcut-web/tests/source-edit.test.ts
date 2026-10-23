import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixtures.ts";
import { ticks, sourceTime, endOf } from "../studio/model.ts";
import { insertSourceRange } from "../studio/source-edit.ts";
test("source insert splits picture and ripples only the destination track", () => {
  const { p, c, a } = fixture();
  const { project: q, clipId } = insertSourceRange(
    p,
    a.id,
    c.trackId,
    ticks(3),
    ticks(5),
    ticks(2),
    "insert",
  );
  assert.equal(q.clips.length, 3);
  assert.equal(endOf(q), ticks(8));
  const inserted = q.clips.find((x) => x.id === clipId)!;
  assert.equal(inserted.sourceIn, ticks(3));
  assert.equal(inserted.duration, ticks(2));
  const tail = q.clips.find((x) => x.start === ticks(4))!;
  assert.equal(sourceTime(tail, ticks(1)), sourceTime(c, ticks(3)));
  assert.equal(p.clips.length, 1);
});
test("source overwrite preserves both outside ranges and program duration", () => {
  const { p, c, a } = fixture();
  const { project: q } = insertSourceRange(
    p,
    a.id,
    c.trackId,
    ticks(8),
    ticks(10),
    ticks(2),
    "overwrite",
  );
  assert.equal(q.clips.length, 3);
  assert.equal(endOf(q), ticks(6));
  assert.equal(
    sourceTime(
      q.clips.find((x) => x.start === ticks(4))!,
      ticks(1),
    ),
    sourceTime(c, ticks(5)),
  );
});
test("source edit rejects locks, incompatible tracks, broken ranges and linked ripple", () => {
  const { p, c, a } = fixture();
  const edit = () =>
    insertSourceRange(p, a.id, c.trackId, 0, ticks(1), 0, "insert");
  p.tracks[0]!.locked = true;
  assert.throws(edit, /unlocked/);
  p.tracks[0]!.locked = false;
  c.linkId = "linked";
  assert.throws(edit, /Unlink/);
  delete c.linkId;
  assert.throws(
    () => insertSourceRange(p, a.id, p.tracks[1]!.id, 0, ticks(1), 0, "insert"),
    /compatible/,
  );
  assert.throws(
    () => insertSourceRange(p, a.id, c.trackId, 0, ticks(21), 0, "insert"),
    /range/,
  );
});
