# BazCut 2.0 development

The canonical editor lives in this directory. React/TypeScript powers the Next.js entry and the native Tauri entry; Rust owns native transactional project storage and original-media integrity checks.

This is an incomplete development implementation of `BazCut_2.0_Complete_Master_Specification_2026.pdf`. See `release-status.json` for the acceptance matrix. It is not a production release, and no signed Android, iOS, or Windows build has been qualified.

## Develop and verify

From the repository root:

```powershell
npm ci
npm run studio --workspace=@bazaara/bazcut-web
npm run check:studio --workspace=@bazaara/bazcut-web
npm run test:studio --workspace=@bazaara/bazcut-web
npm run test:engine --workspace=@bazaara/bazcut-web
npm run bundle --workspace=@bazaara/bazcut-web
npm run test:browser --workspace=@bazaara/bazcut-web
```

The browser integration suite requires FFmpeg and Playwright Chromium. Set `BAZCUT_BROWSER_EXECUTABLE` to use an already installed Chromium executable. `BAZCUT_TEST_OUTPUT` selects its test-artifact directory.

The current preview/export engine uses Canvas2D and WebCodecs through Mediabunny. Codec availability depends on the host WebView. The native Rust/wgpu media compositor, native codec fallback, background rendering, 3D, Nova, production collaboration, account integration, billing, marketplace, and publishing remain unfinished.

## Editing additions

The media library opens a source monitor with frame-based in/out marks, preview audio, and insert/overwrite into an unlocked compatible track. J/K/L shuttles backward, stops, or shuttles forward; repeated J/L reaches 16x. Space plays or pauses at normal speed.

The Motion inspector includes ordered, bypassable color/effect stacks, effect keyframes, acyclic visual parenting with optional opacity inheritance, and a source-time curve for holds, reversals, and speed ramps. Preview and video export use the same evaluator. Frozen time-map segments are silent; other speed changes affect audio pitch. Splits and trims retain the original animation/time-curve origin.

Verification on the development host: 28 TypeScript tests, 9 Rust tests, strict TypeScript, Vite production bundle, Next webpack production build, and the real Chromium/FFmpeg browser suite pass. Browser checks include persisted undo/redo, source insertion, bidirectional shuttle, ordered-effect pixels, parented preview/export agreement, and remapped audio. This does not establish native device compatibility.

## Native targets

```powershell
.\apps\bazcut-web\Build-BazCut.ps1 -Action doctor -Platform windows
npm run build:windows --workspace=@bazaara/bazcut-web
npm run build:android --workspace=@bazaara/bazcut-web
```

On a Mac with Xcode and CocoaPods:

```sh
npm run build:ios-simulator --workspace=@bazaara/bazcut-web
npm run build:ios --workspace=@bazaara/bazcut-web
```

The target doctor reports missing SDKs and toolchains. Windows needs the Visual Studio C++ and Windows SDK toolchain; Android needs Java, Android SDK/NDK and the configured API level; iOS needs macOS/Xcode and an Apple development team for device signing. Development build scripts do not publish to stores. Native platform compilation and device testing must pass before release readiness can be claimed.

## Data behavior

Originals are kept separately from the editable graph and are not deleted by timeline edits. SHA-256 verifies originals and portable project media. `.bazcut` packages contain the graph and original media; plain JSON contains only graph metadata. Imports use new identities and reset cloud permissions.

Graph revisions use optimistic concurrency checks. Named versions are immutable. The browser and native stores commit bounded undo/redo journals with the corresponding graph, allowing edit history to reopen after a saved revision. A save failure remains visible and blocks silent navigation. Unknown feature metadata is retained, and final export rejects unsupported features instead of dropping them.

Cloud inference, training, original uploads, and publishing are off by default. No production cloud service is connected in this implementation.
