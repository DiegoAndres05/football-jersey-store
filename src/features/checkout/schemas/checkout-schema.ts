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
  shippingZipCode: z.string().max(12, "Código postal demasiado largo").optional().or(z.literal("")),
  notes: z.string().max(500, "Nota demasiado larga").optional().or(z.literal("")),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export type PaymentMethod = "CARD" | "PSE" | "NEQUI";