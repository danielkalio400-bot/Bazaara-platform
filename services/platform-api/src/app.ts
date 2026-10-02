import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { allowedOrigins, env } from "./config.js";
import { AppError } from "./errors.js";
import { db } from "@bazaara/db";
import { identityRoutes } from "./identity/routes.js";
import { nativeIdentityRoutes } from "./identity/native-routes.js";
import { oidcRoutes } from "./identity/oidc-routes.js";
import { shoppingRoutes } from "./shopping/routes.js";
import { shoppingPromotionRoutes } from "./shopping/promotion-routes.js";
import { shoppingReviewRoutes } from "./shopping/review-routes.js";
import { shoppingSearchV2Routes } from "./shopping/search-v2-routes.js";
import { shoppingCatalogRoutes } from "./shopping/catalog-routes.js";
import { shoppingFulfillmentRoutes } from "./shopping/fulfillment-routes.js";
import { shoppingOperationsRoutes } from "./shopping/operations-routes.js";
import { groceryRoutes } from "./shopping/grocery-routes.js";
import { foodRoutes } from "./food/routes.js";
import { addressRoutes } from "./addresses/routes.js";
import { bazaaraGoRoutes } from "./shopping/go-routes.js";
import { paymentOrchestrationRoutes } from "./payments/routes.js";
import { notificationRoutes } from "./notifications/routes.js";
import { startNotificationWorker } from "./notifications/worker.js";
import { startBusinessReportWorker } from "./business/report-worker.js";
import { supportRoutes } from "./support/routes.js";
import { riskRoutes } from "./risk/routes.js";
import { browserMutationOriginAllowed } from "./security/csrf.js";
import { logisticsRoutes } from "./logistics/routes.js";
import { driveRoutes } from "./drive/routes.js";
import { payRoutes } from "./pay/routes.js";
import { businessPlatformRoutes } from "./business/routes.js";
import { businessPayRoutes } from "./business/pay-routes.js";
import { operationsPlatformRoutes } from "./operations/routes.js";
import { operationsManagementRoutes } from "./operations/management-routes.js";
import { businessAdvancedRoutes } from "./business/advanced-routes.js";
import { businessManagementRoutes } from "./business/management-routes.js";
import { businessV25Routes } from "./business/v25-routes.js";
import { pharmacyRoutes } from "./pharmacy/routes.js";
import { bazasportRoutes } from "./bazasport/routes.js";
import { platformRoutes } from "./platform/routes.js";
import { socialRoutes } from "./social/routes.js";
import { bazchatRoutes } from "./social/chat-routes.js";
import { bchatCallsRoutes } from "./social/chat-calls.js";
import { bazcircleRoutes } from "./social/circle-routes.js";
import { bazforumRoutes } from "./social/forum-routes.js";
import { bazclipsRoutes } from "./social/clips-routes.js";
import { baztuneRoutes } from "./social/tune-routes.js";
import { bazcutRoutes } from "./social/cut-routes.js";
import { bazsendRoutes } from "./social/send-routes.js";
import { startOutboxWorker } from "./webhooks/worker.js";

export async function buildApp() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL }, genReqId: (req) => req.headers["x-request-id"]?.toString() ?? crypto.randomUUID() });
  await app.register(cookie);
  await app.register(formbody);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(cors, {
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(new Error("Origin not allowed"), false);
    },
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  // Cookie-authenticated mutations must originate from an approved Bazaara web origin.
  // Native clients authenticate with Bearer tokens and are not subject to browser CSRF.
  app.addHook("onRequest", async (request) => {
    if (browserMutationOriginAllowed({
      method: request.method,
      authorization: request.headers.authorization,
      hasSessionCookie: Boolean(request.cookies[env.BAZID_COOKIE_NAME]),
      origin: request.headers.origin,
      referer: request.headers.referer,
      allowedOrigins,
    })) return;
    throw new AppError("FORBIDDEN", "Cross-site request rejected", 403);
  });

  // Friendly root endpoint for browser checks and local connectivity probes.
  // The real liveness/readiness probes remain /health/live and /health/ready.
  app.get("/", async () => ({
    service: "bazaara-platform-api",
    status: "ok",
    live: "/health/live",
    ready: "/health/ready",
  }));
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async (_request, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch {
      return reply.code(503).send({ status: "not_ready" });
    }
  });
  await app.register(identityRoutes);
  await app.register(nativeIdentityRoutes);
  await app.register(oidcRoutes);
  await app.register(shoppingRoutes);
  await app.register(shoppingPromotionRoutes);
  await app.register(shoppingReviewRoutes);
  await app.register(shoppingSearchV2Routes);
  await app.register(shoppingCatalogRoutes);
  await app.register(shoppingFulfillmentRoutes);
  await app.register(shoppingOperationsRoutes);
  await app.register(groceryRoutes);
  await app.register(addressRoutes);
  await app.register(foodRoutes);
  await app.register(bazaaraGoRoutes);
  await app.register(paymentOrchestrationRoutes);
  await app.register(notificationRoutes);
  await app.register(supportRoutes);
  await app.register(riskRoutes);
  await app.register(logisticsRoutes);
  await app.register(driveRoutes);
  await app.register(payRoutes);
  await app.register(businessPlatformRoutes);
  await app.register(businessPayRoutes);
  await app.register(operationsPlatformRoutes);
  await app.register(operationsManagementRoutes);
  await app.register(businessAdvancedRoutes);
  await app.register(businessManagementRoutes);
  await app.register(businessV25Routes);
  await app.register(pharmacyRoutes);
  await app.register(bazasportRoutes);
  await app.register(platformRoutes);
  await app.register(socialRoutes);
  await app.register(bazchatRoutes);
  await app.register(bchatCallsRoutes);
  await app.register(bazcircleRoutes);
  await app.register(bazforumRoutes);
  await app.register(bazclipsRoutes);
  await app.register(baztuneRoutes);
  await app.register(bazcutRoutes);
  await app.register(bazsendRoutes);

  let stopNotificationWorker: (() => void) | undefined;
  let stopOutboxWorker: (() => void) | undefined;
  let stopBusinessReportWorker: (() => void) | undefined;
  app.addHook("onReady", async () => {
    if (env.NODE_ENV === "test") return;
    stopNotificationWorker = startNotificationWorker({ intervalMs: env.NOTIFICATION_WORKER_INTERVAL_MS, log: app.log });
    stopOutboxWorker = startOutboxWorker({ intervalMs: env.OUTBOX_WORKER_INTERVAL_MS, log: app.log });
    stopBusinessReportWorker = startBusinessReportWorker({ intervalMs: env.BUSINESS_REPORT_WORKER_INTERVAL_MS, log: app.log });
  });
  app.addHook("onClose", async () => { stopNotificationWorker?.(); stopOutboxWorker?.(); stopBusinessReportWorker?.(); });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      const fields: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "form";
        (fields[key] ??= []).push(issue.message);
      }
      return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "Check the highlighted fields", requestId: request.id, fields } });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: { code: error.code, message: error instanceof Error ? error.message : "Request rejected", requestId: request.id, fields: error.fields } });
    }
    const maybeStatus = (error as { statusCode?: number }).statusCode;
    if (maybeStatus && maybeStatus >= 400 && maybeStatus < 500) {
      return reply.code(maybeStatus).send({ error: { code: "REQUEST_REJECTED", message: error instanceof Error ? error.message : "Request rejected", requestId: request.id } });
    }
    request.log.error({ err: error, requestId: request.id }, "Unhandled request error");
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Something went wrong", requestId: request.id } });
  });
  return app;
}
