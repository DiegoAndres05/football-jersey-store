import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? "";
}

export function createUnsubscribeToken(email: string): string | null {
  const key = secret();
  const normalized = email.trim().toLowerCase();
  if (!key || !normalized) return null;
  const body = Buffer.from(normalized).toString("base64url");
  const mac = createHmac("sha256", key).update(normalized).digest("base64url");
  return `${body}.${mac}`;
}

export function readUnsubscribeToken(token: string): string | null {
  const key = secret();
  const [body, mac] = token.split(".");
  if (!key || !body || !mac) return null;
  let email: string;
  try {
    email = Buffer.from(body, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", key).update(email).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return email;
}

export function unsubscribeUrl(origin: string, email: string): string | null {
  const token = createUnsubscribeToken(email);
  if (!token) return null;
  return `${origin}/newsletter/baja?token=${encodeURIComponent(token)}`;
}
