import test from "node:test";
import assert from "node:assert/strict";
import { validateJournal } from "./index";

test("balanced journal is valid", () => {
  assert.doesNotThrow(() => validateJournal({
    reference: "t-1", kind: "PAYMENT", currency: "NGN",
    lines: [
      { accountId: "cash", direction: "DEBIT", amountMinor: 500000n },
      { accountId: "merchant-payable", direction: "CREDIT", amountMinor: 500000n },
    ],
  }));
});

test("unbalanced journal is rejected", () => {
  assert.throws(() => validateJournal({
    reference: "t-2", kind: "PAYMENT", currency: "NGN",
    lines: [
      { accountId: "cash", direction: "DEBIT", amountMinor: 500000n },
      { accountId: "merchant-payable", direction: "CREDIT", amountMinor: 499999n },
    ],
  }), /Unbalanced journal/);
});
