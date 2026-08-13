import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border bg-background px-3 py-2 text-sm transition-all",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        hasError
          ? "border-destructive focus-visible:ring-destructive"
          : "border-input focus-visible:ring-ring",
        className,
      )}
      aria-invalid={hasError ? "true" : undefined}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
