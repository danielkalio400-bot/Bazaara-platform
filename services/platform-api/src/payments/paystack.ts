import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config.js";
import type { PaymentProviderAdapter, ProviderPaymentRequest, ProviderPaymentResult, ProviderRefundRequest } from "./provider.js";

const PAYSTACK_API = "https://api.paystack.co";
const REQUEST_TIMEOUT_MS = 15_000;

type PaystackEnvelope<T> = { status: boolean; message: string; data?: T };
type InitializeData = { authorization_url: string; access_code: string; reference: string };
type VerifyData = { status: string; reference: string; amount: number; currency: string; gateway_response?: string };
type RefundData = { id?: number; status?: string; transaction?: { reference?: string } | number; refund_reference?: string };

async function paystackRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!env.PAYSTACK_SECRET_KEY) throw new Error("Paystack is not configured on this server");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "content-type": "application/json",
        accept: "application/json",
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as PaystackEnvelope<T> | null;
    if (!response.ok || !body?.status || body.data === undefined) {
      const error = new Error(body?.message || `Paystack returned HTTP ${response.status}`);
      Object.assign(error, { statusCode: response.status });
      throw error;
    }
    return body.data;
  } finally {
    clearTimeout(timeout);
  }
}

function transactionStatus(data: VerifyData): ProviderPaymentResult["status"] {
  const status = data.status.toLowerCase();
  if (status === "success") return "CAPTURED";
  if (["failed", "abandoned", "reversed"].includes(status)) return "FAILED";
  return "PENDING";
}

export class PaystackProvider implements PaymentProviderAdapter {
  readonly key = "PAYSTACK";

  async createPayment(request: ProviderPaymentRequest): Promise<ProviderPaymentResult> {
    if (!request.customerEmail) throw new Error("A verified customer email is required for Paystack checkout");
    const reference = `BZ_${request.paymentIntentId}_${request.idempotencyKey}`.replace(/[^A-Za-z0-9._=-]/g, "").slice(0, 100);
    const data = await paystackRequest<InitializeData>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: request.customerEmail,
        amount: String(request.amountMinor),
        currency: request.currency,
        reference,
        callback_url: request.callbackUrl,
        channels: request.channels,
        metadata: JSON.stringify({
          paymentIntentId: request.paymentIntentId,
          paymentMethod: request.paymentMethod,
          idempotencyKey: request.idempotencyKey,
          ...(request.metadata ?? {}),
        }),
      }),
    });
    return {
      providerReference: data.reference,
      status: "PENDING",
      checkoutUrl: data.authorization_url,
      accessCode: data.access_code,
      raw: data,
    };
  }

  async requestRefund(request: ProviderRefundRequest): Promise<ProviderPaymentResult> {
    if (!request.providerReference) throw new Error("Paystack transaction reference is missing for this refund");
    const data = await paystackRequest<RefundData>("/refund", {
      method: "POST",
      body: JSON.stringify({
        transaction: request.providerReference,
        amount: request.amountMinor,
        currency: request.currency,
        customer_note: request.reason,
        merchant_note: `Bazaara refund ${request.refundId}`,
      }),
    });
    return {
      providerReference: data.refund_reference ?? String(data.id ?? request.refundId),
      status: "PENDING",
      raw: data,
    };
  }

  async reconcile(providerReference: string): Promise<ProviderPaymentResult> {
    const data = await paystackRequest<VerifyData>(`/transaction/verify/${encodeURIComponent(providerReference)}`, { method: "GET" });
    return {
      providerReference: data.reference,
      status: transactionStatus(data),
      amountMinor: data.amount,
      currency: data.currency,
      errorMessage: data.status === "success" ? undefined : data.gateway_response,
      raw: data,
    };
  }
}

export function paystackConfigured() {
  return Boolean(env.PAYSTACK_SECRET_KEY);
}

export function verifyPaystackWebhookSignatureWithSecret(rawBody: Buffer, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyPaystackWebhookSignature(rawBody: Buffer, signature: string) {
  return verifyPaystackWebhookSignatureWithSecret(rawBody, signature, env.PAYSTACK_SECRET_KEY ?? "");
}


export type PaystackBank = { name: string; code: string; slug?: string };
type ResolveAccountData = { account_number: string; account_name: string; bank_id?: number };
type TransferRecipientData = { recipient_code: string; name?: string; details?: { account_number?: string; bank_code?: string; bank_name?: string } };
type TransferData = { transfer_code?: string; reference: string; status: string; amount?: number; currency?: string; reason?: string };

export async function listPaystackBanks(): Promise<PaystackBank[]> {
  const data = await paystackRequest<Array<{ name:string; code:string; slug?:string }>>("/bank?country=nigeria&currency=NGN&perPage=100", { method: "GET" });
  return data.map((bank) => ({ name: bank.name, code: bank.code, slug: bank.slug }));
}

export async function resolvePaystackBankAccount(accountNumber: string, bankCode: string) {
  return paystackRequest<ResolveAccountData>(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`, { method: "GET" });
}

export async function createPaystackTransferRecipient(input: { name:string; accountNumber:string; bankCode:string; currency?:string }) {
  return paystackRequest<TransferRecipientData>("/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: input.name, account_number: input.accountNumber, bank_code: input.bankCode, currency: input.currency ?? "NGN" }) });
}

export async function initiatePaystackTransfer(input: { amountMinor:number; recipientCode:string; reference:string; reason:string; currency?:string }) {
  return paystackRequest<TransferData>("/transfer", { method: "POST", body: JSON.stringify({ source: "balance", amount: input.amountMinor, recipient: input.recipientCode, reference: input.reference, reason: input.reason, currency: input.currency ?? "NGN" }) });
}

export async function verifyPaystackTransfer(reference: string) {
  return paystackRequest<TransferData>(`/transfer/verify/${encodeURIComponent(reference)}`, { method: "GET" });
}
