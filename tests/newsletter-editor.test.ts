import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  appendCampaignBlock,
  campaignHref,
  clearBlockImage,
  documentProblems,
  emptyCampaignDocument,
  hasCampaignChanges,
  isAllowedCampaignUrl,
  parseCampaignDocument,
  renderCampaignPreview,
  renderCampaignText,
  setBlockImage,
} from "../src/features/newsletter/domain/campaign-document.ts";

const origin = "https://www.flashsports.shop";
const previewUnsubscribe = `${origin}/newsletter/baja`;
const photo = {
  sourceId: "img-1",
  name: "Camiseta local",
  alt: "Camiseta negra",
  url: "https://cdn.example.test/camiseta.jpg",
};

test("la vista previa incluye logo, imagen, botón y baja, y escapa el texto", () => {
  const draft = setBlockImage(
    {
      ...emptyCampaignDocument(),
      name: "Octubre",
      subject: "Novedades de octubre",
      preheader: "Camisetas <nuevas>",
      blocks: emptyCampaignDocument().blocks.map((block) => {
        if (block.type === "heading") return { ...block, text: "Nuevas camisetas" };
        if (block.type === "text") return { ...block, text: "Hola <script>" };
        if (block.type === "button") return { ...block, label: "COMPRAR AHORA", destination: { kind: "internal" as const, path: "/productos" } };
        return block;
      }),
    },
    "hero",
    photo,
  );
  const html = renderCampaignPreview(draft, origin, previewUnsubscribe);
  assert.match(html, /flashsport-logo\.png/);
  assert.match(html, /alt="Flashsport"/);
  assert.match(html, /cdn\.example\.test\/camiseta\.jpg/);
  assert.match(html, /alt="Camiseta negra"/);
  assert.match(html, /href="https:\/\/www\.flashsports\.shop\/productos"/);
  assert.match(html, /COMPRAR AHORA/);
  assert.match(html, /Dejar de recibir ofertas/);
  assert.match(html, /newsletter\/baja/);
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /Camisetas &lt;nuevas&gt;/);
  assert.match(html, /<meta name="color-scheme" content="light only">/);
  assert.match(html, /background-color:#FBF9F8/);
  assert.match(html, /color:#141414/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.equal(documentProblems(draft, origin).length, 0);
});

test("ocultar el logo lo saca de la vista previa y cambiar la imagen sustituye la anterior", () => {
  const hidden = {
    ...emptyCampaignDocument(),
    blocks: emptyCampaignDocument().blocks.map((block) => (block.type === "logo" ? { ...block, visible: false } : block)),
  };
  assert.equal(renderCampaignPreview(hidden, origin, previewUnsubscribe).includes("flashsport-logo.png"), false);

  const selected = setBlockImage(emptyCampaignDocument(), "hero", photo);
  const replaced = setBlockImage(selected, "hero", { ...photo, url: "https://cdn.example.test/otra.jpg", name: "Otra" });
  const html = renderCampaignPreview(replaced, origin, previewUnsubscribe);
  assert.match(html, /otra\.jpg/);
  assert.equal(html.includes("camiseta.jpg"), false);
  const cleared = clearBlockImage(replaced, "hero");
  assert.equal(renderCampaignPreview(cleared, origin, previewUnsubscribe).includes("cdn.example.test"), false);
});

test("rechaza destinos inseguros y acepta rutas internas de la tienda", () => {
  assert.equal(campaignHref({ kind: "url", url: "javascript:alert(1)" }, origin), null);
  assert.equal(campaignHref({ kind: "url", url: "https://evil.test/productos" }, origin), null);
  assert.equal(campaignHref({ kind: "internal", path: "/admin/newsletter" }, origin), null);
  assert.equal(campaignHref({ kind: "internal", path: "//evil.test" }, origin), null);
  assert.equal(isAllowedCampaignUrl("https://www.flashsports.shop/productos/local"), true);
  assert.equal(campaignHref({ kind: "internal", path: "/equipos/real-madrid" }, origin), "https://www.flashsports.shop/equipos/real-madrid");
  const unsafe = {
    ...emptyCampaignDocument(),
    name: "Oferta",
    subject: "Oferta de octubre",
    blocks: emptyCampaignDocument().blocks.map((block) =>
      block.type === "button" ? { ...block, destination: { kind: "url" as const, url: "javascript:alert(1)" } } : block,
    ),
  };
  assert.match(documentProblems(unsafe, origin).join(" "), /destino no permitido/);
  assert.equal(renderCampaignPreview(unsafe, origin, previewUnsubscribe).includes("javascript:"), false);
});

test("no se añade un segundo logo ni se pasa de ocho bloques", () => {
  let document = emptyCampaignDocument();
  document = appendCampaignBlock(document, { id: "logo-2", type: "logo", visible: true });
  assert.equal(document.blocks.filter((block) => block.type === "logo").length, 1);
  for (let index = 0; index < 10; index += 1) {
    document = appendCampaignBlock(document, { id: `extra-${index}`, type: "text", text: "Bloque" });
  }
  assert.equal(document.blocks.length, 8);
});

test("una imagen sin https no entra en el documento ni en el html", () => {
  const document = setBlockImage(emptyCampaignDocument(), "hero", { ...photo, url: "http://cdn.example.test/a.jpg" });
  assert.equal(document.blocks.find((block) => block.type === "image" && block.image)?.type, undefined);
  const forced = {
    ...emptyCampaignDocument(),
    blocks: emptyCampaignDocument().blocks.map((block) =>
      block.type === "image" ? { ...block, image: { ...photo, url: "javascript:alert(1)" } } : block,
    ),
  };
  assert.equal(renderCampaignPreview(forced, origin, previewUnsubscribe).includes("javascript:"), false);
});

test("los cambios se detectan solo frente al documento inicial y desaparecen al restablecerlo", () => {
  const initial = emptyCampaignDocument();
  assert.equal(hasCampaignChanges(initial, initial), false);
  const edited = { ...initial, name: "Octubre" };
  assert.equal(hasCampaignChanges(edited, initial), true);
  assert.equal(hasCampaignChanges({ ...edited, name: "" }, initial), false);
});

test("el botón libre usa la URL canónica y rechaza puertos, admin, saltos de línea, credenciales y tokens", () => {
  assert.equal(
    campaignHref({ kind: "url", url: "https://WWW.FLASHSPORTS.SHOP/productos" }, origin),
    "https://www.flashsports.shop/productos",
  );
  assert.equal(
    campaignHref({ kind: "url", url: "https://www.flashsports.shop/productos?liga=la-liga&page=2" }, origin),
    "https://www.flashsports.shop/productos?liga=la-liga&page=2",
  );
  const rejected = [
    "javascript:alert(1)",
    "http://flashsports.shop/productos",
    "https://evil.test",
    "https://flashsports.shop.evil.test",
    "https://flashsports.shop:8443/admin",
    "https://flashsports.shop/admin",
    "https://user:pass@www.flashsports.shop/productos",
    "https://www.flashsports.shop/productos\nSet-Cookie:a",
    "https://www.flashsports.shop/productos/../admin",
    "https://www.flashsports.shop/newsletter/baja?token=abc",
    "https://www.flashsports.shop/productos?token=abc",
  ];
  for (const url of rejected) {
    assert.equal(campaignHref({ kind: "url", url }, origin), null, url);
    assert.equal(isAllowedCampaignUrl(url), false, url);
  }
  assert.equal(campaignHref({ kind: "internal", path: "/../admin" }, origin), null);
  const drafted = {
    ...emptyCampaignDocument(),
    blocks: emptyCampaignDocument().blocks.map((block) =>
      block.type === "button"
        ? { ...block, destination: { kind: "url" as const, url: "https://WWW.FLASHSPORTS.SHOP/productos" } }
        : block.type === "heading"
          ? { ...block, text: '"><script>alert(1)</script>' }
          : block.type === "image"
            ? { ...block, image: { ...photo, alt: '"><script>' } }
            : block,
    ),
  };
  const html = renderCampaignPreview(drafted, origin, previewUnsubscribe);
  assert.match(html, /href="https:\/\/www\.flashsports\.shop\/productos"/);
  assert.equal(html.includes("WWW.FLASHSPORTS"), false);
  assert.equal(html.includes("<script>"), false);
  assert.match(html, /alt="&quot;&gt;&lt;script&gt;"/);
});

test("la vista previa no lleva token y el render usa el enlace de baja recibido", () => {
  const draft = emptyCampaignDocument();
  const preview = renderCampaignPreview(draft, origin, previewUnsubscribe);
  assert.match(preview, /href="https:\/\/www\.flashsports\.shop\/newsletter\/baja"/);
  assert.equal(preview.includes("token="), false);
  const personal = renderCampaignPreview(draft, origin, "https://www.flashsports.shop/newsletter/baja?token=cuerpo.firma");
  assert.match(personal, /href="https:\/\/www\.flashsports\.shop\/newsletter\/baja\?token=cuerpo\.firma"/);
  const injected = renderCampaignPreview(draft, origin, "javascript:alert(1)");
  assert.equal(injected.includes("javascript:"), false);
});

test("el editor envía la campaña diseñada sin usar el remitente de compras", () => {
  const editor = readFileSync("src/features/newsletter/components/campaign-editor.tsx", "utf8");
  const page = readFileSync("src/app/admin/(dashboard)/newsletter/campanas/nueva/page.tsx", "utf8");
  const catalog = readFileSync("src/features/newsletter/server/campaign-catalog.ts", "utf8");
  const list = readFileSync("src/app/admin/(dashboard)/newsletter/page.tsx", "utf8");
  const subscribe = readFileSync("src/features/newsletter/server/newsletter-actions.ts", "utf8");
  const sender = readFileSync("src/features/newsletter/server/campaign-actions.ts", "utf8");
  assert.match(list, /\/admin\/newsletter\/campanas\/nueva/);
  assert.match(page, /loadCampaignCatalog/);
  assert.match(catalog, /getSessionUser/);
  const route = readFileSync("src/app/api/admin/newsletter/campaign/route.ts", "utf8");
  assert.match(editor, /\/api\/admin\/newsletter\/campaign/);
  assert.doesNotMatch(editor, /RESEND_API_KEY|EMAIL_FROM|api\.resend\.com|sendDesignedNewsletterCampaign/);
  assert.match(route, /sendDesignedNewsletterCampaign/);
  assert.doesNotMatch(route, /EMAIL_FROM|RESEND_API_KEY/);
  assert.match(editor, /beforeunload/);
  assert.match(editor, /hasCampaignChanges/);
  assert.match(editor, /disabled=\{atLimit\}/);
  assert.match(editor, /aria-label=\{`Subir bloque de/);
  assert.match(editor, /newsletter\/baja/);
  assert.doesNotMatch(editor, /createUnsubscribeToken|token=/);
  assert.match(editor, /eslint-disable-next-line @next\/next\/no-img-element/);
  assert.doesNotMatch(page, /sendNewsletterCampaign/);
  assert.match(sender, /getNewsletterConfig/);
  assert.doesNotMatch(sender, /EMAIL_FROM/);
  assert.match(subscribe, /newsletterSubscriber\.upsert/);
  assert.doesNotMatch(subscribe, /welcome|sendWelcomeEmail/);
});

test("el documento enviado conserva el enlace personal de baja y rechaza una imagen insegura", () => {
  const draft = emptyCampaignDocument();
  draft.name = "Lanzamiento";
  draft.subject = "Nuevas camisetas";
  const parsed = parseCampaignDocument(draft);
  assert.ok(parsed);
  const text = renderCampaignText(parsed, origin, "https://www.flashsports.shop/newsletter/baja?token=cuerpo.firma");
  assert.match(text, /newsletter\/baja\?token=cuerpo\.firma/);
  const unsafe = parseCampaignDocument({
    ...draft,
    blocks: draft.blocks.map((block) => block.type === "image"
      ? { ...block, image: { sourceId: "x", name: "x", alt: "x", url: "javascript:alert(1)" } }
      : block),
  });
  assert.equal(unsafe, null);
});
