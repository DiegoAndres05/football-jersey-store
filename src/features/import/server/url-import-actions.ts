"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import { extractFromUrl, type ExtractedProduct } from "../fka/url-extractor";
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
});

export type ExtractUrlResponse =
  | { ok: true; products: ExtractedProduct[]; totalFound: number; totalFiltered: number }
  | { ok: false; error: string };

export type DownloadUrlResponse =
  | { ok: true; urls: string[] }
  | { ok: false; error: string };

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

export async function downloadUrlImagesAction(input: unknown): Promise<DownloadUrlResponse> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = downloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { products, type, productId, teamId, seasonId } = parsed.data;

  if (type === "associated" && !productId) {
    return { ok: false, error: "El producto es obligatorio para imágenes asociadas." };
  }

  const urls: string[] = [];

  for (const product of products) {
    try {
      const storagePath = await uploadImageFromUrl(product, type, productId, teamId, seasonId);
      urls.push(storagePath);
    } catch (err) {
      console.error(`Error subiendo imagen ${product.imageUrl}:`, err);
    }
  }

  if (urls.length === 0) {
    return { ok: false, error: "No se pudieron descargar las imágenes seleccionadas." };
  }

  return { ok: true, urls };
}

async function uploadImageFromUrl(
  product: ExtractedProduct,
  type: string,
  productId?: string,
  teamId?: string,
  seasonId?: string,
): Promise<string> {
  const fetcher = await (await import("../fka/fetcher")).FkaFetcher.connect();
  try {
    const image = await fetcher.downloadImage(product.imageUrl);
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
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
      if (!product) throw new Error("Producto no encontrado.");
      const count = await prisma.productImage.count({ where: { productId } });
      storagePath = `products/${productId}/${product.slug}-${Date.now()}-${count}.${ext}`;
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
  } finally {
    await fetcher.close();
  }
}
