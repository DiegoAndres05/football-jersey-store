/**
 * Rate-limit del login (en memoria, por instancia).
 * Protección básica contra fuerza bruta en single-instance.
 * En producción con varias instancias usar un limitador distribuido
 * (Redis/Cloudflare).
 */

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

const loginAttempts = new Map<string, { fails: number; windowStart: number }>();

export function isLoginBlocked(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.fails >= LOGIN_MAX_ATTEMPTS;
}

export function registerLoginFailure(key: string): void {
  const entry = loginAttempts.get(key) ?? { fails: 0, windowStart: Date.now() };
  if (Date.now() - entry.windowStart > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { fails: 1, windowStart: Date.now() });
    return;
  }
  entry.fails += 1;
  loginAttempts.set(key, entry);
}

export function clearLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

export function loginWindowMinutes(): number {
  return Math.ceil(LOGIN_WINDOW_MS / 60000);
}