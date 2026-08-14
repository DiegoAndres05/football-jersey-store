import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con permisos de service role.
 * SOLO puede importarse desde código server-side (import "server-only").
 * NUNCA importar desde componentes cliente.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Faltan SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL para el cliente server de Storage",
  );
}

export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "public" },
});

export const PRODUCT_IMAGES_BUCKET = "product-images";