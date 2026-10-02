import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), "utf8");
let count = 0;
function has(file, pattern, label) {
  assert.match(read(file), pattern, `${file}: ${label}`);
  count++;
}
const web = "apps/drive-web/app/page.tsx";
const css = "apps/drive-web/app/globals.css";
const rider = "apps/drive-rider-mobile/app/index.tsx";
const driver = "apps/drive-driver-mobile/app/index.tsx";
const api = "services/platform-api/src/drive/routes.ts";
const ops = "apps/operations-web/app/drive/page.tsx";
const service = "services/platform-api/src/drive/service.ts";
for (const file of [web, css, rider, driver, api, ops, service, "services/platform-api/src/drive/fuel-policy.ts"]) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} exists`); count++;
}
for (const [file, regex, label] of [
  [web, /drive-v12-map-hero|className="dv14-map"/, "map-first UI"],
  [web, /openstreetmap\.org\/export\/embed\.html/, "map preview attribution/provider"],
  [web, /role="group" aria-label="When to travel"|className="dv14-when"/, "accessible trip schedule toggle"],
  [web, /if\(routeDirty\)/, "edited destination cannot silently keep old pin"],
  [web, /shareTrip/, "non-deceptive reference sharing"],
  [web, /href="tel:112"/, "emergency dial action"],
  [web, /fuelPolicy\?\.status|quote\.fuelDisclosure\?\.status/, "fuel source disclosure"],
  [css, /@media\(max-width:700px\)/, "small phone layout"],
  [rider, /expo-location/, "GPS permission and pickup location"],
  [rider, /manualDestination\) throw/, "no silent stale dropoff pin"],
  [rider, /getCurrentPositionAsync/, "actual device geolocation"],
  [rider, /Share\.share/, "rider share action"],
  [rider, /tel:112/, "native emergency dialer"],
  [rider, /not live traffic or navigation|not live road navigation/, "honest schematic preview"],
  [driver, /make:make\.trim\(\)/, "real vehicle make entered by driver"],
  [driver, /model:model\.trim\(\)/, "real vehicle model entered by driver"],
  [driver, /Vehicle and document verification/, "collapsible compliance panel"],
  [driver, /openNavigation/, "external pickup navigation"],
  [driver, /Share\.share/, "driver share action"],
  [driver, /tel:112/, "driver emergency dialer"],
  [api, /app\.get\("\/v1\/drive\/fuel-policy"/, "fuel transparency API"],
  [api, /status:"PENDING"/, "fuel index pending state"],
  [api, /:id\/approve/, "second operator approval endpoint"],
  [api, /submittedByUserId===auth\.userId/, "reject self-approval"],
  [api, /VEHICLE_INSPECTION"\]/, "driver roadworthiness review"],
  [api, /documentTypes/, "online expiry recheck"],
  [api, /straightDistance/, "no route shorter than geodesic baseline"],
  [api, /input\.discountsMinor\)throw/, "reject untrusted discounts and arbitrary fees"],
  [api, /fuelDisclosure/, "immutable quote-level fuel evidence"],
  [driver, /Vehicle and document verification/, "collapsible compliance panel"],
  [rider, /SecureStore\.setItemAsync/, "encrypted persisted pickup PIN"],
  [rider, /pendingBookingKey\.current/, "stable retry idempotency"],
  [ops, /Submit for approval/, "evidence submission instead of immediate activation"],
  [ops, /Approve \(second reviewer\)/, "review UI"],
  [service, /fuelPublicationStatus/, "stale publication fallback"],
  [service, /calculateFuelAdjustmentMinor/, "bounded fuel exposure"],
  [service, /drive-v12\.0/, "pricing snapshot version"],
]) has(file, regex, label);
for (const file of [web, rider, driver]) {
  assert.ok(!read(file).includes('href="#"'), `${file}: no inert placeholder link`); count++;
}
const unit = spawnSync(process.execPath, ["--experimental-strip-types", "--test", "services/platform-api/src/drive/fuel-policy.test.mjs"], { cwd: root, encoding: "utf8" });
if (unit.status !== 0) {
  process.stderr.write(unit.stdout + unit.stderr);
  throw new Error("Drive V12 fuel policy unit tests failed");
}
// Node 22 emits "# pass 4"; Node 24 can emit "ℹ pass 4".
// Normalize TAP reporter prefixes rather than depending on their glyphs.
const summary = unit.stdout.split(/\r?\n/).map(line =>
  line.replace(/^[^A-Za-z0-9]*/, "").trim()
);
assert.ok(["tests 4", "pass 4", "fail 0"].every(row => summary.includes(row)),
  `Expected 4 passing fuel policy tests and 0 failures. Output:\n${unit.stdout}`); count++;
console.log(`BAZAARA Drive V12 source and fuel policy checks PASS (${count} assertions, 4 unit tests).`);
