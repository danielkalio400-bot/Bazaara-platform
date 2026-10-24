import assert from "node:assert/strict";

// Test the real storage module with a controlled native bridge. Native filesystem
// and installer behavior are verified separately by Rust and Windows CI checks.
export async function verifyNativeDelivery(page, moduleBase) {
  const result = await page.evaluate(async (base) => {
    const { download } = await import(`${base}/storage.ts`);
    const originalFlag = globalThis.isTauri;
    const originalBridge = window.__TAURI_INTERNALS__;
    const calls = [];
    let scenario = "cancelled",
      finishShare,
      signalShare;
    const shareOpened = new Promise((resolve) => {
      signalShare = resolve;
    });
    globalThis.isTauri = true;
    window.__TAURI_INTERNALS__ = {
      invoke: async (command, args) => {
        calls.push({ command, args });
        if (command === "append_media" && scenario === "write-failure")
          throw Error("Disk full");
        if (command === "discard_export" && scenario === "cleanup-failure")
          throw Error("Cleanup failed");
        if (command !== "plugin:bazcut-share|share") return;
        if (scenario === "cancelled") {
          signalShare();
          return new Promise((resolve) => {
            finishShare = resolve;
          });
        }
        if (scenario === "save-failure") throw Error("Destination full");
        return ["saved", "cleanup-failure"].includes(scenario)
          ? { saved: true, path: "C:/test/output.webm" }
          : { saved: true };
      },
    };
    try {
      let settled = false;
      const pending = download(
        "test:/output.webm",
        new Blob(["rendered"], { type: "video/webm" }),
      ).then((value) => {
        settled = true;
        return value;
      });
      await shareOpened;
      const waited = !settled;
      finishShare({ saved: false });
      const cancelled = await pending;
      const cancelCalls = calls.map((item) => item.command);
      const safeName = calls.find(
        (item) => item.command === "plugin:bazcut-share|share",
      ).args.payload.name;
      scenario = "saved";
      const saved = await download("saved.webm", "rendered");
      scenario = "shared";
      const shared = await download("shared.webm", "rendered");
      scenario = "save-failure";
      let saveError = "",
        writeError = "",
        cleanupError = "";
      try {
        await download("failed.webm", "rendered");
      } catch (error) {
        saveError = String(error);
      }
      scenario = "write-failure";
      calls.length = 0;
      try {
        await download("failed.webm", "rendered");
      } catch (error) {
        writeError = String(error);
      }
      const writeCalls = calls.map((item) => item.command);
      scenario = "cleanup-failure";
      try {
        await download("saved.webm", "rendered");
      } catch (error) {
        cleanupError = String(error);
      }
      return {
        waited,
        cancelled,
        saved,
        shared,
        cancelCalls,
        writeCalls,
        safeName,
        saveError,
        writeError,
        cleanupError,
      };
    } finally {
      globalThis.isTauri = originalFlag;
      window.__TAURI_INTERNALS__ = originalBridge;
    }
  }, moduleBase);
  assert.ok(result.waited);
  assert.equal(result.cancelled, "cancelled");
  assert.equal(result.saved, "saved");
  assert.equal(result.shared, "share-prepared");
  assert.equal(result.safeName, "test__output.webm");
  assert.deepEqual(result.cancelCalls, [
    "begin_media",
    "append_media",
    "finish_media",
    "plugin:bazcut-share|share",
    "discard_export",
  ]);
  assert.deepEqual(result.writeCalls, [
    "begin_media",
    "append_media",
    "cancel_media",
    "discard_export",
  ]);
  assert.match(result.saveError, /Destination full/);
  assert.match(result.writeError, /Disk full/);
  assert.match(
    result.cleanupError,
    /File saved.*Temporary-file cleanup failed/,
  );
  console.log(
    "PASS: native delivery waits for completion; cancellation, write/save errors and isolated cleanup",
  );
  return result;
}
