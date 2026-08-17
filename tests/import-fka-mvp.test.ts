import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertAllowedFkaImageUrl,
  fkaImageExtension,
  downloadFkaImage,
  FkaImageError,
} from "../src/features/import/fka/fka-image.ts";
import {
  importFkaKitsAsDrafts,
  missingSeasons,
  seasonToCreateData,
  type ImportStore,
  type ImageGateway,
  type FkaImportResult,
} from "../src/features/import/server/import-logic.ts";
import type { FkaKit } from "../src/features/import/fka/types.ts";

// ---------------- VALIDACIÓN DE URL FKA ----------------

test("validación de URL FKA: acepta https de hosts permitidos", () => {
  assert.doesNotThrow(() =>
    assertAllowedFkaImageUrl("https://www.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg"),
  );
  assert.doesNotThrow(() =>
    assertAllowedFkaImageUrl("https://cdn.footballkitarchive.com/cdn/2026/06/11/hash/local.jpg"),
  );
});

test("validación de URL FKA: rechaza dominios externos", () => {
  assert.throws(() => assertAllowedFkaImageUrl("https://evil.com/cdn/image.jpg"), FkaImageError);
  assert.throws(() => assertAllowedFkaImageUrl("https://images.unsplash.com/photo.jpg"), FkaImageError);
  assert.throws(() => assertAllowedFkaImageUrl("http://www.footballkitarchive.com/cdn/a.jpg"), FkaImageError);
  assert.throws(() => assertAllowedFkaImageUrl("ftp://www.footballkitarchive.com/cdn/a.jpg"), FkaImageError);
  assert.throws(() => assertAllowedFkaImageUrl("not-a-url"), FkaImageError);
});

test("fkaImageExtension: mapea MIME a extensión y rechaza otros", () => {
  assert.equal(fkaImageExtension("image/jpeg"), "jpg");
  assert.equal(fkaImageExtension("image/png"), "png");
  assert.equal(fkaImageExtension("image/webp"), "webp");
  assert.equal(fkaImageExtension("image/gif"), null);
  assert.equal(fkaImageExtension("text/html"), null);
});

// ---------------- DESCARGAR IMAGEN (fetch con stubs) ----------------

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => handler(url, init)) as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function okResponse(body: Uint8Array, contentType: string): Response {
  return new Response(body as BodyInit, { status: 200, headers: { "content-type": contentType } });
}

test("descarga de imagen: válida y devuelve buffer/contentType/extension", async () => {
  const restore = stubFetch(() => okResponse(Buffer.from([1, 2, 3]), "image/jpeg"));
  try {
    const result = await downloadFkaImage("https://www.footballkitarchive.com/cdn/2026/06/11/hash/a.jpg");
    assert.equal(result.contentType, "image/jpeg");
    assert.equal(result.extension, "jpg");
    assert.equal(result.buffer.length, 3);
  } finally {
    restore();
  }
});

test("descarga de imagen: rechaza error HTTP", async () => {
  const restore = stubFetch(() => new Response(null, { status: 404 }));
  try {
    await assert.rejects(
      downloadFkaImage("https://www.footballkitarchive.com/cdn/2026/06/11/hash/a.jpg"),
      /HTTP 404/,
    );
  } finally {
    restore();
  }
});

test("descarga de imagen: rechaza MIME no permitido", async () => {
  const restore = stubFetch(() => okResponse(Buffer.from("<!doctype html>"), "text/html"));
  try {
    await assert.rejects(
      downloadFkaImage("https://www.footballkitarchive.com/cdn/2026/06/11/hash/a.jpg"),
      /no es un formato válido/,
    );
  } finally {
    restore();
  }
});

test("descarga de imagen: rechaza imagen vacía", async () => {
  const restore = stubFetch(() => okResponse(Buffer.alloc(0), "image/png"));
  try {
    await assert.rejects(
      downloadFkaImage("https://www.footballkitarchive.com/cdn/2026/06/11/hash/a.png"),
      /está vacía/,
    );
  } finally {
    restore();
  }
});

test("descarga de imagen: rechaza tamaño excesivo", async () => {
  const restore = stubFetch(() => okResponse(Buffer.alloc(6 * 1024 * 1024), "image/webp"));
  try {
    await assert.rejects(
      downloadFkaImage("https://www.footballkitarchive.com/cdn/2026/06/11/hash/a.webp"),
      /supera el tamaño máximo/,
    );
  } finally {
    restore();
  }
});

test("descarga de imagen: rechaza dominio externo incluso en fetch", async () => {
  const restore = stubFetch(() => okResponse(Buffer.from([1]), "image/jpeg"));
  try {
    await assert.rejects(downloadFkaImage("https://evil.com/cdn/a.jpg"), /origen de la imagen no está permitido/);
  } finally {
    restore();
  }
});

// ---------------- IMPORTACIÓN (BD/Storage simulados) ----------------

const TEAMS = [
  { id: "t1", name: "Real Madrid" },
  { id: "t2", name: "FC Barcelona" },
];
const SEASONS = [
  { id: "s1", name: "Temporada 25/26", slug: "25-26", year: 2025 },
  { id: "s2", name: "Temporada 24/25", slug: "24-25", year: 2024 },
];

function kit(overrides: Partial<FkaKit> = {}): FkaKit {
  return {
    source: "football-kit-archive",
    title: "Camiseta Local Real Madrid 25-26",
    team: "Real Madrid",
    season: "2025-26",
    type: "LOCAL",
    imageUrl: "https://www.footballkitarchive.com/cdn/2025/01/01/hash/local.jpg",
    sourceUrl: "https://www.footballkitarchive.com/es/camiseta-local-real-madrid-2025-26-1/",
    ...overrides,
  };
}

function makeMemoryStore(initialProducts: Array<{ id: string; teamId: string; seasonId: string; kitType: string }> = []) {
  const created: Array<{ id: string; slug: string; name: string; isActive: boolean; productId: string }> = [];
  const images: Array<{ productId: string; url: string; altText: string; storagePath: string }> = [];
  const store: ImportStore & { created: typeof created; images: typeof images } = {
    created,
    images,
    async slugExists(slug: string) {
      return created.some((c) => c.slug === slug);
    },
    async createProduct(data) {
      const id = `prod-${created.length + 1}`;
      const record = { id, slug: data.slug, name: data.name, isActive: data.isActive, productId: id };
      created.push(record);
      return { id, slug: data.slug };
    },
    async deleteProduct(id: string) {
      const index = created.findIndex((c) => c.productId === id);
      if (index !== -1) created.splice(index, 1);
    },
    async createImage(data) {
      images.push(data);
      return { id: `img-${images.length}` };
    },
    async removeImage() {
      /* no-op para tests */
    },
  };
  return store;
}

function makeImageGateway(overrides: Partial<ImageGateway> = {}): ImageGateway {
  const uploaded: string[] = [];
  const gateway: ImageGateway = {
    async download(url) {
      if (!url.includes("footballkitarchive.com")) throw new Error("origen no permitido");
      return { buffer: new Uint8Array([1, 2, 3]), extension: "jpg" };
    },
    async upload(storagePath) {
      uploaded.push(storagePath);
    },
    publicUrl(storagePath) {
      return `https://fake.supabase.co/storage/v1/object/public/product-images/${storagePath}`;
    },
    remove: async (storagePath) => {
      const index = uploaded.indexOf(storagePath);
      if (index !== -1) uploaded.splice(index, 1);
    },
    ...overrides,
  };
  return gateway;
}

test("importación: crea borrador con isActive=false, imagen y slug", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts([kit()], TEAMS, SEASONS, [], store, gateway);

  assert.equal(res.summary.imported, 1);
  assert.equal(res.items[0].status, "IMPORTADO");
  assert.equal(res.items[0].productId, "prod-1");
  assert.ok(res.items[0].slug);
  assert.equal(store.created.length, 1);
  assert.equal(store.created[0].isActive, false);
  assert.equal(store.created[0].name, "Camiseta Local Real Madrid 25-26");
  assert.equal(store.images.length, 1);
  assert.equal(store.images[0].productId, "prod-1");
  assert.ok(store.images[0].storagePath.startsWith("products/prod-1/fka-"));
  assert.equal(store.images[0].altText, "Camiseta Local Real Madrid 25-26");
  assert.ok(store.images[0].url.includes("/product-images/"));
});

test("importación: soporta Local, Visitante y Tercera", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts(
    [
      kit({ type: "LOCAL" }),
      kit({ type: "VISITANTE", title: "Visitante", season: "2024-25" }),
      kit({ type: "TERCERA", title: "Tercera", season: "2024-25" }),
    ],
    TEAMS,
    SEASONS,
    [],
    store,
    gateway,
  );
  assert.equal(res.summary.imported, 3);
  assert.deepEqual(res.items.map((i) => i.type), ["LOCAL", "VISITANTE", "TERCERA"]);
});

test("importación: devuelve SIN_TEMPORADA cuando la temporada no existe", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts([kit({ season: "2026-27" })], TEAMS, SEASONS, [], store, gateway);
  assert.equal(res.items[0].status, "SIN_TEMPORADA");
  assert.equal(res.summary.sinTemporada, 1);
  assert.equal(store.created.length, 0);
});

test("importación: devuelve SIN_EQUIPO cuando el equipo no existe", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts([kit({ team: "Girona FC" })], TEAMS, SEASONS, [], store, gateway);
  assert.equal(res.items[0].status, "SIN_EQUIPO");
  assert.equal(res.summary.sinEquipo, 1);
});

test("importación: detecta duplicado existente por team+season+type", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const existing = [{ id: "p1", teamId: "t1", seasonId: "s1", kitType: "LOCAL" }];
  const res = await importFkaKitsAsDrafts([kit()], TEAMS, SEASONS, existing, store, gateway);
  assert.equal(res.items[0].status, "DUPLICADO");
  assert.equal(res.summary.duplicated, 1);
  assert.equal(res.summary.imported, 0);
  assert.equal(store.created.length, 0);
});

test("importación: no duplica dentro del mismo lote", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts(
    [kit(), kit({ title: "Segunda entrada" })],
    TEAMS,
    SEASONS,
    [],
    store,
    gateway,
  );
  assert.equal(res.items[0].status, "IMPORTADO");
  assert.equal(res.items[1].status, "DUPLICADO");
  assert.equal(res.summary.duplicated, 1);
  assert.equal(store.created.length, 1);
});

test("importación: slug único cuando ya existe", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  await importFkaKitsAsDrafts([kit()], TEAMS, SEASONS, [], store, gateway);
  const res = await importFkaKitsAsDrafts(
    [kit({ title: "Camiseta Local Real Madrid 25-26", team: "FC Barcelona" })],
    TEAMS,
    SEASONS,
    [],
    store,
    gateway,
  );
  assert.equal(res.summary.imported, 1);
  assert.ok(res.items[0].slug!.endsWith("-2"));
});

test("importación: sin imageUrl aún crea el borrador (sin imagen)", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const res = await importFkaKitsAsDrafts([kit({ imageUrl: null })], TEAMS, SEASONS, [], store, gateway);
  assert.equal(res.summary.imported, 1);
  assert.equal(store.images.length, 0);
});

test("importación: error de descarga produce ERROR y hace rollback del producto", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway({
    download: async () => {
      throw new Error("La imagen respondió con estado HTTP 404.");
    },
  });
  const res = await importFkaKitsAsDrafts([kit()], TEAMS, SEASONS, [], store, gateway);
  assert.equal(res.items[0].status, "ERROR");
  assert.equal(res.summary.errors, 1);
  assert.equal(store.created.length, 0);
  assert.equal(store.images.length, 0);
});

test("importación: error de Storage produce ERROR y hace rollback del producto", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway({
    upload: async () => {
      throw new Error("Error de Storage al subir la imagen: bucket not found");
    },
  });
  const res = await importFkaKitsAsDrafts([kit()], TEAMS, SEASONS, [], store, gateway);
  assert.equal(res.items[0].status, "ERROR");
  assert.equal(res.summary.errors, 1);
  assert.equal(store.created.length, 0);
});

test("importación: resultado parcial mezcla estados", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const existing = [{ id: "p1", teamId: "t2", seasonId: "s1", kitType: "LOCAL" }];
  const res = await importFkaKitsAsDrafts(
    [
      kit({ season: "2026-27" }), // SIN_TEMPORADA
      kit({ team: "Girona FC" }), // SIN_EQUIPO
      kit({ team: "FC Barcelona" }), // DUPLICADO
      kit(), // IMPORTADO
    ],
    TEAMS,
    SEASONS,
    existing,
    store,
    gateway,
  );
  assert.equal(res.summary.sinTemporada, 1);
  assert.equal(res.summary.sinEquipo, 1);
  assert.equal(res.summary.duplicated, 1);
  assert.equal(res.summary.imported, 1);
  assert.equal(res.summary.errors, 0);
});

test("importación: tipos de estado válidos", () => {
  const statuses = new Set<FkaImportResult["items"][number]["status"]>([
    "IMPORTADO",
    "DUPLICADO",
    "SIN_TEMPORADA",
    "SIN_EQUIPO",
    "ERROR",
  ]);
  assert.equal(statuses.has("IMPORTADO"), true);
  assert.equal(statuses.has("DUPLICADO"), true);
  assert.equal(statuses.has("ERROR"), true);
});

// ---------------- TEMPORADAS FALTANTES (MVP confirmación) ----------------

test("seasonToCreateData: genera el formato Season a partir de FKA", () => {
  assert.deepEqual(seasonToCreateData("2026-27"), { slug: "26-27", name: "Temporada 26/27", year: 2026 });
  assert.deepEqual(seasonToCreateData("25-26"), { slug: "25-26", name: "Temporada 25/26", year: 2025 });
  assert.equal(seasonToCreateData("no-es-temporada"), null);
});

test("missingSeasons: lista temporadas únicas faltantes solo con equipo encontrado", () => {
  const kits = [
    kit({ season: "2026-27" }), // RM + temporada faltante
    kit({ season: "2026-27", type: "VISITANTE", title: "Visitante" }), // misma temporada, dedup
    kit({ season: "2027-28", type: "TERCERA", title: "Tercera" }), // otra temporada faltante
    kit({ team: "Girona FC" }), // equipo no encontrado → ignorado
    kit({ team: "FC Barcelona" }), // temporada 2025-26 existe → no falta
  ];
  const missing = missingSeasons(kits, TEAMS, SEASONS);
  assert.deepEqual(missing, ["2026-27", "2027-28"]);
});

test("missingSeasons: sin temporadas faltantes devuelve lista vacía", () => {
  const missing = missingSeasons([kit(), kit({ team: "FC Barcelona" })], TEAMS, SEASONS);
  assert.deepEqual(missing, []);
});

test("importación: crea la temporada antes de importar permite importar el kit", async () => {
  const store = makeMemoryStore();
  const gateway = makeImageGateway();
  const newSeason = seasonToCreateData("2026-27")!;
  const seasonsWithNew = [...SEASONS, { id: "s3", name: newSeason.name, slug: newSeason.slug, year: newSeason.year }];
  const res = await importFkaKitsAsDrafts(
    [kit({ season: "2026-27" })],
    TEAMS,
    seasonsWithNew,
    [],
    store,
    gateway,
  );
  assert.equal(res.items[0].status, "IMPORTADO");
  assert.equal(res.summary.imported, 1);
  assert.equal(store.created[0].isActive, false);
});
