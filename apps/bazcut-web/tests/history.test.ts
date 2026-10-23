import test from "node:test";
import assert from "node:assert/strict";
import { newProject } from "../studio/model.ts";
import { editHistory, validateHistory } from "../studio/history.ts";

test("recovery history is bounded, independent, and validates every snapshot", () => {
  const p = newProject();
  const history = editHistory(p, Array.from({ length: 110 }, () => p), [p]);
  assert.equal(history.past.length, 100);
  p.name = "Later edit";
  assert.notEqual(history.past[0]!.name, p.name);
  assert.equal(validateHistory(history, p), history);
  history.future[0]!.schemaVersion = 3;
  assert.throws(() => validateHistory(history, p), /Unsupported/);
});

test("recovery rejects mismatched projects and revisions", () => {
  const p = newProject(), h = editHistory(p, [p], []);
  assert.throws(() => validateHistory(h, { ...p, revision: 1 }), /match/);
  h.past[0]!.id = "foreign-project";
  assert.throws(() => validateHistory(h, p), /another project/);
});
