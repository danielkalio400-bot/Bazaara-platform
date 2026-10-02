/** Display only: the server's available balance is authoritative. Never infer credit or funds. */
export function formatDriveWalletAmount(minor: number, currency: string): string {
  if (!Number.isSafeInteger(minor) || minor < 0) return "Balance unavailable";
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "NGN";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  }
}
