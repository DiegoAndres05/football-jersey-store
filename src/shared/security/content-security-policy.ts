export type ContentSecurityPolicyOptions = {
  nonce: string;
  isDev?: boolean;
};

/**
 * Report-Only policy for the public store.
 * FKA, CDP, localhost and Telegram stay out: they are not browser dependencies in production.
 */
export function buildContentSecurityPolicy({ nonce, isDev = false }: ContentSecurityPolicyOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://checkout.bold.co",
    isDev ? "'unsafe-eval'" : null,
  ].filter(Boolean);

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self'",
    "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com https://xmsreelwxwqjzgtkxcje.supabase.co",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'self' https://checkout.bold.co",
    "media-src 'none'",
    "form-action 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
  ];

  return directives.join("; ");
}
