import { EFFECTS, PARENT, validateMotion } from "./motion.ts";
import {
  TIME_MAP,
  mappedTime,
  timeMapOf,
  validateTimeMaps,
} from "./time-map.ts";
/** Integer ticks exactly represent 24/25/30/50/60 and NTSC rates, plus 44.1/48 kHz audio. */
export const TIMEBASE = 35_280_000;
export const SCHEMA = 2;
export type Rate = { num: number; den: number };
export type MediaKind = "video" | "audio" | "image";
export type Asset = {
  id: string;
  name: string;
  kind: MediaKind;
  mime: string;
  size: number;
  duration: number;
  width: number;
  height: number;
  hash: string;
  hasAudio: boolean;
  license: string;
  tags: string[];
  favorite: boolean;
  proxyOf?: string;
};
export type KeyProperty =
  "x" | "y" | "scale" | "rotation" | "opacity" | "volume";
export type Keyframe = {
  id: string;
  at: number;
  property: KeyProperty;
  value: number;
  easing: "linear" | "hold" | "easeInOut" | "bezier";
  curve?: [number, number, number, number];
};
export type Clip = {
  id: string;
  trackId: string;
  assetId?: string;
  name: string;
  kind: MediaKind | "text" | "shape";
  start: number;
  duration: number;
  sourceIn: number;
  speed: Rate;
  reverse: boolean;
  freeze: boolean;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  mirror: boolean;
  fit: "contain" | "cover";
  crop: [number, number, number, number];
  mask: "none" | "circle" | "rounded";
  blend: "source-over" | "screen" | "multiply" | "overlay";
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  volume: number;
  pan: number;
  fadeIn: number;
  fadeOut: number;
  text: string;
  fontSize: number;
  color: string;
  background: string;
  shape: "rectangle" | "ellipse";
  keyframes: Keyframe[];
  animationOffset?: number;
  animationDuration?: number;
  linkId?: string;
  extensions?: Record<string, unknown>;
};
export type Track = {
  id: string;
  name: string;
  kind: "visual" | "audio";
  locked: boolean;
  muted: boolean;
  hidden: boolean;
  volume: number;
};
export type Caption = {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: string;
};
export type Comment = {
  id: string;
  at: number;
  text: string;
  author: string;
  resolved: boolean;
  created: string;
};
export type Project = {
  schemaVersion: number;
  engineVersion: string;
  id: string;
  name: string;
  revision: number;
  parentRevision: number | null;
  created: string;
  updated: string;
  timebase: number;
  fps: Rate;
  width: number;
  height: number;
  background: string;
  sampleRate: number;
  colorSpace: "srgb";
  tracks: Track[];
  clips: Clip[];
  assets: Asset[];
  captions: Caption[];
  markers: { id: string; at: number; label: string }[];
  comments: Comment[];
  captionStyle: {
    size: number;
    color: string;
    background: string;
    position: number;
  };
  sync: {
    enabled: boolean;
    originals: boolean;
    region: null | "africa" | "europe";
    remoteRevision: string | null;
  };
  permissions: {
    cloudInference: boolean;
    training: boolean;
    publishing: boolean;
  };
  extensions?: Record<string, unknown>;
};
export const uid = () => crypto.randomUUID();
export const seconds = (ticks: number) => ticks / TIMEBASE;
export const ticks = (value: number) => Math.round(value * TIMEBASE);
export const fpsValue = (fps: Rate) => fps.num / fps.den;
export const frameTicks = (fps: Rate) => (TIMEBASE * fps.den) / fps.num;
export const snapFrame = (time: number, fps: Rate) =>
  Math.max(0, Math.round(time / frameTicks(fps)) * frameTicks(fps));
export const endOf = (p: Project) =>
  p.clips.reduce((n, c) => Math.max(n, c.start + c.duration), 0);
export function timecode(time: number, fps: Rate): string {
  const rate = Math.ceil(fpsValue(fps));
  const frame = Math.max(0, Math.round(time / frameTicks(fps)));
  return [
    Math.floor(frame / rate / 3600),
    Math.floor(frame / rate / 60) % 60,
    Math.floor(frame / rate) % 60,
    frame % rate,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
export function newProject(
  name = "Untitled project",
  aspect = "16:9",
): Project {
  const size = (
    {
      "16:9": [1920, 1080],
      "9:16": [1080, 1920],
      "1:1": [1080, 1080],
      "4:5": [1080, 1350],
    } as Record<string, number[]>
  )[aspect] ?? [1920, 1080];
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA,
    engineVersion: "2.0.0-dev.1",
    id: uid(),
    name,
    revision: 0,
    parentRevision: null,
    created: now,
    updated: now,
    timebase: TIMEBASE,
    fps: { num: 30, den: 1 },
    width: size[0]!,
    height: size[1]!,
    background: "#070a13",
    sampleRate: 48000,
    colorSpace: "srgb",
    tracks: [
      {
        id: uid(),
        name: "Video 1",
        kind: "visual",
        locked: false,
        muted: false,
        hidden: false,
        volume: 1,
      },
      {
        id: uid(),
        name: "Audio 1",
        kind: "audio",
        locked: false,
        muted: false,
        hidden: false,
        volume: 1,
      },
    ],
    clips: [],
    assets: [],
    captions: [],
    markers: [],
    comments: [],
    captionStyle: {
      size: 52,
      color: "#ffffff",
      background: "#101524",
      position: 0.89,
    },
    sync: {
      enabled: false,
      originals: false,
      region: null,
      remoteRevision: null,
    },
    permissions: { cloudInference: false, training: false, publishing: false },
  };
}
export function newClip(
  trackId: string,
  start: number,
  asset?: Asset,
  kind: Clip["kind"] = asset?.kind ?? "text",
): Clip {
  return {
    id: uid(),
    trackId,
    assetId: asset?.id,
    name: asset?.name ?? (kind === "text" ? "Your story starts here" : "Shape"),
    kind,
    start,
    duration: asset && asset.kind !== "image" ? asset.duration : ticks(5),
    sourceIn: 0,
    speed: { num: 1, den: 1 },
    reverse: false,
    freeze: false,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    opacity: 1,
    mirror: false,
    fit: "contain",
    crop: [0, 0, 0, 0],
    mask: "none",
    blend: "source-over",
    brightness: 1,
    contrast: 1,
    saturation: 1,
    hue: 0,
    blur: 0,
    volume: 1,
    pan: 0,
    fadeIn: 0,
    fadeOut: 0,
    text: kind === "text" ? "Your story starts here" : "",
    fontSize: 96,
    color: "#ffffff",
    background: "#2778ff",
    shape: "rectangle",
    keyframes: [],
  };
}
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);
const integer = (n: unknown): n is number =>
  finite(n) && Number.isSafeInteger(n) && n >= 0;
const color = (s: unknown) =>
  typeof s === "string" && /^#[0-9a-f]{6}$/i.test(s);
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function validateProject(value: unknown): Project {
  assert(value && typeof value === "object", "Project is not an object.");
  const p = value as Project;
  assert(
    p.schemaVersion === SCHEMA,
    `Unsupported project schema ${p.schemaVersion}. The original file was not changed.`,
  );
  assert(
    typeof p.id === "string" &&
      /^[a-zA-Z0-9-]{1,80}$/.test(p.id) &&
      typeof p.name === "string" &&
      p.name.length <= 200,
    "Invalid project identity.",
  );
  assert(
    integer(p.revision) && p.timebase === TIMEBASE,
    "Invalid revision or timebase.",
  );
  assert(
    p.fps &&
      integer(p.fps.num) &&
      integer(p.fps.den) &&
      p.fps.num > 0 &&
      p.fps.den > 0 &&
      Number.isSafeInteger(frameTicks(p.fps)) &&
      fpsValue(p.fps) <= 240,
    "Unsupported frame rate.",
  );
  assert(
    integer(p.width) &&
      integer(p.height) &&
      p.width >= 16 &&
      p.height >= 16 &&
      p.width <= 8192 &&
      p.height <= 8192 &&
      p.width % 2 === 0 &&
      p.height % 2 === 0,
    "Canvas dimensions must be even numbers from 16 to 8192.",
  );
  assert(
    color(p.background) &&
      p.colorSpace === "srgb" &&
      [44100, 48000].includes(p.sampleRate),
    "Unsupported color or audio format.",
  );
  for (const key of [
    "tracks",
    "clips",
    "assets",
    "captions",
    "markers",
    "comments",
  ] as const)
    assert(Array.isArray(p[key]), `Missing ${key}.`);
  for (const list of [
    p.tracks,
    p.clips,
    p.assets,
    p.captions,
    p.markers,
    p.comments,
  ])
    assert(
      new Set(list.map((x) => x.id)).size === list.length &&
        list.every(
          (x) => typeof x.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(x.id),
        ),
      "Duplicate or invalid object ID.",
    );
  for (const a of p.assets)
    assert(
      ["video", "audio", "image"].includes(a.kind) &&
        integer(a.duration) &&
        a.duration > 0 &&
        integer(a.size) &&
        a.size > 0 &&
        integer(a.width) &&
        integer(a.height) &&
        typeof a.hash === "string" &&
        /^[a-f0-9]{64}$/.test(a.hash) &&
        typeof a.name === "string",
      "Invalid media manifest.",
    );
  for (const t of p.tracks)
    assert(
      ["visual", "audio"].includes(t.kind) &&
        finite(t.volume) &&
        t.volume >= 0 &&
        t.volume <= 4,
      "Invalid track.",
    );
  for (const c of p.clips) {
    assert(
      p.tracks.some((t) => t.id === c.trackId),
      "A clip references a missing track.",
    );
    assert(
      integer(c.start) &&
        integer(c.duration) &&
        c.duration > 0 &&
        integer(c.sourceIn) &&
        Number.isSafeInteger(c.start + c.duration),
      "Invalid clip timing.",
    );
    assert(
      c.speed &&
        integer(c.speed.num) &&
        integer(c.speed.den) &&
        c.speed.num > 0 &&
        c.speed.den > 0 &&
        c.speed.num / c.speed.den >= 0.1 &&
        c.speed.num / c.speed.den <= 16,
      "Speed must be 0.1–16×.",
    );
    assert(
      ["video", "audio", "image", "text", "shape"].includes(c.kind),
      "Unsupported clip kind.",
    );
    if (c.assetId) {
      const a = p.assets.find((a) => a.id === c.assetId);
      assert(a, "Clip source is missing from the manifest.");
      if (a.kind !== "image" && !timeMapOf(c))
        assert(
          c.sourceIn +
            (c.freeze
              ? 1
              : Math.round((c.duration * c.speed.num) / c.speed.den)) <=
            a.duration + frameTicks(p.fps),
          "Trim extends beyond the source.",
        );
    } else
      assert(
        c.kind === "text" || c.kind === "shape",
        "Media clip has no source.",
      );
    for (const key of [
      "x",
      "y",
      "scale",
      "rotation",
      "opacity",
      "brightness",
      "contrast",
      "saturation",
      "hue",
      "blur",
      "volume",
      "pan",
      "fontSize",
    ] as const)
      assert(finite(c[key]), `Invalid ${key}.`);
    assert(
      c.scale > 0 &&
        c.scale <= 20 &&
        c.opacity >= 0 &&
        c.opacity <= 1 &&
        c.volume >= 0 &&
        c.volume <= 4 &&
        c.pan >= -1 &&
        c.pan <= 1 &&
        c.blur >= 0 &&
        c.blur <= 100,
      "Clip property outside supported bounds.",
    );
    assert(
      ["none", "circle", "rounded"].includes(c.mask) &&
        ["source-over", "screen", "multiply", "overlay"].includes(c.blend) &&
        ["contain", "cover"].includes(c.fit),
      "Unsupported composition operation.",
    );
    assert(
      color(c.color) &&
        color(c.background) &&
        typeof c.text === "string" &&
        c.text.length <= 10000,
      "Invalid typography.",
    );
    assert(
      Array.isArray(c.crop) &&
        c.crop.length === 4 &&
        c.crop.every((v) => finite(v) && v >= 0 && v < 1) &&
        c.crop[0] + c.crop[2] < 1 &&
        c.crop[1] + c.crop[3] < 1,
      "Crop removes the whole frame.",
    );
    assert(integer(c.fadeIn) && integer(c.fadeOut), "Invalid fades.");
    assert(Array.isArray(c.keyframes), "Missing keyframes.");
    assert(
      c.animationOffset === undefined ||
        Number.isSafeInteger(c.animationOffset),
      "Invalid animation offset.",
    );
    assert(
      c.animationDuration === undefined || integer(c.animationDuration),
      "Invalid animation duration.",
    );
    for (const k of c.keyframes)
      assert(
        integer(k.at) &&
          finite(k.value) &&
          ["x", "y", "scale", "rotation", "opacity", "volume"].includes(
            k.property,
          ) &&
          ["linear", "hold", "easeInOut", "bezier"].includes(k.easing) &&
          (!k.curve ||
            (k.curve.length === 4 &&
              k.curve.every(finite) &&
              k.curve[0] >= 0 &&
              k.curve[0] <= 1 &&
              k.curve[2] >= 0 &&
              k.curve[2] <= 1)),
        "Invalid keyframe.",
      );
  }
  for (const c of p.captions)
    assert(
      integer(c.start) &&
        integer(c.end) &&
        c.end > c.start &&
        typeof c.text === "string" &&
        c.text.length <= 10000,
      "Invalid caption.",
    );
  for (const m of p.markers)
    assert(integer(m.at) && typeof m.label === "string", "Invalid marker.");
  for (const c of p.comments)
    assert(
      integer(c.at) &&
        typeof c.text === "string" &&
        typeof c.author === "string",
      "Invalid comment.",
    );
  assert(
    p.captionStyle &&
      finite(p.captionStyle.size) &&
      p.captionStyle.size >= 8 &&
      p.captionStyle.size <= 300 &&
      finite(p.captionStyle.position) &&
      p.captionStyle.position >= 0 &&
      p.captionStyle.position <= 1 &&
      color(p.captionStyle.color) &&
      color(p.captionStyle.background),
    "Invalid caption styling.",
  );
  assert(p.sync && p.permissions, "Project privacy settings are missing.");
  validateMotion(p);
  validateTimeMaps(p);
  return p;
}
export function unsupportedFeatures(p: Project): string[] {
  const issues: string[] = [];
  if (p.extensions && Object.keys(p.extensions).length)
    issues.push("Project extension data");
  for (const c of p.clips)
    if (
      c.extensions &&
      Object.keys(c.extensions).some(
        (key) => ![EFFECTS, PARENT, TIME_MAP].includes(key),
      )
    )
      issues.push(`${c.name}: extension effects`);
  return issues;
}
export function sourceTime(c: Clip, local: number): number {
  const map = timeMapOf(c);
  if (map) return Math.round(mappedTime(map, local + (c.animationOffset ?? 0)));
  if (c.freeze) return c.sourceIn;
  const elapsed = Math.max(0, Math.min(local, c.duration));
  return Math.round(
    c.sourceIn +
      ((c.reverse ? Math.max(0, c.duration - elapsed - 1) : elapsed) *
        c.speed.num) /
        c.speed.den,
  );
}
function bezier(x: number, points: [number, number, number, number]) {
  const [x1, y1, x2, y2] = points;
  let lo = 0,
    hi = 1,
    t = x;
  const value = (a: number, b: number, v: number) =>
    3 * (1 - v) * (1 - v) * v * a + 3 * (1 - v) * v * v * b + v * v * v;
  for (let i = 0; i < 24; i++) {
    t = (lo + hi) / 2;
    if (value(x1, x2, t) < x) lo = t;
    else hi = t;
  }
  return value(y1, y2, t);
}
export function propertyAt(c: Clip, property: KeyProperty, at: number): number {
  at += c.animationOffset ?? 0;
  const frames = c.keyframes
    .filter((k) => k.property === property)
    .sort((a, b) => a.at - b.at);
  if (!frames.length) return c[property];
  const first = frames[0]!,
    last = frames[frames.length - 1]!;
  if (at <= first.at) return first.value;
  if (at >= last.at) return last.value;
  const j = frames.findIndex((k) => k.at > at),
    a = frames[j - 1]!,
    b = frames[j]!;
  let t = (at - a.at) / (b.at - a.at);
  if (a.easing === "hold") t = 0;
  else if (a.easing === "easeInOut") t = t * t * (3 - 2 * t);
  else if (a.easing === "bezier") t = bezier(t, a.curve ?? [0.42, 0, 0.58, 1]);
  return a.value + (b.value - a.value) * t;
}
export const fadeAt = (c: Clip, t: number) => {
  const elapsed = t + (c.animationOffset ?? 0),
    duration = c.animationDuration ?? c.duration;
  return Math.max(
    0,
    Math.min(
      1,
      c.fadeIn ? elapsed / c.fadeIn : 1,
      c.fadeOut ? (duration - elapsed) / c.fadeOut : 1,
    ),
  );
};

export type Edit =
  | { type: "split"; id: string; at: number }
  | { type: "delete"; ids: string[]; ripple?: boolean }
  | {
      type: "move";
      id: string;
      start: number;
      trackId?: string;
      linked?: boolean;
    }
  | { type: "trim"; id: string; start: number; end: number; ripple?: boolean }
  | { type: "slip"; id: string; delta: number }
  | { type: "roll"; id: string; delta: number }
  | { type: "slide"; id: string; delta: number }
  | { type: "duplicate"; id: string }
  | { type: "speed"; id: string; rate: Rate }
  | { type: "patch"; id: string; patch: Partial<Clip> };
export function applyEdit(project: Project, edit: Edit): Project {
  const p = structuredClone(project);
  const c = "id" in edit ? p.clips.find((c) => c.id === edit.id) : undefined;
  const unlocked = (clip: Clip) => {
    if (p.tracks.find((t) => t.id === clip.trackId)?.locked)
      throw Error("Unlock this track before editing.");
  };
  if ("id" in edit && !c) throw Error("Clip not found.");
  if (c) unlocked(c);
  if (
    c &&
    timeMapOf(c) &&
    (edit.type === "speed" ||
      (edit.type === "patch" &&
        ["speed", "reverse", "freeze"].some((key) => key in edit.patch)))
  )
    throw Error(
      "Clear time remapping before changing constant speed, reverse, or freeze.",
    );
  if (edit.type === "split" && c) {
    const at = snapFrame(edit.at, p.fps) - c.start;
    if (at <= 0 || at >= c.duration)
      throw Error("Place the playhead inside the clip.");
    const right = {
      ...structuredClone(c),
      id: uid(),
      start: c.start + at,
      duration: c.duration - at,
    };
    if (c.reverse && !c.freeze)
      c.sourceIn += Math.round(((c.duration - at) * c.speed.num) / c.speed.den);
    else if (!c.freeze)
      right.sourceIn += Math.round((at * c.speed.num) / c.speed.den);
    // Preserve the complete original curves and envelope, with an origin offset.
    // Truncating/re-fitting Beziers at the cut changes the motion on either side.
    c.animationDuration ??= c.duration;
    right.animationDuration = c.animationDuration;
    right.animationOffset = (c.animationOffset ?? 0) + at;
    c.duration = at;
    p.clips.push(right);
  } else if (edit.type === "delete") {
    const removed = p.clips.filter((c) => edit.ids.includes(c.id));
    removed.forEach(unlocked);
    if (edit.ripple)
      for (const target of [...removed].sort((a, b) => b.start - a.start))
        for (const x of p.clips)
          if (
            x.trackId === target.trackId &&
            !edit.ids.includes(x.id) &&
            x.start >= target.start + target.duration
          ) {
            unlocked(x);
            x.start -= target.duration;
          }
    p.clips = p.clips.filter((c) => !edit.ids.includes(c.id));
  } else if (edit.type === "move" && c) {
    const dest = p.tracks.find((t) => t.id === (edit.trackId ?? c.trackId));
    if (!dest || dest.locked)
      throw Error("Destination track is unavailable or locked.");
    if ((c.kind === "audio") !== (dest.kind === "audio"))
      throw Error("Choose a compatible track.");
    const delta = snapFrame(edit.start, p.fps) - c.start;
    for (const x of p.clips)
      if (x.id === c.id || (edit.linked && c.linkId && x.linkId === c.linkId)) {
        unlocked(x);
        x.start += delta;
        if (x.start < 0) throw Error("A linked clip would move before zero.");
      }
    c.trackId = dest.id;
  } else if (edit.type === "trim" && c) {
    const start = snapFrame(edit.start, p.fps),
      end = snapFrame(edit.end, p.fps),
      oldEnd = c.start + c.duration;
    if (end <= start) throw Error("Trim end must follow the start.");
    const leading = start - c.start,
      trailing = oldEnd - end;
    if (!c.freeze)
      c.sourceIn += Math.round(
        ((c.reverse ? trailing : leading) * c.speed.num) / c.speed.den,
      );
    c.animationDuration ??= c.duration;
    c.animationOffset = (c.animationOffset ?? 0) + leading;
    c.start = start;
    c.duration = end - start;
    if (edit.ripple)
      for (const x of p.clips)
        if (x.id !== c.id && x.trackId === c.trackId && x.start >= oldEnd) {
          unlocked(x);
          x.start += end - oldEnd;
        }
  } else if (edit.type === "slip" && c) {
    const map = timeMapOf(c);
    if (map) for (const point of map.points) point.source += edit.delta;
    else c.sourceIn += edit.delta;
  } else if (edit.type === "roll" && c) {
    const next = p.clips.find(
      (x) => x.trackId === c.trackId && x.start === c.start + c.duration,
    );
    if (!next) throw Error("Roll requires an adjacent next clip.");
    unlocked(next);
    c.animationDuration ??= c.duration;
    next.animationDuration ??= next.duration;
    next.animationOffset = (next.animationOffset ?? 0) + edit.delta;
    if (c.reverse && !c.freeze)
      c.sourceIn -= Math.round((edit.delta * c.speed.num) / c.speed.den);
    c.duration += edit.delta;
    next.start += edit.delta;
    next.duration -= edit.delta;
    if (!next.reverse && !next.freeze)
      next.sourceIn += Math.round(
        (edit.delta * next.speed.num) / next.speed.den,
      );
  } else if (edit.type === "slide" && c) {
    const prev = p.clips.find(
        (x) => x.trackId === c.trackId && x.start + x.duration === c.start,
      ),
      next = p.clips.find(
        (x) => x.trackId === c.trackId && x.start === c.start + c.duration,
      );
    if (!prev || !next)
      throw Error("Slide requires adjacent clips on both sides.");
    unlocked(prev);
    unlocked(next);
    prev.animationDuration ??= prev.duration;
    next.animationDuration ??= next.duration;
    next.animationOffset = (next.animationOffset ?? 0) + edit.delta;
    if (prev.reverse && !prev.freeze)
      prev.sourceIn -= Math.round(
        (edit.delta * prev.speed.num) / prev.speed.den,
      );
    prev.duration += edit.delta;
    c.start += edit.delta;
    next.start += edit.delta;
    next.duration -= edit.delta;
    if (!next.reverse && !next.freeze)
      next.sourceIn += Math.round(
        (edit.delta * next.speed.num) / next.speed.den,
      );
  } else if (edit.type === "duplicate" && c)
    p.clips.push({
      ...structuredClone(c),
      id: uid(),
      start: c.start + c.duration,
      linkId: undefined,
    });
  else if (edit.type === "speed" && c) {
    const length = (c.duration * c.speed.num) / c.speed.den;
    c.speed = edit.rate;
    c.duration = snapFrame((length * edit.rate.den) / edit.rate.num, p.fps);
  } else if (edit.type === "patch" && c) {
    const {
      id: ignoredId,
      trackId: ignoredTrack,
      assetId: ignoredAsset,
      ...patch
    } = edit.patch;
    Object.assign(c, patch);
  }
  return validateProject(p);
}

export function parseCaptions(raw: string): Caption[] {
  const parse = (s: string) => {
    const m = s.match(/^(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})$/);
    if (!m || Number(m[2]) > 59 || Number(m[3]) > 59)
      throw Error("Invalid subtitle timestamp.");
    return ticks(
      Number(m[1] ?? 0) * 3600 +
        Number(m[2]) * 60 +
        Number(m[3]) +
        Number(m[4]) / 1000,
    );
  };
  const blocks = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .replace(/^WEBVTT[^\n]*\n/, "")
    .split(/\n\s*\n/);
  return blocks.flatMap((block) => {
    const lines = block.trim().split("\n"),
      i = lines.findIndex((l) => l.includes("-->"));
    if (i < 0) return [];
    const pair = lines[i]!.split("-->"),
      start = parse(pair[0]!.trim()),
      end = parse(pair[1]!.trim().split(/\s/)[0]!);
    if (end <= start) throw Error("Caption end must follow start.");
    const text = lines
      .slice(i + 1)
      .join("\n")
      .replace(/<[^>]*>/g, "");
    return [{ id: uid(), start, end, text, speaker: "" }];
  });
}
export function exportCaptions(captions: Caption[], format: "srt" | "vtt") {
  const stamp = (n: number) => {
    const ms = Math.round(seconds(n) * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, "0")}:${String(Math.floor(ms / 60000) % 60).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}${format === "srt" ? "," : "."}${String(ms % 1000).padStart(3, "0")}`;
  };
  return (
    (format === "vtt" ? "WEBVTT\n\n" : "") +
    [...captions]
      .sort((a, b) => a.start - b.start)
      .map(
        (c, i) =>
          `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`,
      )
      .join("\n")
  );
}
