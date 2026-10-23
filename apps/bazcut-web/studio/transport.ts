import { useEffect } from "react";
import { endOf, fpsValue, seconds, type Project } from "./model";
import { mixAudio, type MediaPool } from "./media";

export function shuttleSpeed(
  current: number,
  direction: -1 | 1,
  playing: boolean,
) {
  return (
    direction *
    (playing && Math.sign(current) === direction
      ? Math.min(16, Math.abs(current) * 2)
      : 1)
  );
}

/** One clock drives both audio and picture. Shuttle speed changes restart at the visible frame. */
export function useTransport({
  project,
  pool,
  frame,
  playing,
  speed,
  onFrame,
  onPlaying,
  onError,
}: {
  project: Project | null;
  pool: MediaPool | null;
  frame: number;
  playing: boolean;
  speed: number;
  onFrame: (frame: number) => void;
  onPlaying: (playing: boolean) => void;
  onError: (error: unknown) => void;
}) {
  useEffect(() => {
    if (!playing || !project || !pool || !speed) return;
    const p = project,
      media = pool,
      initial = frame,
      rate = fpsValue(p.fps);
    const total = Math.ceil(seconds(endOf(p)) * rate),
      magnitude = Math.abs(speed);
    if (!total) {
      onPlaying(false);
      return;
    }
    const context = new AudioContext({ sampleRate: p.sampleRate });
    const nodes = new Set<AudioBufferSourceNode>(),
      abort = new AbortController();
    let stopped = false,
      raf = 0,
      base: number | null = null;
    const tick = () => {
      if (stopped) return;
      const next =
        initial +
        Math.floor(
          Math.max(0, base === null ? 0 : context.currentTime - base) *
            rate *
            speed,
        );
      if (next < 0 || next >= total) {
        onFrame(Math.max(0, Math.min(total - 1, next)));
        onPlaying(false);
        return;
      }
      onFrame(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    void (async () => {
      await context.resume();
      let cursor = Math.round((initial / rate) * p.sampleRate),
        scheduled = 0;
      const end = Math.ceil(seconds(endOf(p)) * p.sampleRate);
      while (!stopped && (speed > 0 ? cursor < end : cursor > 0)) {
        if (base !== null && base + scheduled - context.currentTime > 1.2) {
          await new Promise<void>((r) => setTimeout(r, 40));
          continue;
        }
        const length = Math.min(
          Math.round((p.sampleRate / 4) * magnitude),
          speed > 0 ? end - cursor : cursor,
        );
        const buffer = await mixAudio(
          p,
          media,
          speed > 0 ? cursor : cursor - length,
          length,
          abort.signal,
        );
        if (stopped) break;
        if (speed < 0)
          for (let i = 0; i < buffer.numberOfChannels; i++)
            buffer.getChannelData(i).reverse();
        base ??= context.currentTime + 0.05;
        const target = base + scheduled,
          late = Math.max(0, context.currentTime - target);
        if (late * magnitude < buffer.duration) {
          const node = context.createBufferSource();
          node.buffer = buffer;
          node.playbackRate.value = magnitude;
          node.connect(context.destination);
          nodes.add(node);
          node.onended = () => {
            nodes.delete(node);
            node.disconnect();
          };
          node.start(Math.max(context.currentTime, target), late * magnitude);
        }
        scheduled += length / p.sampleRate / magnitude;
        cursor += speed > 0 ? length : -length;
      }
    })().catch((error) => {
      if (!stopped) {
        onError(error);
        onPlaying(false);
      }
    });
    return () => {
      stopped = true;
      abort.abort();
      cancelAnimationFrame(raf);
      for (const node of nodes) {
        try {
          node.stop();
        } catch {}
        node.disconnect();
      }
      void context.close().catch(() => {});
    };
    // Frame is output from this clock, not an instruction to restart it.
  }, [playing, speed, project?.id, pool]);
}
