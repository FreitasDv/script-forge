import { cn } from "@/lib/utils";

interface ChipOption {
  id: string;
  label: string;
  icon?: string;
}

interface ChipSelectProps {
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  color?: string;
  layout?: "flex" | "grid";
}

const ChipSelect = ({ options, value, onChange, label, color, layout = "flex" }: ChipSelectProps) => {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
        {label}
      </span>
      <div className={cn(
        layout === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"
      )}>
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border active:scale-95 flex items-center gap-1.5",
                !isSelected && "bg-card/30 text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
              )}
              style={
                isSelected && color
                  ? {
                      backgroundColor: `${color}15`,
                      color: color,
                      borderColor: `${color}40`,
                      boxShadow: `0 2px 8px ${color}15`,
                    }
                  : isSelected
                  ? undefined
                  : undefined
              }
            >
              {opt.icon && <span className="text-sm">{opt.icon}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChipSelect;
