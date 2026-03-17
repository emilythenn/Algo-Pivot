import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowColor?: "primary" | "warning" | "destructive" | "accent";
}

const glowMap = {
  primary: "shadow-[inset_0_0_30px_-12px_hsl(160_84%_39%/0.2)]",
  warning: "shadow-[inset_0_0_30px_-12px_hsl(38_92%_50%/0.2)]",
  destructive: "shadow-[inset_0_0_30px_-12px_hsl(0_84%_60%/0.2)]",
  accent: "shadow-[inset_0_0_30px_-12px_hsl(199_89%_48%/0.2)]",
};

export function GlassCard({ children, className, hoverable = false, glowColor }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass-panel p-5",
        hoverable && "glass-panel-hover cursor-pointer",
        glowColor && glowMap[glowColor],
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
