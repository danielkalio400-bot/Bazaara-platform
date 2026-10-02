import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import type { PayFundingIntentContract } from "@bazaara/contracts";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { appendOutboxEvent } from "../outbox.js";
import { paymentProvider } from "../payments/registry.js";
import { compareProviderCapture } from "../payments/provider.js";
import type { PaystackWebhookBody } from "../payments/provider-service.js";

function safeMinor(value: bigint) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}

function contract(row: {
  id: string;
  walletId: string;
  provider: string;
  providerReference: string | null;
  paymentMethod: string;
  amountMinor: bigint;
  currency: string;
  status: string;
  checkoutUrl: string | null;
  failureMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): PayFundingIntentContract {
  return {
    id: row.id,
    walletId: row.walletId,
    provider: row.provider,
    providerReference: row.providerReference,
    paymentMethod: row.paymentMethod as "PAYSTACK_CARD" | "PAYSTACK_BANK",
    amountMinor: safeMinor(row.amountMinor),
    currency: row.currency,
    status: row.status,
    checkoutUrl: row.checkoutUrl,
    failureMessage: row.failureMessage,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

async function ensureWallet(tx: Prisma.TransactionClient, userId: string, currency: string) {
  let wallet = await tx.wallet.findUnique({ where: { ownerKey_currency: { ownerKey: `user:${userId}`, currency } } });
  if (!wallet) wallet = await tx.wallet.create({ data: { userId, ownerKey: `user:${userId}`, currency } });
  let account = await tx.ledgerAccount.findFirst({ where: { walletId: wallet.id, currency, kind: "WALLET_LIABILITY" } });
  if (!account) account = await tx.ledgerAccount.create({ data: { walletId: wallet.id, code: `wallet:${wallet.id}:${currency}`, currency, kind: "WALLET_LIABILITY" } });
  return { wallet, account };
}

async function ensureFundingClearingAccount(tx: Prisma.TransactionClient, currency: string) {
  const code = `paystack:funding-clearing:${currency}`;
  return await tx.ledgerAccount.findUnique({ where: { code } })
    ?? await tx.ledgerAccount.create({ data: { code, currency, kind: "PAYMENT_CLEARING_ASSET" } });
}

async function primaryEmail(userId: string) {
  const row = await db.userEmail.findFirst({ where: { userId, isPrimary: true, verifiedAt: { not: null } }, select: { email: true } });
  if (!row) throw new AppError("CONFLICT", "A verified primary BazID email is required to add money", 409);
  return row.email;
}

export async function createPayFundingIntent(input: {
  userId: string;
  idempotencyKey: string;
  amountMinor: number;
  currency?: string;
  paymentMethod: "PAYSTACK_CARD" | "PAYSTACK_BANK";
}) {
  if (!env.PAYSTACK_SECRET_KEY) throw new AppError("PROVIDER_UNAVAILABLE", "Wallet funding requires Paystack to be configured", 503);
  const provider = paymentProvider("PAYSTACK");
  if (!provider) throw new AppError("PROVIDER_UNAVAILABLE", "Paystack is not available", 503);
  const currency = (input.currency ?? env.CURRENCY).toUpperCase();
  const email = await primaryEmail(input.userId);
  const walletInfo = await db.$transaction((tx) => ensureWallet(tx, input.userId, currency));

  const existing = await db.payFundingIntent.findUnique({ where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } } });
  if (existing) return { fundingIntent: contract(existing), checkoutUrl: existing.checkoutUrl, replayed: true };

  const intent = await db.payFundingIntent.create({
    data: {
      userId: input.userId,
      walletId: walletInfo.wallet.id,
      paymentMethod: input.paymentMethod,
      amountMinor: BigInt(input.amountMinor),
      currency,
      idempotencyKey: input.idempotencyKey,
      status: "INITIALIZING",
    },
  });

  try {
    const callbackBase = (env.BAZAARA_PAY_WEB_BASE_URL ?? "http://localhost:3010").replace(/\/$/, "");
    const result = await provider.createPayment({
      paymentIntentId: `fund_${intent.id}`,
      amountMinor: input.amountMinor,
      currency,
      paymentMethod: input.paymentMethod,
      idempotencyKey: input.idempotencyKey,
      customerEmail: email,
      callbackUrl: `${callbackBase}/?funding=return&fundingIntent=${encodeURIComponent(intent.id)}`,
      channels: input.paymentMethod === "PAYSTACK_CARD" ? ["card"] : ["bank", "bank_transfer", "ussd"],
      metadata: { kind: "BAZAARA_PAY_FUNDING", fundingIntentId: intent.id, walletId: walletInfo.wallet.id, userId: input.userId },
    });
    if (!result.checkoutUrl) throw new Error("Paystack did not return a checkout URL");
    const updated = await db.payFundingIntent.update({
      where: { id: intent.id },
      data: { status: "PENDING", providerReference: result.providerReference, checkoutUrl: result.checkoutUrl, failureMessage: null },
    });
    return { fundingIntent: contract(updated), checkoutUrl: result.checkoutUrl, replayed: false };
  } catch (cause) {
    await db.payFundingIntent.update({ where: { id: intent.id }, data: { status: "FAILED", failureMessage: cause instanceof Error ? cause.message : "Funding initialization failed" } }).catch(() => undefined);
    throw new AppError("CONFLICT", cause instanceof Error ? cause.message : "Funding initialization failed", 409);
  }
}

async function completeFunding(intentId: string) {
  return db.$transaction(async (tx) => {
    const claimed = await tx.payFundingIntent.updateMany({ where: { id: intentId, status: "PENDING" }, data: { status: "PROCESSING", failureMessage: null } });
    const row = await tx.payFundingIntent.findUnique({ where: { id: intentId } });
    if (!row) throw new AppError("NOT_FOUND", "Funding intent not found", 404);
    if (row.status === "COMPLETED") return row;
    if (claimed.count !== 1) throw new AppError("CONFLICT", "Funding intent cannot be completed from its current state", 409);

    const { account: walletAccount } = await ensureWallet(tx, row.userId, row.currency);
    const clearing = await ensureFundingClearingAccount(tx, row.currency);
    const journal = await postJournal(tx, {
      reference: `pay-funding:${row.id}`,
      kind: "WALLET_FUNDING",
      currency: row.currency,
      description: `Wallet funding ${row.providerReference ?? row.id}`,
      lines: [
        { accountId: clearing.id, direction: "DEBIT", amountMinor: row.amountMinor },
        { accountId: walletAccount.id, direction: "CREDIT", amountMinor: row.amountMinor },
      ],
    });
    const completed = await tx.payFundingIntent.update({ where: { id: row.id }, data: { status: "COMPLETED", completedAt: new Date(), failureMessage: null } });
    await appendOutboxEvent(tx, {
      aggregateType: "PayFundingIntent",
      aggregateId: completed.id,
      eventType: "pay.funding.completed",
      payload: { fundingIntentId: completed.id, walletId: completed.walletId, amountMinor: safeMinor(completed.amountMinor), currency: completed.currency, ledgerTransactionId: journal.id },
    });
    return completed;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function reconcilePayFundingIntent(input: { userId: string; fundingIntentId: string }) {
  const row = await db.payFundingIntent.findFirst({ where: { id: input.fundingIntentId, userId: input.userId } });
  if (!row) throw new AppError("NOT_FOUND", "Funding intent not found", 404);
  if (row.status === "COMPLETED") return { fundingIntent: contract(row), reconciled: true };
  if (!row.providerReference) throw new AppError("CONFLICT", "Funding provider reference is missing", 409);
  const provider = paymentProvider(row.provider);
  if (!provider?.reconcile) throw new AppError("PROVIDER_UNAVAILABLE", "Funding provider reconciliation is unavailable", 503);
  const result = await provider.reconcile(row.providerReference);
  const comparison = compareProviderCapture({
    expectedAmountMinor: safeMinor(row.amountMinor),
    expectedCurrency: row.currency,
    reportedAmountMinor: result.amountMinor,
    reportedCurrency: result.currency,
  });
  if (result.status === "CAPTURED") {
    if (!comparison.matches) {
      const failed = await db.payFundingIntent.update({ where: { id: row.id }, data: { status: "FAILED", failureMessage: "Provider capture did not match the requested amount/currency" } });
      return { fundingIntent: contract(failed), reconciled: true, mismatch: true };
    }
    const completed = await completeFunding(row.id);
    return { fundingIntent: contract(completed), reconciled: true };
  }
  if (result.status === "FAILED") {
    const failed = await db.payFundingIntent.update({ where: { id: row.id }, data: { status: "FAILED", failureMessage: result.errorMessage ?? "Provider reported failed funding" } });
    return { fundingIntent: contract(failed), reconciled: true };
  }
  return { fundingIntent: contract(row), reconciled: true };
}

export async function listPayFundingIntents(userId: string) {
  const rows = await db.payFundingIntent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
  return { fundingIntents: rows.map(contract) };
}

export async function processPaystackFundingWebhook(body: PaystackWebhookBody) {
  const eventType = body.event ?? "";
  const data = body.data ?? {};
  const providerReference = data.reference ?? data.transaction_reference;
  if (!providerReference) return { handled: false as const };
  const row = await db.payFundingIntent.findUnique({ where: { providerReference: String(providerReference) } });
  if (!row) return { handled: false as const };
  if (eventType !== "charge.success") return { handled: true as const, ignored: true, reason: `Funding event ${eventType} is non-terminal` };
  const comparison = compareProviderCapture({
    expectedAmountMinor: safeMinor(row.amountMinor),
    expectedCurrency: row.currency,
    reportedAmountMinor: data.amount == null ? undefined : Number(data.amount),
    reportedCurrency: data.currency,
  });
  if (!comparison.matches) {
    await db.payFundingIntent.update({ where: { id: row.id }, data: { status: "FAILED", failureMessage: "Paystack webhook amount/currency mismatch" } });
    return { handled: true as const, ignored: true, mismatch: true };
  }
  const completed = row.status === "COMPLETED" ? row : await completeFunding(row.id);
  return { handled: true as const, completed: true, fundingIntent: contract(completed) };
}
