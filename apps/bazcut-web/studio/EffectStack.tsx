import { useState } from "react";
import { snapFrame, uid, type Clip, type Project } from "./model";
import {
  EFFECTS,
  PARENT,
  effectAmount,
  effectTypes,
  effectsOf,
  parentOf,
  setExtension,
  type Effect,
  type Easing,
} from "./motion";

export function EffectStack({
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
  const [type, setType] = useState<Effect["type"]>("brightness");
  const effects = effectsOf(clip),
    parent = parentOf(clip);
  const at =
    snapFrame(Math.max(0, Math.min(local, clip.duration)), project.fps) +
    (clip.animationOffset ?? 0);
  const save = (next: Effect[]) =>
    patch(setExtension(clip, EFFECTS, next.length ? next : undefined));
  const update = (id: string, change: Partial<Effect>) =>
    save(
      effects.map((effect) =>
        effect.id === id ? { ...effect, ...change } : effect,
      ),
    );
  const move = (index: number, delta: number) => {
    const next = [...effects];
    [next[index], next[index + delta]] = [next[index + delta]!, next[index]!];
    save(next);
  };
  return (
    <section className="bc-effects-stack">
      <h3>Parenting</h3>
      <label className="bc-field">
        Transform parent
        <select
          aria-label="Transform parent"
          value={parent?.id ?? ""}
          onChange={(e) =>
            patch(
              setExtension(
                clip,
                PARENT,
                e.target.value
                  ? {
                      id: e.target.value,
                      inheritOpacity: parent?.inheritOpacity ?? true,
                    }
                  : undefined,
              ),
            )
          }
        >
          <option value="">None</option>
          {project.clips
            .filter((c) => c.id !== clip.id && c.kind !== "audio")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      {parent && (
        <label className="bc-check">
          <input
            type="checkbox"
            checked={parent.inheritOpacity}
            onChange={(e) =>
              patch(
                setExtension(clip, PARENT, {
                  ...parent,
                  inheritOpacity: e.target.checked,
                }),
              )
            }
          />
          Inherit parent opacity
        </label>
      )}
      <h3>Effect stack</h3>
      <p className="bc-hint">
        Effects run from top to bottom after the base color adjustments.
      </p>
      <div className="bc-button-pair">
        <select
          aria-label="Effect type"
          value={type}
          onChange={(e) => setType(e.target.value as Effect["type"])}
        >
          {Object.entries(effectTypes).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>
        <button
          className="bc-quiet"
          disabled={effects.length >= 64}
          onClick={() =>
            save([
              ...effects,
              {
                id: uid(),
                type,
                amount: effectTypes[type].initial,
                enabled: true,
                keyframes: [],
              },
            ])
          }
        >
          Add effect
        </button>
      </div>
      {effects.map((effect, index) => {
        const spec = effectTypes[effect.type];
        return (
          <article className="bc-effect-card" key={effect.id}>
            <header>
              <label>
                <input
                  type="checkbox"
                  aria-label={`Enable ${spec.label} effect ${index + 1}`}
                  checked={effect.enabled}
                  onChange={(e) =>
                    update(effect.id, { enabled: e.target.checked })
                  }
                />
                {spec.label}
              </label>
              <div>
                <button
                  aria-label={`Move effect ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  aria-label={`Move effect ${index + 1} down`}
                  disabled={index === effects.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  aria-label={`Remove effect ${index + 1}`}
                  onClick={() =>
                    save(effects.filter((e) => e.id !== effect.id))
                  }
                >
                  ×
                </button>
              </div>
            </header>
            <label className="bc-field">
              Base value{effect.keyframes.length ? " (keys override)" : ""}
              <input
                type="number"
                aria-label={`Effect ${index + 1} amount`}
                step={0.01}
                min={spec.min}
                max={spec.max}
                value={effect.amount}
                onChange={(e) => {
                  if (Number.isFinite(e.target.valueAsNumber))
                    update(effect.id, { amount: e.target.valueAsNumber });
                }}
              />
            </label>
            <button
              className="bc-quiet"
              onClick={() =>
                update(effect.id, {
                  keyframes: [
                    ...effect.keyframes.filter((k) => k.at !== at),
                    {
                      at,
                      value: effectAmount(effect, at),
                      easing: "linear" as const,
                    },
                  ].sort((a, b) => a.at - b.at),
                })
              }
            >
              Keyframe at playhead
            </button>
            {effect.keyframes.map((key, keyIndex) => (
              <div className="bc-effect-key" key={key.at}>
                <span title="Animation time in seconds">
                  {(
                    (key.at - (clip.animationOffset ?? 0)) /
                    project.timebase
                  ).toFixed(2)}
                  s
                </span>
                <input
                  type="number"
                  aria-label={`Effect ${index + 1} key ${keyIndex + 1} value`}
                  min={spec.min}
                  max={spec.max}
                  step={0.01}
                  value={key.value}
                  onChange={(e) => {
                    if (Number.isFinite(e.target.valueAsNumber))
                      update(effect.id, {
                        keyframes: effect.keyframes.map((k) =>
                          k === key
                            ? { ...k, value: e.target.valueAsNumber }
                            : k,
                        ),
                      });
                  }}
                />
                <select
                  aria-label={`Effect ${index + 1} key ${keyIndex + 1} easing`}
                  value={key.easing}
                  onChange={(e) =>
                    update(effect.id, {
                      keyframes: effect.keyframes.map((k) =>
                        k === key
                          ? { ...k, easing: e.target.value as Easing }
                          : k,
                      ),
                    })
                  }
                >
                  <option value="linear">Linear</option>
                  <option value="hold">Hold</option>
                  <option value="easeInOut">Smooth</option>
                </select>
                <button
                  aria-label={`Remove effect ${index + 1} key ${keyIndex + 1}`}
                  onClick={() =>
                    update(effect.id, {
                      keyframes: effect.keyframes.filter((k) => k !== key),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </article>
        );
      })}
    </section>
  );
}
