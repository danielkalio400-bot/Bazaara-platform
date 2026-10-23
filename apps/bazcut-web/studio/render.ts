import { worldTransform } from "./motion";
import { timeMapOf } from "./time-map";
import {
  Input,
  ALL_FORMATS,
  BlobSource,
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  AudioBufferSource,
  canEncodeVideo,
  canEncodeAudio,
  type VideoCodec,
} from "mediabunny";
import {
  type Project,
  type Clip,
  endOf,
  frameTicks,
  fpsValue,
  seconds,
  propertyAt,
  sourceTime,
  fadeAt,
  unsupportedFeatures,
  validateProject,
} from "./model";
import { MediaPool, mixAudio, clipFilter } from "./media";

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}
export async function drawFrame(
  canvas: HTMLCanvasElement,
  p: Project,
  pool: MediaPool,
  time: number,
  options: { captions?: boolean; guides?: boolean } = {},
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw Error("Canvas rendering is unavailable.");
  const w = p.width,
    h = p.height;
  ctx.save();
  try {
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.fillStyle = p.background;
    ctx.fillRect(0, 0, w, h);
    for (const track of p.tracks) {
      if (track.kind !== "visual" || track.hidden) continue;
      for (const c of p.clips.filter(
        (c) =>
          c.trackId === track.id &&
          c.start <= time &&
          c.start + c.duration > time,
      )) {
        const local = time - c.start;
        ctx.save();
        try {
          const world = worldTransform(p, c, time);
          ctx.globalAlpha = world.opacity;
          ctx.globalCompositeOperation = c.blend;
          ctx.transform(...world.matrix);
          ctx.filter = clipFilter(c, local);
          if (c.mask === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, Math.min(w, h) / 2, 0, 2 * Math.PI);
            ctx.clip();
          }
          if (c.mask === "rounded") {
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.12);
            ctx.clip();
          }
          if (c.kind === "text") {
            ctx.font = `700 ${c.fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = c.color;
            const lines = wrap(ctx, c.text, w * 0.85);
            ctx.shadowColor = "#00000080";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;
            lines.forEach((line, i) =>
              ctx.fillText(
                line,
                0,
                (i - (lines.length - 1) / 2) * c.fontSize * 1.22,
                w * 0.94,
              ),
            );
          } else if (c.kind === "shape") {
            ctx.fillStyle = c.background;
            ctx.beginPath();
            if (c.shape === "ellipse")
              ctx.ellipse(0, 0, w * 0.25, h * 0.25, 0, 0, Math.PI * 2);
            else ctx.roundRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.5, 24);
            ctx.fill();
          } else if (c.assetId) {
            const asset = p.assets.find((a) => a.id === c.assetId);
            if (!asset) throw Error("Source manifest is missing.");
            const image = await pool.frame(asset, sourceTime(c, local));
            if (!image) throw Error(`No decoded frame for ${asset.name}.`);
            const [top, right, bottom, left] = c.crop,
              sw = asset.width * (1 - left - right),
              sh = asset.height * (1 - top - bottom),
              ratio =
                c.fit === "cover"
                  ? Math.max(w / sw, h / sh)
                  : Math.min(w / sw, h / sh);
            ctx.drawImage(
              image,
              asset.width * left,
              asset.height * top,
              sw,
              sh,
              (-sw * ratio) / 2,
              (-sh * ratio) / 2,
              sw * ratio,
              sh * ratio,
            );
          }
        } finally {
          ctx.restore();
        }
      }
    }
    if (options.captions !== false) {
      const captions = p.captions.filter(
        (c) => c.start <= time && c.end > time,
      );
      ctx.font = `700 ${p.captionStyle.size}px ui-sans-serif, system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = captions.flatMap((c) => wrap(ctx, c.text, w * 0.88));
      lines.forEach((line, i) => {
        const size = p.captionStyle.size,
          y =
            h * p.captionStyle.position +
            (i - (lines.length - 1) / 2) * size * 1.3,
          width = Math.min(w * 0.94, ctx.measureText(line).width + size * 0.6);
        ctx.fillStyle = p.captionStyle.background;
        ctx.fillRect(w / 2 - width / 2, y - size * 0.65, width, size * 1.3);
        ctx.fillStyle = p.captionStyle.color;
        ctx.fillText(line, w / 2, y, w * 0.9);
      });
    }
    if (options.guides) {
      ctx.strokeStyle = "#ffffff65";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      ctx.setLineDash([]);
    }
  } finally {
    ctx.restore();
  }
}
export type ExportSettings = {
  container: "mp4" | "webm";
  codec: VideoCodec;
  bitrate: number;
  width: number;
  height: number;
  captions: boolean;
};
export type Progress = {
  stage: "checking" | "rendering" | "finalizing" | "verifying" | "complete";
  completed: number;
  total: number;
  percent: number;
};
export async function capabilities(p: Project) {
  const results = await Promise.all(
    (["avc", "hevc", "av1", "vp9"] as const).map(async (codec) => ({
      codec,
      supported: await canEncodeVideo(codec, {
        width: p.width,
        height: p.height,
        frameRate: fpsValue(p.fps),
        bitrate: 8_000_000,
      }),
    })),
  );
  const audio = {
    aac: await canEncodeAudio("aac", {
      sampleRate: p.sampleRate,
      numberOfChannels: 2,
      bitrate: 192000,
    }),
    opus: await canEncodeAudio("opus", {
      sampleRate: p.sampleRate,
      numberOfChannels: 2,
      bitrate: 192000,
    }),
  };
  return { video: results, audio };
}
export async function renderProject(
  project: Project,
  settings: ExportSettings,
  signal: AbortSignal,
  onProgress: (p: Progress) => void,
): Promise<{ blob: Blob; frames: number; duration: number; audio: boolean }> {
  validateProject(project);
  const unsupported = unsupportedFeatures(project);
  if (unsupported.length)
    throw Error(
      `Export blocked to preserve unsupported data: ${unsupported.join(", ")}.`,
    );
  const p = structuredClone(project);
  p.width = settings.width;
  p.height = settings.height;
  validateProject(p);
  if (!p.clips.length || endOf(p) <= 0)
    throw Error("Add at least one clip before exporting.");
  if (
    p.assets.some((a) => a.proxyOf && p.clips.some((c) => c.assetId === a.id))
  )
    throw Error(
      "Replace proxy references with original media before final export.",
    );
  const abort = () => {
    if (signal.aborted)
      throw new DOMException("Export cancelled.", "AbortError");
  };
  abort();
  const total = Math.ceil(endOf(p) / frameTicks(p.fps)),
    fps = fpsValue(p.fps),
    duration = total / fps;
  const stage = (s: Progress["stage"], completed: number, percent: number) =>
    onProgress({ stage: s, completed, total, percent });
  stage("checking", 0, 0);
  if (
    !(await canEncodeVideo(settings.codec, {
      width: p.width,
      height: p.height,
      frameRate: fps,
      bitrate: settings.bitrate,
    }))
  )
    throw Error(
      "The selected codec, dimensions or frame rate are not supported on this device.",
    );
  if (settings.container === "webm" && !["vp9", "av1"].includes(settings.codec))
    throw Error("Choose VP9 or AV1 for WebM.");
  if (
    settings.container === "mp4" &&
    !["avc", "hevc", "av1"].includes(settings.codec)
  )
    throw Error("Choose H.264, HEVC or AV1 for MP4.");
  const audio = p.clips.some(
    (c) =>
      (!c.freeze || !!timeMapOf(c)) &&
      (c.volume > 0 ||
        c.keyframes.some((k) => k.property === "volume" && k.value > 0)) &&
      !p.tracks.find((t) => t.id === c.trackId)?.muted &&
      p.assets.find((a) => a.id === c.assetId)?.hasAudio,
  );
  const audioCodec = settings.container === "mp4" ? "aac" : "opus";
  if (
    audio &&
    !(await canEncodeAudio(audioCodec, {
      numberOfChannels: 2,
      sampleRate: p.sampleRate,
      bitrate: 192000,
    }))
  )
    throw Error(
      `This device cannot encode ${audioCodec.toUpperCase()} audio. Choose another container.`,
    );
  // BufferTarget is deliberately bounded; large renders require a streaming native renderer.
  if ((duration * (settings.bitrate + 192000)) / 8 > 512 * 1024 * 1024)
    throw Error(
      "Estimated output exceeds the 512 MB in-memory encoder limit. Reduce bitrate/duration or use a streaming native renderer when available.",
    );
  const pool = new MediaPool(),
    canvas = document.createElement("canvas");
  canvas.width = p.width;
  canvas.height = p.height;
  const output = new Output({
    format:
      settings.container === "mp4"
        ? new Mp4OutputFormat({ fastStart: "in-memory" })
        : new WebMOutputFormat(),
    target: new BufferTarget(),
  });
  const video = new CanvasSource(canvas, {
    codec: settings.codec,
    bitrate: settings.bitrate,
  });
  output.addVideoTrack(video, { frameRate: fps });
  const audioSource = audio
    ? new AudioBufferSource({ codec: audioCodec, bitrate: 192000 })
    : undefined;
  if (audioSource) output.addAudioTrack(audioSource);
  try {
    // Probe every original before starting any encoder, including audio-only clips.
    for (const id of new Set(p.clips.map((c) => c.assetId).filter(Boolean))) {
      const asset = p.assets.find((a) => a.id === id)!;
      await pool.source(asset);
      abort();
    }
    await output.start();
    let sample = 0;
    for (let frame = 0; frame < total; frame++) {
      abort();
      await drawFrame(canvas, p, pool, Math.round(frame * frameTicks(p.fps)), {
        captions: settings.captions,
      });
      abort();
      await video.add(frame / fps, 1 / fps);
      if (audioSource) {
        const next = Math.round(((frame + 1) / fps) * p.sampleRate);
        if (next > sample) {
          const mixed = await mixAudio(p, pool, sample, next - sample, signal);
          await audioSource.add(mixed);
          sample = next;
        }
      }
      stage("rendering", frame + 1, ((frame + 1) / total) * 94);
      if (frame % 8 === 0)
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    abort();
    stage("finalizing", total, 95);
    await output.finalize();
    abort();
    if (!output.target.buffer?.byteLength)
      throw Error("The encoder produced an empty file.");
    const blob = new Blob([output.target.buffer], {
      type: settings.container === "mp4" ? "video/mp4" : "video/webm",
    });
    stage("verifying", total, 98);
    const check = new Input({
      formats: ALL_FORMATS,
      source: new BlobSource(blob),
    });
    try {
      const v = await check.getPrimaryVideoTrack(),
        a = await check.getPrimaryAudioTrack(),
        d = await check.computeDuration();
      if (
        !v ||
        (await v.getDisplayWidth()) !== p.width ||
        (await v.getDisplayHeight()) !== p.height ||
        Math.abs(d - duration) > Math.max(0.1, 2 / fps) ||
        (audio && !a)
      )
        throw Error(
          "Output verification failed: duration, dimensions or audio mismatch.",
        );
    } finally {
      check.dispose();
    }
    abort();
    stage("complete", total, 100);
    return { blob, frames: total, duration, audio };
  } finally {
    if (output.state !== "finalized" && output.state !== "canceled")
      await output.cancel().catch(() => {});
    pool.dispose();
    canvas.width = 1;
    canvas.height = 1;
  }
}
export async function renderWav(
  p: Project,
  signal: AbortSignal,
  onProgress: (v: number) => void,
): Promise<Blob> {
  validateProject(p);
  if (!p.clips.length) throw Error("Add at least one clip before exporting.");
  const unsupported = unsupportedFeatures(p);
  if (unsupported.length)
    throw Error(
      `Export blocked to preserve unsupported data: ${unsupported.join(", ")}.`,
    );
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  if (
    p.assets.some((a) => a.proxyOf && p.clips.some((c) => c.assetId === a.id))
  )
    throw Error(
      "Replace proxy references with original media before final export.",
    );
  const samples = Math.ceil(seconds(endOf(p)) * p.sampleRate);
  if (samples * 4 > 512 * 1024 * 1024)
    throw Error("WAV exceeds the in-memory output limit.");
  const header = new ArrayBuffer(44),
    view = new DataView(header),
    write = (at: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
    };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * 4, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, p.sampleRate, true);
  view.setUint32(28, p.sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * 4, true);
  const parts: BlobPart[] = [header],
    pool = new MediaPool();
  try {
    for (let start = 0; start < samples; start += p.sampleRate) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const len = Math.min(p.sampleRate, samples - start),
        buffer = await mixAudio(p, pool, start, len, signal),
        bytes = new ArrayBuffer(len * 4),
        data = new DataView(bytes);
      for (let i = 0; i < len; i++)
        for (let ch = 0; ch < 2; ch++) {
          const v = buffer.getChannelData(ch)[i]!;
          data.setInt16(
            i * 4 + ch * 2,
            Math.round(v * (v < 0 ? 32768 : 32767)),
            true,
          );
        }
      parts.push(bytes);
      onProgress(((start + len) / samples) * 100);
    }
    return new Blob(parts, { type: "audio/wav" });
  } finally {
    pool.dispose();
  }
}
