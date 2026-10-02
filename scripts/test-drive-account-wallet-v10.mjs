import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { formatDriveWalletAmount } from "../apps/drive-rider-mobile/src/lib/wallet-display.ts";

const read = (filename) => fs.readFileSync(filename, "utf8");
const rider = read("apps/drive-rider-mobile/app/index.tsx");
const account = read("apps/drive-rider-mobile/app/components/DriveAccountMobile.tsx");

test("zero Wallet balance displays a real zero", () => {
  assert.match(formatDriveWalletAmount(0, "NGN"), /₦\s*0\.00/u);
});
test("minor NGN units are converted exactly to Naira and Kobo", () => {
  assert.match(formatDriveWalletAmount(125050, "NGN"), /₦\s*1,250\.50/u);
});
test("invalid balances do not display fabricated funds", () => {
  for (const value of [-100, Number.NaN, Infinity, 12.1]) {
    assert.equal(formatDriveWalletAmount(value, "NGN"), "Balance unavailable");
  }
});
test("invalid currency falls back to NGN", () => {
  assert.match(formatDriveWalletAmount(1250, "invalid currency"), /₦\s*12\.50/u);
});
test("Account receives the existing authenticated wallet context", () => {
  assert.match(rider, /wallet=\{wallet\s*\?\s*\{\s*\.\.\.wallet\.wallet,\s*heldFareMinor:\s*wallet\.heldFareMinor/);
  assert.match(account, /formatDriveWalletAmount\(wallet\.availableMinor,\s*wallet\.currency\)/);
});
test("Account links to the existing Pay funding page, not a simulated payment", () => {
  assert.match(account, /Linking\.openURL\(\x60\$\{payWeb\.replace/);
  assert.match(account, /\?section=drive/);
  assert.match(account, /Add money in BAZAARA Wallet/);
});
test("unsigned users cannot open the protected funding action", () => {
  assert.match(account, /if \(!signed\)\s*\{\s*onLogin\(\);\s*return;\s*\}/);
});
test("Wallet refresh is manual and occurs after external app returns", () => {
  assert.match(account, /accessibilityLabel="Refresh Wallet balance" onPress=\{onRefresh\}/);
  assert.match(rider, /AppState\.addEventListener\("change"/);
});
test("confirmation screen still offers funding recovery", () => {
  assert.match(rider, /shortfall\s*\?\s*['"]Add funds['"]/);
});
