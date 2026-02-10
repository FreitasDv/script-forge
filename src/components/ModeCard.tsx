import { cn } from "@/lib/utils";

interface ModeCardProps {
  mode: { id: string; label: string; icon: string; desc: string; color: string };
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
        mode.id === "hybrid" && "sm:col-span-2",
        selected
          ? "shadow-lg scale-[1.02]"
          : "bg-card/30 border-border/50 hover:border-border hover:shadow-sm hover:bg-card/60"
      )}
      style={
        selected
          ? {
              backgroundColor: `${mode.color}12`,
              borderColor: `${mode.color}55`,
              boxShadow: `0 4px 20px ${mode.color}15`,
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className={cn("text-xl transition-transform duration-300", selected && "scale-110")}>
          {mode.icon}
        </span>
        <span
          className={cn("text-sm font-bold transition-colors duration-200")}
          style={selected ? { color: mode.color } : undefined}
        >
          {mode.label}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{mode.desc}</p>
    </button>
  );
};

export default ModeCard;
