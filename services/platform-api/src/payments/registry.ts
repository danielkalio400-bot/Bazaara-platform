import type { PaymentProviderAdapter } from "./provider.js";
import { PaystackProvider, paystackConfigured } from "./paystack.js";

const paystack = new PaystackProvider();

export function paymentProvider(key: string): PaymentProviderAdapter | null {
  if (key.toUpperCase() === "PAYSTACK" && paystackConfigured()) return paystack;
  return null;
}

export function paymentProviderCapabilities() {
  return {
    PAYSTACK: {
      configured: paystackConfigured(),
      methods: ["PAYSTACK_CARD", "PAYSTACK_BANK"],
    },
  } as const;
}
