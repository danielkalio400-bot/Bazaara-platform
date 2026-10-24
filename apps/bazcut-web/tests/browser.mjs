import assert from "node:assert/strict";
import { verifyNativeDelivery } from "./native-delivery.mjs";
import { verifyColorScopes } from "./color-scopes.mjs";
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
  await verifyColorScopes(page, output);
  await page.getByRole("button", { name: "Captions", exact: true }).click();
  await page.locator('input[accept=".srt,.vtt"]').setInputFiles({
    name: "captions.srt",
    mimeType: "text/plain",
    buffer: Buffer.from("1\n00:00:00,500 --> 00:00:01,500\nMade with BazCut\n"),
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
  const studioBase = `/@fs/${app.replaceAll("\\", "/")}/studio/`;
  const waitClips = (count) =>
    page.waitForFunction(
      async ({ base, count }) => {
        const { listProjects } = await import(`${base}storage.ts`);
        return (await listProjects())[0]?.clips.length === count;
      },
      { base: studioBase, count },
    );
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("button", { name: "Open source source.webm", exact: true })
    .click();
  await page.getByLabel("Source in frame", { exact: true }).fill("15");
  await page.getByLabel("Source out frame", { exact: true }).fill("45");
  await page.screenshot({
    path: path.join(output, "source-monitor.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Insert range", exact: true }).click();
  await waitClips(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await waitClips(1);
  await page.reload();
  await page.getByRole("button", { name: /Browser verification/ }).click();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  assert.ok(
    await page.getByRole("button", { name: "Redo", exact: true }).isEnabled(),
  );
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await waitClips(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await waitClips(1);
  const playhead = page.getByLabel("Timeline playhead", { exact: true });
  await playhead.focus();
  await playhead.press("End");
  await page.locator(".bc-preview-stage").click();
  const lastFrame = Number(await playhead.inputValue());
  await page.keyboard.press("j");
  await page.waitForFunction(
    (last) =>
      Number(document.querySelector('[aria-label="Timeline playhead"]').value) <
      last - 2,
    lastFrame,
  );
  await page.keyboard.press("j");
  await page.getByText("Reverse 2×", { exact: true }).waitFor();
  await page.keyboard.press("k");
  const stoppedFrame = Number(await playhead.inputValue());
  await page.waitForTimeout(150);
  assert.equal(Number(await playhead.inputValue()), stoppedFrame);
  await page.keyboard.press("l");
  await page.waitForFunction(
    (last) =>
      Number(document.querySelector('[aria-label="Timeline playhead"]').value) >
      last,
    lastFrame === stoppedFrame ? 0 : stoppedFrame,
  );
  await page.keyboard.press("k");
  await playhead.focus();
  await playhead.press("Home");
  await page.locator(".bc-preview-stage").click();
  console.log(
    "PASS: source-range insert, persisted undo/redo, reverse/forward shuttle, K stop",
  );

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
    const {
      listProjects,
      listVersions,
      saveProject,
      getMedia,
      putMedia,
      loadHistory,
    } = await import(`${base}storage.ts`);
    const { renderProject, renderWav, capabilities, drawFrame } = await import(
      `${base}render.ts`
    );
    const { MediaPool, inspectMedia, mixAudio } = await import(
      `${base}media.ts`
    );
    const { newProject, newClip, ticks, validateProject } = await import(
      `${base}model.ts`
    );
    const { EFFECTS, PARENT } = await import(`${base}motion.ts`);
    const { TIME_MAP } = await import(`${base}time-map.ts`);
    const { MATTE } = await import(`${base}matte.ts`);
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
    const recovered = await loadHistory(project);
    const historyRecovered =
      !!recovered && recovered.past.length + recovered.future.length > 0;
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
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d", { willReadFrequently: true }),
      pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
    const motionProject = newProject("Motion render check");
    motionProject.width = 64;
    motionProject.height = 64;
    motionProject.background = "#000000";
    const shape = newClip(motionProject.tracks[0].id, 0, undefined, "shape");
    shape.background = "#ff0000";
    shape.duration = ticks(0.1);
    shape.extensions = {
      [EFFECTS]: [
        {
          id: "dark",
          type: "brightness",
          amount: 0.5,
          enabled: true,
          keyframes: [],
        },
        {
          id: "invert",
          type: "invert",
          amount: 1,
          enabled: true,
          keyframes: [],
        },
      ],
    };
    motionProject.clips = [shape];
    validateProject(motionProject);
    const motionPool = new MediaPool();
    await drawFrame(canvas, motionProject, motionPool, 0);
    const firstOrder = pixel(32, 32);
    shape.extensions[EFFECTS].reverse();
    await drawFrame(canvas, motionProject, motionPool, 0);
    const secondOrder = pixel(32, 32);
    const effectOrder = firstOrder[1] > secondOrder[1] + 80;
    const parent = newClip(motionProject.tracks[0].id, 0, undefined, "shape");
    parent.duration = ticks(0.1);
    parent.x = 0.25;
    parent.opacity = 0;
    shape.background = "#ffffff";
    shape.scale = 0.25;
    shape.extensions = { [PARENT]: { id: parent.id, inheritOpacity: false } };
    motionProject.clips = [parent, shape];
    validateProject(motionProject);
    await drawFrame(canvas, motionProject, motionPool, 0);
    const parentPreview = pixel(48, 32)[0] > 240 && pixel(32, 32)[0] < 10;
    const encoded = await renderProject(
      motionProject,
      { ...settings, width: 64, height: 64 },
      new AbortController().signal,
      () => {},
    );
    const encodedAsset = await inspectMedia(
      new File([encoded.blob], "motion.webm", { type: "video/webm" }),
    );
    await putMedia(encodedAsset, encoded.blob);
    const decoded = await motionPool.frame(encodedAsset, 0);
    context.drawImage(decoded, 0, 0, 64, 64);
    const parentingMatchesExport =
      parentPreview && pixel(48, 32)[0] > 200 && pixel(32, 32)[0] < 40;
    // A transformed red matte distinguishes luma from alpha and detects a
    // source layer accidentally being painted over its consumer.
    shape.scale = 2;
    parent.opacity = 1;
    parent.scale = 0.5;
    parent.shape = "ellipse";
    parent.background = "#ff0000";
    shape.extensions = {
      [MATTE]: { id: parent.id, mode: "alpha", hideSource: true },
    };
    motionProject.clips = [shape, parent];
    const mattePixels = {};
    for (const mode of ["alpha", "alpha-inverted", "luma", "luma-inverted"]) {
      shape.extensions[MATTE].mode = mode;
      validateProject(motionProject);
      await drawFrame(canvas, motionProject, motionPool, 0);
      mattePixels[mode] = { inside: pixel(48, 32), outside: pixel(32, 32) };
    }
    const cutout = newClip(parent.trackId, 0, undefined, "shape");
    cutout.x = 0.25;
    cutout.scale = 0.125;
    cutout.shape = "ellipse";
    cutout.background = "#ffffff";
    cutout.duration = ticks(0.1);
    parent.extensions = {
      [MATTE]: { id: cutout.id, mode: "alpha", hideSource: true },
    };
    motionProject.clips.push(cutout);
    shape.extensions[MATTE].mode = "alpha";
    await drawFrame(canvas, motionProject, motionPool, 0);
    const nestedMatte = pixel(48, 32)[0] > 240 && pixel(54, 32)[0] < 10;
    parent.duration = ticks(0.05);
    await drawFrame(canvas, motionProject, motionPool, ticks(0.08));
    const inactiveMatte = pixel(48, 32)[0] < 10;
    parent.duration = ticks(0.1);
    parent.extensions = undefined;
    motionProject.clips = [shape, parent];
    const matteExport = await renderProject(
      motionProject,
      { ...settings, width: 64, height: 64 },
      new AbortController().signal,
      () => {},
    );
    const matteAsset = await inspectMedia(
      new File([matteExport.blob], "matte.webm", { type: "video/webm" }),
    );
    await putMedia(matteAsset, matteExport.blob);
    context.drawImage(await motionPool.frame(matteAsset, 0), 0, 0, 64, 64);
    const mattesMatchExport = pixel(48, 32)[0] > 200 && pixel(32, 32)[0] < 40;
    const portableMatte = await unpackProject(
      await packageProject(motionProject),
    );
    const mattePackage =
      portableMatte.clips[0].extensions[MATTE].id === portableMatte.clips[1].id;
    const mapped = structuredClone(project);
    mapped.clips[0].extensions = {
      [TIME_MAP]: {
        points: [
          { at: 0, source: ticks(1), easing: "hold" },
          { at: ticks(0.5), source: ticks(1), easing: "linear" },
          { at: mapped.clips[0].duration, source: 0, easing: "linear" },
        ],
      },
    };
    validateProject(mapped);
    const frozen = await mixAudio(mapped, motionPool, 0, 24000),
      moving = await mixAudio(mapped, motionPool, 30000, 4096);
    const remapAudio =
      frozen.getChannelData(0).every((x) => x === 0) &&
      moving.getChannelData(0).some((x) => Math.abs(x) > 0.005);
    motionPool.dispose();
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
      historyRecovered,
      effectOrder,
      parentingMatchesExport,
      mattePixels,
      nestedMatte,
      inactiveMatte,
      mattesMatchExport,
      mattePackage,
      remapAudio,
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
  assert.ok(
    checks.historyRecovered &&
      checks.effectOrder &&
      checks.parentingMatchesExport &&
      checks.remapAudio,
    JSON.stringify(checks),
  );
  assert.equal(checks.cancellation, "AbortError");
  assert.ok(
    checks.nestedMatte &&
      checks.inactiveMatte &&
      checks.mattesMatchExport &&
      checks.mattePackage,
    JSON.stringify(checks),
  );
  assert.ok(
    checks.mattePixels.alpha.inside[0] > 240 &&
      checks.mattePixels.alpha.outside[0] < 10,
  );
  assert.ok(
    checks.mattePixels["alpha-inverted"].inside[0] < 10 &&
      checks.mattePixels["alpha-inverted"].outside[0] > 240,
  );
  assert.ok(
    Math.abs(checks.mattePixels.luma.inside[0] - 54) <= 2 &&
      checks.mattePixels.luma.outside[0] < 10,
  );
  assert.ok(
    Math.abs(checks.mattePixels["luma-inverted"].inside[0] - 201) <= 2 &&
      checks.mattePixels["luma-inverted"].outside[0] > 240,
  );
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
  await verifyNativeDelivery(page, moduleBase);
  // A separate touch context exercises actual tap input and coarse-pointer CSS.
  page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page
    .getByRole("button", { name: "Create a project", exact: true })
    .tap();
  await page
    .getByRole("dialog")
    .getByLabel("Project name")
    .fill("Touch motion verification");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create project", exact: true })
    .tap();
  await page.locator("input[type=file][multiple]").setInputFiles(fixture);
  await page
    .getByText("Media imported and stored on this device.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Motion", exact: true }).tap();
  await page.getByRole("button", { name: "Adjust", exact: true }).tap();
  await page.getByRole("button", { name: "Add effect", exact: true }).tap();
  await page.getByLabel("Effect 1 amount", { exact: true }).fill("1.25");
  await page
    .getByRole("button", { name: "Keyframe at playhead", exact: true })
    .tap();
  await page.getByLabel("Effect 1 key 1 value", { exact: true }).fill("0.8");
  await page
    .getByLabel("Effect 1 key 1 easing", { exact: true })
    .selectOption("easeInOut");
  await page.getByLabel("Effect type", { exact: true }).selectOption("invert");
  await page.getByRole("button", { name: "Add effect", exact: true }).tap();
  await page
    .getByRole("button", { name: "Move effect 2 up", exact: true })
    .tap();
  const invert = page.getByLabel("Enable Invert effect 1", { exact: true });
  assert.ok(await invert.isChecked());
  await invert.tap();
  assert.ok(!(await invert.isChecked()));
  const removeEffect = page.getByRole("button", {
    name: "Remove effect 1",
    exact: true,
  });
  const touchBounds = await removeEffect.boundingBox();
  assert.ok(touchBounds.width >= 44 && touchBounds.height >= 44);
  await removeEffect.tap();
  await page
    .getByRole("button", { name: "Enable time remapping", exact: true })
    .tap();
  await page.getByLabel("Time key 1 source seconds", { exact: true }).fill("1");
  await page
    .getByLabel("Time key 1 easing", { exact: true })
    .selectOption("hold");
  await page.getByLabel("Time key 2 source seconds", { exact: true }).fill("0");
  await page
    .getByRole("img", { name: "Source time curve", exact: true })
    .scrollIntoViewIfNeeded();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: path.join(output, "motion-touch.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Close inspector", exact: true })
    .tap();
  await page.getByRole("button", { name: "Text", exact: true }).tap();
  await page.getByLabel("Title text", { exact: true }).fill("Parented title");
  await page
    .getByLabel("Transform parent", { exact: true })
    .selectOption({ label: "source.webm" });
  await page.getByLabel("Inherit parent opacity", { exact: true }).uncheck();
  await page
    .getByLabel("Matte source", { exact: true })
    .selectOption({ label: "source.webm" });
  await page
    .getByLabel("Matte mode", { exact: true })
    .selectOption("luma-inverted");
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  const touchMotion = await page.evaluate(async (base) => {
    const { listProjects } = await import(`${base}storage.ts`);
    const project = (await listProjects())[0];
    const source = project.clips.find((clip) => clip.kind === "video"),
      title = project.clips.find((clip) => clip.kind === "text");
    return {
      sourceId: source.id,
      effects: source.extensions["bazcut.effects.v1"],
      timeMap: source.extensions["bazcut.time.v1"],
      parent: title.extensions["bazcut.parent.v1"],
      matte: title.extensions["bazcut.matte.v1"],
    };
  }, moduleBase);
  assert.equal(touchMotion.effects.length, 1);
  assert.equal(touchMotion.effects[0].type, "brightness");
  assert.equal(touchMotion.effects[0].amount, 1.25);
  assert.equal(touchMotion.effects[0].keyframes[0].value, 0.8);
  assert.equal(touchMotion.effects[0].keyframes[0].easing, "easeInOut");
  assert.equal(touchMotion.timeMap.points[0].easing, "hold");
  assert.equal(touchMotion.timeMap.points[1].source, 0);
  assert.deepEqual(touchMotion.parent, {
    id: touchMotion.sourceId,
    inheritOpacity: false,
  });
  assert.deepEqual(touchMotion.matte, {
    id: touchMotion.sourceId,
    mode: "luma-inverted",
    hideSource: true,
  });
  await page.reload();
  await page.getByRole("button", { name: /Touch motion verification/ }).tap();
  await page.getByText("Saved on this device", { exact: true }).waitFor();
  console.log(
    "PASS: touch effect ordering/bypass/keyframes, time-map editing and persisted parenting",
  );
  await page
    .getByRole("button", { name: "Select source.webm", exact: true })
    .tap();
  await page.getByRole("button", { name: "Color", exact: true }).tap();
  await page.getByLabel("Color scope", { exact: true }).selectOption("parade");
  const touchScope = page.getByRole("img", {
    name: "RGB parade of the preview",
    exact: true,
  });
  await touchScope.scrollIntoViewIfNeeded();
  const scopeBounds = await touchScope.boundingBox();
  assert.ok(
    scopeBounds &&
      scopeBounds.x >= 0 &&
      scopeBounds.x + scopeBounds.width <= 390,
  );
  await page.screenshot({
    path: path.join(output, "color-scopes-touch.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await writeFile(
    path.join(output, "result.json"),
    JSON.stringify(
      {
        passed: true,
        browser: await browser.version(),
        probe,
        checks,
        touchMotion,
      },
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
  console.log(
    "PASS: ordered effect pixels, parent preview/export agreement, frozen/remapped audio",
  );
  console.log(`Artifacts: ${output}`);
  console.log(
    "PASS: alpha/luma/inverted/nested matte pixels, source timing, portable references and encoded export agreement",
  );
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
