import assert from "node:assert/strict";
import test from "node:test";

function available(items: Array<{ quantityOnHand: number; quantityReserved: number }>) {
  return items.reduce((total, item) => total + Math.max(0, item.quantityOnHand - item.quantityReserved), 0);
}

test("inventory availability never becomes negative", () => {
  assert.equal(available([{ quantityOnHand: 3, quantityReserved: 5 }]), 0);
});

test("availability aggregates across stores", () => {
  assert.equal(available([{ quantityOnHand: 10, quantityReserved: 2 }, { quantityOnHand: 5, quantityReserved: 1 }]), 12);
});
