"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type AdminSaveResult, saveError, saveSuccess } from "@/shared/admin/admin-save-result";

const newsletterSchema = z.object({
  email: z.string().trim().email("Escribe un correo válido."),
});

export async function subscribeToNewsletterAction(
  _previousState: AdminSaveResult | null,
  formData: FormData,
): Promise<AdminSaveResult> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return saveError(parsed.error.issues[0].message);

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      update: {},
      create: { email: parsed.data.email.toLowerCase() },
    });
    return saveSuccess();
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    return saveError("No pudimos registrar tu correo. Intenta de nuevo.");
  }
}
