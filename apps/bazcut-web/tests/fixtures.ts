import { newProject, newClip, ticks, type Asset } from "../studio/model.ts";
export function fixture() {
  const p = newProject("Editor test");
  const a: Asset = {
    id: "source",
    name: "original.webm",
    kind: "video",
    mime: "video/webm",
    size: 100,
    duration: ticks(20),
    width: 320,
    height: 180,
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
