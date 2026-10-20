import { NextResponse } from "next/server";
import { capturePayPalReturn } from "@/features/payments/services/paypal-service";
import { resolvePublicOrigin } from "@/shared/config/public-origin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = resolvePublicOrigin();
  const token = new URL(request.url).searchParams.get("token") ?? "";
  try {
    const result = await capturePayPalReturn(token);
    if (!result.ok) {
      return NextResponse.redirect(`${origin}/checkout?paypal=error`);
    }
    return NextResponse.redirect(`${origin}/pedido/confirmado/${result.orderCode}`);
  } catch (err) {
    console.error("[PayPal] Return failed:", err);
    return NextResponse.redirect(`${origin}/checkout?paypal=error`);
  }
}
