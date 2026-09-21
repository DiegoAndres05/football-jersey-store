const SECRET_KEYS = /token|secret|password|authorization|identity.?key/i;

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SECRET_KEYS.test(key) ? "[REDACTED]" : redactSecrets(item)]));
  }
  return value;
}

export function publicError(error: unknown, fallback = "No pudimos completar la operación. Intenta de nuevo."): { message: string } {
  if (error instanceof Error && error.message && !SECRET_KEYS.test(error.message)) return { message: error.message };
  return { message: fallback };
}
