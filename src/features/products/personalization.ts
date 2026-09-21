export type PersonalizationType = "NONE" | "CUSTOM" | "OFFICIAL_PLAYER";

export type PersonalizationInput = {
  type?: PersonalizationType;
  name?: string;
  number?: string;
  playerId?: string;
};

export type NormalizedPersonalization = {
  type: PersonalizationType;
  name: string;
  number: string;
  playerId?: string;
};

const NAME = /^[A-Za-zÀ-ÿ0-9 .'-]{1,15}$/;
const NUMBER = /^(?:[0-9]|[1-9][0-9])$/;

export function normalizePersonalization(input: PersonalizationInput = {}): NormalizedPersonalization {
  const value: NormalizedPersonalization = {
    type: input.type ?? "NONE",
    name: (input.name ?? "").trim().replace(/\s+/g, " ").toUpperCase(),
    number: (input.number ?? "").trim(),
  };
  const playerId = input.playerId?.trim();
  if (playerId) value.playerId = playerId;
  return value;
}

export function validatePersonalization(
  input: PersonalizationInput,
  options: { enabled?: boolean; officialPlayer?: { id: string; name: string; number: string } } = {},
): { ok: true; value: NormalizedPersonalization } | { ok: false; code: "INVALID_NAME" | "INVALID_NUMBER" | "PLAYER_REQUIRED" | "PLAYER_NOT_FOUND" | "DISABLED"; message: string } {
  const value = normalizePersonalization(input);
  if (value.type === "NONE") return { ok: true, value };
  if (options.enabled === false) return { ok: false, code: "DISABLED", message: "Esta camiseta no permite personalización." };
  if (value.type === "CUSTOM") {
    if (!NAME.test(value.name)) return { ok: false, code: "INVALID_NAME", message: "El nombre debe tener entre 1 y 15 caracteres válidos." };
    if (!NUMBER.test(value.number)) return { ok: false, code: "INVALID_NUMBER", message: "El número debe estar entre 0 y 99." };
    return { ok: true, value };
  }
  if (!value.playerId) return { ok: false, code: "PLAYER_REQUIRED", message: "Selecciona un jugador oficial." };
  if (!options.officialPlayer || options.officialPlayer.id !== value.playerId) return { ok: false, code: "PLAYER_NOT_FOUND", message: "El jugador oficial seleccionado no está disponible." };
  return { ok: true, value: { ...value, name: options.officialPlayer.name, number: options.officialPlayer.number } };
}

export function personalizationSurcharge(type: PersonalizationType, surchargeCop: number): number {
  return type === "NONE" ? 0 : Math.max(0, Math.trunc(surchargeCop));
}
