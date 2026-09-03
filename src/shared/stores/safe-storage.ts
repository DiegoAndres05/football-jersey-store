export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getSafeStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    const probe = "__flashsport_storage_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

export function readSafe<T>(key: string, fallback: T, validate: (value: unknown) => T | null): T {
  const storage = getSafeStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return validate(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeSafe<T>(key: string, value: T): boolean {
  const storage = getSafeStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeSafe(key: string): void {
  try {
    getSafeStorage()?.removeItem(key);
  } catch {
    // Storage errors are intentionally invisible to the shopping flow.
  }
}