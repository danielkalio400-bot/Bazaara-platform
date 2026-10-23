import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";

// Real browser/media integration check. Requires FFmpeg and a Playwright Chromium.
// Optional: BAZCUT_BROWSER_EXECUTABLE and BAZCUT_TEST_OUTPUT for an existing browser/artifact directory.
const require = createRequire(import.meta.url);
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output =
  process.env.BAZCUT_TEST_OUTPUT ||
  (await mkdtemp(path.join(tmpdir(), "bazcut-test-")));
await mkdir(output, { recursive: true });
const fixture = path.join(output, "source.webm");
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "lavfi",
  "-i",
  "testsrc2=size=320x180:rate=30:duration=2",
  "-f",
  "lavfi",
  "-i",
  "sine=frequency=440:sample_rate=48000:duration=2",
  "-c:v",
  "libvpx-vp9",
  "-row-mt",
  "1",
  "-b:v",
  "500k",
  "-c:a",
  "libopus",
  "-shortest",
  "-y",
  fixture,
]);
const port = Number(process.env.BAZCUT_TEST_PORT || 3418);
const origin = `http://127.0.0.1:${port}`;
const vite = path.join(
  path.dirname(require.resolve("vite/package.json")),
  "bin",
  "vite.js",
);
const server = spawn(
  process.execPath,
  [vite, "--config", "vite.config.ts", "--port", String(port)],
  { cwd: app, stdio: "pipe" },
);
let log = "";
server.stdout.on("data", (b) => {
  log += b;
});
server.stderr.on("data", (b) => {
  log += b;
});
let browser, page;
const errors = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw Error(`Vite failed: ${log}`);
    try {
      if ((await fetch(origin)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, `Vite did not start: ${log}`);
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BAZCUT_BROWSER_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-software-rasterizer",
      "--disable-dev-shm-usage",
      "--no-zygote",
    ],
  });
  page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.screenshot({
    path: path.join(output, "home-desktop.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Create a project", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Project name")
    .fill("Browser verification");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page.getByText("Project settings", { exact: true }).click();
  await page.getByLabel("Width", { exact: true }).fill("320");
  await page.getByLabel("Height", { exact: true }).fill("180");
  await page.locator("input[type=file][multiple]").setInputFiles(fixture);
  await page
    .getByText("Media imported and stored on this device.", { exact: true })
    .waitFor();
  await page.getByLabel("Mask", { exact: true }).selectOption("circle");
  await page.getByRole("button", { name: "Captions", exact: true }).click();
  await page
    .locator('input[accept=".srt,.vtt"]')
    .setInputFiles({
      name: "captions.srt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "1\n00:00:00,500 --> 00:00:01,500\nMade with BazCut\n",
      ),
    });
  await page.getByLabel("Caption text", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Caption text", { exact: true }).inputValue(),
    "Made with BazCut",
  );
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByText("Project settings", { exact: true }).click();
  await page
    .getByRole("button", { name: "Save named version", exact: true })
    .click();
  await page.getByText("Named version saved.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Deliver", exact: true }).click();
  await page.getByLabel("Container", { exact: true }).selectOption("webm");
  const download = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "Export video", exact: true }).click();
  const video = path.join(output, "render.webm");
  await (await download).saveAs(video);
  assert.match(
    await page.locator(".bc-render-progress").innerText(),
    /complete.*100%/s,
  );
  const probe = JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-count_frames",
        "-show_entries",
        "format=duration:stream=codec_name,codec_type,width,height,nb_read_frames,sample_rate,channels",
        "-of",
        "json",
        video,
      ],
      { encoding: "utf8" },
    ),
  );
  const v = probe.streams.find((s) => s.codec_type === "video");
  const a = probe.streams.find((s) => s.codec_type === "audio");
  assert.equal(v.width, 320);
  assert.equal(v.height, 180);
  assert.equal(Number(v.nb_read_frames), 60);
  assert.equal(a.channels, 2);
  assert.equal(Number(a.sample_rate), 48000);
  assert.ok(Math.abs(Number(probe.format.duration) - 2) < 0.05);
  const pcm = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      video,
      "-map",
      "0:a:0",
      "-f",
      "f32le",
      "-acodec",
      "pcm_f32le",
      "-",
    ],
    { maxBuffer: 2_000_000 },
  );
  let energy = 0;
  for (let i = 0; i < pcm.length; i += 4) {
    const x = pcm.readFloatLE(i);
    assert.ok(Number.isFinite(x));
    energy += x * x;
  }
  assert.ok(
    Math.sqrt(energy / (pcm.length / 4)) > 0.03,
    "Rendered audio is silent",
  );
  const frame = execFileSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      "0.25",
      "-i",
      video,
      "-frames:v",
      "1",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-",
    ],
    { maxBuffer: 2_000_000 },
  );
  assert.ok(
    frame[0] < 25 && frame[1] < 25 && frame[2] < 35,
    "Circle mask did not render",
  );
  console.log(
    "PASS: import, captions, named version, 60-frame VP9/Opus export, non-silent audio, rendered mask",
  );
  await page.reload();
  await page.getByRole("button", { name: /Browser verification/ }).click();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Select source.webm", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Mask", { exact: true }).inputValue(),
    "circle",
  );
  await page.screenshot({
    path: path.join(output, "editor-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Close inspector", exact: true })
    .click();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: path.join(output, "editor-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Adjust", exact: true }).click();
  await page.getByLabel("Mask", { exact: true }).waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(output, "inspector-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Close inspector", exact: true })
    .click();
  assert.ok(!(await page.getByLabel("Mask", { exact: true }).isVisible()));
  console.log(
    "PASS: persistent media/project reload, mobile layout and touch inspector",
  );
  const moduleBase = `/@fs/${app.replaceAll("\\", "/")}/studio/`;
  const checks = await page.evaluate(async (base) => {
    const { listProjects, listVersions, saveProject, getMedia } = await import(
      `${base}storage.ts`
    );
    const { renderProject, renderWav, capabilities } = await import(
      `${base}render.ts`
    );
    const { MediaPool } = await import(`${base}media.ts`);
    const { packageProject, unpackProject } = await import(`${base}package.ts`);
    const project = (await listProjects())[0];
    const settings = {
      container: "webm",
      codec: "vp9",
      bitrate: 1_000_000,
      width: 320,
      height: 180,
      captions: true,
    };
    const before = JSON.stringify(project);
    const portable = await packageProject(project);
    const imported = await unpackProject(portable);
    const portableValid =
      imported.id !== project.id &&
      imported.assets[0].id !== project.assets[0].id &&
      imported.assets[0].hash === project.assets[0].hash &&
      imported.clips[0].mask === project.clips[0].mask &&
      imported.captions[0].text === project.captions[0].text &&
      (await getMedia(imported.assets[0].id)).size === project.assets[0].size;
    let truncated = "",
      corruptPackage = "";
    try {
      await unpackProject(portable.slice(0, portable.size - 1));
    } catch (error) {
      truncated = error.message;
    }
    const last = new Uint8Array(await portable.slice(-1).arrayBuffer());
    last[0] ^= 255;
    try {
      await unpackProject(
        new Blob([portable.slice(0, portable.size - 1), last]),
      );
    } catch (error) {
      corruptPackage = error.message;
    }
    const controller = new AbortController();
    let cancellation = "";
    try {
      await renderProject(project, settings, controller.signal, (progress) => {
        if (progress.completed >= 5) controller.abort();
      });
    } catch (error) {
      cancellation = error.name;
    }
    const corrupt = structuredClone(project);
    const missingId = crypto.randomUUID();
    corrupt.assets[0].id = missingId;
    corrupt.clips[0].assetId = missingId;
    let missing = "";
    try {
      await renderProject(
        corrupt,
        settings,
        new AbortController().signal,
        () => {},
      );
    } catch (error) {
      missing = error.message;
    }
    const unknown = structuredClone(project);
    unknown.clips[0].extensions = { unrecognizedEffect: { strength: 7 } };
    let unsupported = "",
      unsupportedWav = "";
    try {
      await renderProject(
        unknown,
        settings,
        new AbortController().signal,
        () => {},
      );
    } catch (error) {
      unsupported = error.message;
    }
    try {
      await renderWav(unknown, new AbortController().signal, () => {});
    } catch (error) {
      unsupportedWav = error.message;
    }
    const edited = structuredClone(project);
    edited.revision++;
    edited.name = "Concurrent revision";
    await saveProject(edited, project.revision);
    let conflict = "";
    try {
      await saveProject(
        { ...edited, name: "Stale overwrite" },
        project.revision,
      );
    } catch (error) {
      conflict = error.message;
    }
    const retained = (await listProjects())[0];
    const restored = { ...project, revision: edited.revision + 1 };
    await saveProject(restored, edited.revision);
    const pool = new MediaPool();
    let closed = "";
    await pool.source(project.assets[0]);
    pool.dispose();
    try {
      await pool.source(project.assets[0]);
    } catch (error) {
      closed = error.message;
    }
    return {
      portableValid,
      truncated,
      corruptPackage,
      cancellation,
      missing,
      unsupported,
      unsupportedWav,
      conflict,
      retainedName: retained.name,
      unchanged: before === JSON.stringify(project),
      versions: (await listVersions(project.id)).length,
      mediaSize: (await getMedia(project.assets[0].id)).size,
      closed,
      capabilities: await capabilities(project),
    };
  }, moduleBase);
  assert.equal(checks.cancellation, "AbortError");
  assert.match(checks.missing, /Missing media/);
  assert.ok(checks.portableValid);
  assert.match(checks.truncated, /truncated/);
  assert.match(checks.corruptPackage, /checksum mismatch/);
  assert.match(checks.unsupported, /unsupported data/);
  assert.match(checks.unsupportedWav, /unsupported data/);
  assert.match(checks.conflict, /SAVE_CONFLICT/);
  assert.equal(checks.retainedName, "Concurrent revision");
  assert.ok(checks.unchanged && checks.versions > 0 && checks.mediaSize > 0);
  assert.match(checks.closed, /closed/);
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(output, "result.json"),
    JSON.stringify(
      { passed: true, browser: await browser.version(), probe, checks },
      null,
      2,
    ),
  );
  console.log(
    "PASS: cancellation, missing-original rejection, unknown-effect protection, conflict protection, media-session cleanup",
  );
  console.log(
    "PASS: portable project/originals roundtrip and rejection of truncated/corrupt packages",
  );
  console.log(`Artifacts: ${output}`);
} catch (error) {
  if (page)
    await page
      .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
      .catch(() => {});
  throw error;
} finally {
  await browser?.close();
  server.kill();
}
