import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// This creates test projects in the disposable CI user's native app data.
// Never run against a developer's personal BazCut data directory.
assert.equal(process.platform, "win32", "This check requires Windows.");
assert.equal(
  process.env.CI,
  "true",
  "Run this check only on a disposable CI host.",
);
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const executable =
  process.env.BAZCUT_TEST_EXECUTABLE ||
  path.join(app, "src-tauri/target/x86_64-pc-windows-msvc/debug/bazcut.exe");
const portServer = createServer();
await new Promise((resolve, reject) => {
  portServer.once("error", reject);
  portServer.listen(0, "127.0.0.1", resolve);
});
const port = portServer.address().port;
await new Promise((resolve) => portServer.close(resolve));
const profile = await mkdtemp(path.join(tmpdir(), "bazcut-webview-check-"));
// Elevated CI hosts ignore WebView2 environment/HKCU overrides. Apply an
// app-specific HKLM test policy; never add debugging flags to the app bundle.
// https://learn.microsoft.com/microsoft-edge/webview2/concepts/security
const policyRoot = "HKLM\\Software\\Policies\\Microsoft\\Edge\\WebView2";
const testPolicies = [];
function installTestPolicy(name, value) {
  const key = `${policyRoot}\\${name}`;
  const query = spawnSync(
    "reg.exe",
    ["query", key, "/v", "bazcut.exe", "/reg:64"],
    { encoding: "utf8" },
  );
  assert.notEqual(
    query.status,
    0,
    `Refusing to overwrite existing ${name} policy.`,
  );
  const result = spawnSync(
    "reg.exe",
    ["add", key, "/v", "bazcut.exe", "/t", "REG_SZ", "/d", value, "/reg:64"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  testPolicies.push(key);
}
let processHandle;
let output = "",
  startError,
  browser;
try {
  installTestPolicy(
    "AdditionalBrowserArguments",
    `--remote-debugging-port=${port} --remote-debugging-address=127.0.0.1`,
  );
  installTestPolicy("UserDataFolder", profile);
  processHandle = spawn(executable, [], {
    cwd: app,
    env: {
      ...process.env,
    },
    stdio: "pipe",
  });
  processHandle.once("error", (error) => {
    startError = error;
  });
  processHandle.stdout.on("data", (chunk) => {
    output += chunk;
  });
  processHandle.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const endpoint = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 180; i++) {
    if (startError) throw startError;
    if (processHandle.exitCode !== null)
      throw Error(`BazCut exited: ${output}`);
    try {
      if ((await fetch(`${endpoint}/json/version`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) {
    const diagnostics = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `
      Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('bazcut.exe', 'msedgewebview2.exe') } | Select-Object Name, ProcessId, ParentProcessId, CommandLine | Format-List
      Add-Type -AssemblyName UIAutomationClient
      Add-Type -AssemblyName UIAutomationTypes
      $condition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, ${processHandle.pid})
      [System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condition) | ForEach-Object { $_.Current.Name }
    `,
      ],
      { encoding: "utf8", timeout: 15000 },
    );
    throw Error(
      `WebView2 did not open. Application output: ${output}\nStartup diagnostics: ${diagnostics.stdout}\n${diagnostics.stderr}`,
    );
  }
  browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts()[0];
  const page = context.pages()[0] ?? (await context.waitForEvent("page"));
  page.setDefaultTimeout(30_000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("button", { name: "Create a project", exact: true })
    .click();
  const name = `Native verification ${randomUUID().slice(0, 8)}`;
  await page.getByRole("dialog").getByLabel("Project name").fill(name);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const original = await readFile(
    path.join(app, "src-tauri/icons/128x128.png"),
  );
  await page.locator("input[type=file][multiple]").setInputFiles({
    name: "native-source.png",
    mimeType: "image/png",
    buffer: original,
  });
  await page
    .getByText("Media imported and stored on this device.", { exact: true })
    .waitFor();
  await page.getByLabel("Mask", { exact: true }).selectOption("circle");
  await page.getByLabel("Position X (%)", { exact: true }).fill("10");
  await page.waitForFunction(() => {
    const canvas = document.querySelector(
      '[aria-label="Project video preview"]',
    );
    if (!canvas?.width) return false;
    const pixels = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 2; i < pixels.length; i += 4) if (pixels[i] > 100) return true;
    return false;
  });
  await page.getByText("Project settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Save named version", exact: true })
    .click();
  await page.getByText("Named version saved.", { exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page
    .getByRole("button", { name: "Select native-source.png", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Mask", { exact: true }).inputValue(),
    "circle",
  );
  assert.equal(
    await page.getByLabel("Position X (%)", { exact: true }).inputValue(),
    "10",
  );
  assert.ok(
    await page.getByRole("button", { name: "Undo", exact: true }).isEnabled(),
  );
  const saved = await page.evaluate(async (name) => {
    const invoke = window.__TAURI_INTERNALS__.invoke;
    const project = (await invoke("list_projects")).find(
      (item) => item.name === name,
    );
    return {
      project,
      path: await invoke("media_path", { id: project.assets[0].id }),
      versions: await invoke("list_versions", { id: project.id }),
      history: await invoke("load_history", { id: project.id }),
    };
  }, name);
  assert.equal(
    saved.project.assets[0].hash,
    createHash("sha256").update(original).digest("hex"),
  );
  assert.deepEqual(await readFile(saved.path), original);
  assert.equal(saved.versions.length, 1);
  assert.ok(saved.history.past.length > 0);
  const database = await readFile(
    path.join(path.dirname(path.dirname(saved.path)), "bazcut.sqlite3"),
  );
  assert.equal(database.subarray(0, 16).toString(), "SQLite format 3\0");
  const temporary = await page.evaluate(
    async ({ bytes, hash, originalId }) => {
      const invoke = window.__TAURI_INTERNALS__.invoke;
      const id = `export-${crypto.randomUUID()}`;
      await invoke("begin_media", { id });
      await invoke("append_media", { id, offset: 0, data: bytes });
      await invoke("finish_media", { id, hash, size: bytes.length });
      const file = await invoke("media_path", { id });
      await invoke("discard_export", { id });
      const removed = (await invoke("media_path", { id })) === null;
      let originalProtected = false;
      try {
        await invoke("discard_export", { id: originalId });
      } catch {
        originalProtected = true;
      }
      return { file, removed, originalProtected };
    },
    {
      bytes: Array.from(original),
      hash: saved.project.assets[0].hash,
      originalId: saved.project.assets[0].id,
    },
  );
  assert.equal(path.basename(path.dirname(temporary.file)), "exports");
  assert.ok(temporary.removed && temporary.originalProtected);
  await assert.rejects(readFile(temporary.file), { code: "ENOENT" });
  assert.deepEqual(await readFile(saved.path), original);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: packaged Windows WebView2 launch, native SHA-256 media import/preview, SQLite save/reopen, named version, persisted undo and isolated export cleanup",
  );
} finally {
  await browser?.close().catch(() => {});
  if (processHandle?.pid)
    spawnSync("taskkill", ["/pid", String(processHandle.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  for (const key of testPolicies) {
    const result = spawnSync(
      "reg.exe",
      ["delete", key, "/v", "bazcut.exe", "/f", "/reg:64"],
      { encoding: "utf8" },
    );
    assert.equal(
      result.status,
      0,
      `Test policy cleanup failed: ${result.stdout}${result.stderr}`,
    );
  }
}
