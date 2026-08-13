import { cn } from "@/lib/utils";

const toneClasses = {
  default: "bg-primary/10 text-primary ring-1 ring-primary/20",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success-muted text-success ring-1 ring-success/20",
  warning: "bg-warning-muted text-warning ring-1 ring-warning/20",
  danger: "bg-[hsl(0_84%_95%)] text-destructive ring-1 ring-destructive/20",
  info: "bg-info-muted text-info ring-1 ring-info/20",
  muted: "bg-secondary text-secondary-foreground ring-1 ring-border",
  outline: "bg-transparent text-foreground ring-1 ring-border",
} as const;

const sizeClasses = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
} as const;

type Tone = keyof typeof toneClasses;
type Size = keyof typeof sizeClasses;

export interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, tone = "default", size = "md", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium leading-none",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-current": tone !== "muted" && tone !== "outline",
            "bg-muted-foreground": tone === "muted" || tone === "outline",
          })}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
