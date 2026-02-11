import { useState } from "react";
import type { DirectorScene } from "@/lib/director-types";
import { Camera, Brain, Mic, Settings, Palette, ChevronDown, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
  defaultOpen?: boolean;
}

function formatPrompt(text: unknown): string {
  if (!text) return "";
  if (typeof text === "object") return JSON.stringify(text, null, 2);
  const str = String(text);
  try {
    if (str.trim().startsWith("{")) return JSON.stringify(JSON.parse(str), null, 2);
  } catch {}
  return str;
}

const promptColors: Record<string, string> = {
  nano: "#eab308",
  veo: "#a78bfa",
  veob: "#8b5cf6",
  kling: "#22c55e",
};

function PromptBlock({ label, text, color, icon }: { label: string; text: string; color: string; icon: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold flex items-center gap-1" style={{ color }}>{icon} {label}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); copy(); }}
          className="flex items-center gap-1 text-[10px] font-semibold rounded-md px-2.5 py-1 transition-all duration-200"
          style={{
            background: copied ? "hsl(152 69% 40% / 0.12)" : `${color}10`,
            color: copied ? "hsl(var(--success))" : color,
          }}
        >
          {copied ? <><Check size={10} /> Copiado!</> : <><Copy size={10} /> Copiar</>}
        </button>
      </div>
      <div
        className="rounded-xl p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto no-scrollbar"
        style={{
          background: "hsl(0 0% 0% / 0.3)",
          border: `1px solid ${color}18`,
          color: "hsl(var(--foreground) / 0.7)",
        }}
      >
        {formatPrompt(text)}
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, text, color }: { icon: React.ReactNode; label: string; text: string; color: string }) {
  if (!text || text === "null") return null;
  return (
    <div
      className="rounded-r-xl py-2.5 px-3 animate-fade-in"
      style={{ borderLeft: `3px solid ${color}`, background: `${color}08` }}
    >
      <span className="text-[10px] font-bold flex items-center gap-1 mb-1" style={{ color }}>
        {icon} {label}
      </span>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap m-0">{text}</p>
    </div>
  );
}

const sceneGradients = [
  "from-purple-500/5 to-transparent",
  "from-blue-500/5 to-transparent",
  "from-cyan-500/5 to-transparent",
  "from-green-500/5 to-transparent",
  "from-amber-500/5 to-transparent",
  "from-rose-500/5 to-transparent",
];

const SceneCard = ({ scene, index, defaultOpen = false }: SceneCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  const hasNano = scene.prompt_nano && scene.prompt_nano !== "null";
  const nanoIsNA = hasNano && scene.prompt_nano!.startsWith("N/A");
  const gradientClass = sceneGradients[index % sceneGradients.length];

  return (
    <div className="glass rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex justify-between items-center px-4 py-3.5 border-none cursor-pointer transition-all duration-200 bg-gradient-to-r",
          open ? gradientClass : "from-transparent to-transparent",
          "hover:bg-white/[0.02]"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{
              background: "hsl(var(--primary) / 0.12)",
              color: "hsl(var(--primary))",
              boxShadow: open ? "0 0 12px hsl(var(--primary) / 0.2)" : "none",
            }}
          >
            {index + 1}
          </span>
          <div className="text-left">
            <p className="text-foreground text-[13px] font-bold m-0">{scene.title}</p>
            <p className="text-muted-foreground text-[11px] m-0">{scene.duration}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={cn("text-muted-foreground transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {/* Body with smooth height */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pb-4 flex flex-col gap-3">
          {hasNano && !nanoIsNA && (
            <PromptBlock label="NANO BANANA PRO" text={scene.prompt_nano!} color={promptColors.nano} icon={<Palette size={12} />} />
          )}
          {nanoIsNA && (
            <p className="text-muted-foreground/40 text-[11px] italic px-1">{scene.prompt_nano}</p>
          )}

          {scene.prompt_veo && scene.prompt_veo !== "null" && (
            <PromptBlock label="PROMPT VEO 3.1" text={scene.prompt_veo} color={promptColors.veo} icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.veo }} />} />
          )}

          {scene.prompt_veo_b && scene.prompt_veo_b !== "null" && (
            <PromptBlock label="VEO 3.1 — SHOT B" text={scene.prompt_veo_b} color={promptColors.veob} icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.veob }} />} />
          )}

          {scene.prompt_kling && scene.prompt_kling !== "null" && (
            <PromptBlock label="PROMPT KLING 3.0" text={scene.prompt_kling} color={promptColors.kling} icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.kling }} />} />
          )}

          <InfoBlock icon={<Camera size={12} />} label="Câmera" text={scene.camera_direction} color="#a78bfa" />
          <InfoBlock icon={<Brain size={12} />} label="Neuro" text={scene.neuro_note} color="#fb7185" />
          <InfoBlock icon={<Mic size={12} />} label="Fala" text={scene.speech_timing || ""} color="#67e8f9" />
          <InfoBlock icon={<Settings size={12} />} label="Estratégia" text={scene.tech_strategy} color="#fcd34d" />
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
