import { z } from "zod";
import type { MeasurementProfile } from "../types/size-guide-types";

const measurement = (label: string, min: number, max: number) => z.coerce.number({ error: `${label} debe ser un número.` }).finite(`${label} debe ser un número válido.`).gt(0, `${label} debe ser mayor que cero.`).min(min, `${label} está fuera de un rango razonable.`).max(max, `${label} está fuera de un rango razonable.`);
export const sizeGuideSchema = z.object({ heightCm: measurement("La altura", 100, 230), weightKg: measurement("El peso", 25, 250) }).strict();
export function validateMeasurementProfile(input: unknown) { return sizeGuideSchema.safeParse(input) as ReturnType<typeof sizeGuideSchema.safeParse> & { data?: MeasurementProfile }; }