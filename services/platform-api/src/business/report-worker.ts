import { db } from "@bazaara/db";
import { env } from "../config.js";
import { audit } from "../audit.js";

function nextRun(frequency: string, from = new Date()) {
  const next = new Date(from);
  if (frequency === "DAILY") next.setUTCDate(next.getUTCDate() + 1);
  else if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
  else if (frequency === "QUARTERLY") next.setUTCMonth(next.getUTCMonth() + 3);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  next.setUTCHours(7, 0, 0, 0);
  return next;
}

async function sendEmail(to: string, title: string, body: string, scheduleId: string) {
  if (!env.NOTIFICATION_EMAIL_WEBHOOK_URL) {
    throw new Error("Email notification adapter is not configured");
  }
  const response = await fetch(env.NOTIFICATION_EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.NOTIFICATION_EMAIL_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.NOTIFICATION_EMAIL_WEBHOOK_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      to,
      title,
      body,
      category: "BUSINESS_REPORT",
      notificationId: scheduleId,
    }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || `Email adapter returned HTTP ${response.status}`);
  }
}

export async function processBusinessReportSchedules(limit = 25) {
  if (!env.NOTIFICATION_EMAIL_WEBHOOK_URL) return { processed: 0, skipped: "email-adapter-not-configured" as const };
  const now = new Date();
  const schedules = await db.businessReportSchedule.findMany({
    where: { active: true, nextRunAt: { lte: now } },
    orderBy: { nextRunAt: "asc" },
    take: Math.min(100, Math.max(1, limit)),
  });
  const results: Array<{ id: string; status: "SENT" | "FAILED"; error?: string }> = [];

  for (const schedule of schedules) {
    try {
      const organization = await db.organization.findUnique({
        where: { id: schedule.organizationId },
        select: { displayName: true },
      });
      const title = `${organization?.displayName ?? "Bazaara Business"} · ${schedule.name}`;
      const reportUrl = `${env.BUSINESS_WEB_BASE_URL.replace(/\/$/, "")}/reports`;
      const body = [
        `Your scheduled ${schedule.reportType.toLowerCase().replaceAll("_", " ")} report is ready for review.`,
        `Frequency: ${schedule.frequency.toLowerCase()}.`,
        `Open Business Reports: ${reportUrl}`,
        "The report is generated from the live organization-scoped Business data available when you open the workspace.",
      ].join("\n\n");
      for (const recipient of schedule.recipients) await sendEmail(recipient, title, body, schedule.id);
      const completedAt = new Date();
      await db.businessReportSchedule.update({
        where: { id: schedule.id },
        data: { lastRunAt: completedAt, nextRunAt: nextRun(schedule.frequency, completedAt) },
      });
      await audit({
        action: "business.report-schedule.delivered",
        resourceType: "BusinessReportSchedule",
        resourceId: schedule.id,
        metadata: { organizationId: schedule.organizationId, reportType: schedule.reportType, recipients: schedule.recipients.length },
      });
      results.push({ id: schedule.id, status: "SENT" });
    } catch (cause) {
      results.push({ id: schedule.id, status: "FAILED", error: cause instanceof Error ? cause.message.slice(0, 500) : "Scheduled report delivery failed" });
    }
  }
  return { processed: results.length, results };
}

export function startBusinessReportWorker(input: { intervalMs?: number; log?: { info: (...args: any[]) => void; error: (...args: any[]) => void } } = {}) {
  const intervalMs = Math.max(30_000, input.intervalMs ?? 60_000);
  let stopped = false;
  let running = false;
  const tick = async () => {
    if (stopped || running) return;
    running = true;
    try {
      const result = await processBusinessReportSchedules(25);
      if (result.processed > 0) input.log?.info({ processed: result.processed }, "Business scheduled reports processed");
    } catch (error) {
      input.log?.error({ err: error }, "Business scheduled report worker failed");
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => { void tick(); }, intervalMs);
  timer.unref?.();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
