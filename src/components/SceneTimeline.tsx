import { useMemo } from "react";
import type { DirectorScene } from "@/lib/director-types";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Clock } from "lucide-react";

const sceneColors = ["#7c3aed", "#3b82f6", "#22d3ee", "#22c55e", "#eab308", "#f43f5e"];

function parseDuration(d: string): number {
  const match = d?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 8;
}

interface SceneTimelineProps {
  scenes: DirectorScene[];
  completedScenes: boolean[];
  onClickScene: (index: number) => void;
}

const SceneTimeline = ({ scenes, completedScenes, onClickScene }: SceneTimelineProps) => {
  const durations = useMemo(() => scenes.map((s) => parseDuration(s.duration)), [scenes]);
  const totalSeconds = useMemo(() => durations.reduce((a, b) => a + b, 0), [durations]);
  const completedCount = completedScenes.filter(Boolean).length;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">Timeline</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              {completedCount}/{scenes.length} prontas
            </span>
            <span className="text-[11px] font-bold text-primary">{totalSeconds}s total</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${scenes.length > 0 ? (completedCount / scenes.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, hsl(var(--primary)), #22c55e)",
            }}
          />
        </div>

        {/* Timeline blocks */}
        <div className="flex gap-1 h-10 items-end">
          {scenes.map((scene, i) => {
            const pct = totalSeconds > 0 ? (durations[i] / totalSeconds) * 100 : 100 / scenes.length;
            const color = sceneColors[i % sceneColors.length];
            const done = completedScenes[i];

            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onClickScene(i)}
                    className="relative rounded-md transition-all duration-200 hover:brightness-125 cursor-pointer group"
                    style={{
                      flex: `${pct} 0 0`,
                      minWidth: 20,
                      height: "100%",
                      background: done ? `${color}30` : `${color}60`,
                      border: done ? `1px solid ${color}50` : "1px solid transparent",
                      opacity: done ? 0.5 : 1,
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80">
                      {i + 1}
                    </span>
                    {done && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center text-[7px] text-white font-bold">✓</span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-bold">{scene.title}</p>
                  <p className="text-muted-foreground">{scene.duration} • {done ? "Pronta ✓" : "Pendente"}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between mt-1.5">
          <span className="text-[9px] text-muted-foreground/40">0s</span>
          <span className="text-[9px] text-muted-foreground/40">{totalSeconds}s</span>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SceneTimeline;
