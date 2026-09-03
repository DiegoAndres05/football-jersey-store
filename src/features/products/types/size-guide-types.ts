export type SizeGuideKind = "FAN" | "PLAYER";
export type SizeGuideStatus = "RECOMMENDED" | "AMBIGUOUS" | "UNAVAILABLE" | "INSUFFICIENT_DATA" | "NO_MATCH";
export type SizeGuideRow = Readonly<{ sizeCode: string; heightMin: number; heightMax: number; weightMin: number; weightMax: number; measurements?: Readonly<Record<string, number>> }>;
export type SizeGuideTable = Readonly<{ kind: SizeGuideKind; sourceKey: string; toleranceCm: 1; rows: readonly SizeGuideRow[] }>;
export type MeasurementProfile = { heightCm: number; weightKg: number };
export type SizeCandidate = SizeGuideRow & { heightMatch: boolean; weightMatch: boolean; weightDistance: number };
export type SizeRecommendation = { status: SizeGuideStatus; primarySize?: string; alternativeSize?: string; availablePrimary: boolean; reason: string; candidates: SizeCandidate[]; garmentMeasurements?: Readonly<Record<string, number>> };

const rows = (values: readonly (readonly [string, number, number, number, number])[]): SizeGuideRow[] => values.map(([sizeCode, heightMin, heightMax, weightMin, weightMax]) => ({ sizeCode, heightMin, heightMax, weightMin, weightMax }));
export const FAN_SIZE_GUIDE: SizeGuideTable = { kind: "FAN", sourceKey: "adult_men_fan_version_jersey", toleranceCm: 1, rows: rows([["S", 160, 170, 60, 65], ["M", 170, 175, 66, 70], ["L", 175, 180, 71, 75], ["XL", 180, 185, 76, 80], ["2XL", 185, 190, 81, 87], ["3XL", 190, 195, 88, 95], ["4XL", 190, 199, 96, 105]]) };
export const PLAYER_SIZE_GUIDE: SizeGuideTable = { kind: "PLAYER", sourceKey: "adult_men_player_version_jersey", toleranceCm: 1, rows: rows([["S", 160, 165, 55, 60], ["M", 165, 170, 60, 70], ["L", 170, 175, 70, 80], ["XL", 175, 185, 80, 92.5], ["2XL", 185, 190, 90, 95]]) };
export const SIZE_GUIDES = { FAN: FAN_SIZE_GUIDE, PLAYER: PLAYER_SIZE_GUIDE } as const;