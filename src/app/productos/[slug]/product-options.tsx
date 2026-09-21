"use client";

import { useMemo } from "react";
import { validatePersonalization, type PersonalizationInput } from "@/features/products/personalization";

export function ProductOptionsValidation({ input, enabled = true }: { input: PersonalizationInput; enabled?: boolean }) {
  const result = useMemo(() => validatePersonalization(input, { enabled }), [input, enabled]);
  if (result.ok) return null;
  return <p role="alert" className="text-sm text-destructive">{result.message}</p>;
}
