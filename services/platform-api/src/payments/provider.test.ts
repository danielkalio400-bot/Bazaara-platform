import test from "node:test";
import assert from "node:assert/strict";
import { compareProviderCapture } from "./provider.js";

test("provider capture verification requires exact amount and currency", () => {
  const exact = compareProviderCapture({ expectedAmountMinor: 29900, expectedCurrency: "NGN", reportedAmountMinor: 29900, reportedCurrency: "ngn" });
  assert.equal(exact.matches, true);

  const underpaid = compareProviderCapture({ expectedAmountMinor: 29900, expectedCurrency: "NGN", reportedAmountMinor: 29899, reportedCurrency: "NGN" });
  assert.equal(underpaid.matches, false);
  assert.equal(underpaid.amountMatches, false);

  const wrongCurrency = compareProviderCapture({ expectedAmountMinor: 29900, expectedCurrency: "NGN", reportedAmountMinor: 29900, reportedCurrency: "USD" });
  assert.equal(wrongCurrency.matches, false);
  assert.equal(wrongCurrency.currencyMatches, false);

  const missingProviderFacts = compareProviderCapture({ expectedAmountMinor: 29900, expectedCurrency: "NGN" });
  assert.equal(missingProviderFacts.matches, false);
});
