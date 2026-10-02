/** Starts only the chosen local development targets; never runs production migrations. */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const group = process.argv[2] || "core";
const groups = {
  core: ["@bazaara/platform-api", "@bazaara/bazid-web", "@bazaara/bazchat-web", "@bazaara/bazcircle-web", "@bazaara/bazforum-web"],
  media: ["@bazaara/bazclips-web", "@bazaara/baztune-web", "@bazaara/bazcut-web", "@bazaara/bazsend-web"],
  all: ["@bazaara/platform-api", "@bazaara/bazid-web", "@bazaara/bazchat-web", "@bazaara/bazcircle-web", "@bazaara/bazforum-web", "@bazaara/bazclips-web", "@bazaara/baztune-web", "@bazaara/bazcut-web", "@bazaara/bazsend-web"],
};
if (!(group in groups)) { console.error("Usage: node scripts/e2-dev.mjs [core|media|all]"); process.exit(2); }
const children = [];
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
for (const name of groups[group]) {
  const child = spawn(npm, ["run", "dev", `--workspace=${name}`], { cwd: root, env: process.env, stdio: "inherit", shell: process.platform === "win32" });
  children.push(child);
  child.on("error", (err) => console.error(`${name}: ${err.message}`));
}
const stop = () => { for (const child of children) if (child.exitCode === null) child.kill("SIGTERM"); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
console.log(`[BAZAARA E2] Started ${children.length} local workspaces (${group}). Ctrl+C to stop.`);
