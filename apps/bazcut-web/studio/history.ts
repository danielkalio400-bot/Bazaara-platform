import { validateProject, type Project } from "./model.ts";

export type EditHistory = {
  format: 1;
  projectId: string;
  revision: number;
  past: Project[];
  future: Project[];
};
const MAX_BYTES = 8 * 1024 * 1024;
const size = (value: unknown) =>
  new TextEncoder().encode(JSON.stringify(value)).length;

/** A bounded recovery journal, committed in the same transaction as its graph. */
export function editHistory(
  project: Project,
  past: Project[],
  future: Project[],
): EditHistory {
  const result: EditHistory = {
    format: 1,
    projectId: project.id,
    revision: project.revision,
    past: past.slice(-100),
    future: future.slice(-100),
  };
  while (size(result) > MAX_BYTES) {
    if (result.past.length) result.past.shift();
    else if (result.future.length) result.future.shift();
    else throw Error("Recovery journal exceeds its size limit.");
  }
  return structuredClone(result);
}

export function validateHistory(value: unknown, project: Project): EditHistory {
  const h = value as EditHistory;
  if (
    !h ||
    h.format !== 1 ||
    h.projectId !== project.id ||
    h.revision !== project.revision ||
    !Array.isArray(h.past) ||
    !Array.isArray(h.future) ||
    h.past.length > 100 ||
    h.future.length > 100 ||
    size(h) > MAX_BYTES
  )
    throw Error("Recovery journal does not match the saved project.");
  for (const snapshot of [...h.past, ...h.future]) {
    validateProject(snapshot);
    if (snapshot.id !== project.id)
      throw Error("Recovery journal contains another project.");
  }
  return h;
}
