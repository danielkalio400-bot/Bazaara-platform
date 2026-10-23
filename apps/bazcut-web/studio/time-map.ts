import type { Clip, Project } from "./model.ts";
import type { Easing } from "./motion.ts";
export const TIME_MAP = "bazcut.time.v1";
export type TimePoint = { at: number; source: number; easing: Easing };
export type TimeMap = { points: TimePoint[] };
export const timeMapOf = (clip: Clip) =>
  clip.extensions?.[TIME_MAP] as TimeMap | undefined;
function segment(map: TimeMap, at: number) {
  const i = map.points.findIndex((p) => p.at > at);
  return i > 0 ? ([map.points[i - 1]!, map.points[i]!] as const) : null;
}
export function mappedTime(map: TimeMap, at: number): number {
  const pair = segment(map, at);
  if (!pair)
    return at <= map.points[0]!.at
      ? map.points[0]!.source
      : map.points[map.points.length - 1]!.source;
  const [a, b] = pair;
  let t = (at - a.at) / (b.at - a.at);
  if (a.easing === "hold") t = 0;
  else if (a.easing === "easeInOut") t = t * t * (3 - 2 * t);
  return a.source + (b.source - a.source) * t;
}
export function mappedSpeed(map: TimeMap, at: number) {
  const pair = segment(map, at);
  if (!pair || pair[0].easing === "hold") return 0;
  const [a, b] = pair,
    t = (at - a.at) / (b.at - a.at);
  return (
    ((b.source - a.source) / (b.at - a.at)) *
    (a.easing === "easeInOut" ? 6 * t * (1 - t) : 1)
  );
}
/** Decode disjoint source ranges separately; a held jump must not decode the intervening source. */
export function mappedIntervals(
  map: TimeMap,
  from: number,
  to: number,
): [number, number][] {
  const boundaries = [
    from,
    ...map.points.filter((p) => p.at > from && p.at < to).map((p) => p.at),
    to,
  ];
  if (boundaries.length > 66)
    throw Error("Too many time-map jumps in one audio block.");
  const ranges: [number, number][] = [];
  for (let i = 1; i < boundaries.length; i++) {
    const a = mappedTime(map, boundaries[i - 1]!),
      b = mappedTime(map, Math.max(boundaries[i - 1]!, boundaries[i]! - 1));
    ranges.push([Math.min(a, b), Math.max(a, b)]);
  }
  ranges.push([mappedTime(map, to), mappedTime(map, to)]);
  const merged: [number, number][] = [];
  for (const range of ranges.sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1] + 1) last[1] = Math.max(last[1], range[1]);
    else merged.push(range);
  }
  return merged;
}
export function validateTimeMaps(project: Project) {
  for (const clip of project.clips) {
    if (!clip.extensions || !(TIME_MAP in clip.extensions)) continue;
    const map = timeMapOf(clip),
      asset = project.assets.find((a) => a.id === clip.assetId);
    if (
      !asset ||
      !["video", "audio"].includes(asset.kind) ||
      !map ||
      !Array.isArray(map.points) ||
      map.points.length < 2 ||
      map.points.length > 1000
    )
      throw Error(
        "Time remapping requires a video or audio source and 2–1000 points.",
      );
    for (let i = 0; i < map.points.length; i++) {
      const point = map.points[i]!,
        previous = map.points[i - 1];
      if (
        !point ||
        !Number.isSafeInteger(point.at) ||
        point.at < 0 ||
        !Number.isSafeInteger(point.source) ||
        point.source < 0 ||
        point.source >= asset.duration ||
        !["linear", "hold", "easeInOut"].includes(point.easing) ||
        (previous && point.at <= previous.at)
      )
        throw Error("Invalid time-remapping point or source range.");
      if (
        previous &&
        previous.easing !== "hold" &&
        (Math.abs(point.source - previous.source) / (point.at - previous.at)) *
          (previous.easing === "easeInOut" ? 1.5 : 1) >
          16.000001
      )
        throw Error("Time-remapping speed cannot exceed 16×.");
    }
    const offset = clip.animationOffset ?? 0;
    if (
      map.points[0]!.at > offset ||
      map.points[map.points.length - 1]!.at < offset + clip.duration
    )
      throw Error("Time-remapping curve must cover the clip duration.");
  }
}
