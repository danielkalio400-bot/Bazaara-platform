import { fadeAt, propertyAt, type Clip, type Project } from "./model.ts";

export const EFFECTS = "bazcut.effects.v1",
  PARENT = "bazcut.parent.v1";
export const effectTypes = {
  brightness: { label: "Brightness", min: 0, max: 4, initial: 1 },
  contrast: { label: "Contrast", min: 0, max: 4, initial: 1 },
  saturation: { label: "Saturation", min: 0, max: 4, initial: 1 },
  hue: { label: "Hue", min: -180, max: 180, initial: 0 },
  blur: { label: "Blur", min: 0, max: 100, initial: 0 },
  grayscale: { label: "Grayscale", min: 0, max: 1, initial: 1 },
  sepia: { label: "Sepia", min: 0, max: 1, initial: 1 },
  invert: { label: "Invert", min: 0, max: 1, initial: 1 },
};
export type Easing = "linear" | "hold" | "easeInOut";
export type Effect = {
  id: string;
  type: keyof typeof effectTypes;
  enabled: boolean;
  amount: number;
  keyframes: { at: number; value: number; easing: Easing }[];
};
export type Parenting = { id: string; inheritOpacity: boolean };
export const effectsOf = (clip: Clip) =>
  (clip.extensions?.[EFFECTS] ?? []) as Effect[];
export const parentOf = (clip: Clip) =>
  clip.extensions?.[PARENT] as Parenting | undefined;
export function setExtension(clip: Clip, name: string, value: unknown) {
  const extensions = { ...clip.extensions };
  if (value === undefined) delete extensions[name];
  else extensions[name] = value;
  return {
    extensions: Object.keys(extensions).length ? extensions : undefined,
  };
}
export function validateMotion(project: Project) {
  for (const clip of project.clips) {
    if (
      clip.extensions !== undefined &&
      (!clip.extensions ||
        typeof clip.extensions !== "object" ||
        Array.isArray(clip.extensions))
    )
      throw Error("Invalid clip extensions.");
    if (clip.extensions && EFFECTS in clip.extensions) {
      const effects = effectsOf(clip),
        ids = new Set<string>();
      if (!Array.isArray(clip.extensions[EFFECTS]) || effects.length > 64)
        throw Error("Invalid effect stack.");
      for (const effect of effects) {
        const spec =
          effect && Object.hasOwn(effectTypes, effect.type)
            ? effectTypes[effect.type]
            : undefined;
        if (
          !spec ||
          typeof effect.id !== "string" ||
          !/^[a-zA-Z0-9-]{1,80}$/.test(effect.id) ||
          ids.has(effect.id) ||
          typeof effect.enabled !== "boolean" ||
          !Number.isFinite(effect.amount) ||
          effect.amount < spec.min ||
          effect.amount > spec.max ||
          !Array.isArray(effect.keyframes) ||
          effect.keyframes.length > 1000
        )
          throw Error("Invalid effect parameters.");
        ids.add(effect.id);
        const times = new Set<number>();
        for (const k of effect.keyframes) {
          if (
            !Number.isSafeInteger(k.at) ||
            k.at < 0 ||
            times.has(k.at) ||
            !Number.isFinite(k.value) ||
            k.value < spec.min ||
            k.value > spec.max ||
            !["linear", "hold", "easeInOut"].includes(k.easing)
          )
            throw Error("Invalid effect keyframe.");
          times.add(k.at);
        }
      }
    }
    if (clip.extensions && PARENT in clip.extensions) {
      const link = parentOf(clip),
        parent = project.clips.find((c) => c.id === link?.id);
      if (
        !link ||
        typeof link.inheritOpacity !== "boolean" ||
        !parent ||
        parent.kind === "audio" ||
        clip.kind === "audio"
      )
        throw Error("Choose an existing visual parent.");
      const visited = new Set([clip.id]);
      let next: Clip | undefined = parent;
      while (next) {
        if (visited.has(next.id) || visited.size > 32)
          throw Error(
            "Parenting must be acyclic and no deeper than 32 layers.",
          );
        visited.add(next.id);
        next = project.clips.find((c) => c.id === parentOf(next!)?.id);
      }
    }
  }
}
export function effectAmount(effect: Effect, at: number) {
  const keys = [...effect.keyframes].sort((a, b) => a.at - b.at);
  if (!keys.length) return effect.amount;
  if (at <= keys[0]!.at) return keys[0]!.value;
  const i = keys.findIndex((k) => k.at > at);
  if (i < 0) return keys[keys.length - 1]!.value;
  const a = keys[i - 1]!,
    b = keys[i]!;
  let t = (at - a.at) / (b.at - a.at);
  if (a.easing === "hold") t = 0;
  else if (a.easing === "easeInOut") t = t * t * (3 - 2 * t);
  return a.value + (b.value - a.value) * t;
}
export function effectFilter(clip: Clip, local: number) {
  return effectsOf(clip)
    .filter((e) => e.enabled)
    .map((e) => {
      const value = effectAmount(e, local + (clip.animationOffset ?? 0));
      const name =
        e.type === "saturation"
          ? "saturate"
          : e.type === "hue"
            ? "hue-rotate"
            : e.type;
      return `${name}(${value}${e.type === "hue" ? "deg" : e.type === "blur" ? "px" : ""})`;
    })
    .join(" ");
}
type Matrix = [number, number, number, number, number, number];
function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
export function worldTransform(project: Project, clip: Clip, time: number) {
  const chain: Clip[] = [clip];
  let next = parentOf(clip);
  while (next) {
    const parent = project.clips.find((c) => c.id === next!.id);
    if (!parent || chain.some((c) => c.id === parent.id) || chain.length >= 33)
      throw Error("Invalid parenting chain.");
    chain.unshift(parent);
    next = parentOf(parent);
  }
  let matrix: Matrix = [1, 0, 0, 1, project.width / 2, project.height / 2];
  let opacity = 1;
  for (const item of chain) {
    const local = time - item.start,
      angle = (propertyAt(item, "rotation", local) * Math.PI) / 180;
    const scale = propertyAt(item, "scale", local),
      sx = item.mirror ? -scale : scale;
    matrix = multiply(matrix, [
      Math.cos(angle) * sx,
      Math.sin(angle) * sx,
      -Math.sin(angle) * scale,
      Math.cos(angle) * scale,
      propertyAt(item, "x", local) * project.width,
      propertyAt(item, "y", local) * project.height,
    ]);
    if (!parentOf(item)?.inheritOpacity) opacity = 1;
    opacity *= Math.max(
      0,
      Math.min(1, propertyAt(item, "opacity", local) * fadeAt(item, local)),
    );
  }
  return { matrix, opacity };
}
