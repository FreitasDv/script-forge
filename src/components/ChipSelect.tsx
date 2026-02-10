import { cn } from "@/lib/utils";

interface ChipOption {
  id: string;
  label: string;
}

interface ChipSelectProps {
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const ChipSelect = ({ options, value, onChange, label }: ChipSelectProps) => {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
              value === opt.id
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChipSelect;
