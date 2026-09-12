import type { MetadataRoute } from "next";
import { resolvePublicOrigin } from "@/shared/config/public-origin";

const BASE_URL = resolvePublicOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/carrito", "/checkout", "/pedido"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}