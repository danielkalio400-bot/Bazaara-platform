import { useEffect, useRef, useState, type RefObject } from "react";
import { analyzeScopes, previewChroma, type ScopeData } from "./scopes";

const modes = {
  histogram: "RGB histogram",
  waveform: "Luma waveform",
  parade: "RGB parade",
  vectorscope: "Vectorscope",
};
type Mode = keyof typeof modes;
const colors = [
  [252, 106, 114],
  [93, 217, 153],
  [102, 140, 255],
];
function paint(
  ctx: CanvasRenderingContext2D,
  data: ScopeData,
  mode: Mode,
  scratch: HTMLCanvasElement,
) {
  const left = 30,
    top = 14,
    width = 280,
    height = 154;
  ctx.clearRect(0, 0, 320, 194);
  ctx.fillStyle = "#090e18";
  ctx.fillRect(0, 0, 320, 194);
  ctx.font = "10px system-ui, sans-serif";
  ctx.lineWidth = 1;
  function line(x1: number, y1: number, x2: number, y2: number) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function density(
    grid: Uint32Array,
    color: number[],
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const s = scratch.getContext("2d")!;
    const pixels = s.createImageData(data.size, data.size);
    let max = 1;
    for (const count of grid) max = Math.max(max, count);
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      pixels.data.set(color, i * 4);
      pixels.data[i * 4 + 3] =
        64 + (191 * Math.log1p(grid[i]!)) / Math.log1p(max);
    }
    s.putImageData(pixels, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(scratch, x, y, w, h);
  }
  if (mode === "vectorscope") {
    const side = 150,
      x = 85,
      y = 20;
    ctx.strokeStyle = "#293447";
    for (const radius of [side / 4, side / 2]) {
      ctx.beginPath();
      ctx.arc(x + side / 2, y + side / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    line(x, y + side / 2, x + side, y + side / 2);
    line(x + side / 2, y, x + side / 2, y + side);
    density(data.vectorscope, [93, 217, 153], x, y, side, side);
    const targets = [
      { label: "R", rgb: [0.75, 0, 0] },
      { label: "Mg", rgb: [0.75, 0, 0.75] },
      { label: "B", rgb: [0, 0, 0.75] },
      { label: "Cy", rgb: [0, 0.75, 0.75] },
      { label: "G", rgb: [0, 0.75, 0] },
      { label: "Yl", rgb: [0.75, 0.75, 0] },
    ];
    ctx.fillStyle = "#b1bed0";
    ctx.strokeStyle = "#67758b";
    for (const target of targets) {
      const { cb, cr } = previewChroma(
        target.rgb[0]!,
        target.rgb[1]!,
        target.rgb[2]!,
      );
      const tx = x + (0.5 + cb) * side,
        ty = y + (0.5 - cr) * side;
      ctx.strokeRect(tx - 3, ty - 3, 6, 6);
      ctx.fillText(target.label, tx + 5, ty - 4);
    }
    ctx.textAlign = "center";
    ctx.fillText("Cb →  ·  Cr ↑  ·  75% targets", 160, 187);
    ctx.textAlign = "left";
    return;
  }
  ctx.strokeStyle = "#263044";
  ctx.fillStyle = "#8c9bb2";
  for (const level of [0, 0.25, 0.5, 0.75, 1]) {
    const y = top + (1 - level) * height;
    line(left, y, left + width, y);
    if (mode !== "histogram")
      ctx.fillText(String(Math.round(level * 100)), 3, y + 3);
  }
  if (mode === "histogram") {
    let max = 1;
    for (const bins of data.histogram)
      for (const count of bins) max = Math.max(max, count);
    ctx.globalCompositeOperation = "screen";
    data.histogram.forEach((bins, channel) => {
      ctx.fillStyle = `rgb(${colors[channel]!.join(",")})`;
      for (let i = 0; i < bins.length; i++) {
        const h = (bins[i]! / max) * height;
        ctx.fillRect(
          left + (i * width) / 256,
          top + height - h,
          width / 256,
          h,
        );
      }
    });
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#8c9bb2";
    ctx.fillText("0", left, 187);
    ctx.fillText("128", left + width / 2 - 9, 187);
    ctx.fillText("255", left + width - 18, 187);
  } else if (mode === "waveform") {
    density(data.waveform, [93, 217, 153], left, top, width, height);
    ctx.fillText("Picture left", left, 187);
    ctx.fillText("Picture right", left + width - 62, 187);
  } else {
    data.parade.forEach((grid, i) => {
      const lane = width / 3;
      density(grid, colors[i]!, left + i * lane, top, lane - 3, height);
      ctx.fillStyle = `rgb(${colors[i]!.join(",")})`;
      ctx.fillText(["R", "G", "B"][i]!, left + i * lane + lane / 2 - 4, 187);
    });
  }
}
export function ColorScopes({
  canvas,
}: {
  canvas: RefObject<HTMLCanvasElement | null>;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("histogram");
  const [summary, setSummary] = useState("Waiting for a preview frame…");
  useEffect(() => {
    const sample = document.createElement("canvas"),
      scratch = document.createElement("canvas");
    scratch.width = scratch.height = 128;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    function update() {
      const source = canvas.current,
        ctx = ref.current?.getContext("2d");
      if (!source?.width || !source.height || !sampleContext || !ctx) return;
      try {
        const scale = Math.min(1, 320 / source.width, 180 / source.height);
        const width = Math.max(1, Math.round(source.width * scale)),
          height = Math.max(1, Math.round(source.height * scale));
        if (sample.width !== width) sample.width = width;
        if (sample.height !== height) sample.height = height;
        sampleContext.imageSmoothingEnabled = false;
        sampleContext.clearRect(0, 0, width, height);
        sampleContext.drawImage(source, 0, 0, width, height);
        const data = analyzeScopes(
          sampleContext.getImageData(0, 0, width, height).data,
          width,
          height,
        );
        paint(ctx, data, mode, scratch);
        setSummary(
          data.samples
            ? `Luma: min ${(data.min * 100).toFixed(1)}% · mean ${(data.mean * 100).toFixed(1)}% · max ${(data.max * 100).toFixed(1)}%`
            : "No visible pixels in this frame.",
        );
      } catch {
        setSummary("Scope unavailable for this frame.");
      }
    }
    update();
    // Independent of React frame updates so a playing timeline cannot repeatedly
    // cancel the pending measurement and leave the scopes frozen.
    const timer = window.setInterval(update, 200);
    return () => {
      clearInterval(timer);
      sample.width = sample.height = scratch.width = scratch.height = 0;
    };
  }, [canvas, mode]);
  return (
    <div className="bc-scope">
      <h3>Color scopes</h3>
      <label className="bc-field">
        <span>Color scope</span>
        <select
          aria-label="Color scope"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
        >
          {Object.entries(modes).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <canvas
        width={320}
        height={194}
        ref={ref}
        role="img"
        aria-label={`${modes[mode]} of the preview`}
      />
      <p className="bc-help" aria-label="Preview luma statistics">
        {summary}
      </p>
      <p className="bc-help">
        SDR sRGB preview · full range · Rec.709 luma weights. Sampled at up to
        320 × 180, five times per second.
      </p>
    </div>
  );
}
