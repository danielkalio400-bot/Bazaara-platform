// Full-range display-referred preview analysis. This does not claim a calibrated
// broadcast/HDR pipeline. Rec.709 matrix: ITU-R BT.709-6, section 3.2–3.3.
// https://www.itu.int/rec/R-REC-BT.709
export function previewChroma(r: number, g: number, b: number) {
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return { y, cb: (b - y) / 1.8556, cr: (r - y) / 1.5748 };
}
export type ScopeData = {
  size: number;
  samples: number;
  histogram: Uint32Array[];
  waveform: Uint32Array;
  parade: Uint32Array[];
  vectorscope: Uint32Array;
  min: number;
  max: number;
  mean: number;
};
export function analyzeScopes(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  size = 128,
): ScopeData {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > 1_048_576 ||
    rgba.length !== width * height * 4 ||
    !Number.isInteger(size) ||
    size < 8 ||
    size > 256
  )
    throw Error("Invalid scope sample dimensions.");
  const data: ScopeData = {
    size,
    samples: 0,
    histogram: Array.from({ length: 3 }, () => new Uint32Array(256)),
    waveform: new Uint32Array(size * size),
    parade: Array.from({ length: 3 }, () => new Uint32Array(size * size)),
    vectorscope: new Uint32Array(size * size),
    min: 1,
    max: 0,
    mean: 0,
  };
  const bin = (value: number) =>
    Math.max(0, Math.min(size - 1, Math.round(value * (size - 1))));
  for (let pixel = 0; pixel < width * height; pixel++) {
    const offset = pixel * 4,
      alpha = rgba[offset + 3]! / 255;
    if (!alpha) continue;
    // The final preview is opaque. If handed a partial frame, measure visible
    // samples over black and ignore fully transparent hidden RGB values.
    const rgb = [rgba[offset]!, rgba[offset + 1]!, rgba[offset + 2]!].map(
      (value) => (value * alpha) / 255,
    );
    const { y, cb, cr } = previewChroma(rgb[0]!, rgb[1]!, rgb[2]!);
    const x = Math.min(size - 1, Math.floor(((pixel % width) * size) / width));
    data.waveform[bin(1 - y) * size + x]!++;
    data.vectorscope[bin(0.5 - cr) * size + bin(0.5 + cb)]!++;
    for (let channel = 0; channel < 3; channel++) {
      const value = rgb[channel]!;
      data.histogram[channel]![Math.round(value * 255)]!++;
      data.parade[channel]![bin(1 - value) * size + x]!++;
    }
    data.samples++;
    data.mean += y;
    data.min = Math.min(data.min, y);
    data.max = Math.max(data.max, y);
  }
  data.mean = data.samples ? data.mean / data.samples : 0;
  if (!data.samples) data.min = 0;
  return data;
}
