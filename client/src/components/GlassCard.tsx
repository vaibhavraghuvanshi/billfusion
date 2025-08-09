import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
  hover?: boolean;
}

export function GlassCard({ children, className, variant = "light", hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border backdrop-blur-[10px]",
        variant === "light" ? "glass" : "glass-dark",
        hover && "transition-all duration-300 hover:bg-white/20 hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}
