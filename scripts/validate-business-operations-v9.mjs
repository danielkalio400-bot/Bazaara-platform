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
function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (["node_modules", ".next", "dist", "build"].includes(item.name)) continue;
      walk(full, out);
    } else if (item.name.endsWith(".tsx") && !item.name.includes(".bak")) out.push(full);
  }
  return out;
}
function extractTags(source, name) {
  const result = [];
  for (let i = 0; i < source.length;) {
    const start = source.indexOf(`<${name}`, i);
    if (start < 0) break;
    let j = start + name.length + 1;
    let braces = 0;
    let parens = 0;
    let quote = null;
    let escaped = false;
    for (; j < source.length; j += 1) {
      const char = source[j];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
      if (char === "{") braces += 1;
      else if (char === "}") braces = Math.max(0, braces - 1);
      else if (char === "(") parens += 1;
      else if (char === ")") parens = Math.max(0, parens - 1);
      else if (char === ">" && braces === 0 && parens === 0) { j += 1; break; }
    }
    result.push({ start, end: j, tag: source.slice(start, j), line: source.slice(0, start).split("\n").length });
    i = j;
  }
  return result;
}

// V8 must remain intact.
requireFile("scripts/validate-business-operations-v8.mjs");
requireFile("packages/db/prisma/migrations/20260921143000_smart_actions_restaurant_contact/migration.sql");

// Customer contact audit + live-support persistence.
requireText("packages/db/prisma/schema.prisma", [
  "model SupportCustomerContactAttempt",
  "supportCustomerContacts",
  "supportCustomerActions",
  "customerContactAttempts",
  "notificationId",
]);
requireFile("packages/db/prisma/migrations/20260921170000_support_customer_live_chat/migration.sql");
requireText("services/platform-api/src/support/customer-contact-service.ts", [
  "getSupportCustomerContactCenter",
  "createSupportCustomerContactAttempt",
  "updateSupportCustomerContactAttempt",
  'status = "QUEUED"',
  'status = "COMPLETED"',
  "ALREADY_DONE",
  "queueNotificationTx",
]);

// Live case event stream for consumer, business and Operations surfaces.
requireText("services/platform-api/src/support/live.ts", [
  "publishSupportLiveEvent",
  "subscribeSupportLiveEvent",
  "MESSAGE_ADDED",
  "CONTACT_UPDATED",
]);
requireText("services/platform-api/src/support/routes.ts", [
  "/v1/support/cases/:id/stream",
  "/v1/business/organizations/:organizationId/support/cases/:id/stream",
  "/v1/admin/support/cases/:id/stream",
  "/v1/admin/support/cases/:id/customer-contact-center",
  "/v1/admin/support/cases/:id/customer-contact-attempts",
  "/v1/admin/support/customer-contact-attempts/:attemptId",
  "publishSupportLiveEvent",
]);
requireText("services/platform-api/src/support/service.ts", [
  "Bazaara Support replied",
  "queueNotificationTx",
  'status: input.internal ? supportCase.status : "WAITING_CUSTOMER"',
]);

// No fabricated phone outcomes: click-to-call stays initiated until human/provider result exists.
const restaurantContactSource = read("services/platform-api/src/support/contact-service.ts");
const restaurantCreateStart = restaurantContactSource.indexOf("export async function createSupportRestaurantContactAttempt");
const restaurantUpdateStart = restaurantContactSource.indexOf("export async function updateSupportRestaurantContactAttempt");
if (restaurantCreateStart < 0 || restaurantUpdateStart < 0) throw new Error("Restaurant contact functions are missing");
const restaurantCreateBlock = restaurantContactSource.slice(restaurantCreateStart, restaurantUpdateStart);
if (/NO_ANSWER|setTimeout\s*\(/.test(restaurantCreateBlock)) throw new Error("Restaurant call creation must not fabricate NO_ANSWER or timer-based outcomes");
checks.push("restaurant:no-fabricated-no-answer");
const customerContactSource = read("services/platform-api/src/support/customer-contact-service.ts");
const customerCreateStart = customerContactSource.indexOf("export async function createSupportCustomerContactAttempt");
const customerUpdateStart = customerContactSource.indexOf("export async function updateSupportCustomerContactAttempt");
const customerCreateBlock = customerContactSource.slice(customerCreateStart, customerUpdateStart);
if (/NO_ANSWER|setTimeout\s*\(/.test(customerCreateBlock)) throw new Error("Customer call creation must not fabricate NO_ANSWER or timer-based outcomes");
checks.push("customer:no-fabricated-no-answer");

// Operations contact center + provider-backed customer contact statuses.
requireText("apps/operations-web/app/support/page.tsx", [
  "CUSTOMER CONTACT + LIVE CHAT",
  "Call customer",
  "Send SMS",
  "Send email",
  "Send in live chat",
  "Outcome is pending until an agent records",
  "No call result is guessed automatically",
  "Provider:",
  "RESTAURANT CONTACT CENTER",
  "External composer opened · delivery not verified by Bazaara",
]);
requireText("apps/operations-web/app/globals.css", [
  "OPERATIONS CUSTOMER CONTACT + LIVE SUPPORT V9",
  ".ops-live-chip",
  ".ops-customer-contact-center",
]);

// Customer-facing reporting + live chat surfaces.
requireText("apps/food-web/app/support/page.tsx", [
  "Report it. Chat live. Track the outcome.",
  "Open case & start live chat",
  "EventSource",
  "Send message",
  "✓ Escalated",
]);
requireText("apps/food-web/components/food-header.tsx", ['<Link href="/support">Support</Link>']);
requireText("apps/grocery-web/app/support/page.tsx", [
  "Help & live support",
  "Create case & start live chat",
  "EventSource",
  "✓ Escalated",
  "Refreshing…",
]);
requireText("apps/business-web/app/support/page.tsx", [
  "EventSource",
  "business-live-chip",
]);
requireText("apps/food-mobile/app/support.tsx", [
  "Report it. Chat live.",
  "Open case & start live chat",
  "LIVE SYNC",
  "foodOrderId",
  "Send live message",
]);
requireText("apps/food-mobile/app/(tabs)/account.tsx", [
  "Help & live support",
  'route:"/support"',
]);
requireText("apps/food-mobile/app/order/[id].tsx", [
  "Open live support chat",
  'pathname:"/support"',
]);
requireText("apps/grocery-mobile/app/support.tsx", [
  "Help & live support",
  "LIVE SYNC",
  "Create case & start live chat",
]);

// Audit every rendered Business/Operations button. There must be no decorative/dead buttons,
// and async/mutating actions must expose a busy/disabled/server-state feedback path.
const uiRoots = ["apps/business-web/app", "apps/operations-web/app"];
let buttonCount = 0;
const deadButtons = [];
const remoteWithoutFeedback = [];
const riskySubmitButtons = [];
const placeholderLinks = [];
for (const relRoot of uiRoots) {
  const absRoot = path.join(root, relRoot);
  for (const file of walk(absRoot)) {
    const source = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file).replaceAll(path.sep, "/");
    if (/href\s*=\s*["'](?:#|javascript:)/.test(source)) placeholderLinks.push(rel);
    for (const button of extractTags(source, "button")) {
      buttonCount += 1;
      const before = source.slice(0, button.start);
      const inForm = before.lastIndexOf("<form") > before.lastIndexOf("</form>");
      const hasClick = /\bonClick\s*=/.test(button.tag);
      const submit = /\btype\s*=\s*["']submit["']/.test(button.tag);
      const disabled = /\bdisabled(?:\s*=|\s|>)/.test(button.tag);
      if (!hasClick && !submit && !inForm && !disabled) deadButtons.push(`${rel}:${button.line}`);
      const clickExpression = hasClick ? (button.tag.slice(button.tag.indexOf("onClick"))) : "";
      const localDownload = /\bdownload\w*\b/i.test(clickExpression) && !/\bvoid\b|async\s*\(/i.test(clickExpression);
      const looksRemote = hasClick && !localDownload && /(void\s+|async\s*\(|save|submit|approve|reject|resolve|cancel|refund|assign|delete|remove|update|create|send|retry|suspend|activate|deactivate|verify|close|reopen|escalate|contact|call|pay|charge|release|mark|load|refresh|ship|review|batch)/i.test(clickExpression);
      const feedback = /\bdisabled\s*=|aria-busy|busy|loading|refreshing|searching|pending|saving|sending|processing|copied|status|state/i.test(button.tag);
      if (looksRemote && !feedback) remoteWithoutFeedback.push(`${rel}:${button.line}`);
    }
    for (const form of extractTags(source, "form")) {
      if (!/onSubmit\s*=/.test(form.tag)) continue;
      const close = source.indexOf("</form>", form.end);
      if (close < 0) continue;
      const inner = source.slice(form.end, close);
      for (const submitButton of extractTags(inner, "button")) {
        if (/type\s*=\s*["']button["']/.test(submitButton.tag)) continue;
        const buttonClose = inner.indexOf("</button>", submitButton.end);
        const body = buttonClose >= 0 ? inner.slice(submitButton.end, buttonClose) : "";
        const feedback = /disabled\s*=|busy|loading|saving|sending|processing|pending|aria-busy/i.test(submitButton.tag) || /…|✓|Saving|Creating|Sending|Updating|Processing|Opening|Adding/.test(body);
        if (!feedback) riskySubmitButtons.push(`${rel}:${form.line + submitButton.line - 1}`);
      }
    }
  }
}
if (deadButtons.length) throw new Error(`Dead Business/Operations buttons: ${deadButtons.join(", ")}`);
if (remoteWithoutFeedback.length) throw new Error(`Async Business/Operations buttons without visible state feedback: ${remoteWithoutFeedback.join(", ")}`);
if (riskySubmitButtons.length) throw new Error(`Server submit buttons without busy feedback: ${riskySubmitButtons.join(", ")}`);
if (placeholderLinks.length) throw new Error(`Placeholder links detected: ${placeholderLinks.join(", ")}`);
checks.push(`button-audit:${buttonCount}:no-dead-buttons`);
checks.push(`button-audit:${buttonCount}:async-feedback`);
checks.push("button-audit:forms-smart");
checks.push("button-audit:no-placeholder-links");

console.log(`Business & Operations V9 smart-button/live-support assertions passed (${checks.length} checks; ${buttonCount} buttons audited).`);
