import { NextResponse } from "next/server";
import { prepareBoldTransaction } from "@/features/payments/services/bold-service";

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
    const isConfigError =
      message.includes("order-id") ||
      message.includes("monto") ||
      message.includes("moneda") ||
      message.includes("condiciones") ||
      message.includes("sandbox") ||
      message.includes("no encontrado") ||
      message.includes("pendiente");
    console.error("Error generating Bold hash:", message);
    return NextResponse.json(
      { error: isConfigError ? message : "Error generando hash." },
      { status: isConfigError ? 400 : 500 },
    );
  }
}
