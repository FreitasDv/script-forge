import { cn } from "@/lib/utils";

interface ModeCardProps {
  mode: { id: string; label: string; icon: string; desc: string };
  selected: boolean;
  onClick: () => void;
}

const ModeCard = ({ mode, selected, onClick }: ModeCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl p-4 border transition-all duration-300 group",
        selected
          ? "bg-primary/10 border-primary/40 shadow-md shadow-primary/10"
          : "bg-card/50 border-border hover:border-primary/20 hover:shadow-sm hover:bg-card/80"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-lg transition-transform duration-300", selected && "scale-110")}>
          {mode.icon}
        </span>
        <span className={cn(
          "text-sm font-semibold transition-colors duration-200",
          selected ? "text-primary" : "text-foreground group-hover:text-primary/70"
        )}>
          {mode.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{mode.desc}</p>
    </button>
  );
};

export default ModeCard;
