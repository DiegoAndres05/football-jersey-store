export type SizeSelectionState = {
  selectedSize: string;
  isSelected: boolean;
};

export function createSizeSelectionState(selectedSize = ""): SizeSelectionState {
  const normalized = selectedSize.trim();
  return {
    selectedSize: normalized,
    isSelected: normalized.length > 0,
  };
}

export function resolveSelectedSize({
  currentSize,
  allowedSizes,
  nextVersionSizes,
}: {
  currentSize: string;
  allowedSizes: readonly string[];
  nextVersionSizes?: readonly string[];
}): SizeSelectionState {
  const candidates = new Set((nextVersionSizes ?? allowedSizes).map((size) => String(size).trim()));
  const current = String(currentSize ?? "").trim();
  const selectedSize = current && candidates.has(current) ? current : "";
  return {
    selectedSize,
    isSelected: selectedSize.length > 0,
  };
}
