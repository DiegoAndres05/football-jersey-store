import { NextResponse } from "next/server";
import { generateBoldIntegrityHash, getBoldPublicKey } from "@/features/payments/services/bold-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, amount, currency } = body;

    if (!orderId || !amount || !currency) {
      return NextResponse.json({ error: "Faltan parámetros: orderId, amount, currency." }, { status: 400 });
    }

    const hash = generateBoldIntegrityHash(orderId, amount, currency);
    const apiKey = getBoldPublicKey();
    return NextResponse.json({ hash, apiKey });
  } catch (err) {
    console.error("Error generating Bold hash:", err);
    return NextResponse.json({ error: "Error generando hash." }, { status: 500 });
  }
}
