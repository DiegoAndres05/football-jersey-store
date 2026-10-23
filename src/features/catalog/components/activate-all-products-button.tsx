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
import { activateAllProductsAction } from "@/features/catalog/server/catalog-actions";

export function ActivateAllProductsButton({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await activateAllProductsAction();
      if (result.ok) {
        toast({ title: "Todos los productos quedaron visibles en la tienda", variant: "success" });
        setOpen(false);
        router.refresh();
        return;
      }
      toast({ title: result.error, variant: "error" });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:border-foreground/30"
      >
        Mostrar todos en la tienda ({count})
      </button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¿Mostrar todos los productos?</DialogTitle>
            <DialogDescription>
              {count === 1
                ? "Hay 1 producto oculto. Volverá a verse en el catálogo."
                : `Hay ${count} productos ocultos. Todos volverán a verse en el catálogo.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={confirm}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {pending ? "Activando…" : "Mostrar todos"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
