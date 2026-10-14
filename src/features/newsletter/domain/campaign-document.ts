export const CAMPAIGN_BLOCK_LIMIT = 8;
export const CAMPAIGN_LOGO_PATH = "/flashsport-logo.png";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STORE_HOSTS = new Set(["flashsports.shop", "www.flashsports.shop"]);

export type CampaignImage = {
  sourceId: string;
  name: string;
  alt: string;
  url: string;
};

export type CampaignDestination =
  | { kind: "internal"; path: string }
  | { kind: "url"; url: string };

export type CampaignBlock =
  | { id: string; type: "logo"; visible: boolean }
  | { id: string; type: "image"; image: CampaignImage | null }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "button"; label: string; destination: CampaignDestination };

export type CampaignDocument = {
  name: string;
  subject: string;
  preheader: string;
  blocks: CampaignBlock[];
};

export type CampaignDestinationOption = {
  label: string;
  path: string;
};

export function emptyCampaignDocument(): CampaignDocument {
  return {
    name: "",
    subject: "",
    preheader: "",
    blocks: [
      { id: "logo", type: "logo", visible: true },
      { id: "hero", type: "image", image: null },
      { id: "title", type: "heading", text: "" },
      { id: "copy", type: "text", text: "" },
      { id: "cta", type: "button", label: "COMPRAR AHORA", destination: { kind: "internal", path: "/productos" } },
    ],
  };
}

export function isAllowedInternalPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || /[\\?#\s]/.test(path)) return false;
  const parts = path.split("/").filter(Boolean);
  if (parts.some((part) => part === "." || part === "..")) return false;
  if (parts.length === 1 && (parts[0] === "productos" || parts[0] === "ligas")) return true;
  if (parts.length !== 2 || !SLUG.test(parts[1])) return false;
  return parts[0] === "productos" || parts[0] === "ligas" || parts[0] === "equipos";
}

export function isAllowedCampaignUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
  return STORE_HOSTS.has(parsed.hostname.toLowerCase());
}

export function isPublicImageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === "https:" && !parsed.username && !parsed.password;
}

export function campaignHref(destination: CampaignDestination, origin: string): string | null {
  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    return null;
  }
  if ((base.protocol !== "https:" && base.protocol !== "http:") || base.username || base.password) return null;
  if (destination.kind === "internal") {
    if (!isAllowedInternalPath(destination.path)) return null;
    return `${base.origin}${destination.path}`;
  }
  return isAllowedCampaignUrl(destination.url) ? destination.url : null;
}

export function setBlockImage(document: CampaignDocument, blockId: string, image: CampaignImage): CampaignDocument {
  if (!isPublicImageUrl(image.url)) return document;
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId && block.type === "image" ? { ...block, image } : block,
    ),
  };
}

export function clearBlockImage(document: CampaignDocument, blockId: string): CampaignDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId && block.type === "image" ? { ...block, image: null } : block,
    ),
  };
}

export function appendCampaignBlock(document: CampaignDocument, block: CampaignBlock): CampaignDocument {
  if (document.blocks.length >= CAMPAIGN_BLOCK_LIMIT) return document;
  if (block.type === "logo" && document.blocks.some((item) => item.type === "logo")) return document;
  if (document.blocks.some((item) => item.id === block.id)) return document;
  return { ...document, blocks: [...document.blocks, block] };
}

export function removeCampaignBlock(document: CampaignDocument, blockId: string): CampaignDocument {
  return { ...document, blocks: document.blocks.filter((block) => block.id !== blockId) };
}

export function moveCampaignBlock(document: CampaignDocument, blockId: string, direction: -1 | 1): CampaignDocument {
  const index = document.blocks.findIndex((block) => block.id === blockId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= document.blocks.length) return document;
  const blocks = document.blocks.slice();
  const [block] = blocks.splice(index, 1);
  blocks.splice(next, 0, block);
  return { ...document, blocks };
}

export function documentProblems(document: CampaignDocument, origin: string): string[] {
  const problems: string[] = [];
  const name = document.name.trim();
  const subject = document.subject.trim();
  const preheader = document.preheader.trim();
  if (name.length < 2) problems.push("Escribe un nombre interno de al menos 2 caracteres.");
  if (name.length > 80) problems.push("El nombre interno es demasiado largo.");
  if (subject.length < 3) problems.push("Escribe un asunto de al menos 3 caracteres.");
  if (subject.length > 120) problems.push("El asunto es demasiado largo.");
  if (preheader.length > 140) problems.push("El texto de vista previa es demasiado largo.");
  if (document.blocks.length > CAMPAIGN_BLOCK_LIMIT) problems.push("La campaña tiene demasiados bloques.");

  for (const block of document.blocks) {
    if (block.type === "heading" && block.text.trim().length > 120) problems.push("Un título es demasiado largo.");
    if (block.type === "text" && block.text.trim().length > 2000) problems.push("Un texto es demasiado largo.");
    if (block.type === "image" && block.image && !isPublicImageUrl(block.image.url)) {
      problems.push("Una imagen no tiene una URL pública segura.");
    }
    if (block.type === "button") {
      const label = block.label.trim();
      if (label.length < 2 || label.length > 40) problems.push("Revisa el texto de un botón.");
      if (!campaignHref(block.destination, origin)) problems.push("Un botón tiene un destino no permitido.");
    }
  }
  return problems;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphHtml(value: string): string {
  return value
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#111111;">${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`,
    )
    .join("");
}

export function renderCampaignPreview(document: CampaignDocument, origin: string): string {
  let base: URL;
  try {
    base = new URL(origin);
  } catch {
    base = new URL("https://www.flashsports.shop");
  }
  const site = base.origin;
  const rows = document.blocks
    .map((block) => {
      if (block.type === "logo" && block.visible) {
        const src = `${site}${CAMPAIGN_LOGO_PATH}`;
        return `<tr><td align="center" style="padding:28px 24px 12px;background:#ffffff;"><img src="${escapeHtml(src)}" alt="Flashsport" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;background:#ffffff;"></td></tr>`;
      }
      if (block.type === "image" && block.image && isPublicImageUrl(block.image.url)) {
        return `<tr><td style="padding:12px 24px;background:#ffffff;"><img src="${escapeHtml(block.image.url)}" alt="${escapeHtml(block.image.alt || block.image.name)}" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;"></td></tr>`;
      }
      if (block.type === "heading" && block.text.trim()) {
        return `<tr><td style="padding:8px 24px 4px;background:#ffffff;"><h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;line-height:1.2;font-weight:700;letter-spacing:0.02em;color:#111111;">${escapeHtml(block.text.trim())}</h1></td></tr>`;
      }
      if (block.type === "text" && block.text.trim()) {
        return `<tr><td style="padding:8px 24px 0;background:#ffffff;">${paragraphHtml(block.text)}</td></tr>`;
      }
      if (block.type === "button" && block.label.trim()) {
        const href = campaignHref(block.destination, site);
        const label = escapeHtml(block.label.trim());
        const control = href
          ? `<a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;color:#ffffff;text-decoration:none;">${label}</a>`
          : `<span style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.08em;color:#ffffff;">${label}</span>`;
        return `<tr><td align="center" style="padding:8px 24px 20px;background:#ffffff;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#111111" style="background:#111111;border-radius:4px;">${control}</td></tr></table></td></tr>`;
      }
      return "";
    })
    .join("");

  const preheader = document.preheader.trim();
  const hidden = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>`
    : "";

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(document.subject.trim() || "Flashsport")}</title></head><body style="margin:0;padding:0;background:#f4f4f4;">${hidden}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f4;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;">${rows}<tr><td style="padding:24px;background:#ffffff;border-top:1px solid #e5e5e5;"><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#444444;">Flashsport · flashsport.col@gmail.com</p><p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;"><a href="${escapeHtml(`${site}/privacidad`)}" style="color:#111111;">Privacidad</a></p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;"><a href="${escapeHtml(`${site}/newsletter/baja`)}" style="color:#111111;">Dejar de recibir ofertas</a></p></td></tr></table></td></tr></table></body></html>`;
}
