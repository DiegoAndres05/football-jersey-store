"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import { extractFromUrl, type ExtractedProduct } from "../fka/url-extractor";
import { downloadPublicImage } from "../fka/fka-image";
import { supabaseServer, PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/server";

const extractSchema = z.object({
  url: z.string().url("URL inválida"),
  keywords: z.array(z.string()).default([]),
});

const downloadSchema = z.object({
  products: z.array(z.object({
    title: z.string().min(1, "Título requerido"),
    imageUrl: z.string().url("URL de imagen inválida"),
  })).min(1, "Selecciona al menos una imagen"),
  type: z.enum(["independent", "associated"]),
  productId: z.string().optional(),
  teamId: z.string().optional(),
  seasonId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

export type ExtractUrlResponse =
  | { ok: true; products: ExtractedProduct[]; totalFound: number; totalFiltered: number }
  | { ok: false; error: string };

export type DownloadUrlResponse =
  | { ok: true; urls: string[] }
  | { ok: false; error: string };

export type ImportProductOption = {
  id: string;
  name: string;
  teamName: string;
  seasonName: string;
};

export async function extractUrlAction(input: unknown): Promise<ExtractUrlResponse> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = extractSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const result = await extractFromUrl({
      url: parsed.data.url,
      keywords: parsed.data.keywords,
    });
    return { ok: true, ...result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo extraer datos de la URL.",
    };
  }
}

export async function searchImportProductsAction(query: string): Promise<ImportProductOption[]> {
  const admin = await getSessionUser();
  if (!admin) return [];

  const term = query.trim();
  if (term.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { team: { name: { contains: term, mode: "insensitive" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      team: { select: { name: true } },
      season: { select: { name: true } },
    },
    orderBy: { name: "asc" },
    take: 8,
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    teamName: product.team.name,
    seasonName: product.season.name,
  }));
}

export async function downloadUrlImagesAction(input: unknown): Promise<DownloadUrlResponse> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = downloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { products, type, productId, sourceUrl } = parsed.data;

  if (type === "associated" && !productId) {
    return { ok: false, error: "El producto es obligatorio para imágenes asociadas." };
  }

  const urls: string[] = [];
  let firstError = "No se pudieron descargar las imágenes seleccionadas.";

  for (const product of products) {
    try {
      const storagePath = await uploadImageFromUrl(product, type, productId, sourceUrl);
      urls.push(storagePath);
    } catch (err) {
      console.error(`Error subiendo imagen ${product.imageUrl}:`, err);
      if (urls.length === 0 && err instanceof Error && err.message) {
        firstError = err.message;
      }
    }
  }

  if (urls.length === 0) {
    return { ok: false, error: firstError };
  }

  return { ok: true, urls };
}

async function uploadImageFromUrl(
  product: ExtractedProduct,
  type: string,
  productId?: string,
  sourceUrl?: string,
): Promise<string> {
  const image = await downloadPublicImage(product.imageUrl, 15000, sourceUrl);
  const ext = image.extension;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");

  let storagePath: string;
  if (type === "independent") {
    const sanitizedTitle = product.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imagen";
    storagePath = `imports/${sanitizedTitle}-${Date.now()}.${ext}`;
  } else {
    if (!productId) throw new Error("Producto requerido.");
    const stored = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
    if (!stored) throw new Error("Producto no encontrado.");
    const count = await prisma.productImage.count({ where: { productId } });
    storagePath = `products/${productId}/${stored.slug}-${Date.now()}-${count}.${ext}`;
  }

  const { error } = await supabaseServer.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, image.buffer, { contentType: image.contentType, upsert: false });

  if (error) throw new Error(`Error de Storage: ${error.message}`);

  if (type === "associated" && productId) {
    const publicUrl = `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
    await prisma.productImage.create({
      data: {
        productId,
        url: publicUrl,
        altText: product.title,
        order: 0,
        isPrimary: false,
        storagePath,
      },
    });
  }

  return storagePath;
}
