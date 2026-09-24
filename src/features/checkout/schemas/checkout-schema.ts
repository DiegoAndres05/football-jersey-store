import { z } from "zod";

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .min(3, "Escribe tu nombre completo")
    .max(80, "Nombre demasiado largo"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .max(120, "Correo demasiado largo"),
  phone: z
    .string()
    .min(7, "Escribe un teléfono válido")
    .max(20, "Teléfono demasiado largo")
    .regex(/^[0-9+\s().-]+$/, "Solo números y signos de teléfono"),
  shippingFullName: z
    .string()
    .min(3, "Escribe el nombre del destinatario")
    .max(80, "Nombre demasiado largo"),
  shippingPhone: z
    .string()
    .min(7, "Escribe un teléfono válido")
    .max(20, "Teléfono demasiado largo")
    .regex(/^[0-9+\s().-]+$/, "Solo números y signos de teléfono"),
  shippingLine1: z
    .string()
    .min(5, "Escribe la dirección (calle, número, complemento)")
    .max(160, "Dirección demasiado larga"),
  shippingLine2: z.string().max(160, "Complemento demasiado largo").optional().or(z.literal("")),
  shippingCity: z.string().min(2, "Escribe la ciudad").max(80, "Ciudad demasiado larga"),
  shippingState: z.string().min(2, "Escribe el departamento").max(80, "Departamento demasiado largo"),
  shippingCountry: z.string().trim().min(2, "Escoge el país de destino").max(80, "País demasiado largo"),
  shippingZipCode: z.string().max(12, "Código postal demasiado largo").optional().or(z.literal("")),
  notes: z.string().max(500, "Nota demasiado larga").optional().or(z.literal("")),
  consentTerms: z.boolean().refine((value) => value === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),
  consentPrivacy: z.boolean().refine((value) => value === true, {
    message: "Debes aceptar la política de privacidad.",
  }),
  consentDataProcessing: z.boolean().refine((value) => value === true, {
    message: "Debes aceptar el tratamiento de datos.",
  }),
}).superRefine((value, ctx) => {
  if (!value.consentTerms) {
    ctx.addIssue({ code: "custom", path: ["consentTerms"], message: "Debes aceptar los términos y condiciones." });
  }
  if (!value.consentPrivacy) {
    ctx.addIssue({ code: "custom", path: ["consentPrivacy"], message: "Debes aceptar la política de privacidad." });
  }
  if (!value.consentDataProcessing) {
    ctx.addIssue({ code: "custom", path: ["consentDataProcessing"], message: "Debes aceptar el tratamiento de datos." });
  }
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export type PaymentMethod = "CARD" | "PSE" | "NEQUI";

/** Client input for the cart; prices are deliberately absent and are always
 * loaded from ProductVariant during order creation. */
export const checkoutLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  customizationType: z.enum(["NONE", "CUSTOM", "OFFICIAL_PLAYER"]),
  customizationName: z.string().max(80).default(""),
  customizationNumber: z.string().max(20).default(""),
  deliveryMode: z.enum(["INMEDIATA", "BAJO_PEDIDO"]),
});

export const checkoutCartSchema = z.object({
  lines: z.array(checkoutLineSchema).min(1).max(100),
  saleCurrency: z.enum(["COP", "USD"]).default("COP"),
  couponCode: z.string().trim().max(32).nullable().optional(),
});

/** Server-produced values used by payment and rendering. */
export const checkoutTotalsSchema = z.object({
  subtotal: z.number().int().nonnegative(),
  personalizationFee: z.number().int().nonnegative(),
  shippingFee: z.number().int().nonnegative(),
  discountAmount: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  paymentAmount: z.number().int().nonnegative(),
  saleCurrency: z.enum(["COP", "USD"]),
});

export type CheckoutLine = z.infer<typeof checkoutLineSchema>;
export type CheckoutCart = z.infer<typeof checkoutCartSchema>;
export type CheckoutTotals = z.infer<typeof checkoutTotalsSchema>;