import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// Own a fresh simulator so this test never changes a developer's app data.
assert.equal(process.platform, "darwin", "This check requires Xcode on macOS.");
assert.equal(process.env.CI, "true", "Use a disposable CI host.");
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleId = "app.bazaara.bazcut";
function command(
  binary,
  args,
  { allowFailure = false, timeout = 60_000 } = {},
) {
  const label = [binary, ...args.slice(0, binary === "xcrun" ? 2 : 1)].join(
    " ",
  );
  const started = Date.now();
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    timeout,
    maxBuffer: 2 * 1024 * 1024,
  });
  if (!allowFailure && (result.error || result.status !== 0))
    throw Error(
      `${label} failed after ${((Date.now() - started) / 1000).toFixed(1)}s: ${result.error?.message || result.stderr || result.stdout}`,
    );
  return result.stdout.trim();
}
const simctl = (args, options) => {
  console.log(
    `Simulator ${args[0]}${args[1] === "devices" || args[1] === "runtimes" ? ` ${args[1]}` : ""}`,
  );
  return command("xcrun", ["simctl", ...args], options);
};
const products = path.join(app, "src-tauri/gen/apple/build");
let bundle;
for (const item of await readdir(products, { withFileTypes: true })) {
  if (!item.isDirectory()) continue;
  const candidate = path.join(products, item.name, "BazCut.app");
  try {
    await access(path.join(candidate, "Info.plist"));
  } catch {
    continue;
  }
  const id = command("/usr/bin/plutil", [
    "-extract",
    "CFBundleIdentifier",
    "raw",
    "-o",
    "-",
    path.join(candidate, "Info.plist"),
  ]);
  const platform = command("/usr/bin/plutil", [
    "-extract",
    "CFBundleSupportedPlatforms.0",
    "raw",
    "-o",
    "-",
    path.join(candidate, "Info.plist"),
  ]);
  if (id === bundleId && platform === "iPhoneSimulator") {
    bundle = candidate;
    break;
  }
}
assert.ok(bundle, "The compiled BazCut simulator app is missing.");
const { devices } = JSON.parse(
  simctl(["list", "devices", "available", "--json"]),
);
const runtimes = JSON.parse(simctl(["list", "runtimes", "--json"]))
  .runtimes.filter(
    (runtime) =>
      runtime.isAvailable &&
      runtime.identifier.includes(".iOS-") &&
      Number(runtime.version.split(".")[0]) >= 17,
  )
  .sort((a, b) =>
    b.version.localeCompare(a.version, undefined, { numeric: true }),
  );
const runtime = runtimes.find((item) =>
  devices[item.identifier]?.some(
    (device) =>
      device.isAvailable &&
      device.name.startsWith("iPhone") &&
      device.deviceTypeIdentifier,
  ),
);
assert.ok(runtime, "No available iPhone simulator runtime was found.");
const seed = devices[runtime.identifier].find(
  (device) =>
    device.isAvailable &&
    device.name.startsWith("iPhone") &&
    device.deviceTypeIdentifier,
);
const device = simctl([
  "create",
  `BazCut CI ${randomUUID().slice(0, 8)}`,
  seed.deviceTypeIdentifier,
  runtime.identifier,
]);
assert.match(device, /^[A-F0-9-]{36}$/i);

async function findDatabase(directory, depth = 0) {
  if (depth > 7) return null;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isFile() && entry.name === "bazcut.sqlite3") return file;
    if (entry.isDirectory() && !["Caches", "WebKit"].includes(entry.name)) {
      const found = await findDatabase(file, depth + 1);
      if (found) return found;
    }
  }
  return null;
}
function assertAlive(pid) {
  assert.ok(
    Number.isSafeInteger(pid) && pid > 0,
    "No native application process ID.",
  );
  process.kill(pid, 0);
}
function launch() {
  const result = simctl(["launch", device, bundleId]);
  const pid = Number(result.match(/:\s*(\d+)\s*$/)?.[1]);
  assertAlive(pid);
  return pid;
}
try {
  simctl(["boot", device]);
  simctl(["bootstatus", device, "-b"], { timeout: 180_000 });
  simctl(["install", device, bundle], { timeout: 240_000 });
  let pid = launch();
  const container = simctl(["get_app_container", device, bundleId, "data"]);
  let database;
  for (let i = 0; i < 60; i++) {
    assertAlive(pid);
    database = await findDatabase(container);
    if (database) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(
    database,
    "Native project storage was not initialized after launch.",
  );
  const bytes = await readFile(database);
  assert.equal(bytes.subarray(0, 16).toString(), "SQLite format 3\0");
  const inspect = () =>
    command("/usr/bin/sqlite3", [
      "-readonly",
      database,
      "PRAGMA integrity_check; PRAGMA journal_mode; SELECT name FROM sqlite_master WHERE type='table' AND name IN ('projects','versions','journals') ORDER BY name;",
    ]);
  assert.equal(inspect(), "ok\nwal\njournals\nprojects\nversions");
  await access(path.join(path.dirname(database), "media"));
  await access(path.join(path.dirname(database), "exports"));
  // Termination and relaunch exercise the existing database initialization path.
  simctl(["terminate", device, bundleId]);
  pid = launch();
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assertAlive(pid);
  assert.equal(inspect(), "ok\nwal\njournals\nprojects\nversions");
  const screenshot = path.join(
    process.env.RUNNER_TEMP || tmpdir(),
    "bazcut-ios-launch.png",
  );
  simctl(["io", device, "screenshot", screenshot]);
  const png = await readFile(screenshot);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0);
  console.log(
    `PASS: iOS ${runtime.version} simulator install, native launch, SQLite WAL/schema/integrity, export storage, terminate/relaunch and screenshot capture`,
  );
} catch (error) {
  console.error(
    simctl(
      [
        "spawn",
        device,
        "log",
        "show",
        "--last",
        "1m",
        "--style",
        "compact",
        "--predicate",
        'process == "BazCut" OR process == "installd"',
      ],
      { allowFailure: true, timeout: 15_000 },
    ).slice(-12_000),
  );
  throw error;
} finally {
  simctl(["shutdown", device], { allowFailure: true });
  simctl(["delete", device], { allowFailure: true });
}
