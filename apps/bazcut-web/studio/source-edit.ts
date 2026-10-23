import {
  applyEdit,
  frameTicks,
  newClip,
  snapFrame,
  validateProject,
  type Project,
} from "./model.ts";

export function insertSourceRange(
  project: Project,
  assetId: string,
  trackId: string,
  sourceIn: number,
  sourceOut: number,
  at: number,
  mode: "insert" | "overwrite",
) {
  let p = structuredClone(project);
  const asset = p.assets.find((a) => a.id === assetId),
    track = p.tracks.find((t) => t.id === trackId);
  if (!asset || !track || track.locked)
    throw Error("Choose an available, unlocked destination track.");
  if ((asset.kind === "audio") !== (track.kind === "audio"))
    throw Error("Choose a compatible destination track.");
  const step = frameTicks(p.fps),
    start = snapFrame(at, p.fps);
  const input = snapFrame(sourceIn, p.fps),
    output = snapFrame(sourceOut, p.fps);
  if (
    output <= input ||
    output > Math.max(step, Math.floor(asset.duration / step) * step)
  )
    throw Error("Choose a valid source in/out range.");
  const duration = output - input,
    end = start + duration;
  for (const clip of p.clips.filter((c) => c.trackId === trackId)) {
    const affected =
      mode === "insert"
        ? clip.start + clip.duration > start
        : clip.start < end && clip.start + clip.duration > start;
    if (affected && clip.linkId)
      throw Error("Unlink affected clips before a single-track source edit.");
  }
  for (const boundary of mode === "insert" ? [start] : [start, end]) {
    for (const clip of [...p.clips]) {
      if (
        clip.trackId === trackId &&
        clip.start < boundary &&
        clip.start + clip.duration > boundary
      )
        p = applyEdit(p, { type: "split", id: clip.id, at: boundary });
    }
  }
  if (mode === "insert") {
    for (const clip of p.clips)
      if (clip.trackId === trackId && clip.start >= start)
        clip.start += duration;
  } else
    p.clips = p.clips.filter(
      (c) => c.trackId !== trackId || c.start < start || c.start >= end,
    );
  const clip = newClip(trackId, start, asset);
  clip.sourceIn = input;
  clip.duration = duration;
  p.clips.push(clip);
  return { project: validateProject(p), clipId: clip.id };
}
