#!/usr/bin/env node
/**
 * FKA Scraper Local — Puppeteer bridge for the Flashsport importer.
 *
 * Starts an HTTP server on localhost:3001 that performs full FKA searches
 * via a real Brave browser. Cloudflare challenges are solved manually
 * by the worker in the visible browser window.
 *
 * Usage:
 *   node fka-scraper-local.js
 *
 * Requirements:
 *   - Node.js 18+
 *   - Brave Browser installed
 *   - puppeteer-core npm package (npm install puppeteer-core)
 */

import http from "node:http";
import fs from "node:fs";

const PORT = parseInt(process.env.FKA_PROXY_PORT ?? "3001", 10);
const FKA_BASE = "https://www.footballkitarchive.com";
const NAV_TIMEOUT = 60_000;
const CF_WAIT_INTERVAL = 2_000;
const CF_MAX_WAIT = 180_000;

const BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

let puppeteer;
try {
  puppeteer = await import("puppeteer-core");
} catch {
  console.error(
    "\n[puppeteer] No se encontró el paquete puppeteer-core.\n" +
      "Ejecuta: npm install puppeteer-core\n",
  );
  process.exit(1);
}

/* ── Cloudflare detection ─────────────────────────────────────────── */

function isCloudflareChallenge(html) {
  return (
    /Un momento|Just a moment|Verificación de seguridad|Checking your browser/i.test(
      html.slice(0, 500),
    ) || /cf-challenge|challenge-platform/i.test(html.slice(0, 2000))
  );
}

async function waitForCloudflare(page) {
  const start = Date.now();
  while (Date.now() - start < CF_MAX_WAIT) {
    const html = await page.content();
    if (!isCloudflareChallenge(html)) return true;
    await new Promise((r) => setTimeout(r, CF_WAIT_INTERVAL));
  }
  return false;
}

/* ── Browser management ───────────────────────────────────────────── */

let browser = null;
let browserReady = false;

async function ensureBrowser() {
  if (browser && browserReady) return browser;
  if (browser) {
    try { await browser.close(); } catch {}
  }

  if (!fs.existsSync(BRAVE_PATH)) {
    console.error(
      "\n[brave] No se encontró Brave Browser en:\n" +
        `  ${BRAVE_PATH}\n\n` +
        "Instala Brave desde https://brave.com/download/\n",
    );
    process.exit(1);
  }

  browser = await puppeteer.default.launch({
    headless: false,
    executablePath: BRAVE_PATH,
    defaultViewport: null,
    args: [
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-blink-features=AutomationControlled",
    ],
  });
  browserReady = true;
  browser.on("disconnected", () => { browserReady = false; });
  return browser;
}

/* ── Navigate with Cloudflare handling ────────────────────────────── */

async function newStealthPage() {
  const b = await ensureBrowser();
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    delete navigator.__proto__.webdriver;
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["es-CO", "es", "en-US", "en"],
    });
  });
  return page;
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "networkidle2", timeout: NAV_TIMEOUT });
  const html = await page.content();
  if (isCloudflareChallenge(html)) {
    console.log(`[fka] Cloudflare en ${url}. Esperando resolución manual...`);
    const solved = await waitForCloudflare(page);
    if (!solved) throw new Error("Cloudflare no resuelto (timeout).");
    console.log("[fka] Cloudflare resuelto.");
  }
}

/* ── DOM extraction (runs inside the browser) ─────────────────────── */

function extractSearchResults() {
  const links = document.querySelectorAll("a[href*='-camisetas-t']");
  const seen = new Set();
  const results = [];
  for (const a of links) {
    const href = a.href;
    if (!href.includes("-camisetas-t") || seen.has(href)) continue;
    seen.add(href);
    results.push({ name: a.textContent.trim(), url: href });
  }
  return results;
}

function extractTeamPageData(season) {
  const links = document.querySelectorAll("a");
  const anchors = [];
  for (const a of links) {
    anchors.push({ text: a.textContent.trim(), href: a.href, className: a.className });
  }

  // Find season link
  const seasonNormalized = normalizeSeasonForSearch(season);
  let seasonLink = null;
  for (const a of anchors) {
    if (a.href.includes(`camisetas-${seasonNormalized}-`)) {
      seasonLink = a.href;
      break;
    }
  }

  // Find kit links on current page (if already on season page)
  const kitLinks = extractKitLinksFromAnchors(anchors, seasonNormalized);

  // Extract team context from breadcrumbs
  const breadcrumbs = document.querySelectorAll('.breadcrumbs-container a, nav a, [class*="breadcrumb"] a');
  let leagueName = null;
  let leagueUrl = null;
  let country = null;
  for (const crumb of breadcrumbs) {
    const href = crumb.href;
    if (/\/es\/[^/]+-camisetas-l\d+\/?$/.test(href)) {
      leagueName = crumb.textContent.trim();
      leagueUrl = href;
    }
  }
  // Country is usually the breadcrumb before the league
  const crumbArr = Array.from(breadcrumbs);
  for (let i = 0; i < crumbArr.length; i++) {
    if (crumbArr[i].href === leagueUrl && i > 0) {
      country = crumbArr[i - 1].textContent.trim();
    }
  }

  return { seasonLink, kitLinks, leagueName, leagueUrl, country };
}

function extractKitLinksFromAnchors(anchors, normalizedSeason) {
  const NON_JERSEY = /calentamiento|himno|chandal|pista|abrigo|chaqueta|campera|portero|guante|bufanda|pelota|botas|shorts|medias|sudader|parka|anorak/i;
  const seen = new Set();
  const links = [];
  for (const a of anchors) {
    if (!/^kit(\s|$)/.test(a.className)) continue;
    if (!a.href.includes(`-${normalizedSeason}-`)) continue;
    if (NON_JERSEY.test(a.text)) continue;
    if (seen.has(a.href)) continue;
    seen.add(a.href);
    const type = mapKitTypeFromText(a.text);
    if (type) {
      links.push({ title: a.text.replace(/\s+/g, " ").trim(), url: a.href, type });
    }
  }
  return links;
}

function extractKitDetail() {
  const rows = document.querySelectorAll("tr");
  const data = {};
  for (const row of rows) {
    const cells = row.querySelectorAll("td, th");
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const val = cells[1].textContent.trim();
      if (key.includes("equipo")) data.team = val;
      if (key.includes("temporada")) data.season = val;
      if (key.includes("tipo")) data.type = val;
    }
  }

  // Image: prefer og:image, then CDN images
  const ogImg = document.querySelector('meta[property="og:image"]');
  let imageUrl = ogImg?.getAttribute("content") || null;
  if (imageUrl && !imageUrl.startsWith("http")) imageUrl = `https://www.footballkitarchive.com${imageUrl}`;

  if (!imageUrl) {
    const imgs = document.querySelectorAll("img[data-src*='/cdn/']");
    for (const img of imgs) {
      const src = img.getAttribute("data-src");
      if (src && !src.includes("-small")) {
        imageUrl = src.startsWith("http") ? src : `https://www.footballkitarchive.com${src}`;
        break;
      }
    }
  }

  const title = document.title.replace(/\s*[-–|].*$/, "").trim();

  return { ...data, title, imageUrl };
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function normalizeSeasonForSearch(season) {
  const m = season.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}`;
  const m2 = season.match(/^(\d{2})-(\d{2})$/);
  if (m2) return `20${m2[1]}-${m2[2]}`;
  return season;
}

function mapKitTypeFromText(text) {
  const lower = text.toLowerCase();
  if (/local|domicilio|principal|home/i.test(lower)) return "LOCAL";
  if (/visitante|away|fuera/i.test(lower)) return "VISITANTE";
  if (/tercera|third|alternate|extra/i.test(lower)) return "TERCERA";
  return null;
}

function normalizeTitle(title) {
  return title
    .replace(/\s*[-–|].*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── Full search flow ─────────────────────────────────────────────── */

async function searchFka(teams, season, types) {
  const page = await newStealthPage();
  const items = [];

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      Referer: `${FKA_BASE}/`,
    });

    for (const teamName of teams) {
      console.log(`[fka] Searching: ${teamName}`);
      const searchUrl = `${FKA_BASE}/search?q=${encodeURIComponent(teamName)}`;

      try {
        await safeGoto(page, searchUrl);

        // Check if we landed directly on a team page
        const currentUrl = page.url();
        const isTeamPage = /camisetas-t\d+\/?$/.test(currentUrl) && !/camisetas-\d{4}-\d{2}-t\d+/.test(currentUrl);

        let teamUrl, teamPageData;

        if (isTeamPage) {
          teamUrl = currentUrl;
          teamPageData = await page.evaluate(extractTeamPageData, season);
        } else {
          // Parse search results
          const results = await page.evaluate(extractSearchResults);
          if (results.length === 0) {
            items.push(makeErrorItem(teamName, season, types[0], `No se encontró "${teamName}" en FKA.`));
            continue;
          }

          // Pick the best match
          const bestMatch = results.find((r) =>
            r.name.toLowerCase().includes(teamName.toLowerCase()),
          ) ?? results[0];

          teamUrl = bestMatch.url;
          console.log(`[fka] Found team: ${bestMatch.name} → ${teamUrl}`);
          await safeGoto(page, teamUrl);
          teamPageData = await page.evaluate(extractTeamPageData, season);
        }

        // If no season link found on team page, try navigating to it
        if (!teamPageData.seasonLink && teamPageData.kitLinks.length === 0) {
          // Try constructing the season URL directly
          const teamIdMatch = teamUrl.match(/-(t\d+)\/?$/);
          if (teamIdMatch) {
            const constructedUrl = `${FKA_BASE}/es/camisetas-${normalizeSeasonForSearch(season)}-${teamIdMatch[1]}`;
            console.log(`[fka] Trying constructed season URL: ${constructedUrl}`);
            await safeGoto(page, constructedUrl);
            teamPageData = await page.evaluate(extractTeamPageData, season);
          }
        }

        // Collect kit links
        let kitLinks = teamPageData.kitLinks;

        // If we have a season link but no kit links, navigate to season page
        if (teamPageData.seasonLink && kitLinks.length === 0) {
          console.log(`[fka] Navigating to season: ${teamPageData.seasonLink}`);
          await safeGoto(page, teamPageData.seasonLink);
          const seasonData = await page.evaluate(extractTeamPageData, season);
          kitLinks = seasonData.kitLinks;
          // Update context from season page
          if (seasonData.leagueName) {
            teamPageData.leagueName = seasonData.leagueName;
            teamPageData.leagueUrl = seasonData.leagueUrl;
            teamPageData.country = seasonData.country;
          }
        }

        // Filter by requested types
        kitLinks = kitLinks.filter((k) => types.includes(k.type));

        if (kitLinks.length === 0) {
          items.push(makeErrorItem(teamName, season, types[0], `No se encontraron camisetas para "${teamName}" ${season}.`));
          continue;
        }

        // Fetch each kit detail
        for (const link of kitLinks) {
          try {
            console.log(`[fka] Fetching kit: ${link.title}`);
            await safeGoto(page, link.url);
            const detail = await page.evaluate(extractKitDetail);

            items.push({
              kit: {
                source: "football-kit-archive",
                title: normalizeTitle(detail.title || link.title),
                team: detail.team || teamName,
                season: detail.season || season,
                type: link.type,
                leagueName: teamPageData.leagueName,
                leagueUrl: teamPageData.leagueUrl,
                country: teamPageData.country,
                imageUrl: detail.imageUrl || null,
                sourceUrl: link.url,
              },
              status: "ENCONTRADO",
              teamMatch: { found: true, name: teamName },
              seasonMatch: { found: true, name: season },
              message: null,
            });
          } catch (err) {
            items.push(makeErrorItem(teamName, season, link.type, `Error al abrir "${link.title}": ${err.message}`));
          }
        }
      } catch (err) {
        items.push(makeErrorItem(teamName, season, types[0], `Error buscando "${teamName}": ${err.message}`));
      }
    }
  } finally {
    await page.close();
  }

  return items;
}

function makeErrorItem(team, season, type, message) {
  return {
    kit: {
      source: "football-kit-archive",
      title: `${team} ${season}`,
      team,
      season,
      type,
      leagueName: null,
      leagueUrl: null,
      country: null,
      imageUrl: null,
      sourceUrl: "",
    },
    status: "ERROR",
    teamMatch: { found: false, name: null },
    seasonMatch: { found: false, name: null },
    message,
  };
}

/* ── HTTP server ──────────────────────────────────────────────────── */

function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  setCORS(res);
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // Health check
  if (req.url === "/health" && req.method === "GET") {
    return json(res, 200, { status: "ok", browser: browserReady, port: PORT });
  }

  // Full search
  if (req.url === "/search" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      if (!body.teams || !body.season || !body.types) {
        return json(res, 400, { ok: false, error: "Missing teams/season/types." });
      }
      console.log(`[fka] Search request: ${body.teams.join(", ")} — ${body.season}`);
      const items = await searchFka(body.teams, body.season, body.types);
      return json(res, 200, { ok: true, items });
    } catch (err) {
      return json(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Single URL fetch (kept for future use)
  if (req.url === "/fetch" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      if (!body.url || typeof body.url !== "string") {
        return json(res, 400, { ok: false, error: "Missing 'url' field." });
      }
      const page = await newStealthPage();
      try {
        await safeGoto(page, body.url);
        const html = await page.content();
        return json(res, 200, { ok: true, html, url: page.url() });
      } finally {
        await page.close();
      }
    } catch (err) {
      return json(res, 500, { ok: false, error: String(err) });
    }
  }

  // Shutdown
  if (req.url === "/shutdown" && req.method === "POST") {
    if (browser) await browser.close().catch(() => {});
    process.exit(0);
  }

  json(res, 404, { error: "Not found. Endpoints: /health, /search, /fetch, /shutdown" });
});

server.listen(PORT, () => {
  if (fs.existsSync(BRAVE_PATH)) {
    console.log(`
╔══════════════════════════════════════════════════╗
║  FKA Scraper Local — Puerto ${String(PORT).padEnd(24)}║
╠══════════════════════════════════════════════════╣
║  Navegador: Brave Browser                        ║
║                                                  ║
║  Se abrirá una ventana de Brave.                 ║
║  Si aparece Cloudflare, resuélvelo manualmente   ║
║  y el script continuará solo.                    ║
║                                                  ║
║  Mantén esta terminal abierta mientras usas      ║
║  el importador en la tienda.                    ║
╚══════════════════════════════════════════════════╝
`);
  } else {
    console.error(`
╔══════════════════════════════════════════════════╗
║  ⚠  BRAVE NO ENCONTRADO                         ║
╠══════════════════════════════════════════════════╣
║  No se encontró Brave Browser en:                ║
║  ${BRAVE_PATH.padEnd(47)}║
║                                                  ║
║  Descárgalo desde https://brave.com/download/    ║
╚══════════════════════════════════════════════════╝
`);
  }
});
