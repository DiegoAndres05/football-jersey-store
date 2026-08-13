import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm transition-all",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
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
Input.displayName = "Input";
