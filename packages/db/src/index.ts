import { PrismaClient } from "@prisma/client";

declare global {
  var __bazaaraPrisma: PrismaClient | undefined;
}

export const db = globalThis.__bazaaraPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalThis.__bazaaraPrisma = db;
export * from "@prisma/client";
