import { NextResponse } from "next/server";
import { prepareBoldPayment } from "@/features/payments/services/bold-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, amount, currency } = body;

    if (orderId == null || amount == null || !currency) {
      return NextResponse.json({ error: "Faltan parámetros: orderId, amount, currency." }, { status: 400 });
    }

    const payment = prepareBoldPayment({ orderId, amount, currency });
    return NextResponse.json(payment);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generando hash.";
    const isConfigError =
      message.includes("order-id") ||
      message.includes("monto") ||
      message.includes("moneda");
    console.error("Error generating Bold hash:", err);
    return NextResponse.json(
      { error: isConfigError ? message : "Error generando hash." },
      { status: isConfigError ? 400 : 500 },
    );
  }
}
