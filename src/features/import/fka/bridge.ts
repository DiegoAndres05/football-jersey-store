/**
 * Client-side bridge to the local FKA scraper (fka-scraper-local.js).
 *
 * Runs in the browser and communicates with the local Puppeteer proxy.
 * The Vercel-hosted importer UI fetches FKA pages through the worker's
 * local Brave browser, bypassing Cloudflare challenges.
 */

const LOCAL_PROXY_URL = "http://localhost:3001";
const HEALTH_TIMEOUT = 2_000;
const SEARCH_TIMEOUT = 300_000; // 5 min for full search

export type BridgeSearchResult =
  | { ok: true; items: unknown[] }
  | { ok: false; error: string };

/**
 * Check if the local FKA scraper is running.
 */
export async function checkLocalProxy(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);
    const res = await fetch(`${LOCAL_PROXY_URL}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Run a full FKA search through the local Puppeteer proxy.
 * Opens a visible Brave window. The worker solves Cloudflare manually.
 */
export async function searchViaBridge(input: {
  teams: string[];
  season: string;
  types: string[];
}): Promise<BridgeSearchResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
    const res = await fetch(`${LOCAL_PROXY_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    if (data.ok) {
      return { ok: true, items: data.items };
    }
    return { ok: false, error: data.error ?? "Proxy returned an error." };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Timeout: la búsqueda tomó demasiado." };
    }
    return {
      ok: false,
      error: "No se pudo conectar con el proxy local. ¿Está corriendo fka-scraper-local.js?",
    };
  }
}
