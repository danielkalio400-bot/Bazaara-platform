import {
  seconds,
  snapFrame,
  sourceTime,
  ticks,
  type Clip,
  type Project,
} from "./model";
import { setExtension, type Easing } from "./motion";
import { mappedTime, timeMapOf, TIME_MAP, type TimePoint } from "./time-map";

export function TimeRemap({
  project,
  clip,
  local,
  patch,
}: {
  project: Project;
  clip: Clip;
  local: number;
  patch: (p: Partial<Clip>) => void;
}) {
  const asset = project.assets.find((a) => a.id === clip.assetId);
  if (!asset || !["video", "audio"].includes(asset.kind)) return null;
  const map = timeMapOf(clip),
    offset = clip.animationOffset ?? 0;
  const at =
    snapFrame(Math.max(0, Math.min(local, clip.duration)), project.fps) +
    offset;
  const save = (points: TimePoint[]) =>
    patch(
      setExtension(clip, TIME_MAP, {
        points: [...points].sort((a, b) => a.at - b.at),
      }),
    );
  const source = (time: number) =>
    Math.max(0, Math.min(asset.duration - 1, sourceTime(clip, time)));
  const update = (index: number, change: Partial<TimePoint>) =>
    save(
      map!.points.map((point, i) =>
        i === index ? { ...point, ...change } : point,
      ),
    );
  const extent = map
    ? map.points[map.points.length - 1]!.at - map.points[0]!.at
    : 1;
  const path = map
    ? Array.from({ length: 121 }, (_, i) => {
        const time = map.points[0]!.at + (extent * i) / 120;
        return `${i ? "L" : "M"}${10 + (i * 220) / 120},${100 - (mappedTime(map, time) / asset.duration) * 90}`;
      }).join(" ")
    : "";
  return (
    <section className="bc-time-remap">
      <h3>Time remapping</h3>
      <p className="bc-hint">
        Map timeline time to source time. Descending curves reverse; held
        segments freeze and silence audio. Speed changes also change pitch.
      </p>
      {!map ? (
        <button
          className="bc-quiet"
          onClick={() =>
            save([
              { at: offset, source: source(0), easing: "linear" },
              {
                at: offset + clip.duration,
                source: source(clip.duration),
                easing: "linear",
              },
            ])
          }
        >
          Enable time remapping
        </button>
      ) : (
        <>
          <svg viewBox="0 0 240 112" role="img" aria-label="Source time curve">
            <path d="M10 10V100H230" fill="none" stroke="#34435b" />
            <path d={path} fill="none" stroke="#8abaff" strokeWidth="2" />
            {map.points.map((p) => (
              <circle
                key={p.at}
                cx={10 + ((p.at - map.points[0]!.at) / extent) * 220}
                cy={100 - (p.source / asset.duration) * 90}
                r="3"
                fill="#d4e6ff"
              />
            ))}
          </svg>
          <div className="bc-button-pair">
            <button
              className="bc-quiet"
              disabled={map.points.some((p) => p.at === at)}
              onClick={() =>
                save([
                  ...map.points,
                  {
                    at,
                    source: Math.round(mappedTime(map, at)),
                    easing: "linear",
                  },
                ])
              }
            >
              Time key at playhead
            </button>
            <button
              className="bc-quiet"
              onClick={() => patch(setExtension(clip, TIME_MAP, undefined))}
            >
              Clear time remapping
            </button>
          </div>
          {map.points.map((point, index) => (
            <div className="bc-time-key" key={index}>
              <label>
                Timeline seconds
                <input
                  aria-label={`Time key ${index + 1} timeline seconds`}
                  type="number"
                  min={0}
                  step={project.fps.den / project.fps.num}
                  value={Number(seconds(point.at - offset).toFixed(5))}
                  disabled={index === 0 || index === map.points.length - 1}
                  onChange={(e) => {
                    if (Number.isFinite(e.target.valueAsNumber))
                      update(index, {
                        at:
                          snapFrame(
                            ticks(e.target.valueAsNumber),
                            project.fps,
                          ) + offset,
                      });
                  }}
                />
              </label>
              <label>
                Source seconds
                <input
                  aria-label={`Time key ${index + 1} source seconds`}
                  type="number"
                  min={0}
                  max={seconds(asset.duration - 1)}
                  step={0.01}
                  value={Number(seconds(point.source).toFixed(6))}
                  onChange={(e) => {
                    if (Number.isFinite(e.target.valueAsNumber))
                      update(index, { source: ticks(e.target.valueAsNumber) });
                  }}
                />
              </label>
              <select
                aria-label={`Time key ${index + 1} easing`}
                value={point.easing}
                onChange={(e) =>
                  update(index, { easing: e.target.value as Easing })
                }
              >
                <option value="linear">Linear</option>
                <option value="hold">Hold</option>
                <option value="easeInOut">Smooth</option>
              </select>
              <button
                aria-label={`Remove time key ${index + 1}`}
                disabled={index === 0 || index === map.points.length - 1}
                onClick={() => save(map.points.filter((p) => p !== point))}
              >
                ×
              </button>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
