"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  HOMEPAGE_CAROUSEL_MAX,
  toggleCarouselImageId,
  type EligibleCarouselPhoto,
} from "@/features/products/domain/homepage-carousel-slides";
import { saveHomepageCarouselAction } from "@/features/products/server/homepage-carousel-actions";

type HomepageCarouselPickerProps = {
  photos: EligibleCarouselPhoto[];
  initialSelectedIds: string[];
};

export function HomepageCarouselPicker({
  photos,
  initialSelectedIds,
}: HomepageCarouselPickerProps) {
  const eligibleIds = new Set(photos.map((photo) => photo.id));
  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelectedIds.filter((id) => eligibleIds.has(id)),
  );
  const [maxWarning, setMaxWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(imageId: string) {
    const result = toggleCarouselImageId(selectedIds, imageId);
    if (!result.ok) {
      setMaxWarning(`Máximo ${HOMEPAGE_CAROUSEL_MAX} fotos. Desmarca una para elegir otra.`);
      toast({
        title: `Máximo ${HOMEPAGE_CAROUSEL_MAX} fotos`,
        description: "Desmarca una para elegir otra.",
        variant: "warning",
      });
      return;
    }
    setMaxWarning(null);
    setSelectedIds(result.ids);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveHomepageCarouselAction(selectedIds);
      if (result.ok) {
        toast({ title: "Carrusel guardado", variant: "success" });
        router.refresh();
        return;
      }
      toast({ title: result.error, variant: "error" });
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-tight">
            Fotos del carrusel de inicio
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Haz clic en las fotos de productos visibles (hasta {HOMEPAGE_CAROUSEL_MAX}) y pulsa
            Guardar. El inicio muestra exactamente esas fotos.
          </p>
        </div>
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay fotos de productos visibles. Sube imágenes y muestra el producto en la tienda.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {photos.map((photo) => {
            const selected = selectedIds.includes(photo.id);
            const order = selected ? selectedIds.indexOf(photo.id) + 1 : null;

            return (
              <li key={photo.id}>
                <button
                  type="button"
                  onClick={() => handleToggle(photo.id)}
                  aria-pressed={selected}
                  className={`relative block w-full overflow-hidden rounded-lg border bg-secondary text-left transition-colors ${
                    selected
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="relative block aspect-square">
                    <Image
                      src={photo.url}
                      alt={photo.altText ?? photo.productName}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Seleccionada</span>
                      </span>
                    )}
                    {order !== null && (
                      <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-xs font-semibold">
                        {order}
                      </span>
                    )}
                  </span>
                  <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                    {photo.productName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {maxWarning && (
        <p className="text-sm text-destructive" role="alert">
          {maxWarning}
        </p>
      )}
    </section>
  );
}
