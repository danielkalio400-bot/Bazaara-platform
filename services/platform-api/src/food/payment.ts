import { db, Prisma } from "@bazaara/db";
import { postJournal } from "@bazaara/ledger";
import { AppError } from "../errors.js";
import { env } from "../config.js";
import { paymentProvider } from "../payments/registry.js";
import { compareProviderCapture } from "../payments/provider.js";
import { paystackConfigured } from "../payments/paystack.js";
import { queueBusinessFoodOrderReceivedTx } from "./notifications.js";

export type FoodPaymentMethod = "BAZAARA_PAY" | "PAYSTACK_CARD" | "PAYSTACK_BANK";

function safeMinor(value: bigint) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) throw new Error("Monetary value exceeds transport range");
  return amount;
}

async function ensureWalletAccountTx(
  tx: Prisma.TransactionClient,
  input: { ownerKey: string; currency: string; userId?: string | null },
) {
  let wallet = await tx.wallet.findUnique({ where: { ownerKey_currency: { ownerKey: input.ownerKey, currency: input.currency } } });
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        ownerKey: input.ownerKey,
        currency: input.currency,
        userId: input.userId ?? null,
        status: "ACTIVE",
      },
    });
  }
  if (wallet.status !== "ACTIVE") throw new AppError("CONFLICT", "Wallet is not active", 409);
  let account = await tx.ledgerAccount.findFirst({
    where: { walletId: wallet.id, currency: input.currency, kind: "WALLET_LIABILITY" },
  });
  if (!account) {
    account = await tx.ledgerAccount.create({
      data: {
        walletId: wallet.id,
        code: `wallet:${wallet.id}:${input.currency}`,
        currency: input.currency,
        kind: "WALLET_LIABILITY",
      },
    });
  }
  return { wallet, account };
}

async function accountBalanceTx(tx: Prisma.TransactionClient, accountId: string) {
  const grouped = await tx.ledgerEntry.groupBy({
    by: ["direction"],
    where: { accountId },
    _sum: { amountMinor: true },
  });
  let credit = 0n;
  let debit = 0n;
  for (const row of grouped) {
    if (row.direction === "CREDIT") credit = row._sum.amountMinor ?? 0n;
    else debit = row._sum.amountMinor ?? 0n;
  }
  return credit - debit;
}

export async function settleFoodPaymentTx(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    orderId: string;
    paymentMethod: FoodPaymentMethod;
    amountMinor: bigint;
    currency: string;
  },
) {
  if (input.paymentMethod === "BAZAARA_PAY") {
    const source = await ensureWalletAccountTx(tx, {
      ownerKey: `user:${input.userId}`,
      currency: input.currency,
      userId: input.userId,
    });
    const available = await accountBalanceTx(tx, source.account.id);
    if (available < input.amountMinor) {
      throw new AppError(
        "CONFLICT",
        `Insufficient Wallet balance. Available ${safeMinor(available)} minor units.`,
        409,
      );
    }

    const clearing = await ensureWalletAccountTx(tx, {
      ownerKey: "platform:bazaara:food-clearing",
      currency: input.currency,
    });

    const journal = await postJournal(tx, {
      reference: `food-wallet:${input.orderId}`,
      kind: "FOOD_PAYMENT",
      currency: input.currency,
      description: `Food order ${input.orderId}`,
      lines: [
        { accountId: source.account.id, direction: "DEBIT", amountMinor: input.amountMinor },
        { accountId: clearing.account.id, direction: "CREDIT", amountMinor: input.amountMinor },
      ],
    });

    await tx.payment.create({
      data: {
        internalReference: `FOOD:${input.orderId}`,
        provider: "BAZAARA_PAY",
        status: "CAPTURED",
        amountMinor: input.amountMinor,
        currency: input.currency,
        ledgerTransactionId: journal.id,
      },
    });

    return { paymentStatus: "PAID" as const };
  }

  await tx.payment.create({
    data: {
      internalReference: `FOOD:${input.orderId}`,
      provider: "PAYSTACK",
      status: "CREATED",
      amountMinor: input.amountMinor,
      currency: input.currency,
    },
  });
  return { paymentStatus: "PENDING" as const };
}

export async function foodPaymentCapabilities(userId: string) {
  const wallet = await db.wallet.findUnique({
    where: { ownerKey_currency: { ownerKey: `user:${userId}`, currency: env.CURRENCY } },
  });
  let walletBalanceMinor = 0;
  if (wallet) {
    const account = await db.ledgerAccount.findFirst({
      where: { walletId: wallet.id, currency: env.CURRENCY, kind: "WALLET_LIABILITY" },
    });
    if (account) {
      const grouped = await db.ledgerEntry.groupBy({
        by: ["direction"],
        where: { accountId: account.id },
        _sum: { amountMinor: true },
      });
      let credit = 0n;
      let debit = 0n;
      for (const row of grouped) {
        if (row.direction === "CREDIT") credit = row._sum.amountMinor ?? 0n;
        else debit = row._sum.amountMinor ?? 0n;
      }
      walletBalanceMinor = safeMinor(credit - debit);
    }
  }

  const [providerReady, profile] = await Promise.all([
    Promise.resolve(paystackConfigured()),
    db.payProfile.findUnique({ where: { userId }, select: { pinHash: true, pinLockedUntil: true } }),
  ]);
  return {
    currency: env.CURRENCY,
    walletBalanceMinor,
    walletPinSet: Boolean(profile?.pinHash),
    walletPinLockedUntil: profile?.pinLockedUntil?.toISOString() ?? null,
    methods: [
      {
        key: "BAZAARA_PAY" as const,
        label: "Wallet",
        available: true,
        reason: walletBalanceMinor > 0 ? null : "Add money to Wallet before using your wallet.",
      },
      {
        key: "PAYSTACK_CARD" as const,
        label: "Card",
        available: providerReady,
        reason: providerReady ? null : "Card payments require the configured payment provider.",
      },
      {
        key: "PAYSTACK_BANK" as const,
        label: "Bank transfer",
        available: providerReady,
        reason: providerReady ? null : "Bank transfer requires the configured payment provider.",
      },
    ],
  };
}

function foodPaymentReference(orderId: string) {
  return `FOOD:${orderId}`;
}

export async function initializeFoodPayment(input: {
  userId: string;
  orderId: string;
  idempotencyKey: string;
  returnOrigin?: string | null;
}) {
  const order = await db.foodOrder.findFirst({
    where: { id: input.orderId, userId: input.userId },
    include: { user: { include: { emails: { where: { isPrimary: true }, take: 1 } } } },
  });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  if (order.paymentStatus === "PAID") return { alreadyPaid: true, checkoutUrl: null, paymentStatus: order.paymentStatus };
  if (!["PAYSTACK_CARD", "PAYSTACK_BANK"].includes(order.paymentMethod)) {
    throw new AppError("CONFLICT", "This Food order does not use an external payment method", 409);
  }

  const provider = paymentProvider("PAYSTACK");
  if (!provider) throw new AppError("PROVIDER_UNAVAILABLE", "Online payments are not configured", 503);

  const email = order.user.emails[0]?.email;
  if (!email) throw new AppError("CONFLICT", "A primary BazID email is required for online payment", 409);

  const payment = await db.payment.findUnique({ where: { internalReference: foodPaymentReference(order.id) } });
  if (!payment) throw new AppError("CONFLICT", "Food payment record is missing", 409);

  const callbackOrigin = (input.returnOrigin || env.FOOD_WEB_BASE_URL).replace(/\/$/, "");
  const result = await provider.createPayment({
    paymentIntentId: `food-${order.id}`,
    amountMinor: safeMinor(order.totalMinor),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    idempotencyKey: input.idempotencyKey,
    customerEmail: email,
    callbackUrl: `${callbackOrigin}/orders/${encodeURIComponent(order.id)}?payment=return`,
    channels: order.paymentMethod === "PAYSTACK_CARD" ? ["card"] : ["bank", "bank_transfer", "ussd"],
    metadata: {
      vertical: "FOOD",
      foodOrderId: order.id,
      orderNumber: order.orderNumber,
      userId: input.userId,
    },
  });
  if (!result.checkoutUrl) throw new AppError("CONFLICT", "Payment provider did not return a checkout URL", 409);

  await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        provider: "PAYSTACK",
        providerReference: result.providerReference,
        status: "PENDING",
      },
    }),
    db.foodOrder.update({
      where: { id: order.id },
      data: { paymentStatus: "PENDING" },
    }),
  ]);

  return {
    alreadyPaid: false,
    checkoutUrl: result.checkoutUrl,
    providerReference: result.providerReference,
    paymentStatus: "PENDING",
  };
}

export async function reconcileFoodPayment(input: { userId: string; orderId: string }) {
  const order = await db.foodOrder.findFirst({ where: { id: input.orderId, userId: input.userId } });
  if (!order) throw new AppError("NOT_FOUND", "Food order not found", 404);
  if (order.paymentStatus === "PAID") return { reconciled: true, paymentStatus: "PAID", orderId: order.id };
  if (!["PAYSTACK_CARD", "PAYSTACK_BANK"].includes(order.paymentMethod)) {
    throw new AppError("CONFLICT", "This order does not require provider reconciliation", 409);
  }

  const payment = await db.payment.findUnique({ where: { internalReference: foodPaymentReference(order.id) } });
  if (!payment?.providerReference) throw new AppError("CONFLICT", "Payment has not been initialized yet", 409);
  const provider = paymentProvider("PAYSTACK");
  if (!provider?.reconcile) throw new AppError("PROVIDER_UNAVAILABLE", "Payment reconciliation is unavailable", 503);

  const result = await provider.reconcile(payment.providerReference);
  const comparison = compareProviderCapture({
    expectedAmountMinor: safeMinor(order.totalMinor),
    expectedCurrency: order.currency,
    reportedAmountMinor: result.amountMinor,
    reportedCurrency: result.currency,
  });

  if (result.status === "CAPTURED") {
    if (!comparison.matches) {
      await db.$transaction([
        db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
        db.foodOrder.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } }),
      ]);
      throw new AppError("CONFLICT", "Payment amount or currency did not match this Food order", 409);
    }

    await db.$transaction(async tx => {
      await tx.payment.update({ where: { id: payment.id }, data: { status: "CAPTURED" } });
      const newlyPaid = await tx.foodOrder.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" } },
        data: { paymentStatus: "PAID" },
      });
      if (newlyPaid.count === 1) await queueBusinessFoodOrderReceivedTx(tx, order.id);
    });
    return { reconciled: true, paymentStatus: "PAID", orderId: order.id };
  }

  if (result.status === "FAILED") {
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } }),
      db.foodOrder.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } }),
    ]);
    return { reconciled: true, paymentStatus: "FAILED", orderId: order.id };
  }

  await db.payment.update({ where: { id: payment.id }, data: { status: "PENDING" } });
  return { reconciled: true, paymentStatus: "PENDING", orderId: order.id };
}
