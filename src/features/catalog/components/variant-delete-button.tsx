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
import { deleteVariantAction } from "@/features/catalog/server/catalog-actions";
import {
  variantDeleteBlockedMessage,
  variantDeleteIsBlocked,
} from "@/features/catalog/variant-delete-rules";

const buttonClassName =
  "rounded-md border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent";

type VariantDeleteButtonProps = {
  variantId: string;
  label: string;
  movementCount: number;
};

export function VariantDeleteButton({
  variantId,
  label,
  movementCount,
}: VariantDeleteButtonProps) {
  const blocked = variantDeleteIsBlocked(movementCount);
  const reason = blocked ? variantDeleteBlockedMessage(movementCount) : null;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (blocked && reason) {
    return (
      <div className="flex max-w-[16rem] flex-col items-end gap-1">
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
      const result = await deleteVariantAction(variantId);
      if (result.ok) {
        toast({ title: "Variante eliminada", variant: "success" });
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
        <DialogContent className="max-w-md" aria-describedby="variant-delete-description">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta variante?</DialogTitle>
            <DialogDescription id="variant-delete-description">
              Se eliminará {label}. Solo es posible si no tiene movimientos de inventario.
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
