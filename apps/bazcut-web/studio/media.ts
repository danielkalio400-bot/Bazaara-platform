import { effectFilter } from "./motion";
import { mappedIntervals, mappedSpeed, timeMapOf } from "./time-map";
import {
  Input,
  ALL_FORMATS,
  BlobSource,
  CanvasSink,
  AudioBufferSink,
  type WrappedAudioBuffer,
} from "mediabunny";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  uid,
  ticks,
  seconds,
  sourceTime,
  propertyAt,
  fadeAt,
  type Asset,
  type Clip,
  type Project,
} from "./model";
import { getMedia } from "./storage";

export async function fingerprint(file: Blob): Promise<string> {
  const hash = sha256.create();
  for (let n = 0; n < file.size; n += 4 * 1024 * 1024)
    hash.update(
      new Uint8Array(await file.slice(n, n + 4 * 1024 * 1024).arrayBuffer()),
    );
  return Array.from(hash.digest(), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
}
export async function inspectMedia(file: File): Promise<Asset> {
  if (!file.size) throw Error("The selected file is empty.");
  const hash = await fingerprint(file);
  if (file.type.startsWith("image/")) {
    const image = await createImageBitmap(file);
    const asset: Asset = {
      id: uid(),
      name: file.name,
      kind: "image",
      mime: file.type,
      size: file.size,
      duration: ticks(5),
      width: image.width,
      height: image.height,
      hash,
      hasAudio: false,
      license: "User supplied — confirm rights before publishing",
      tags: [],
      favorite: false,
    };
    image.close();
    return asset;
  }
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });
  try {
    const video = await input.getPrimaryVideoTrack(),
      audio = await input.getPrimaryAudioTrack();
    if (!video && !audio) throw Error("No readable video or audio stream.");
    if (video && !(await video.canDecode()))
      throw Error(
        "This device cannot decode the video codec. Convert or relink a supported source.",
      );
    if (audio && !(await audio.canDecode()))
      throw Error(
        "This device cannot decode the audio codec. Import a supported version.",
      );
    const duration = await input.computeDuration();
    if (!Number.isFinite(duration) || duration <= 0)
      throw Error("Invalid source duration.");
    return {
      id: uid(),
      name: file.name,
      kind: video ? "video" : "audio",
      mime: file.type || "application/octet-stream",
      size: file.size,
      duration: ticks(duration),
      width: video ? await video.getDisplayWidth() : 0,
      height: video ? await video.getDisplayHeight() : 0,
      hash,
      hasAudio: !!audio,
      license: "User supplied — confirm rights before publishing",
      tags: [],
      favorite: false,
    };
  } finally {
    input.dispose();
  }
}
type Source = {
  input?: Input;
  video?: CanvasSink;
  audio?: AudioBufferSink;
  image?: ImageBitmap;
  audioCache: WrappedAudioBuffer[];
  cacheStart: number;
  cacheEnd: number;
};
export class MediaPool {
  private items = new Map<string, Promise<Source>>();
  private disposed = false;
  async source(asset: Asset): Promise<Source> {
    if (this.disposed) throw Error("Media session closed.");
    let pending = this.items.get(asset.id);
    if (!pending) {
      pending = (async () => {
        const blob = await getMedia(asset.id);
        if (!blob)
          throw Error(
            `Missing media: ${asset.name}. Relink the original file.`,
          );
        if (
          blob.size !== asset.size ||
          (await fingerprint(blob)) !== asset.hash
        )
          throw Error(
            `Original checksum mismatch: ${asset.name}. Relink the exact original.`,
          );
        if (asset.kind === "image")
          return {
            image: await createImageBitmap(blob),
            audioCache: [],
            cacheStart: 0,
            cacheEnd: 0,
          };
        const input = new Input({
          formats: ALL_FORMATS,
          source: new BlobSource(blob),
        });
        try {
          const video = await input.getPrimaryVideoTrack(),
            audio = await input.getPrimaryAudioTrack();
          return {
            input,
            video: video ? new CanvasSink(video, { poolSize: 2 }) : undefined,
            audio: audio ? new AudioBufferSink(audio) : undefined,
            audioCache: [],
            cacheStart: 0,
            cacheEnd: 0,
          };
        } catch (e) {
          input.dispose();
          throw e;
        }
      })();
      this.items.set(asset.id, pending);
    }
    return pending;
  }
  async frame(asset: Asset, time: number): Promise<CanvasImageSource | null> {
    const s = await this.source(asset);
    if (s.image) return s.image;
    if (!s.video) return null;
    return (
      (await s.video.getCanvas(Math.max(0, seconds(time))))?.canvas ?? null
    );
  }
  async audio(
    asset: Asset,
    start: number,
    end: number,
  ): Promise<WrappedAudioBuffer[]> {
    const s = await this.source(asset);
    if (!s.audio) return [];
    if (start >= s.cacheStart && end <= s.cacheEnd && s.audioCache.length)
      return s.audioCache;
    s.audioCache = [];
    s.cacheStart = Math.max(0, start - 0.05);
    s.cacheEnd = Math.min(seconds(asset.duration), end + 0.2);
    for await (const chunk of s.audio.buffers(s.cacheStart, s.cacheEnd))
      s.audioCache.push(chunk);
    return s.audioCache;
  }
  dispose() {
    this.disposed = true;
    for (const promise of this.items.values())
      void promise
        .then((s) => {
          s.input?.dispose();
          s.image?.close();
        })
        .catch(() => {});
    this.items.clear();
  }
}
export async function mixAudio(
  p: Project,
  pool: MediaPool,
  startSample: number,
  length: number,
  signal?: AbortSignal,
): Promise<AudioBuffer> {
  const rate = p.sampleRate,
    buffer = new AudioBuffer({ length, sampleRate: rate, numberOfChannels: 2 });
  const left = buffer.getChannelData(0),
    right = buffer.getChannelData(1),
    begin = startSample / rate,
    end = (startSample + length) / rate;
  for (const c of p.clips) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    const track = p.tracks.find((t) => t.id === c.trackId),
      asset = p.assets.find((a) => a.id === c.assetId);
    if (
      !asset?.hasAudio ||
      track?.muted ||
      (c.volume === 0 &&
        !c.keyframes.some((k) => k.property === "volume" && k.value > 0)) ||
      (c.freeze && !timeMapOf(c)) ||
      seconds(c.start) >= end ||
      seconds(c.start + c.duration) <= begin
    )
      continue;
    const from = Math.max(0, Math.ceil((seconds(c.start) - begin) * rate)),
      to = Math.min(
        length,
        Math.ceil((seconds(c.start + c.duration) - begin) * rate),
      );
    if (to <= from) continue;
    const localStart = ticks(begin + from / rate) - c.start,
      localEnd = ticks(begin + (to - 1) / rate) - c.start;
    const map = timeMapOf(c),
      offset = c.animationOffset ?? 0;
    const intervals = map
      ? mappedIntervals(map, localStart + offset, localEnd + offset)
      : [
          [
            Math.min(sourceTime(c, localStart), sourceTime(c, localEnd)),
            Math.max(sourceTime(c, localStart), sourceTime(c, localEnd)),
          ],
        ];
    const chunks: WrappedAudioBuffer[] = [];
    for (const [a, b] of intervals)
      chunks.push(
        ...(await pool.audio(asset, seconds(a!), seconds(b!) + 2 / rate)),
      );
    chunks.sort((a, b) => a.timestamp - b.timestamp);
    let index = 0;
    for (let n = from; n < to; n++) {
      const local = ticks((startSample + n) / rate) - c.start,
        sampleTime = seconds(sourceTime(c, local));
      if (map && Math.abs(mappedSpeed(map, local + offset)) < 1e-8) continue;
      // Reverse and variable-rate reads are explicitly sample-mapped; speed changes also change pitch.
      while (
        index < chunks.length - 1 &&
        sampleTime >= chunks[index]!.timestamp + chunks[index]!.duration
      )
        index++;
      while (index > 0 && sampleTime < chunks[index]!.timestamp) index--;
      const chunk = chunks[index];
      if (!chunk) continue;
      const pos = (sampleTime - chunk.timestamp) * chunk.buffer.sampleRate;
      if (pos < 0 || pos >= chunk.buffer.length) continue;
      const j = Math.floor(pos),
        weight = pos - j;
      const sample = (channel: number) => {
        const data = chunk.buffer.getChannelData(
          Math.min(channel, chunk.buffer.numberOfChannels - 1),
        );
        return (
          data[j]! * (1 - weight) +
          (data[Math.min(j + 1, data.length - 1)] ?? 0) * weight
        );
      };
      const gain =
        propertyAt(c, "volume", local) *
        fadeAt(c, local) *
        (track?.volume ?? 1);
      const gl = c.pan > 0 ? 1 - c.pan : 1,
        gr = c.pan < 0 ? 1 + c.pan : 1;
      left[n]! += sample(0) * gain * gl;
      right[n]! += sample(1) * gain * gr;
    }
  }
  // Deterministic peak clipping protection. No claim of LUFS normalization or a mastering limiter.
  for (let n = 0; n < length; n++) {
    left[n] = Math.max(-1, Math.min(1, left[n]!));
    right[n] = Math.max(-1, Math.min(1, right[n]!));
  }
  return buffer;
}
export function clipFilter(c: Clip, local = 0) {
  return `brightness(${c.brightness}) contrast(${c.contrast}) saturate(${c.saturation}) hue-rotate(${c.hue}deg) blur(${c.blur}px) ${effectFilter(c, local)}`.trim();
}
