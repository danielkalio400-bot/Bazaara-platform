export type ProviderPaymentRequest = {
  paymentIntentId: string;
  amountMinor: number;
  currency: string;
  paymentMethod: string;
  idempotencyKey: string;
  customerEmail?: string;
  callbackUrl?: string;
  channels?: string[];
  metadata?: Record<string, unknown>;
};

export type ProviderPaymentResult = {
  providerReference: string;
  status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED";
  checkoutUrl?: string;
  accessCode?: string;
  amountMinor?: number;
  currency?: string;
  retryable?: boolean;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
};

export type ProviderRefundRequest = {
  paymentIntentId: string;
  refundId: string;
  providerReference?: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  reason: string;
};

export interface PaymentProviderAdapter {
  readonly key: string;
  createPayment(request: ProviderPaymentRequest): Promise<ProviderPaymentResult>;
  requestRefund(request: ProviderRefundRequest): Promise<ProviderPaymentResult>;
  reconcile?(providerReference: string): Promise<ProviderPaymentResult>;
}

export function compareProviderCapture(input: {
  expectedAmountMinor: number;
  expectedCurrency: string;
  reportedAmountMinor?: number;
  reportedCurrency?: string;
}) {
  const reportedCurrency = input.reportedCurrency?.trim().toUpperCase();
  const expectedCurrency = input.expectedCurrency.trim().toUpperCase();
  const amountMatches = Number.isSafeInteger(input.reportedAmountMinor) && input.reportedAmountMinor === input.expectedAmountMinor;
  const currencyMatches = Boolean(reportedCurrency) && reportedCurrency === expectedCurrency;
  return {
    matches: amountMatches && currencyMatches,
    amountMatches,
    currencyMatches,
    expectedAmountMinor: input.expectedAmountMinor,
    reportedAmountMinor: Number.isSafeInteger(input.reportedAmountMinor) ? input.reportedAmountMinor! : null,
    expectedCurrency,
    reportedCurrency: reportedCurrency ?? null,
  };
}
