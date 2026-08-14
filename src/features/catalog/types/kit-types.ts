export const KIT_TYPES = ["LOCAL", "VISITANTE", "TERCERA", "ENTRENAMIENTO", "ESPECIAL"] as const;
export type KitType = (typeof KIT_TYPES)[number];