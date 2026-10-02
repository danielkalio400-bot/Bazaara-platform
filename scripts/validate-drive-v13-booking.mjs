import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const web = read("apps/drive-web/app/page.tsx");
const css = read("apps/drive-web/app/globals.css");
// The minimal V14 flow supersedes V13's dense booking card. Validate its
// equivalent real actions instead of requiring obsolete visual selectors.
if (web.includes('className="dv14-app"')) {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(process.execPath, ["scripts/validate-drive-v14-minimal.mjs"], {cwd:root,encoding:"utf8"});
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(1);
  console.log("Drive V13 booking contract migrated to V14 minimal UI.");
  process.exit(0);
}

let passed = 0;
for (const [expr, description] of [
  [/className="drive-v13-stage"/, "map and booking share one viewport"],
  [/\{!activeRideId \? <section/, "active ride replaces booking form"],
  [/destinationChosen/, "booking waits for a mapped destination"],
  [/setDestinationChosen\(false\)/, "free text invalidates stale coordinates"],
  [/Choose a destination/, "first screen is destination-led"],
  [/role="group" aria-label="When to travel"/, "one-tap now/later booking"],
  [/Choose your ride/, "ride categories follow destination"],
  [/<details className="drive-v13-advanced">/, "manual pilot estimates are collapsed"],
  [/useEffect\(\(\) => \{\s*if \(!destinationChosen\) return;/, "pilot route estimate recalculates from pins"],
  [/Pilot route estimate: \{distanceKm\}/, "pilot numbers labelled honestly"],
  [/road routing and live driver positions are not connected/, "no false live route claims"],
  [/<details className="drive-v13-fare-details">/, "fare breakdown is optional"],
  [/<div className="drive-v13-book-actions">/, "sticky booking CTA exists"],
  [/Confirm & find a driver/, "existing booking dispatch remains available"],
  [/Fuel adjustment policy/, "fuel disclosure retained"],
  [/id="active-ride"/, "live ride panel anchored above fold"],
]) {
  assert.match(web, expr, description);passed++;
}
for (const [expr, description] of [
  [/\.drive-v13-stage\{position:relative;height:calc\(100dvh - 66px\)/, "viewport booking stage"],
  [/\.drive-v13-stage \.drive-v12-map-hero\{position:absolute/, "map fills stage"],
  [/\.drive-v13-stage \.drive-v12-book-grid\{position:absolute/, "booking floats over map"],
  [/\.drive-v13-book-actions\{position:sticky/, "CTA remains visible"],
  [/@media\(max-width:700px\)/, "responsive mobile booking sheet"],
  [/max-height:min\(76dvh,640px\)/, "phone sheet stays within viewport"],
  [/prefers-reduced-motion:reduce/, "reduced-motion support"],
]) {
  assert.match(css, expr, description);passed++;
}
assert.ok(!web.includes('href="#"'), "no inert links");passed++;
console.log(`BAZAARA Drive booking-first V13 UI static checks PASS (${passed} assertions).`);
