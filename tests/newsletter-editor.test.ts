import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  appendCampaignBlock,
  campaignHref,
  clearBlockImage,
  documentProblems,
  emptyCampaignDocument,
  isAllowedCampaignUrl,
  renderCampaignPreview,
  setBlockImage,
} from "../src/features/newsletter/domain/campaign-document.ts";

const origin = "https://www.flashsports.shop";
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
  const html = renderCampaignPreview(draft, origin);
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
  assert.equal(documentProblems(draft, origin).length, 0);
});

test("ocultar el logo lo saca de la vista previa y cambiar la imagen sustituye la anterior", () => {
  const hidden = {
    ...emptyCampaignDocument(),
    blocks: emptyCampaignDocument().blocks.map((block) => (block.type === "logo" ? { ...block, visible: false } : block)),
  };
  assert.equal(renderCampaignPreview(hidden, origin).includes("flashsport-logo.png"), false);

  const selected = setBlockImage(emptyCampaignDocument(), "hero", photo);
  const replaced = setBlockImage(selected, "hero", { ...photo, url: "https://cdn.example.test/otra.jpg", name: "Otra" });
  const html = renderCampaignPreview(replaced, origin);
  assert.match(html, /otra\.jpg/);
  assert.equal(html.includes("camiseta.jpg"), false);
  const cleared = clearBlockImage(replaced, "hero");
  assert.equal(renderCampaignPreview(cleared, origin).includes("cdn.example.test"), false);
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
  assert.equal(renderCampaignPreview(unsafe, origin).includes("javascript:"), false);
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
  assert.equal(renderCampaignPreview(forced, origin).includes("javascript:"), false);
});

test("el editor nuevo no envía y el alta sigue sin correo de bienvenida", () => {
  const editor = readFileSync("src/features/newsletter/components/campaign-editor.tsx", "utf8");
  const page = readFileSync("src/app/admin/(dashboard)/newsletter/campanas/nueva/page.tsx", "utf8");
  const catalog = readFileSync("src/features/newsletter/server/campaign-catalog.ts", "utf8");
  const list = readFileSync("src/app/admin/(dashboard)/newsletter/page.tsx", "utf8");
  const subscribe = readFileSync("src/features/newsletter/server/newsletter-actions.ts", "utf8");
  assert.match(list, /\/admin\/newsletter\/campanas\/nueva/);
  assert.match(page, /loadCampaignCatalog/);
  assert.match(catalog, /getSessionUser/);
  assert.doesNotMatch(editor, /sendNewsletterCampaign|RESEND_API_KEY|EMAIL_FROM/);
  assert.doesNotMatch(page, /sendNewsletterCampaign/);
  assert.match(subscribe, /newsletterSubscriber\.upsert/);
  assert.doesNotMatch(subscribe, /welcome|sendWelcomeEmail/);
});
