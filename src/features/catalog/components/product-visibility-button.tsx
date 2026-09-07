"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { setProductActiveAction } from "@/features/catalog/server/catalog-actions";

const hideClassName =
  "rounded-md border border-border px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors disabled:opacity-50";
const showClassName =
  "rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:border-muted-foreground/40 transition-colors disabled:opacity-50";

type ProductVisibilityButtonProps = {
  productId: string;
  productName: string;
  isActive: boolean;
};

export function ProductVisibilityButton({
  productId,
  productName,
  isActive,
}: ProductVisibilityButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const nextActive = !isActive;
  const actionLabel = isActive ? "Ocultar de la tienda" : "Mostrar en la tienda";

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await setProductActiveAction(productId, nextActive);
      if (result.ok) {
        toast({
          title: nextActive ? "Producto visible en la tienda" : "Producto oculto de la tienda",
          variant: "success",
        });
        setOpen(false);
        router.refresh();
        return;
      }
      setError(result.error);
      toast({ title: result.error, variant: "error" });
    });
  }

  return (
    <>
      <button type="button" className={isActive ? hideClassName : showClassName} onClick={() => setOpen(true)}>
        {actionLabel}
      </button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="max-w-md" aria-describedby="product-visibility-description">
          <DialogHeader>
            <DialogTitle>{isActive ? "¿Ocultar de la tienda?" : "¿Mostrar en la tienda?"}</DialogTitle>
            <DialogDescription id="product-visibility-description">
              {isActive
                ? `«${productName}» dejará de verse en el catálogo. El historial de stock y las variantes se conservan.`
                : `«${productName}» volverá a verse en el catálogo público.`}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-muted-foreground/40 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={confirm}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50"
            >
              {pending ? "Guardando…" : actionLabel}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
