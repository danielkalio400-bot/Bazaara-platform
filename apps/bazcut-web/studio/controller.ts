import { useEffect, useRef, useState } from "react";
import { validateProject, type Project } from "./model";
import { saveProject, nativeValidate, loadHistory } from "./storage";

import { editHistory } from "./history";

export function useProject() {
  const [project, setProject] = useState<Project | null>(null),
    [saveState, setSaveState] = useState(""),
    [error, setError] = useState(""),
    [history, setHistory] = useState({ undo: 0, redo: 0 });
  const current = useRef<Project | null>(null),
    past = useRef<Project[]>([]),
    future = useRef<Project[]>([]),
    saved = useRef(new Map<string, number | null>()),
    queue = useRef(Promise.resolve()),
    pending = useRef(0),
    failed = useRef(false);
  function schedule(p: Project, label?: string) {
    const journal = editHistory(p, past.current, future.current);
    setSaveState("Saving…");
    pending.current++;
    const task = queue.current
      .then(async () => {
        const expected = saved.current.get(p.id) ?? null;
        if (expected === null || expected < p.revision || label) {
          await nativeValidate(p);
          await saveProject(p, expected, label, journal);
          saved.current.set(p.id, p.revision);
        }
        failed.current = false;
        if (
          current.current?.id === p.id &&
          current.current.revision === p.revision
        )
          setSaveState("Saved on this device");
      })
      .finally(() => {
        pending.current--;
      });
    queue.current = task.catch((e) => {
      failed.current = true;
      setSaveState("Not saved");
      setError(e instanceof Error ? e.message : String(e));
    });
    return task;
  }
  function set(p: Project, persist = true) {
    current.current = p;
    setProject(p);
    setHistory({ undo: past.current.length, redo: future.current.length });
    if (!persist) {
      setSaveState("Saved on this device");
      return;
    }
    void schedule(p).catch(() => {});
  }
  async function flush(label?: string) {
    if (current.current) await schedule(current.current, label);
    await queue.current;
    if (failed.current)
      throw Error("Save failed. Export the project file to preserve this edit.");
  }

  async function open(p: Project, existing = true) {
    await flush();
    validateProject(p);
    saved.current.set(p.id, existing ? p.revision : null);
    past.current = [];
    future.current = [];
    setError("");
    if (existing) {
      try {
        const journal = await loadHistory(p);
        if (journal) { past.current = journal.past; future.current = journal.future; }
      } catch (e) {
        setError(`The project opened, but its recovery history could not be restored: ${String(e)}`);
      }
    }
    set(p, !existing);
  }
  function edit(change: (p: Project) => Project) {
    const old = current.current;
    if (!old) return;
    try {
      const next = validateProject(change(structuredClone(old)));
      next.parentRevision = old.revision;
      next.revision = old.revision + 1;
      next.updated = new Date().toISOString();
      past.current.push(old);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
      set(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }
  function travel(back: boolean) {
    const from = back ? past.current : future.current,
      to = back ? future.current : past.current,
      old = current.current,
      next = from.pop();
    if (!old || !next) return;
    to.push(old);
    set({
      ...structuredClone(next),
      revision: old.revision + 1,
      parentRevision: old.revision,
      updated: new Date().toISOString(),
    });
  }
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (pending.current || failed.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  return {
    project,
    current,
    edit,
    open,
    flush,
    undo: () => travel(true),
    redo: () => travel(false),
    history,
    saveState,
    error,
    setError,
  };
}
