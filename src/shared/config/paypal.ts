export type PayPalConfig = {
  clientId: string;
  clientSecret: string;
  webhookId: string | null;
  apiBase: string;
  ready: boolean;
};

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function getPayPalConfig(env: Record<string, string | undefined> = process.env): PayPalConfig {
  const clientId = firstNonEmpty([env.PAYPAL_CLIENT_ID, env.NEXT_PUBLIC_PAYPAL_CLIENT_ID]);
  const clientSecret = firstNonEmpty([env.PAYPAL_CLIENT_SECRET, env.PAYPAL_SECRET]);
  const webhookId = firstNonEmpty([env.PAYPAL_WEBHOOK_ID]) || null;
  const mode = firstNonEmpty([env.PAYPAL_ENV, env.PAYPAL_MODE]).toLowerCase();
  const live = mode === "live" || mode === "production";
  return {
    clientId,
    clientSecret,
    webhookId,
    apiBase: live ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com",
    ready: Boolean(clientId && clientSecret),
  };
}
