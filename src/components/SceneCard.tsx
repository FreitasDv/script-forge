import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DirectorScene } from "@/lib/director-types";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
  defaultOpen?: boolean;
}

function formatPrompt(text: string): string {
  if (!text) return text;
  try {
    if (text.trim().startsWith("{")) {
      return JSON.stringify(JSON.parse(text), null, 2);
    }
  } catch {}
  return text;
}

const SceneCard = ({ scene, index, defaultOpen = false }: SceneCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 gap-1 text-[10px] px-2 transition-all duration-200"
      onClick={(e) => { e.stopPropagation(); copy(text, k); }}
    >
      {copied === k ? (
        <Check className="h-3 w-3 text-success animate-scale-in" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied === k ? "Copiado!" : "Copiar"}
    </Button>
  );

  const hasNano = scene.prompt_nano && scene.prompt_nano !== "null";
  const nanoIsNA = hasNano && scene.prompt_nano!.startsWith("N/A");

  const sections = [
    { key: "camera", label: "🎥 Câmera", content: scene.camera_direction, color: "#a78bfa" },
    { key: "neuro", label: "🧠 Neuro", content: scene.neuro_note, color: "#f43f5e" },
    { key: "speech", label: "🎙️ Fala", content: scene.speech_timing, color: "#f97316" },
    { key: "tech", label: "⚙️ Estratégia", content: scene.tech_strategy, color: "#22d3ee" },
  ];

  const activeSections = sections.filter((s) => s.content);

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-border/60">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors duration-200 hover:bg-muted/30"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold">
            {index + 1}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{scene.title}</p>
            <p className="text-[11px] text-muted-foreground">{scene.duration}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {/* Nano */}
          {hasNano && !nanoIsNA && (
            <PromptBlock
              label="🎨 NANO BANANA PRO"
              text={formatPrompt(scene.prompt_nano!)}
              color="#eab308"
              copyBtn={<CopyBtn text={scene.prompt_nano!} k={`nano-${index}`} />}
            />
          )}
          {nanoIsNA && (
            <div className="text-[11px] text-muted-foreground/60 italic px-1">
              {scene.prompt_nano}
            </div>
          )}

          {/* Veo */}
          {scene.prompt_veo && scene.prompt_veo !== "null" && (
            <PromptBlock
              label="🟣 PROMPT VEO 3.1"
              text={formatPrompt(scene.prompt_veo)}
              color="#a78bfa"
              copyBtn={<CopyBtn text={scene.prompt_veo} k={`veo-${index}`} />}
            />
          )}

          {/* Veo B */}
          {scene.prompt_veo_b && scene.prompt_veo_b !== "null" && (
            <PromptBlock
              label="🟣 VEO 3.1 — SHOT B"
              text={formatPrompt(scene.prompt_veo_b)}
              color="#8b5cf6"
              copyBtn={<CopyBtn text={scene.prompt_veo_b} k={`veob-${index}`} />}
            />
          )}

          {/* Kling */}
          {scene.prompt_kling && scene.prompt_kling !== "null" && (
            <PromptBlock
              label="🟢 PROMPT KLING 3.0"
              text={formatPrompt(scene.prompt_kling)}
              color="#22c55e"
              copyBtn={<CopyBtn text={scene.prompt_kling} k={`kling-${index}`} />}
            />
          )}

          {/* Info sections */}
          {activeSections.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full group mt-1">
                <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                <span className="font-semibold">Detalhes técnicos ({activeSections.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                {activeSections.map((s) => (
                  <div
                    key={s.key}
                    className="pl-3 border-l-2 rounded-r-lg p-2.5 bg-muted/20"
                    style={{ borderLeftColor: `${s.color}60` }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">{s.label}</span>
                    <p className="text-xs text-foreground/75 leading-relaxed whitespace-pre-wrap">{s.content}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
};

const PromptBlock = ({
  label,
  text,
  color,
  copyBtn,
}: {
  label: string;
  text: string;
  color: string;
  copyBtn: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
      {copyBtn}
    </div>
    <div
      className="rounded-lg p-3 font-mono text-[11px] text-foreground/75 leading-relaxed whitespace-pre-wrap border max-h-64 overflow-y-auto"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}20`,
      }}
    >
      {text}
    </div>
  </div>
);

export default SceneCard;
