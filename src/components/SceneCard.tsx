import { useState } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DirectorScene } from "@/lib/director-types";
import { cn } from "@/lib/utils";

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
}

const SceneCard = ({ scene, index }: SceneCardProps) => {
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
      className="h-7 gap-1 text-xs transition-all duration-200"
      onClick={() => copy(text, k)}
    >
      {copied === k ? (
        <Check className="h-3 w-3 text-success animate-scale-in" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      {copied === k ? "Copiado" : "Copiar"}
    </Button>
  );

  const sections = [
    { key: "camera", label: "🎥 Direção de Câmera", content: scene.camera_direction, borderColor: "border-l-primary", bgColor: "bg-primary/5" },
    { key: "neuro", label: "🧠 Neuromarketing", content: scene.neuro_note, borderColor: "border-l-destructive", bgColor: "bg-destructive/5" },
    { key: "speech", label: "🎙️ Timing de Fala", content: scene.speech_timing, borderColor: "border-l-accent", bgColor: "bg-accent/5" },
    { key: "tech", label: "⚙️ Estratégia Técnica", content: scene.tech_strategy, borderColor: "border-l-warning", bgColor: "bg-warning/5" },
  ];

  const activeSections = sections.filter((s) => s.content);

  return (
    <div
      className="rounded-xl border bg-card/80 backdrop-blur-sm p-5 space-y-3 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          <span className="text-primary mr-2">CENA {index + 1}</span>
          {scene.title}
        </h3>
        <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">{scene.duration}</span>
      </div>

      {/* Prompts */}
      {scene.prompt_veo && (
        <PromptBlock
          label="PROMPT VEO 3.1"
          text={scene.prompt_veo}
          colorClass="text-primary"
          bgClass="bg-primary/5 border-primary/20"
          copyBtn={<CopyBtn text={scene.prompt_veo} k={`veo-${index}`} />}
        />
      )}
      {scene.prompt_kling && (
        <PromptBlock
          label="PROMPT KLING 3.0"
          text={scene.prompt_kling}
          colorClass="text-success"
          bgClass="bg-success/5 border-success/20"
          copyBtn={<CopyBtn text={scene.prompt_kling} k={`kling-${index}`} />}
        />
      )}
      {scene.prompt_nano && (
        <PromptBlock
          label="REF IMAGE — NANO BANANA PRO"
          text={scene.prompt_nano}
          colorClass="text-warning"
          bgClass="bg-warning/5 border-warning/20"
          copyBtn={<CopyBtn text={scene.prompt_nano} k={`nano-${index}`} />}
        />
      )}

      {/* Collapsible info sections */}
      {activeSections.length > 0 && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group">
            <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
            <span className="font-medium">Detalhes da cena ({activeSections.length})</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {activeSections.map((s) => (
              <div
                key={s.key}
                className={cn(
                  "pl-3 border-l-2 rounded-r-lg p-3 transition-all duration-200",
                  s.borderColor,
                  s.bgColor
                )}
              >
                <span className="text-[11px] font-semibold text-muted-foreground block mb-1">{s.label}</span>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

const PromptBlock = ({
  label,
  text,
  colorClass,
  bgClass,
  copyBtn,
}: {
  label: string;
  text: string;
  colorClass: string;
  bgClass: string;
  copyBtn: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className={`text-xs font-semibold ${colorClass}`}>{label}</span>
      {copyBtn}
    </div>
    <div className={cn("rounded-lg p-3 font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap border", bgClass)}>
      {text}
    </div>
  </div>
);

export default SceneCard;
