import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  variant: "green" | "red" | "warning" | "accent";
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export function StatusBadge({ variant, children, className, pulse }: StatusBadgeProps) {
  const variantMap = {
    green: "status-green",
    red: "status-red",
    warning: "status-warning",
    accent: "status-accent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
        variantMap[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={cn(
            "absolute inline-flex h-full w-full animate-pulse-glow rounded-full opacity-75",
            variant === "green" && "bg-primary",
            variant === "red" && "bg-destructive",
            variant === "warning" && "bg-warning",
            variant === "accent" && "bg-accent",
          )} />
          <span className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            variant === "green" && "bg-primary",
            variant === "red" && "bg-destructive",
            variant === "warning" && "bg-warning",
            variant === "accent" && "bg-accent",
          )} />
        </span>
      )}
      {children}
    </span>
  );
}
