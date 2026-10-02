import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { verifyPayPin } from "../pay/service.js";
import {
  createPaystackTransferRecipient,
  initiatePaystackTransfer,
  listPaystackBanks,
  resolvePaystackBankAccount,
  verifyPaystackTransfer,
} from "../payments/paystack.js";

async function requireBusinessMember(
  request: FastifyRequest,
  organizationId: string,
  finance = false,
) {
  const auth = await requireAuth(request);
  const member = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: auth.userId,
      },
    },
  });
  if (!member || member.status !== "ACTIVE") {
    throw new AppError("FORBIDDEN", "Active Business membership required", 403);
  }
  if (
    finance &&
    !["OWNER", "ADMIN", "FINANCE"].includes(member.roleKey) &&
    !member.permissions.includes("*") &&
    !member.permissions.includes("finance.read") &&
    !member.permissions.includes("settlements.read")
  ) {
    throw new AppError("FORBIDDEN", "Finance permission required", 403);
  }
  return { auth, member };
}

function minor(value: bigint) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Monetary value exceeds transport range");
  return n;
}

async function balanceMinor(
  accountId: string,
  tx: Prisma.TransactionClient | typeof db = db,
) {
  const totals = await tx.ledgerEntry.groupBy({
    by: ["direction"],
    where: { accountId },
    _sum: { amountMinor: true },
  });
  let balance = 0n;
  for (const row of totals) {
    const value = row._sum.amountMinor ?? 0n;
    balance += row.direction === "CREDIT" ? value : -value;
  }
  return balance;
}

async function ensureBusinessWallet(organizationId: string, currency = "NGN") {
  let wallet = await db.wallet.findUnique({
    where: {
      ownerKey_currency: {
        ownerKey: `organization:${organizationId}`,
        currency,
      },
    },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: {
        organizationId,
        ownerKey: `organization:${organizationId}`,
        currency,
      },
    });
  }
  let account = await db.ledgerAccount.findFirst({
    where: {
      walletId: wallet.id,
      currency,
      kind: "WALLET_LIABILITY",
    },
  });
  if (!account) {
    account = await db.ledgerAccount.create({
      data: {
        walletId: wallet.id,
        code: `business-wallet:${wallet.id}:${currency}`,
        currency,
        kind: "WALLET_LIABILITY",
      },
    });
  }
  return { wallet, account };
}

async function payoutClearing(
  tx: Prisma.TransactionClient,
  currency: string,
) {
  const code = `bazaara:business:payout-clearing:${currency}`;
  return (
    (await tx.ledgerAccount.findUnique({ where: { code } })) ??
    (await tx.ledgerAccount.create({
      data: {
        code,
        currency,
        kind: "PAYOUT_CLEARING",
      },
    }))
  );
}

function withdrawalContract(row: any) {
  return {
    id: row.id,
    reference: row.reference,
    amountMinor: minor(row.amountMinor),
    currency: row.currency,
    status: row.status,
    providerReference: row.providerReference ?? null,
    failureMessage: row.failureMessage ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
  };
}

async function reverseWithdrawal(withdrawalId: string, message: string) {
  return db.$transaction(async (tx) => {
    const row = await tx.businessWithdrawal.findUnique({ where: { id: withdrawalId } });
    if (!row) throw new AppError("NOT_FOUND", "Business withdrawal not found", 404);
    if (row.status === "FAILED") return row;

    const originalRef = `business-withdrawal:${row.id}`;
    const reverseRef = `business-withdrawal-reversal:${row.id}`;
    const reverseExists = await tx.ledgerTransaction.findUnique({
      where: { reference: reverseRef },
    });

    if (!reverseExists) {
      const walletAccount = await tx.ledgerAccount.findFirst({
        where: {
          walletId: row.walletId,
          currency: row.currency,
          kind: "WALLET_LIABILITY",
        },
      });
      if (!walletAccount) throw new AppError("CONFLICT", "Business wallet ledger account missing", 409);
      const clearing = await payoutClearing(tx, row.currency);
      await postJournal(tx, {
        reference: reverseRef,
        kind: "BUSINESS_WITHDRAWAL_REVERSAL",
        currency: row.currency,
        description: `Reversal for ${originalRef}`,
        lines: [
          { accountId: clearing.id, direction: "DEBIT", amountMinor: row.amountMinor },
          { accountId: walletAccount.id, direction: "CREDIT", amountMinor: row.amountMinor },
        ],
      });
    }

    return tx.businessWithdrawal.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        failureMessage: message.slice(0, 500),
        failedAt: new Date(),
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function businessV25Routes(app: FastifyInstance) {
  app.get("/v1/business/v25/capabilities", async () => ({
    bTaxId: true,
    branchGeolocation: true,
    verificationDocuments: true,
    businessPayWallet: true,
    bankWithdrawals: Boolean(env.PAYSTACK_SECRET_KEY && env.PAYSTACK_TRANSFERS_ENABLED),
    productMediaUpload: true,
  }));

  app.get(
    "/v1/business/v25/organizations/:organizationId/verification-documents",
    async (request) => {
      const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
      await requireBusinessMember(request, organizationId);
      const documents = await db.businessVerificationDocument.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      });
      return {
        documents: documents.map((document) => ({
          ...document,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        })),
      };
    },
  );

  app.post(
    "/v1/business/v25/organizations/:organizationId/verification-documents",
    async (request, reply) => {
      const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
      const { auth } = await requireBusinessMember(request, organizationId);
      const input = z.object({
        assetId: z.string(),
        type: z.enum([
          "BUSINESS_REGISTRATION",
          "OWNER_ID",
          "ADDRESS_PROOF",
          "FOOD_DOCUMENT",
          "PHARMACY_LICENCE",
          "OTHER",
        ]),
        fileName: z.string().trim().min(1).max(240),
      }).parse(request.body);

      const asset = await db.mediaAsset.findFirst({
        where: {
          id: input.assetId,
          ownerUserId: auth.userId,
          status: "READY",
        },
      });
      if (!asset) throw new AppError("NOT_FOUND", "Completed verification upload not found", 404);

      const document = await db.businessVerificationDocument.create({
        data: {
          organizationId,
          assetId: asset.id,
          type: input.type,
          fileName: input.fileName,
        },
      });

      return reply.code(201).send({ document });
    },
  );

  app.get(
    "/v1/business/v25/organizations/:organizationId/finance",
    async (request) => {
      const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
      await requireBusinessMember(request, organizationId, true);

      const { wallet, account } = await ensureBusinessWallet(organizationId, "NGN");
      const [available, payoutAccount, withdrawals, settlements] = await Promise.all([
        balanceMinor(account.id),
        db.businessPayoutAccount.findUnique({ where: { organizationId } }),
        db.businessWithdrawal.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.businessSettlement.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
      ]);

      return {
        pay: {
          connected: true,
          walletId: wallet.id,
          currency: wallet.currency,
          availableMinor: minor(available),
          providerWithdrawalsEnabled: Boolean(
            env.PAYSTACK_SECRET_KEY && env.PAYSTACK_TRANSFERS_ENABLED,
          ),
        },
        payoutAccount: payoutAccount
          ? {
              id: payoutAccount.id,
              provider: payoutAccount.provider,
              bankCode: payoutAccount.bankCode,
              bankName: payoutAccount.bankName,
              accountName: payoutAccount.accountName,
              accountNumberLast4: payoutAccount.accountNumberLast4,
              status: payoutAccount.status,
            }
          : null,
        withdrawals: withdrawals.map(withdrawalContract),
        settlements: settlements.map((row) => ({
          id: row.id,
          reference: row.reference,
          currency: row.currency,
          grossMinor: minor(row.grossMinor),
          feeMinor: minor(row.feeMinor),
          netMinor: minor(row.netMinor),
          status: row.status,
          provider: row.provider,
          providerRef: row.providerRef,
          scheduledFor: row.scheduledFor?.toISOString() ?? null,
          settledAt: row.settledAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
      };
    },
  );

  app.get("/v1/business/v25/banks", async (request) => {
    await requireAuth(request);
    if (!env.PAYSTACK_SECRET_KEY) {
      return { configured: false, banks: [] };
    }
    return { configured: true, banks: await listPaystackBanks() };
  });

  app.post(
    "/v1/business/v25/organizations/:organizationId/payout-account",
    async (request) => {
      const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
      await requireBusinessMember(request, organizationId, true);
      if (!env.PAYSTACK_SECRET_KEY) {
        throw new AppError("PROVIDER_UNAVAILABLE", "Bank payout provider is not configured", 503);
      }

      const input = z.object({
        bankCode: z.string().trim().min(1).max(20),
        accountNumber: z.string().trim().regex(/^\d{10}$/),
      }).parse(request.body);

      const resolved = await resolvePaystackBankAccount(input.accountNumber, input.bankCode);
      const banks = await listPaystackBanks();
      const bank = banks.find((item) => item.code === input.bankCode);
      const recipient = await createPaystackTransferRecipient({
        name: resolved.account_name,
        accountNumber: input.accountNumber,
        bankCode: input.bankCode,
        currency: "NGN",
      });

      const account = await db.businessPayoutAccount.upsert({
        where: { organizationId },
        create: {
          organizationId,
          bankCode: input.bankCode,
          bankName: bank?.name ?? input.bankCode,
          accountName: resolved.account_name,
          accountNumberLast4: input.accountNumber.slice(-4),
          providerRecipientCode: recipient.recipient_code,
        },
        update: {
          bankCode: input.bankCode,
          bankName: bank?.name ?? input.bankCode,
          accountName: resolved.account_name,
          accountNumberLast4: input.accountNumber.slice(-4),
          providerRecipientCode: recipient.recipient_code,
          status: "ACTIVE",
        },
      });

      return {
        payoutAccount: {
          id: account.id,
          bankCode: account.bankCode,
          bankName: account.bankName,
          accountName: account.accountName,
          accountNumberLast4: account.accountNumberLast4,
          status: account.status,
        },
      };
    },
  );

  app.post(
    "/v1/business/v25/organizations/:organizationId/withdrawals",
    async (request, reply) => {
      const { organizationId } = z.object({ organizationId: z.string() }).parse(request.params);
      const { auth } = await requireBusinessMember(request, organizationId, true);

      if (!env.PAYSTACK_SECRET_KEY || !env.PAYSTACK_TRANSFERS_ENABLED) {
        throw new AppError("PROVIDER_UNAVAILABLE", "Business bank withdrawals are not enabled", 503);
      }

      const input = z.object({
        amountMinor: z.number().int().min(10_000).max(5_000_000_000),
        pin: z.string().regex(/^\d{6}$/),
        idempotencyKey: z.string().trim().min(8).max(160),
      }).parse(request.body);

      await verifyPayPin(auth.userId, input.pin);

      const existing = await db.businessWithdrawal.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });
      if (existing) return reply.send({ withdrawal: withdrawalContract(existing) });

      const payout = await db.businessPayoutAccount.findFirst({
        where: { organizationId, status: "ACTIVE" },
      });
      if (!payout) throw new AppError("CONFLICT", "Connect a verified payout bank first", 409);

      const { wallet, account } = await ensureBusinessWallet(organizationId, "NGN");
      const amount = BigInt(input.amountMinor);

      const pending = await db.$transaction(async (tx) => {
        const available = await balanceMinor(account.id, tx);
        if (available < amount) {
          throw new AppError("CONFLICT", "Insufficient Wallet Business balance", 409);
        }

        const reference =
          `BZBW-${Date.now().toString(36).toUpperCase()}-${randomBytes(4)
            .toString("hex")
            .toUpperCase()}`;

        const row = await tx.businessWithdrawal.create({
          data: {
            organizationId,
            walletId: wallet.id,
            payoutAccountId: payout.id,
            reference,
            amountMinor: amount,
            currency: "NGN",
            status: "PROCESSING",
            idempotencyKey: input.idempotencyKey,
          },
        });

        const clearing = await payoutClearing(tx, "NGN");
        const journal = await postJournal(tx, {
          reference: `business-withdrawal:${row.id}`,
          kind: "BUSINESS_WITHDRAWAL",
          currency: "NGN",
          description: `Business withdrawal to ${payout.bankName} ••••${payout.accountNumberLast4}`,
          lines: [
            { accountId: account.id, direction: "DEBIT", amountMinor: amount },
            { accountId: clearing.id, direction: "CREDIT", amountMinor: amount },
          ],
        });

        return tx.businessWithdrawal.update({
          where: { id: row.id },
          data: { ledgerTransactionId: journal.id },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      try {
        const transfer = await initiatePaystackTransfer({
          amountMinor: input.amountMinor,
          recipientCode: payout.providerRecipientCode,
          reference: pending.reference,
          reason: "Business payout",
          currency: "NGN",
        });
        const completed = transfer.status.toLowerCase() === "success";
        const updated = await db.businessWithdrawal.update({
          where: { id: pending.id },
          data: {
            providerReference: transfer.reference,
            status: completed ? "COMPLETED" : "PENDING",
            completedAt: completed ? new Date() : null,
          },
        });
        return reply.code(201).send({ withdrawal: withdrawalContract(updated) });
      } catch (cause) {
        const failed = await reverseWithdrawal(
          pending.id,
          cause instanceof Error ? cause.message : "Withdrawal provider request failed",
        );
        return reply.code(502).send({ withdrawal: withdrawalContract(failed) });
      }
    },
  );

  app.post(
    "/v1/business/v25/organizations/:organizationId/withdrawals/:id/reconcile",
    async (request) => {
      const { organizationId, id } = z.object({
        organizationId: z.string(),
        id: z.string(),
      }).parse(request.params);
      await requireBusinessMember(request, organizationId, true);

      const row = await db.businessWithdrawal.findFirst({
        where: { id, organizationId },
      });
      if (!row) throw new AppError("NOT_FOUND", "Business withdrawal not found", 404);
      if (!row.providerReference || ["COMPLETED", "FAILED"].includes(row.status)) {
        return { withdrawal: withdrawalContract(row) };
      }

      try {
        const provider = await verifyPaystackTransfer(row.providerReference);
        const status = provider.status.toLowerCase();
        if (status === "success") {
          const updated = await db.businessWithdrawal.update({
            where: { id: row.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
          return { withdrawal: withdrawalContract(updated) };
        }
        if (["failed", "reversed"].includes(status)) {
          return {
            withdrawal: withdrawalContract(
              await reverseWithdrawal(row.id, provider.reason ?? "Provider rejected withdrawal"),
            ),
          };
        }
      } catch {
        // Leave pending so the owner can retry reconciliation later.
      }

      return { withdrawal: withdrawalContract(row) };
    },
  );
}
