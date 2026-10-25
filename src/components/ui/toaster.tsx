"use client";

import Link from "next/link";
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
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[4.75rem] z-[var(--z-toast)] flex flex-col gap-2 md:inset-x-auto md:right-4 md:top-[5.25rem] md:w-full md:max-w-sm"
    >
      {toasts.map((t) => {
        const Icon = iconMap[t.variant ?? "info"];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
              "animate-in slide-in-from-top-2 fade-in-0",
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
              {t.action && (
                <Link
                  href={t.action.href}
                  className="mt-2 inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                >
                  {t.action.label}
                </Link>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
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
