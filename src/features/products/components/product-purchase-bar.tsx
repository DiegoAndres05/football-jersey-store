"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useViewportWidth } from "@/shared/hooks/use-viewport-width";
import { shouldShowPurchaseBar } from "../domain/purchase-bar";

const TEXT_ENTRY = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]";
const OPEN_MODAL = '[role="dialog"][data-state="open"]';

function useTextEntryFocused(): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const sync = () => setFocused(document.activeElement instanceof HTMLElement && document.activeElement.matches(TEXT_ENTRY));
    const syncAfterBlur = () => window.setTimeout(sync, 0);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", syncAfterBlur);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", syncAfterBlur);
    };
  }, []);

  return focused;
}

function useModalOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setOpen(document.querySelector(OPEN_MODAL) !== null);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);

  return open;
}

export function ProductPurchaseBar({
  price,
  sizeLabel,
  action,
}: {
  price: ReactNode;
  sizeLabel: string | null;
  action: ReactNode;
}) {
  const viewportWidth = useViewportWidth();
  const isKeyboardOpen = useTextEntryFocused();
  const isDialogOpen = useModalOpen();

  if (viewportWidth === null || !shouldShowPurchaseBar({ viewportWidth, isKeyboardOpen, isDialogOpen })) return null;

  return (
    <>
      <div aria-hidden="true" className="h-24" />
      <div
        role="region"
        aria-label="Compra rápida"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold tabular-nums">{price}</div>
            <p className={sizeLabel ? "truncate text-xs text-muted-foreground" : "truncate text-xs font-medium text-primary"}>
              {sizeLabel ? `Talla ${sizeLabel}` : "Elige talla"}
            </p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>
      </div>
    </>
  );
}
