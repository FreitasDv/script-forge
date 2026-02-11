import { cn } from "@/lib/utils";

interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  from?: string;
  to?: string;
  variant?: "primary" | "accent";
}

const GradientText = ({ className, variant = "primary", children, ...props }: GradientTextProps) => {
  return (
    <span
      className={cn(
        variant === "primary" ? "text-gradient-primary" : "text-gradient-accent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export { GradientText };
