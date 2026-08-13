"use client";

import { X, CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "./toast";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const borderColorMap = {
  success: "border-success/30",
  error: "border-destructive/30",
  warning: "border-warning/30",
  info: "border-border",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex w-full max-w-sm flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = iconMap[t.variant ?? "info"];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
              "animate-in slide-in-from-right-2 fade-in-0",
              borderColorMap[t.variant ?? "info"],
            )}
          >
            <Icon
              className={cn("h-5 w-5 shrink-0 mt-0.5", {
                "text-success": t.variant === "success",
                "text-destructive": t.variant === "error",
                "text-warning": t.variant === "warning",
                "text-muted-foreground": !t.variant || t.variant === "info",
              })}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-0.5"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
