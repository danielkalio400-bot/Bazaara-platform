import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function requireFile(file) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing required file: ${file}`);
  checks.push(`file:${file}`);
}
function requireText(file, snippets) {
  requireFile(file);
  const source = read(file);
  for (const snippet of snippets) {
    if (!source.includes(snippet)) throw new Error(`${file}: missing marker: ${snippet}`);
    checks.push(`${file}:${snippet}`);
  }
}
function requireOneOf(file, snippets) {
  requireFile(file);
  const source = read(file);
  if (!snippets.some((snippet) => source.includes(snippet))) {
    throw new Error(`${file}: missing every accepted marker: ${snippets.join(" | ")}`);
  }
  checks.push(`${file}:one-of:${snippets.join("|")}`);
}

// V7 management suite remains present.
requireText("packages/db/prisma/schema.prisma", [
  "model BusinessSubscription",
  "model BusinessSubscriptionEvent",
  "model BusinessReportSchedule",
  "model PlatformFeedback",
]);
requireFile("packages/db/prisma/migrations/20260921131500_business_operations_complete/migration.sql");

// V8 restaurant-contact data model + migration.
requireText("packages/db/prisma/schema.prisma", [
  "model RestaurantContact",
  "model SupportContactAttempt",
  "clientActionId",
  "contactAttempts",
]);
requireFile("packages/db/prisma/migrations/20260921143000_smart_actions_restaurant_contact/migration.sql");

// Restaurant contact center APIs and server-side idempotency.
requireText("services/platform-api/src/support/contact-service.ts", [
  "getSupportRestaurantContactCenter",
  "createSupportRestaurantContactAttempt",
  "updateSupportRestaurantContactAttempt",
  "clientActionId",
  "ALREADY_DONE",
]);
requireText("services/platform-api/src/support/routes.ts", [
  "/v1/admin/support/cases/:id/restaurant-contact-center",
  "/v1/admin/support/cases/:id/restaurant-contact-attempts",
  "/v1/admin/support/restaurant-contact-attempts/:attemptId",
  "business.restaurant_contact.noop",
  "support.restaurant_contact.outcome_noop",
]);

// Business UI: contact directory and smart action UX.
requireFile("apps/business-web/app/food/contacts/page.tsx");
requireText("apps/business-web/app/food/contacts/page.tsx", [
  "Restaurant contacts",
  "WhatsApp",
  "Make primary",
  "Mark emergency",
  "smart-done",
  "ALREADY_DONE",
]);
requireText("apps/business-web/app/food/page.tsx", [
  "settingsUnchanged",
  "hourUnchanged",
  '"smart-done"',
  "ALREADY_DONE",
]);
requireText("apps/business-web/app/subscriptions/page.tsx", [
  "subscriptionUnchanged",
  "Current subscription",
  "smart-done",
  "ALREADY_DONE",
]);
requireText("apps/business-web/app/reports/page.tsx", ["ALREADY_DONE"]);
requireText("apps/business-web/app/finance/page.tsx", ["already connected", "ALREADY_DONE"]);
requireText("apps/business-web/app/globals.css", [
  "BUSINESS SMART ACTIONS + RESTAURANT CONTACT DIRECTORY V8",
  ".smart-done",
]);

// Operations UI: support communication channels and smart actions.
requireText("apps/operations-web/app/support/page.tsx", [
  "restaurant-contact-center",
  "restaurant-contact-attempts",
  "clientActionId",
  "PHONE",
  "WHATSAPP",
  "SMS",
  "EMAIL",
  "IN_APP",
  "NO_ANSWER",
  "BUSY",
  'className={attempt.status === "COMPLETED" ? "done" : ""}',
]);
requireText("apps/operations-web/app/access/page.tsx", ["selectedHasRole", "Role assigned", "smart-done"]);
requireText("apps/operations-web/app/feedback/page.tsx", ["resolutionUnchanged", "Resolution saved", "smart-done"]);
requireText("apps/operations-web/app/logistics/page.tsx", ["ALREADY_DONE"]);
requireText("apps/operations-web/app/pay/page.tsx", ["replayed", "Paid", "smart-done"]);
requireText("apps/operations-web/app/food/page.tsx", ["ALREADY_DONE", "smart-done"]);
requireText("apps/operations-web/app/commerce/page.tsx", ["ALREADY_DONE", "replayed"]);
requireText("apps/operations-web/app/globals.css", [
  "OPERATIONS SMART ACTIONS + RESTAURANT CONTACT CENTER V8",
  ".ops-contact-outcomes button.done",
]);

// Server-side no-op / idempotency controls across Business and Operations.
requireText("services/platform-api/src/business/management-routes.ts", [
  "ALREADY_DONE",
  "business.report-schedule.noop",
  "business.subscription.noop",
]);
requireText("services/platform-api/src/business/pay-routes.ts", [
  "ALREADY_DONE",
  "business.pay.link.noop",
]);
requireText("services/platform-api/src/business/routes.ts", [
  "ALREADY_DONE",
  "existing.status === input.status",
]);
requireText("services/platform-api/src/operations/management-routes.ts", [
  "ALREADY_DONE",
  "operations.feedback.noop",
]);
requireText("services/platform-api/src/operations/routes.ts", [
  "ALREADY_DONE",
  "operations.role.grant.noop",
  "operations.role.revoke.noop",
]);
requireText("services/platform-api/src/shopping/operations-routes.ts", [
  "ALREADY_DONE",
]);
requireOneOf("services/platform-api/src/shopping/operations-routes.ts", [
  "shopping.cancellation.noop",
  "shopping.cancellation.resolve_noop",
  "shopping.cancellation.already_resolved",
]);
requireText("services/platform-api/src/food/service.ts", [
  "ALREADY_DONE",
  "setFoodCommissionPolicyActive",
  "updateAdminFoodMenuItem",
]);

requireText("services/platform-api/src/drive/routes.ts", [
  "drive.driver.approval.noop",
  "drive.driver-document.status.noop",
  "drive.vehicle.status.noop",
  "ALREADY_DONE",
]);
requireText("services/platform-api/src/pharmacy/routes.ts", [
  "pharmacy.merchant.verification.noop",
  "pharmacy.pharmacist.verification.noop",
  "ALREADY_DONE",
]);
requireText("services/platform-api/src/risk/routes.ts", ["risk.signal.noop", "ALREADY_DONE"]);
requireText("apps/operations-web/app/drive/page.tsx", ["ALREADY_DONE", "smart-done"]);
requireText("apps/operations-web/app/pharmacy/page.tsx", ["ALREADY_DONE", "smart-done"]);
requireText("apps/operations-web/app/risk/page.tsx", ["ALREADY_DONE", "smart-done"]);
requireText("services/platform-api/src/food/routes.ts", [
  "food.restaurant.admin_noop",
  "food.rules.noop",
  "food.issue.admin_noop",
  "food.promotion.admin_noop",
  "food.menu_item.admin_noop",
  "food.commission_policy.noop",
]);

console.log(`Business & Operations V8 static assertions passed (${checks.length} checks).`);
