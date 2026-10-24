import { invoke, convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { validateProject, type Project, type Asset } from "./model";

import { validateHistory, type EditHistory } from "./history";

type Saved = { project: Project; label?: string };
let database: Promise<IDBDatabase> | undefined;
const native = () => typeof window !== "undefined" && isTauri();
function db(): Promise<IDBDatabase> {
  return (database ??= new Promise((resolve, reject) => {
    const req = indexedDB.open("bazcut-studio-v2", 2);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("projects"))
        d.createObjectStore("projects", { keyPath: "id" });
      if (!d.objectStoreNames.contains("media")) d.createObjectStore("media");
      if (!d.objectStoreNames.contains("versions"))
        d.createObjectStore("versions", { keyPath: "key" });
      if (!d.objectStoreNames.contains("journals"))
        d.createObjectStore("journals", { keyPath: "projectId" });
    };
    req.onsuccess = () => {
      req.result.onversionchange = () => {
        req.result.close();
        database = undefined;
      };
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(Error("Close other BazCut windows to upgrade local storage."));
  }));
}
function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function done(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? Error("Storage transaction cancelled."));
    tx.onerror = () => reject(tx.error);
  });
}
export async function listProjects(): Promise<Project[]> {
  if (native()) return invoke("list_projects");
  const d = await db();
  return request(d.transaction("projects").objectStore("projects").getAll());
}
export async function saveProject(
  project: Project,
  expectedRevision: number | null,
  label?: string,
  history?: EditHistory,
): Promise<void> {
  validateProject(project);
  if (history) validateHistory(history, project);
  if (native()) {
    await invoke("save_project", {
      project,
      expectedRevision,
      label: label ?? null,
      history: history ?? null,
    });
    return;
  }
  const d = await db(),
    tx = d.transaction(["projects", "versions", "journals"], "readwrite", {
      durability: "strict",
    }),
    complete = done(tx),
    store = tx.objectStore("projects");
  let conflict = false,
    backwards = false;
  const read = store.get(project.id);
  read.onsuccess = () => {
    const old = read.result as Project | undefined;
    if ((old?.revision ?? null) !== expectedRevision) {
      conflict = true;
      tx.abort();
      return;
    }
    if (old && old.revision > project.revision) {
      backwards = true;
      tx.abort();
      return;
    }
    store.put(project);
    if (history) tx.objectStore("journals").put(history);
    else tx.objectStore("journals").delete(project.id);
    // Named revisions are immutable, separate from the current autosave. No original media is deleted.
    if (label)
      tx.objectStore("versions").add({
        key: `${project.id}:${project.revision}:${crypto.randomUUID()}`,
        project,
        label,
      });
  };
  try {
    await complete;
  } catch (e) {
    if (backwards) throw Error("Revision must not move backwards.");
    if (conflict)
      throw Error(
        "SAVE_CONFLICT: Another window saved this project. Export your current project before reloading.",
      );
    throw e;
  }
}
export async function loadHistory(
  project: Project,
): Promise<EditHistory | null> {
  const value = native()
    ? await invoke("load_history", { id: project.id })
    : await request(
        (await db())
          .transaction("journals")
          .objectStore("journals")
          .get(project.id),
      );
  return value == null ? null : validateHistory(value, project);
}

export async function listVersions(id: string): Promise<Saved[]> {
  if (native()) return invoke("list_versions", { id });
  const d = await db();
  const all = (await request(
    d.transaction("versions").objectStore("versions").getAll(),
  )) as (Saved & { key: string })[];
  return all
    .filter((x) => x.project.id === id)
    .sort((a, b) => b.project.revision - a.project.revision);
}
export async function putMedia(asset: Asset, file: Blob): Promise<void> {
  if (native()) {
    await invoke("begin_media", { id: asset.id });
    try {
      for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
        const bytes = new Uint8Array(
          await file.slice(offset, offset + 1024 * 1024).arrayBuffer(),
        );
        await invoke("append_media", {
          id: asset.id,
          offset,
          data: Array.from(bytes),
        });
      }
      await invoke("finish_media", {
        id: asset.id,
        hash: asset.hash,
        size: asset.size,
      });
    } catch (e) {
      await invoke("cancel_media", { id: asset.id }).catch(() => {});
      throw e;
    }
    return;
  }
  const d = await db(),
    tx = d.transaction("media", "readwrite"),
    complete = done(tx);
  tx.objectStore("media").put(file, asset.id);
  await complete;
}
export async function getMedia(id: string): Promise<Blob | null> {
  if (native()) {
    const path = await invoke<string | null>("media_path", { id });
    if (!path) return null;
    const r = await fetch(convertFileSrc(path));
    if (!r.ok) throw Error("Native media is unreadable. Relink the source.");
    return r.blob();
  }
  const d = await db();
  return (
    (await request(d.transaction("media").objectStore("media").get(id))) ?? null
  );
}
export async function persistStorage(): Promise<boolean> {
  return native() || !!(await navigator.storage?.persist?.());
}
export const platformName = () =>
  native() ? "Native device storage" : "Browser device storage";
export async function nativeValidate(project: Project) {
  if (native()) await invoke("validate_project", { project });
}
export type SaveOutcome =
  "download-started" | "saved" | "share-prepared" | "cancelled";
export function saveNotice(outcome: SaveOutcome, item: string) {
  switch (outcome) {
    case "saved":
      return `${item} saved.`;
    case "share-prepared":
      return `${item} prepared for sharing.`;
    case "cancelled":
      return "Save or share cancelled.";
    case "download-started":
      return `${item} download started.`;
  }
}
export async function download(
  name: string,
  data: Blob | string,
  mime = "application/json",
): Promise<SaveOutcome> {
  const blob =
    typeof data === "string" ? new Blob([data], { type: mime }) : data;
  if (native()) {
    const { fingerprint } = await import("./media");
    const id = `export-${crypto.randomUUID()}`;
    const safeName = name
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .slice(0, 200);
    let outcome: SaveOutcome = "cancelled";
    let failed = false,
      failure: unknown;
    try {
      await putMedia(
        {
          id,
          name: safeName,
          kind: "video",
          mime: blob.type,
          size: blob.size,
          hash: await fingerprint(blob),
          duration: 1,
          width: 0,
          height: 0,
          hasAudio: false,
          license: "Export",
          tags: [],
          favorite: false,
        },
        blob,
      );
      const result = await invoke<{ saved: boolean; path?: string | null }>(
        "plugin:bazcut-share|share",
        {
          payload: { id, name: safeName, mime: blob.type || mime },
        },
      );
      outcome = result.saved
        ? result.path
          ? "saved"
          : "share-prepared"
        : "cancelled";
    } catch (error) {
      failed = true;
      failure = error;
    }
    try {
      await invoke("discard_export", { id });
    } catch (cleanup) {
      if (failed)
        throw new AggregateError(
          [failure, cleanup],
          `Export failed: ${String(failure)}. Temporary-file cleanup also failed.`,
        );
      throw Error(
        `${saveNotice(outcome, "File")} Temporary-file cleanup failed: ${String(cleanup)}`,
      );
    }
    if (failed) throw failure;
    return outcome;
  }
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  return "download-started";
}
