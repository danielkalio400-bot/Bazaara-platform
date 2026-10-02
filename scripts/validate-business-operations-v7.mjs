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

requireText("packages/db/prisma/schema.prisma", [
  "model BusinessSubscription",
  "model BusinessSubscriptionEvent",
  "model BusinessReportSchedule",
  "model PlatformFeedback",
]);
requireFile("packages/db/prisma/migrations/20260921131500_business_operations_complete/migration.sql");
requireText("services/platform-api/src/app.ts", ["businessManagementRoutes", "operationsManagementRoutes", "startBusinessReportWorker"]);
requireText("services/platform-api/src/config.ts", ["BUSINESS_REPORT_WORKER_INTERVAL_MS", "BUSINESS_WEB_BASE_URL"]);
requireText("services/platform-api/src/business/report-worker.ts", ["startBusinessReportWorker", "businessReportSchedule", "processBusinessReportSchedules"]);
requireText("services/platform-api/src/business/management-routes.ts", [
  "/management/revenue",
  "/management/reports",
  "/management/report-schedules",
  "/management/subscription",
  "/management/feedback",
  "serializeSubscription",
]);
requireText("services/platform-api/src/operations/management-routes.ts", [
  "/v1/operations/management/overview",
  "/v1/operations/management/reports",
  "/v1/operations/management/feedback",
  "/v1/operations/management/audit",
  "/v1/operations/management/support-agents",
  "/v1/operations/management/users",
]);
requireText("services/platform-api/src/support/routes.ts", ["unassigned", "assignedToUserId"]);
requireText("services/platform-api/src/support/service.ts", ["input.unassigned", "assignedToUserId: null"]);

for (const page of ["revenue","reports","pricing","subscriptions","payments","feedback","users"]) {
  requireFile(`apps/business-web/app/${page}/page.tsx`);
}
requireText("apps/business-web/app/components/BusinessHeader.tsx", ["Revenue", "Reports", "Payments", "Subscriptions", "Pricing", "Users & access", "Feedback"]);
requireText("apps/business-web/app/globals.css", ["BUSINESS MANAGEMENT SUITE V7"]);

for (const page of ["reports","audit","feedback","settings","support-tools","tickets"]) {
  requireFile(`apps/operations-web/app/${page}/page.tsx`);
}
requireText("apps/operations-web/app/access/page.tsx", ["BAZID DIRECTORY", "/v1/operations/management/users"]);
requireText("apps/operations-web/app/support/page.tsx", ["support-agents", "Unassigned only", "Assignee"]);
requireText("apps/operations-web/app/components/OpsShell.tsx", ["Reports", "Audit log", "Platform settings", "Help desk", "Feedback", "Support tools"]);
requireText("apps/operations-web/app/globals.css", ["OPERATIONS BUSINESS & SUPPORT CONTROL PLANE V7"]);

console.log(`Business & Operations V7 static assertions passed (${checks.length} checks).`);
