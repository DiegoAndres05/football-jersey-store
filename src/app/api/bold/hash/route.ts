import { NextResponse } from "next/server";
import { prepareBoldTransaction } from "@/features/payments/services/bold-service";
import { toPublicBoldError } from "@/features/payments/domain/bold-public-error";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }
    const { orderId } = body;
    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ error: "Falta orderId." }, { status: 400 });
    }

    const payment = await prepareBoldTransaction(orderId);
    // Keep the route contract deliberately small: no DB ids, secret material,
    // transaction internals, or customer/order snapshots leave the server.
    return NextResponse.json({
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      hash: payment.hash,
      apiKey: payment.apiKey,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando hash.";
    console.error("Error generating Bold hash:", message);
    const publicError = toPublicBoldError(message);
    return NextResponse.json({ error: publicError.message }, { status: publicError.status });
  }
}
