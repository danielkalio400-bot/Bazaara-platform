import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const workspaces = [
  ["@bazaara/business-web", "apps/business-web"],
  ["@bazaara/operations-web", "apps/operations-web"],
  ["@bazaara/shopping-web", "apps/shopping-web"],
  ["@bazaara/bazid-web", "apps/bazid-web"],
  ["@bazaara/bazaara-web", "apps/bazaara-web"],
  ["@bazaara/grocery-web", "apps/grocery-web"],
  ["@bazaara/food-web", "apps/food-web"],
  ["@bazaara/logistics-web", "apps/logistics-web"],
  ["@bazaara/drive-web", "apps/drive-web"],
  ["@bazaara/pay-web", "apps/pay-web"],
  ["@bazaara/pharmacy-web", "apps/pharmacy-web"],
  ["@bazaara/bazasport-web", "apps/bazasport-web"],
];

const repoRoot = process.cwd();

function productionEnvironment() {
  return {
    ...process.env,
    // A Next.js production build must run with the production React runtime.
    // An inherited value such as "local", "dev", or another non-standard
    // NODE_ENV can cause React/Next prerender runtime mismatches.
    NODE_ENV: "production",
  };
}

function runNpm(args) {
  const env = productionEnvironment();
  const npmCli = process.env.npm_execpath;

  if (npmCli) {
    return spawnSync(process.execPath, [npmCli, ...args], {
      stdio: "inherit",
      env,
    });
  }

  if (process.platform === "win32") {
    const comspec = process.env.ComSpec ?? process.env.COMSPEC ?? "cmd.exe";
    return spawnSync(comspec, ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
      stdio: "inherit",
      env,
    });
  }

  return spawnSync("npm", args, {
    stdio: "inherit",
    env,
  });
}

for (const [workspace, relativeDirectory] of workspaces) {
  console.log(`\n=== Building ${workspace} ===`);

  // Remove only generated Next.js output so a previous failed prerender cannot
  // contaminate this validation pass. Source, env files and data are untouched.
  const nextOutput = join(repoRoot, relativeDirectory, ".next");
  rmSync(nextOutput, { recursive: true, force: true });

  const result = runNpm(["run", "build", `--workspace=${workspace}`]);

  if (result.error) {
    console.error(
      `Could not launch npm for ${workspace}: ${result.error.message}`,
    );
    process.exit(1);
  }

  if (result.signal) {
    console.error(
      `Build for ${workspace} terminated by signal ${result.signal}.`,
    );
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(
      `Build for ${workspace} failed with exit code ${result.status ?? 1}.`,
    );
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll web applications built successfully.");
