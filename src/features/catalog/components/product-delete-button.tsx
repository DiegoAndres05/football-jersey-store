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
import { deleteProductAction } from "@/features/catalog/server/catalog-actions";
import {
  productDeleteBlockers,
  productDeleteBlockedMessage,
  type ProductDeleteCounts,
} from "@/features/catalog/product-delete-rules";

const buttonClassName =
  "rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

type ProductDeleteButtonProps = {
  productId: string;
  productName: string;
  counts: ProductDeleteCounts;
};

export function ProductDeleteButton({
  productId,
  productName,
  counts,
}: ProductDeleteButtonProps) {
  const blockers = productDeleteBlockers(counts);
  const blocked = blockers.length > 0;
  const reason = blocked ? productDeleteBlockedMessage(blockers) : null;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (blocked && reason) {
    return (
      <div className="flex max-w-[18rem] flex-col items-end gap-1">
        <button type="button" disabled className={buttonClassName} title={reason}>
          Eliminar
        </button>
        <p className="text-right text-[11px] leading-snug text-muted-foreground">{reason}</p>
      </div>
    );
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        toast({ title: "Producto eliminado", variant: "success" });
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
      <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>
        Eliminar
      </button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="max-w-md" aria-describedby="product-delete-description">
          <DialogHeader>
            <DialogTitle>¿Eliminar este producto?</DialogTitle>
            <DialogDescription id="product-delete-description">
              Se eliminará «{productName}». Esta acción no se puede deshacer.
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
              onClick={confirmDelete}
              className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-[hsl(var(--destructive-hover))] disabled:opacity-50"
            >
              {pending ? "Eliminando…" : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
