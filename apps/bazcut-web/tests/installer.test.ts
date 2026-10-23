import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import installer from "../scripts/installer-core.cjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bazcut-installer-test-"));
  fs.mkdirSync(path.join(root, "apps/bazcut-web"), { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), '{"name":"bazaara-platform"}');
  fs.writeFileSync(path.join(root, "apps/bazcut-web/package.json"), '{}');
  const file = (name: string, before: string | null, after: string) => ({ path: `apps/bazcut-web/${name}`, text: true, before: before === null ? null : installer.digest(Buffer.from(before), true), after: installer.digest(Buffer.from(after), true), content: Buffer.from(after).toString("base64") });
  return { root, file, clean: () => fs.rmSync(root, { recursive: true, force: true }) };
}
test("installer preflights all conflicts before any mutation", () => {
  const { root, file, clean } = fixture();
  try {
    fs.writeFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "User edits");
    assert.throws(() => installer.planInstallation(root, [file("new.txt", null, "New"), file("existing.txt", "Original", "Changed")]), /No files were changed/);
    assert.equal(fs.existsSync(path.join(root, "apps/bazcut-web/new.txt")), false);
    assert.equal(fs.readFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "utf8"), "User edits");
  } finally { clean(); }
});
test("installer handles Windows newlines, applies in place, and is idempotent", () => {
  const { root, file, clean } = fixture();
  try {
    fs.writeFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "Old\r\n");
    const files = [file("existing.txt", "Old\n", "New\n"), file("child/added.txt", null, "Added")];
    installer.applyInstallation(installer.planInstallation(root, files));
    assert.equal(fs.readFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "utf8"), "New\n");
    assert.equal(installer.planInstallation(root, files).length, 0);
    assert.equal(fs.readdirSync(path.join(root, "apps/bazcut-web")).some(x => x.endsWith(".tmp") || x.endsWith(".bak")), false);
  } finally { clean(); }
});
test("installer rejects traversal and detects edits made after preflight", () => {
  const { root, file, clean } = fixture();
  try {
    assert.throws(() => installer.planInstallation(root, [file("../escape", null, "bad")]), /Invalid/);
    fs.writeFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "Old");
    const plan = installer.planInstallation(root, [file("first.txt", null, "First"), file("existing.txt", "Old", "New")]);
    fs.writeFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "Intervening change");
    assert.throws(() => installer.applyInstallation(plan), /rolled back/);
    assert.equal(fs.existsSync(path.join(root, "apps/bazcut-web/first.txt")), false);
    assert.equal(fs.readFileSync(path.join(root, "apps/bazcut-web/existing.txt"), "utf8"), "Intervening change");
  } finally { clean(); }
});
