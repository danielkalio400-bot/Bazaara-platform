import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const args = process.argv.slice(2);
const action = args[0] || "doctor";
const target =
  args[1] ||
  (process.platform === "win32"
    ? "windows"
    : process.platform === "darwin"
      ? "ios-simulator"
      : "android");
const release = args.includes("--release");
const env = { ...process.env };
const problems = [];
const docs = "https://v2.tauri.app/start/prerequisites/";

function run(command, argv, options = {}) {
  const result = spawnSync(command, argv, {
    cwd: app,
    env,
    stdio: "inherit",
    ...options,
  });
  if (result.error || result.status !== 0)
    throw Error(
      `${path.basename(command)} failed${result.error ? `: ${result.error.message}` : ` with exit ${result.status}`}`,
    );
  return result;
}
function read(command, argv) {
  const r = spawnSync(command, argv, {
    cwd: app,
    env,
    encoding: "utf8",
    windowsHide: true,
  });
  return r.status === 0 ? (r.stdout + r.stderr).trim() : null;
}
function check(ok, name, fix) {
  console.log(`${ok ? "OK" : "MISSING"}  ${name}`);
  if (!ok) problems.push(fix);
}
function directories(parent) {
  return existsSync(parent)
    ? readdirSync(parent, { withFileTypes: true })
        .filter((x) => x.isDirectory())
        .map((x) => x.name)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    : [];
}
function tauri(argv) {
  const pkg = require.resolve("@tauri-apps/cli/package.json");
  run(process.execPath, [path.join(path.dirname(pkg), "tauri.js"), ...argv]);
}
function npm(script) {
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], {
    shell: process.platform === "win32",
  });
}
function doctor() {
  console.log(
    `BazCut native ${target} — ${release ? "release" : "development"}\n`,
  );
  const [major, minor] = process.versions.node.split(".").map(Number);
  check(
    major > 22 || (major === 22 && minor >= 18),
    `Node ${process.versions.node}`,
    "Install Node 22.18 or newer (24 LTS recommended).",
  );
  const rust = read("rustc", ["--version"]);
  const version = rust?.match(/rustc (\d+)\.(\d+)/);
  check(
    version && (Number(version[1]) > 1 || Number(version[2]) >= 90),
    rust || "Rust",
    "Install Rust 1.90+ through rustup; reopen your terminal.",
  );
  check(
    !!read("cargo", ["--version"]),
    "Cargo",
    "Install Rust/Cargo through rustup.",
  );
  check(
    !!read("rustup", ["--version"]),
    "rustup",
    "Install rustup so the selected target can be configured.",
  );
  let js = true;
  try {
    require.resolve("@tauri-apps/cli/package.json");
    require.resolve("vite/package.json");
  } catch {
    js = false;
  }
  check(
    js,
    "Frontend/native CLI dependencies",
    "From the repository root: npm install --workspace=@bazaara/bazcut-web",
  );
  if (target === "windows") {
    check(
      process.platform === "win32",
      "Windows build host",
      "Run the Windows build on Windows 11.",
    );
    if (process.platform === "win32") {
      const vswhere = path.join(
        env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
        "Microsoft Visual Studio",
        "Installer",
        "vswhere.exe",
      );
      const visualStudio =
        existsSync(vswhere) &&
        read(vswhere, [
          "-latest",
          "-products",
          "*",
          "-requires",
          "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
          "-property",
          "installationPath",
        ]);
      check(
        !!visualStudio,
        "Visual Studio C++ build tools",
        "Install Visual Studio Build Tools with Desktop development with C++ and the Windows SDK.",
      );
      const sdk = path.join(
        env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
        "Windows Kits",
        "10",
        "Include",
      );
      check(
        directories(sdk).length > 0,
        "Windows SDK",
        "Install the Windows SDK using the Visual Studio Installer.",
      );
      console.log(
        "INFO  Windows runs the interface with Microsoft Edge WebView2; the NSIS installer includes its bootstrapper.",
      );
    }
  } else if (target === "android") {
    env.ANDROID_HOME ||=
      env.ANDROID_SDK_ROOT ||
      (process.platform === "win32"
        ? path.join(
            env.LOCALAPPDATA || path.join(homedir(), "AppData", "Local"),
            "Android",
            "Sdk",
          )
        : process.platform === "darwin"
          ? path.join(homedir(), "Library", "Android", "sdk")
          : path.join(homedir(), "Android", "Sdk"));
    check(
      existsSync(env.ANDROID_HOME),
      "Android SDK",
      "Install Android Studio and set ANDROID_HOME to its SDK directory.",
    );
    const ndks = directories(path.join(env.ANDROID_HOME, "ndk"));
    env.NDK_HOME ||= ndks[0] ? path.join(env.ANDROID_HOME, "ndk", ndks[0]) : "";
    check(
      existsSync(path.join(env.NDK_HOME, "source.properties")),
      "Android NDK",
      "Install NDK (Side by side) in Android Studio; set NDK_HOME if necessary.",
    );
    const sdkLevel = Number(
      readFileSync(
        path.join(app, "native-share", "android", "build.gradle.kts"),
        "utf8",
      ).match(/compileSdk\s*=\s*(\d+)/)?.[1],
    );
    check(
      existsSync(
        path.join(
          env.ANDROID_HOME,
          "platforms",
          `android-${sdkLevel}`,
          "android.jar",
        ),
      ),
      `Android SDK Platform ${sdkLevel}`,
      `Install Android SDK Platform ${sdkLevel} in SDK Manager.`,
    );
    check(
      directories(path.join(env.ANDROID_HOME, "build-tools")).length > 0,
      "Android build tools",
      "Install Android SDK Build-Tools in SDK Manager.",
    );
    const java = env.JAVA_HOME
      ? path.join(
          env.JAVA_HOME,
          "bin",
          process.platform === "win32" ? "java.exe" : "java",
        )
      : "java";
    const javaVersion = read(java, ["-version"]);
    check(
      !!javaVersion,
      "Java runtime",
      "Set JAVA_HOME to Android Studio's bundled jbr directory.",
    );
    if (release)
      console.log(
        "INFO  Release signing must be configured in the generated Android project before distribution. This command does not publish or generate signing keys.",
      );
  } else {
    check(
      process.platform === "darwin",
      "macOS build host",
      "iOS builds require macOS with full Xcode. Run this command on your Mac.",
    );
    if (process.platform === "darwin") {
      check(
        !!read("xcodebuild", ["-version"]),
        "Xcode",
        "Install full Xcode, select it with xcode-select, and finish first launch setup.",
      );
      check(
        !!read("xcrun", [
          "--sdk",
          target === "ios" ? "iphoneos" : "iphonesimulator",
          "--show-sdk-path",
        ]),
        "iOS SDK",
        "Install the iOS platform in Xcode Settings → Components.",
      );
      check(
        !!read("pod", ["--version"]),
        "CocoaPods",
        "Install CocoaPods (for example: brew install cocoapods).",
      );
      if (target === "ios")
        check(
          !!env.APPLE_DEVELOPMENT_TEAM,
          "Apple development team",
          "Set APPLE_DEVELOPMENT_TEAM to your Apple team ID and configure the matching signing identity/provisioning profile in Xcode.",
        );
    }
  }
  if (problems.length) {
    console.error(
      `\nCannot ${action === "doctor" ? "build this target yet" : "continue"}:\n${[...new Set(problems)].map((x) => `- ${x}`).join("\n")}\n\nPlatform setup: ${docs}`,
    );
    return false;
  }
  console.log(
    "\nPrerequisite check passed. Native compilation and real-device qualification are still required.",
  );
  return true;
}

if (
  !["doctor", "build", "dev"].includes(action) ||
  !["windows", "android", "ios", "ios-simulator"].includes(target)
) {
  console.log(
    "Usage: node scripts/native.mjs <doctor|build|dev> <windows|android|ios|ios-simulator> [--release]\nDefault builds are for development and never publish to a store.",
  );
  process.exit(2);
}
try {
  if (!doctor()) process.exit(1);
  if (action !== "doctor") {
    const rustTargets =
      target === "windows"
        ? ["x86_64-pc-windows-msvc"]
        : target === "android"
          ? ["aarch64-linux-android"]
          : target === "ios"
            ? ["aarch64-apple-ios"]
            : [
                process.arch === "arm64"
                  ? "aarch64-apple-ios-sim"
                  : "x86_64-apple-ios",
              ];
    run("rustup", ["target", "add", ...rustTargets]);
    if (target !== "windows") {
      const family = target === "android" ? "android" : "ios";
      const sentinel = family === "android" ? "gradlew" : "project.yml";
      const generated = path.join(
        app,
        "src-tauri",
        "gen",
        family === "ios" ? "apple" : "android",
        sentinel,
      );
      if (!existsSync(generated)) tauri([family, "init", "--ci"]);
    }
    if (action === "build") {
      npm("test:studio");
      run("cargo", [
        "test",
        "--locked",
        "--manifest-path",
        "engine/Cargo.toml",
      ]);
    }
    const debug = release || action === "dev" ? [] : ["--debug"];
    if (target === "windows") {
      tauri(
        action === "dev"
          ? ["dev"]
          : [
              "build",
              "--target",
              rustTargets[0],
              "--bundles",
              "nsis",
              ...debug,
            ],
      );
    } else if (target === "android") {
      tauri(
        action === "dev"
          ? ["android", "dev"]
          : ["android", "build", "--target", "aarch64", "--apk", ...debug],
      );
    } else {
      tauri(
        action === "dev"
          ? ["ios", "dev"]
          : [
              "ios",
              "build",
              "--target",
              target === "ios"
                ? "aarch64"
                : process.arch === "arm64"
                  ? "aarch64-sim"
                  : "x86_64",
              ...debug,
            ],
      );
    }
    console.log(
      `\n${action === "build" ? "Compilation completed" : "Development session ended"}. Output remains under apps/bazcut-web/src-tauri. No store publication was performed.`,
    );
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
