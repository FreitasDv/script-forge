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
        "w-full text-left rounded-xl p-4 border transition-all",
        selected
          ? "bg-primary/10 border-primary/40 shadow-sm"
          : "bg-card/50 border-border hover:border-primary/20"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{mode.icon}</span>
        <span className={cn(
          "text-sm font-semibold",
          selected ? "text-primary" : "text-foreground"
        )}>
          {mode.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{mode.desc}</p>
    </button>
  );
};

export default ModeCard;
