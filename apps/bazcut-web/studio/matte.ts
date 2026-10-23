import type { Clip, Project } from "./model.ts";

export const MATTE = "bazcut.matte.v1";
export const matteModes = {
  alpha: "Alpha",
  "alpha-inverted": "Inverted alpha",
  luma: "Luma",
  "luma-inverted": "Inverted luma",
} as const;
export type Matte = {
  id: string;
  mode: keyof typeof matteModes;
  hideSource: boolean;
};
export const matteOf = (clip: Clip) =>
  clip.extensions?.[MATTE] as Matte | undefined;

export function validateMattes(project: Project) {
  const clips = new Map(project.clips.map((clip) => [clip.id, clip]));
  for (const clip of project.clips) {
    if (!clip.extensions || !(MATTE in clip.extensions)) continue;
    const matte = matteOf(clip);
    const source = clips.get(matte?.id ?? "");
    if (
      !matte ||
      !Object.hasOwn(matteModes, matte.mode) ||
      typeof matte.hideSource !== "boolean" ||
      !source ||
      source.kind === "audio" ||
      clip.kind === "audio"
    )
      throw Error(
        "Choose an existing visual matte source and a supported mode.",
      );
    const visited = new Set([clip.id]);
    let next: Clip | undefined = source;
    while (next) {
      if (visited.has(next.id) || visited.size > 8)
        throw Error("Mattes must be acyclic and no deeper than 8 layers.");
      visited.add(next.id);
      next = clips.get(matteOf(next)?.id ?? "");
    }
  }
}

/** SDR Rec.709 luma, multiplied by source alpha before optional inversion. */
export function matteCoverage(
  r: number,
  g: number,
  b: number,
  alpha: number,
  mode: Matte["mode"],
) {
  const coverage = mode.startsWith("luma")
    ? ((0.2126 * r + 0.7152 * g + 0.0722 * b) * alpha) / 255
    : alpha;
  return Math.round(mode.endsWith("inverted") ? 255 - coverage : coverage);
}
