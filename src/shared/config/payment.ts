export type PaymentConfig = {
  provider: "bold-sandbox" | "mock" | "unavailable";
  identityKey?: string;
  secretKey?: string;
  ready: boolean;
};

// Production Bold is a separate feature: "bold" is only an alias of sandbox.
const BOLD_SANDBOX_ALIASES = new Set(["bold-sandbox", "bold"]);

export function getPaymentConfig(env: NodeJS.ProcessEnv = process.env): PaymentConfig {
  const provider = env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (provider && BOLD_SANDBOX_ALIASES.has(provider)) {
    const identityKey = env.BOLD_IDENTITY_KEY?.trim();
    const secretKey = env.BOLD_SECRET_KEY?.trim();
    return { provider: "bold-sandbox", identityKey, secretKey, ready: Boolean(identityKey && secretKey) };
  }
  if (provider === "mock") return { provider, ready: true };
  return { provider: "unavailable", ready: false };
}

export function canOpenBold(config: PaymentConfig, input: { country: string; currency: string; total: number }): boolean {
  const country = input.country.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  return config.provider === "bold-sandbox" && config.ready && country === "CO" && currency === "COP" && Number.isInteger(input.total) && input.total > 0;
}
