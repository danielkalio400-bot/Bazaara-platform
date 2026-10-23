import type { Clip, Project } from "./model";
import { MATTE, matteModes, matteOf, type Matte } from "./matte";
import { setExtension } from "./motion";

export function MatteControls({
  project,
  clip,
  patch,
}: {
  project: Project;
  clip: Clip;
  patch: (value: Partial<Clip>) => void;
}) {
  if (clip.kind === "audio") return null;
  const matte = matteOf(clip);
  const update = (value: Matte | undefined) =>
    patch(setExtension(clip, MATTE, value));
  return (
    <section className="bc-matte">
      <h3>Track matte</h3>
      <p className="bc-hint">
        Use another layer’s transparency or brightness to reveal this layer. The
        source is transparent outside its timeline range.
      </p>
      <label className="bc-field">
        Matte source
        <select
          aria-label="Matte source"
          value={matte?.id ?? ""}
          onChange={(e) =>
            update(
              e.target.value
                ? {
                    id: e.target.value,
                    mode: matte?.mode ?? "alpha",
                    hideSource: matte?.hideSource ?? true,
                  }
                : undefined,
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
      {matte && (
        <>
          <label className="bc-field">
            Matte mode
            <select
              aria-label="Matte mode"
              value={matte.mode}
              onChange={(e) =>
                update({ ...matte, mode: e.target.value as Matte["mode"] })
              }
            >
              {Object.entries(matteModes).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="bc-check">
            <input
              type="checkbox"
              checked={matte.hideSource}
              onChange={(e) =>
                update({ ...matte, hideSource: e.target.checked })
              }
            />
            Hide matte source from picture
          </label>
          <p className="bc-hint">
            The source’s transforms, masks, effects, opacity and time remapping
            are included. Hiding its picture does not mute its audio.
          </p>
        </>
      )}
    </section>
  );
}
