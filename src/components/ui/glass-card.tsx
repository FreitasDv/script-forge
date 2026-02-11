import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: string;
  hover?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow, hover = true, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass relative rounded-2xl overflow-hidden transition-all duration-300",
          hover && "glass-hover",
          className
        )}
        style={{
          ...(glow ? { boxShadow: `0 0 40px ${glow}08, 0 0 80px ${glow}04` } : {}),
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
