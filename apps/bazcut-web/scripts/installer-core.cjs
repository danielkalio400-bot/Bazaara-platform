const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

function digest(bytes, text) {
  const data = text ? bytes.toString("utf8").replace(/^\uFEFF/, "").replaceAll("\r\n", "\n") : bytes;
  return crypto.createHash("sha256").update(data).digest("hex");
}
function planInstallation(root, files) {
  root = fs.realpathSync(root);
  const project = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8").replace(/^\uFEFF/, ""));
  if (project.name !== "bazaara-platform" || !fs.existsSync(path.join(root, "apps", "bazcut-web", "package.json")))
    throw Error("Choose the existing bazaara-platform repository containing apps/bazcut-web.");
  const planned = [], conflicts = [], seen = new Set();
  for (const file of files) {
    const allowed = file.path.startsWith("apps/bazcut-web/") || ["packages/flagship-ui/src/video-engine.ts", "packages/flagship-ui/src/video.tsx"].includes(file.path);
    if (!allowed || file.path.includes("\\") || file.path.split("/").some(p => !p || p === "." || p === "..") || seen.has(file.path))
      throw Error("Invalid or duplicate installer path.");
    seen.add(file.path);
    const destination = path.join(root, ...file.path.split("/"));
    let component = root;
    for (const name of file.path.split("/")) {
      component = path.join(component, name);
      if (fs.existsSync(component) && fs.lstatSync(component).isSymbolicLink())
        throw Error(`Refusing to overwrite through a link: ${file.path}`);
    }
    const bytes = Buffer.from(file.content, "base64");
    if (digest(bytes, file.text) !== file.after) throw Error(`Installer data is damaged: ${file.path}`);
    const original = fs.existsSync(destination) ? fs.readFileSync(destination) : null;
    const current = original === null ? null : digest(original, file.text);
    if (current === file.after) continue;
    if (current !== file.before) { conflicts.push(file.path); continue; }
    planned.push({ destination, bytes, original, relative: file.path, mode: original === null ? 0o644 : fs.statSync(destination).mode });
  }
  if (conflicts.length) throw Error(`Your existing files differ from the source used for this build. No files were changed. Merge these files before applying the installer:\n${conflicts.map(p => `  ${p}`).join("\n")}`);
  return planned;
}
function atomicWrite(destination, bytes, mode) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.bazcut-install-${crypto.randomUUID()}.tmp`;
  try {
    const fd = fs.openSync(temporary, "wx", mode);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(temporary, destination);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}
function applyInstallation(plan) {
  const written = [];
  try {
    for (const item of plan) {
      // Recheck immediately before replacement so intervening edits are not overwritten.
      const now = fs.existsSync(item.destination) ? fs.readFileSync(item.destination) : null;
      if ((now === null) !== (item.original === null) || now && !now.equals(item.original))
        throw Error(`File changed after preflight: ${item.relative}`);
      atomicWrite(item.destination, item.bytes, item.mode);
      written.push(item);
    }
  } catch (error) {
    const failed = [];
    for (const item of written.reverse()) {
      try {
        const now = fs.readFileSync(item.destination);
        if (!now.equals(item.bytes)) { failed.push(item.relative); continue; }
        if (item.original === null) fs.unlinkSync(item.destination);
        else atomicWrite(item.destination, item.original, item.mode);
      } catch { failed.push(item.relative); }
    }
    throw Error(`${error.message}${failed.length ? `\nRollback could not restore: ${failed.join(", ")}` : "\nEarlier writes were rolled back in memory."}`);
  }
}
module.exports = { digest, planInstallation, applyInstallation };
