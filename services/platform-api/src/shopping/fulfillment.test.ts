import test from "node:test";
import assert from "node:assert/strict";
import { canTransitionFulfillment, canTransitionShipment, deriveSellerOrderShipmentProgress } from "./fulfillment.js";

test("merchant fulfillment cannot skip picking/packing", () => {
  assert.equal(canTransitionFulfillment("PLACED", "CONFIRMED"), true);
  assert.equal(canTransitionFulfillment("CONFIRMED", "PICKING"), true);
  assert.equal(canTransitionFulfillment("CONFIRMED", "READY_TO_SHIP"), false);
  assert.equal(canTransitionFulfillment("PACKED", "READY_TO_SHIP"), true);
});

test("shipment state machine requires failed delivery before redelivery", () => {
  assert.equal(canTransitionShipment("READY_TO_SHIP", "SHIPPED"), true);
  assert.equal(canTransitionShipment("SHIPPED", "DELIVERED"), false);
  assert.equal(canTransitionShipment("FAILED_DELIVERY", "REDELIVERY_SCHEDULED"), true);
  assert.equal(canTransitionShipment("RETURN_TO_SENDER", "RETURNED_TO_SENDER"), true);
});


test("seller order waits for every allocated shipment before advancing aggregate shipping state", () => {
  const items = [{ id: "a", quantity: 1 }, { id: "b", quantity: 1 }];
  assert.equal(deriveSellerOrderShipmentProgress(items, [
    { status: "SHIPPED", items: [{ orderItemId: "a", quantity: 1 }] },
    { status: "READY_TO_SHIP", items: [{ orderItemId: "b", quantity: 1 }] },
  ]), null);
  assert.equal(deriveSellerOrderShipmentProgress(items, [
    { status: "SHIPPED", items: [{ orderItemId: "a", quantity: 1 }] },
    { status: "IN_TRANSIT", items: [{ orderItemId: "b", quantity: 1 }] },
  ]), "SHIPPED");
  assert.equal(deriveSellerOrderShipmentProgress(items, [
    { status: "DELIVERED", items: [{ orderItemId: "a", quantity: 1 }] },
    { status: "DELIVERED", items: [{ orderItemId: "b", quantity: 1 }] },
  ]), "DELIVERED");
});
