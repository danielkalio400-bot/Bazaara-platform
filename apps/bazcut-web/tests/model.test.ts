import test from "node:test";
import assert from "node:assert/strict";
import {
  newProject,
  newClip,
  ticks,
  frameTicks,
  sourceTime,
  applyEdit,
  propertyAt,
  validateProject,
  parseCaptions,
  exportCaptions,
  unsupportedFeatures,
  TIMEBASE,
  type Asset,
} from "../studio/model.ts";
function fixture() {
  const p = newProject("Test");
  const a: Asset = {
    id: "asset",
    name: "original.mp4",
    kind: "video",
    mime: "video/mp4",
    size: 100,
    duration: ticks(20),
    width: 1280,
    height: 720,
    hash: "a".repeat(64),
    hasAudio: true,
    license: "Owned",
    tags: [],
    favorite: false,
  };
  p.assets = [a];
  const c = newClip(p.tracks[0]!.id, 0, a);
  c.duration = ticks(6);
  c.sourceIn = ticks(2);
  p.clips = [c];
  return { p, c, a };
}
test("temporary export files cannot become deletable project originals", () => {
  const { p, c } = fixture();
  const id = "export-rendered-file";
  p.assets[0]!.id = id;
  c.assetId = id;
  assert.throws(() => validateProject(p), /media manifest/);
});
test("timebase represents NTSC frames and both audio sample rates exactly", () => {
  assert.equal(TIMEBASE % 44100, 0);
  assert.equal(TIMEBASE % 48000, 0);
  for (const [num, den] of [
    [24, 1],
    [25, 1],
    [30000, 1001],
    [60000, 1001],
  ])
    assert.equal(Number.isInteger(frameTicks({ num: num!, den: den! })), true);
});
test("split preserves source continuity at non-unit speed", () => {
  const { p, c } = fixture();
  c.speed = { num: 2, den: 1 };
  const result = applyEdit(p, { type: "split", id: c.id, at: ticks(2) });
  assert.equal(result.clips.length, 2);
  assert.equal(result.clips[0]!.duration, ticks(2));
  assert.equal(result.clips[1]!.sourceIn, ticks(6));
  assert.equal(result.clips[1]!.start, ticks(2));
  assert.equal(c.duration, ticks(6));
});
test("reverse split preserves both source ranges", () => {
  const { p, c } = fixture();
  c.reverse = true;
  const result = applyEdit(p, { type: "split", id: c.id, at: ticks(2) });
  assert.equal(result.clips[0]!.sourceIn, ticks(6));
  assert.equal(result.clips[1]!.sourceIn, ticks(2));
  assert.equal(sourceTime(result.clips[1]!, ticks(1)), sourceTime(c, ticks(3)));
});
test("split retains nonlinear animation at every sampled time", () => {
  const { p, c } = fixture();
  c.keyframes = [
    {
      id: "a",
      at: 0,
      property: "x",
      value: 0,
      easing: "bezier",
      curve: [0.1, 0.8, 0.7, 0.2],
    },
    { id: "b", at: ticks(6), property: "x", value: 1, easing: "linear" },
  ];
  const result = applyEdit(p, { type: "split", id: c.id, at: ticks(2) });
  for (let i = 0; i < 12; i++) {
    const t = ticks(i / 2);
    const split = result.clips.find(
      (c) => t >= c.start && t < c.start + c.duration,
    )!;
    assert.ok(
      Math.abs(
        propertyAt(split, "x", t - split.start) - propertyAt(c, "x", t),
      ) < 1e-6,
    );
  }
});
test("ripple removes only timeline references and shifts the same track", () => {
  const { p, c, a } = fixture();
  const right = { ...structuredClone(c), id: "right", start: ticks(6) };
  p.clips.push(right);
  const result = applyEdit(p, { type: "delete", ids: [c.id], ripple: true });
  assert.equal(result.clips[0]!.start, 0);
  assert.deepEqual(result.assets, [a]);
});
test("locked linked clip rejects whole move transaction", () => {
  const { p, c } = fixture();
  c.linkId = "pair";
  p.tracks[1]!.locked = true;
  p.clips.push({
    ...structuredClone(c),
    id: "linked",
    trackId: p.tracks[1]!.id,
    kind: "audio",
  });
  assert.throws(
    () =>
      applyEdit(p, { type: "move", id: c.id, start: ticks(3), linked: true }),
    /Unlock/,
  );
  assert.equal(p.clips[0]!.start, 0);
});
test("invalid source trims are rejected without altering original", () => {
  const { p, c } = fixture();
  assert.throws(
    () => applyEdit(p, { type: "slip", id: c.id, delta: ticks(30) }),
    /source/,
  );
  assert.equal(c.sourceIn, ticks(2));
});
test("roll preserves program duration and contiguous boundaries", () => {
  const { p, c } = fixture();
  p.clips.push({
    ...structuredClone(c),
    id: "b",
    start: ticks(6),
    sourceIn: ticks(6),
  });
  const r = applyEdit(p, { type: "roll", id: c.id, delta: ticks(1) });
  assert.equal(r.clips[0]!.duration, ticks(7));
  assert.equal(r.clips[1]!.start, ticks(7));
  assert.equal(r.clips[1]!.sourceIn, ticks(7));
  assert.equal(r.clips[1]!.duration, ticks(5));
});
test("reverse roll preserves source position at the unchanged timeline origin", () => {
  const { p, c } = fixture();
  c.reverse = true;
  p.clips.push({
    ...structuredClone(c),
    id: "b",
    start: ticks(6),
    sourceIn: ticks(8),
  });
  const result = applyEdit(p, { type: "roll", id: c.id, delta: ticks(1) });
  assert.equal(sourceTime(result.clips[0]!, 0), sourceTime(c, 0));
  assert.equal(
    sourceTime(result.clips[1]!, ticks(1)),
    sourceTime(p.clips[1]!, ticks(2)),
  );
});
test("frozen reverse split keeps the exact same frozen source frame", () => {
  const { p, c } = fixture();
  c.freeze = true;
  c.reverse = true;
  const result = applyEdit(p, { type: "split", id: c.id, at: ticks(2) });
  assert.ok(result.clips.every((x) => sourceTime(x, ticks(1)) === c.sourceIn));
});
test("caption SRT and VTT roundtrips preserve timestamps", () => {
  const c = parseCaptions("1\n00:00:01,125 --> 00:00:03,750\nHello world\n");
  for (const format of ["srt", "vtt"] as const) {
    const result = parseCaptions(exportCaptions(c, format));
    assert.equal(result[0]!.start, ticks(1.125));
    assert.equal(result[0]!.end, ticks(3.75));
    assert.equal(result[0]!.text, "Hello world");
  }
  assert.throws(
    () => parseCaptions("00:00:05.000 --> 00:00:03.000\nBad"),
    /end/,
  );
});
test("future schemas reject; unknown effect extensions are preserved and export-gated", () => {
  const { p, c } = fixture();
  assert.throws(
    () => validateProject({ ...p, schemaVersion: 3 }),
    /Unsupported/,
  );
  c.extensions = { futureVfx: { depth: 20 } };
  const r = applyEdit(p, { type: "move", id: c.id, start: ticks(1) });
  assert.deepEqual(r.clips[0]!.extensions, c.extensions);
  assert.equal(unsupportedFeatures(r).length, 1);
});
test("reject malicious project dimensions, duplicate IDs and invalid mask", () => {
  const { p, c } = fixture();
  assert.throws(() => validateProject({ ...p, width: 2 ** 40 }), /dimensions/);
  assert.throws(() => validateProject({ ...p, clips: [c, c] }), /Duplicate/);
  assert.throws(
    () => validateProject({ ...p, clips: [{ ...c, mask: "arbitrary" }] }),
    /composition/,
  );
});
