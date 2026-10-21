export type PaymentConfig = {
  provider: "bold-sandbox" | "mock" | "unavailable";
  boldMode: "sandbox" | "live";
  identityKey?: string;
  secretKey?: string;
  ready: boolean;
};

// "bold" keeps the same checkout path. Live charges depend on BOLD_ENV and the production key pair.
const BOLD_SANDBOX_ALIASES = new Set(["bold-sandbox", "bold"]);

export function boldEnvironment(value: string | undefined): "sandbox" | "live" {
  const mode = value?.trim().toLowerCase();
  return mode === "live" || mode === "production" ? "live" : "sandbox";
}

export function getPaymentConfig(env: NodeJS.ProcessEnv = process.env): PaymentConfig {
  const provider = env.PAYMENT_PROVIDER?.trim().toLowerCase();
  const boldMode = boldEnvironment(env.BOLD_ENV);
  if (provider && BOLD_SANDBOX_ALIASES.has(provider)) {
    const identityKey = env.BOLD_IDENTITY_KEY?.trim();
    const secretKey = env.BOLD_SECRET_KEY?.trim();
    return { provider: "bold-sandbox", boldMode, identityKey, secretKey, ready: Boolean(identityKey && secretKey) };
  }
  if (provider === "mock") return { provider, boldMode, ready: true };
  return { provider: "unavailable", boldMode, ready: false };
}

export function canOpenBold(config: Pick<PaymentConfig, "provider" | "ready">, input: { country: string; currency: string; total: number }): boolean {
  const country = input.country.trim().toUpperCase();
  const currency = input.currency.trim().toUpperCase();
  return config.provider === "bold-sandbox" && config.ready && country === "CO" && currency === "COP" && Number.isInteger(input.total) && input.total > 0;
}
