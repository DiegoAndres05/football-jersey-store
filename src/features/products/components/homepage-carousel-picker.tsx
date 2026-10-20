"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  CAROUSEL_PICKER_BROWSE_LIMIT,
  HOMEPAGE_CAROUSEL_MAX,
  toggleCarouselImageId,
  visibleCarouselPhotos,
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
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const detailsRef = useRef<HTMLDetailsElement>(null);
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

  const visible = useMemo(() => visibleCarouselPhotos(photos, query), [photos, query]);
  const selectedPhotos = selectedIds.flatMap((id) => {
    const photo = photos.find((item) => item.id === id);
    return photo ? [photo] : [];
  });

  function handleSave() {
    startTransition(async () => {
      const result = await saveHomepageCarouselAction(selectedIds);
      if (result.ok) {
        toast({ title: "Carrusel guardado", variant: "success" });
        if (detailsRef.current) detailsRef.current.open = false;
        router.refresh();
        return;
      }
      toast({ title: result.error, variant: "error" });
    });
  }

  return (
    <details
      ref={detailsRef}
      className="group rounded-xl border border-border bg-card"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <h3 className="font-display text-sm font-bold uppercase tracking-tight">
            Fotos del carrusel de inicio
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedIds.length} de {HOMEPAGE_CAROUSEL_MAX} elegidas
          </p>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Elige hasta {HOMEPAGE_CAROUSEL_MAX} fotos de productos visibles y pulsa Guardar.
          {photos.length > CAROUSEL_PICKER_BROWSE_LIMIT ? " Busca por equipo, liga o producto para no recorrer toda la lista." : ""}
        </p>
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay fotos de productos visibles. Sube imágenes y muestra el producto en la tienda.
        </p>
      ) : (
        <>
          <label className="block text-sm">
            Buscar foto
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Equipo, liga o producto"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          {selectedPhotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Elegidas ({selectedPhotos.length} de {HOMEPAGE_CAROUSEL_MAX})
              </p>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {selectedPhotos.map((photo) => (
                  <PhotoChoice
                    key={photo.id}
                    photo={photo}
                    selected
                    order={selectedIds.indexOf(photo.id) + 1}
                    onToggle={() => handleToggle(photo.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {visible.mode === "prompt" ? (
            <p className="text-sm text-muted-foreground">
              Hay {photos.length} fotos. Escribe al menos dos letras para encontrar un equipo, una liga o un producto.
            </p>
          ) : visible.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguna foto coincide con esa búsqueda.</p>
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {visible.photos.map((photo) => (
                  <PhotoChoice
                    key={photo.id}
                    photo={photo}
                    selected={selectedIds.includes(photo.id)}
                    order={selectedIds.includes(photo.id) ? selectedIds.indexOf(photo.id) + 1 : null}
                    onToggle={() => handleToggle(photo.id)}
                  />
                ))}
              </ul>
              {visible.matchCount > visible.photos.length && (
                <p className="text-sm text-muted-foreground">
                  Hay {visible.matchCount} coincidencias. Afina la búsqueda para ver el resto.
                </p>
              )}
            </>
          )}
        </>
      )}

      {maxWarning && (
        <p className="text-sm text-destructive" role="alert">
          {maxWarning}
        </p>
      )}
      </div>
    </details>
  );
}

function PhotoChoice({
  photo,
  selected,
  order,
  onToggle,
}: {
  photo: EligibleCarouselPhoto;
  selected: boolean;
  order: number | null;
  onToggle: () => void;
}) {
  const caption = photo.teamName ? `${photo.productName} · ${photo.teamName}` : photo.productName;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        className={`relative block w-full overflow-hidden rounded-lg border bg-secondary text-left transition-colors ${
          selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-muted-foreground/40"
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
        <span className="block truncate px-2 py-1.5 text-[11px] text-muted-foreground">{caption}</span>
      </button>
    </li>
  );
}
