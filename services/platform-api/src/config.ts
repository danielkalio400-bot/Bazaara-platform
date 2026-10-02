import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(rootEnvPath) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(rootEnvPath);
}

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const booleanString = z.enum(["true", "false", "1", "0"]).transform((value) => value === "true" || value === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  BAZID_COOKIE_NAME: z.string().min(1).default("bazid_session"),
  BAZID_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 365).default(720),
  WEB_ORIGINS: z.string().default("http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004,http://localhost:3005,http://localhost:3006,http://localhost:3007,http://localhost:3008,http://localhost:3009,http://localhost:3010,http://localhost:3011,http://localhost:3012,http://localhost:3013,http://localhost:3014,http://localhost:3015,http://localhost:3016,http://localhost:3017,http://localhost:3018,http://localhost:3019"),
  LOG_LEVEL: z.string().default("info"),
  REGION: z.string().trim().min(2).max(32).default("NG"),
  CURRENCY: z.string().regex(/^[A-Z]{3}$/).default("NGN"),
  LOCALE: z.string().trim().min(2).max(32).default("en-NG"),
  TIMEZONE: z.string().trim().min(2).max(80).default("Africa/Lagos"),
  PAYSTACK_SECRET_KEY: z.preprocess(blankToUndefined, z.string().min(8).optional()),
  PAYSTACK_TRANSFERS_ENABLED: booleanString.default(false),
  PAYSTACK_CALLBACK_BASE_URL: z.string().url().default("http://localhost:3003"),
  BAZAARA_PAY_WEB_BASE_URL: z.string().url().default("http://localhost:3010"),
  BUSINESS_WEB_BASE_URL: z.string().url().default("http://localhost:3001"),
  BUSINESS_REPORT_WORKER_INTERVAL_MS: z.coerce.number().int().min(30000).max(3600000).default(60000),
  PAY_P2P_FEE_BPS: z.coerce.number().int().min(0).max(2000).default(50),
  PAY_P2P_FEE_MIN_MINOR: z.coerce.number().int().min(0).max(10000000).default(1000),
  PAY_P2P_FEE_MAX_MINOR: z.coerce.number().int().min(0).max(100000000).default(100000),
  PAY_TEST_MODE: booleanString.default(false),
  PAY_TEST_BALANCE_MINOR: z.coerce.number().int().min(0).max(10000000000).default(100000000),
  PAY_FIXED_SAVINGS_MIN_MINOR: z.coerce.number().int().min(10000).max(1000000000).default(100000),
  GO_PARCEL_COMMISSION_BPS: z.coerce.number().int().min(0).max(5000).default(1500),
  GO_MAX_PARCEL_PICKUP_DISTANCE_METERS: z.coerce.number().int().min(1000).max(100000).default(15000),
  GROCERY_SERVICE_FEE_BPS: z.coerce.number().int().min(1000).max(1500).default(1000),
  FOOD_WEB_BASE_URL: z.string().url().default("http://localhost:3007"),
  FOOD_SUPPORT_AI_WEBHOOK_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  FOOD_SUPPORT_AI_WEBHOOK_TOKEN: z.preprocess(blankToUndefined, z.string().min(8).optional()),
  NOTIFICATION_EMAIL_WEBHOOK_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  NOTIFICATION_EMAIL_WEBHOOK_TOKEN: z.preprocess(blankToUndefined, z.string().min(8).optional()),
  NOTIFICATION_SMS_WEBHOOK_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  NOTIFICATION_SMS_WEBHOOK_TOKEN: z.preprocess(blankToUndefined, z.string().min(8).optional()),
  EXPO_PUSH_ACCESS_TOKEN: z.preprocess(blankToUndefined, z.string().min(8).optional()),
  NOTIFICATION_WORKER_INTERVAL_MS: z.coerce.number().int().min(5000).max(300000).default(15000),
  OUTBOX_WORKER_INTERVAL_MS: z.coerce.number().int().min(5000).max(300000).default(15000),
  OUTBOX_PROCESSING_TIMEOUT_MS: z.coerce.number().int().min(60000).max(24 * 60 * 60_000).default(10 * 60_000),
  WEBHOOK_SIGNING_MASTER_SECRET: z.preprocess(blankToUndefined, z.string().min(32).optional()),
  MINIO_ENDPOINT: z.preprocess(blankToUndefined, z.string().url().optional()),
  MINIO_BUCKET: z.string().min(1).default("bazaara-media"),
  MINIO_REGION: z.string().min(1).default("us-east-1"),
  MINIO_ACCESS_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  MINIO_SECRET_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  CDN_BASE_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  PHARMACY_PRESCRIPTION_ENABLED: booleanString.default(false),
  SPORTS_REAL_MONEY_BETTING_ENABLED: z.enum(["false", "0"]).default("false").transform(() => false as const),
  ANALYTICS_ENABLED: booleanString.default(true),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.preprocess(blankToUndefined, z.string().url().optional()),
  BAZID_OIDC_ISSUER: z.string().url().default("http://localhost:4000"),
  BAZID_AUTHORIZATION_ENDPOINT: z.string().url().default("http://localhost:3004/bazid/authorize"),
  BAZID_OIDC_KEY_ID: z.string().trim().min(3).max(120).default("bazaara-local-dev"),
  BAZID_OIDC_SIGNING_PRIVATE_KEY_BASE64: z.preprocess(blankToUndefined, z.string().min(32).optional()),
});

export const env = schema.parse(process.env);
export const allowedOrigins = new Set(
  env.WEB_ORIGINS.split(",").map((value) => value.trim().replace(/\/$/, "")).filter(Boolean),
);
// BAZAARA_LOCAL_ORIGIN_ALIASES_V1
// Local development may be opened as localhost, 127.0.0.1 or ::1.
// Keep the fixed Bazaara web ports equivalent for CORS + CSRF without
// widening the production origin policy for real deployments.
// Never add development host aliases in production, even if a localhost origin
// accidentally remains in WEB_ORIGINS. Production requires explicit HTTPS URLs.
if (env.NODE_ENV === "production") {
  for (const origin of allowedOrigins) {
    let url: URL;
    try {
      url = new URL(origin);
    } catch {
      throw new Error("WEB_ORIGINS must contain absolute HTTPS origins in production.");
    }
    if (
      url.protocol !== "https:" ||
      /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(url.hostname) ||
      url.origin !== origin
    ) {
      throw new Error(`Unsafe production WEB_ORIGINS entry: ${origin}`);
    }
  }
}
const localOriginAliasesEnabled = env.NODE_ENV !== "production";

if (localOriginAliasesEnabled) {
  const localPorts = [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014, 3015, 3016, 3017, 3018, 3019] as const;
  for (const host of ["localhost", "127.0.0.1", "[::1]"] as const) {
    for (const port of localPorts) {
      allowedOrigins.add(`http://${host}:${port}`);
    }
  }
}
// BAZAARA_GO_LOCAL_ORIGIN_V2
// Explicit local Bazaara Go web origins for direct browser fallback.
// Production origins remain governed by the normal configured allow-list.
if (env.NODE_ENV !== "production") {
  for (const host of ["localhost", "127.0.0.1", "[::1]"] as const) {
    allowedOrigins.add(`http://${host}:3008`);
  }
}
