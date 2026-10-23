import { useEffect, useMemo, useRef, useState } from "react";
import {
  frameTicks,
  fpsValue,
  newClip,
  newProject,
  timecode,
  type Asset,
  type Project,
} from "./model";
import { MediaPool } from "./media";
import { drawFrame } from "./render";
import { shuttleSpeed, useTransport } from "./transport";

export function SourceMonitor({
  asset,
  project,
  insert,
}: {
  asset: Asset;
  project: Project;
  insert: (
    track: string,
    input: number,
    output: number,
    mode: "insert" | "overwrite",
  ) => void;
}) {
  const step = frameTicks(project.fps),
    count = Math.max(1, Math.floor(asset.duration / step));
  const tracks = project.tracks.filter(
    (t) => !t.locked && (t.kind === "audio") === (asset.kind === "audio"),
  );
  const [frame, setFrame] = useState(0),
    [input, setInput] = useState(0),
    [output, setOutput] = useState(count);
  const [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [error, setError] = useState("");
  const [track, setTrack] = useState(tracks[0]?.id ?? ""),
    [pool, setPool] = useState<MediaPool | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null),
    queue = useRef(Promise.resolve()),
    generation = useRef(0);
  const source = useMemo(() => {
    const p = newProject(asset.name);
    p.fps = project.fps;
    p.sampleRate = project.sampleRate;
    p.width = Math.max(
      16,
      Math.min(8192, Math.round((asset.width || 640) / 2) * 2),
    );
    p.height = Math.max(
      16,
      Math.min(8192, Math.round((asset.height || 360) / 2) * 2),
    );
    p.assets = [asset];
    const c = newClip(p.tracks[asset.kind === "audio" ? 1 : 0]!.id, 0, asset);
    c.duration = count * step;
    p.clips = [c];
    return p;
  }, [asset.id, project.fps.num, project.fps.den, project.sampleRate]);
  useEffect(() => {
    const media = new MediaPool();
    setPool(media);
    return () => {
      generation.current++;
      media.dispose();
    };
  }, []);
  useEffect(() => {
    if (!pool || !canvas.current) return;
    const id = ++generation.current,
      cv = canvas.current;
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (generation.current !== id) return;
        cv.width = Math.min(960, source.width);
        cv.height = Math.round((cv.width * source.height) / source.width);
        await drawFrame(cv, source, pool, frame * step);
      })
      .catch((e) => {
        if (id === generation.current) setError(String(e));
      });
  }, [pool, source, frame, step]);
  useTransport({
    project: source,
    pool,
    frame,
    playing,
    speed,
    onFrame: setFrame,
    onPlaying: setPlaying,
    onError: (e) => setError(String(e)),
  });
  const markIn = () => {
    setInput(Math.min(frame, count - 1));
    if (frame >= output) setOutput(frame + 1);
  };
  const markOut = () => {
    setOutput(frame + 1);
    if (frame < input) setInput(frame);
  };
  const valid =
    input >= 0 &&
    output <= count &&
    output > input &&
    tracks.some((t) => t.id === track);
  return (
    <div
      className="bc-source-monitor"
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("input,select,textarea")) return;
        const key = e.key.toLowerCase();
        if (
          !["i", "o", "j", "k", "l", " ", "arrowleft", "arrowright"].includes(
            key,
          )
        )
          return;
        e.preventDefault();
        e.stopPropagation();
        if (key === "i") markIn();
        if (key === "o") markOut();
        if (key === "k") setPlaying(false);
        if (key === " ") {
          setSpeed(1);
          setPlaying(!playing);
        }
        if ((key === "j" || key === "l") && !e.repeat) {
          setSpeed(shuttleSpeed(speed, key === "j" ? -1 : 1, playing));
          setPlaying(true);
        }
        if (key.startsWith("arrow")) {
          setPlaying(false);
          setFrame(
            Math.max(
              0,
              Math.min(count - 1, frame + (key === "arrowleft" ? -1 : 1)),
            ),
          );
        }
      }}
      tabIndex={0}
    >
      <canvas ref={canvas} aria-label={`Source preview for ${asset.name}`} />
      {asset.kind === "audio" && <p>Audio source · {asset.name}</p>}
      <div className="bc-source-transport">
        <button
          className="bc-quiet"
          onClick={() => {
            setSpeed(1);
            if (frame === count - 1) setFrame(0);
            setPlaying(!playing);
          }}
        >
          {playing ? "Pause source" : "Play source"}
        </button>
        <output>
          {timecode(frame * step, project.fps)}{" "}
          {playing &&
            `${speed < 0 ? "Reverse" : "Forward"} ${Math.abs(speed)}×`}
        </output>
        <span>{fpsValue(project.fps).toFixed(2)} FPS</span>
      </div>
      <input
        type="range"
        aria-label="Source playhead"
        min={0}
        max={count - 1}
        value={frame}
        onChange={(e) => {
          setPlaying(false);
          setFrame(Number(e.target.value));
        }}
      />
      <div className="bc-source-range">
        <label>
          Source in frame
          <input
            aria-label="Source in frame"
            type="number"
            min={0}
            max={output - 1}
            value={input}
            onChange={(e) => setInput(Math.round(Number(e.target.value)))}
          />
        </label>
        <button className="bc-quiet" onClick={markIn}>
          Mark in (I)
        </button>
        <label>
          Source out frame
          <input
            aria-label="Source out frame"
            type="number"
            min={input + 1}
            max={count}
            value={output}
            onChange={(e) => setOutput(Math.round(Number(e.target.value)))}
          />
        </label>
        <button className="bc-quiet" onClick={markOut}>
          Mark out (O)
        </button>
      </div>
      <p className="bc-hint">
        Out is exclusive. {Math.max(0, output - input)} frames selected. J/K/L
        shuttles or stops playback.
      </p>
      <label className="bc-field">
        Destination track
        <select
          aria-label="Source destination track"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="bc-error-text">
          {error}
        </p>
      )}
      <div className="bc-button-pair">
        {(["insert", "overwrite"] as const).map((mode) => (
          <button
            className={mode === "insert" ? "bc-primary" : "bc-quiet"}
            key={mode}
            disabled={!valid}
            onClick={() => {
              setPlaying(false);
              insert(track, input * step, output * step, mode);
            }}
          >
            {mode === "insert" ? "Insert range" : "Overwrite range"}
          </button>
        ))}
      </div>
    </div>
  );
}
