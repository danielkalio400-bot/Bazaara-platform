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

Track mattes support alpha, luma and their inverses, transformed/effected source layers, nested dependencies up to eight levels, and source hiding. A hidden matte source remains hidden while assigned, including outside the consumer’s duration; its audio is unaffected. The same compositor evaluates preview and export. Cycles, missing sources and unsupported modes are rejected by both TypeScript and Rust. Matte references survive portable project roundtrips.

Verification on the development host: 32 TypeScript tests, 11 Rust tests, strict TypeScript, Vite production bundle, Next webpack production build, and the real Chromium/FFmpeg browser suite pass. Browser checks include persisted undo/redo, source insertion, bidirectional shuttle, ordered-effect pixels, parented preview/export agreement, remapped audio, coarse-pointer Motion controls, and alpha/luma/nested matte pixel/export agreement. This does not establish native device compatibility.

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

The target doctor reports missing SDKs and toolchains. Windows needs the Visual Studio C++ and Windows SDK toolchain; Android needs Java, Android SDK/NDK and the configured API level; iOS needs macOS/Xcode and an Apple development team for device signing. Development build scripts do not publish to stores.

[Native CI run 40093188000](https://github.com/danielkalio400-bot/Bazaara-platform/actions/runs/40093188000) passed all three jobs at commit `a1beeb018c3d989b3887c708585c4cda1c15ae15`: Windows x64 executable and unsigned NSIS installer, Android arm64 development APK, and arm64 iOS simulator app. Windows silent installation, app launch, original import/hash/preview, SQLite save/reopen, named version and persisted undo also passed. Android/iOS runtime behavior, real-device testing and distribution signing remain unqualified.

The Windows interaction test is restricted to disposable CI hosts. It applies an app-specific HKLM debugging policy because elevated hosts ignore WebView2 environment overrides, then removes that policy afterward. The application bundle contains no debugging flags. An additional native temporary-export cleanup check is awaiting its first CI run.

## Data behavior

Originals are kept separately from the editable graph and are not deleted by timeline edits. SHA-256 verifies originals and portable project media. `.bazcut` packages contain the graph and original media; plain JSON contains only graph metadata. Imports use new identities and reset cloud permissions.

Graph revisions use optimistic concurrency checks. Named versions are immutable. The browser and native stores commit bounded undo/redo journals with the corresponding graph, allowing edit history to reopen after a saved revision. A save failure remains visible and blocks silent navigation. Unknown feature metadata is retained, and final export rejects unsupported features instead of dropping them.

Export delivery waits for the native save/share result. A completed save, sharing handoff and cancellation have distinct feedback; write and save errors remain visible. Temporary output uses a separate native export directory and is discarded after delivery, including failures. The cleanup command refuses original-media IDs, and project validation prevents temporary export IDs from becoming originals. Mobile share bridges retain their own cache copy for the receiving app. Browser downloads report that downloading started because the browser does not report final disk completion.

Cloud inference, training, original uploads, and publishing are off by default. No production cloud service is connected in this implementation.
