import { sendDesignedNewsletterCampaign } from "@/features/newsletter/server/campaign-actions";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "La campaña no es válida." });
  }
  const result = await sendDesignedNewsletterCampaign(input);
  return Response.json(result);
}
