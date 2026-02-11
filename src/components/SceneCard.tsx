import { useState, memo } from "react";
import type { DirectorScene } from "@/lib/director-types";
import { Camera, Brain, Mic, Settings, Palette, ChevronDown, Check, Copy, RotateCw, CheckCircle2, Loader2, Zap, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
  defaultOpen?: boolean;
  completed?: boolean;
  onToggleComplete?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  onImageGenerated?: (url: string, sceneIndex: number) => void;
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

function PromptBlock({ label, text, color, icon, onGenerate, generating }: { label: string; text: string; color: string; icon: React.ReactNode; onGenerate?: () => void; generating?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-overline flex items-center gap-1.5" style={{ color }}>{icon} {label}</span>
        <div className="flex items-center gap-1.5">
          {onGenerate && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onGenerate(); }}
              disabled={generating}
              className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-3 py-1.5 transition-all duration-200"
              style={{
                background: generating ? "hsl(38 92% 50% / 0.12)" : "hsl(152 69% 40% / 0.08)",
                color: generating ? "hsl(var(--warning))" : "hsl(var(--success))",
                border: "1px solid",
                borderColor: generating ? "hsl(38 92% 50% / 0.2)" : "hsl(152 69% 40% / 0.15)",
              }}
            >
              {generating ? <><Loader2 size={10} className="animate-spin" /> Gerando...</> : <><Zap size={10} /> Gerar</>}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); copy(); }}
            className="flex items-center gap-1 text-[11px] font-semibold rounded-lg px-3 py-1.5 transition-all duration-200"
            style={{
              background: copied ? "hsl(152 69% 40% / 0.12)" : `${color}12`,
              color: copied ? "hsl(var(--success))" : color,
            }}
          >
            {copied ? <><Check size={10} /> Copiado!</> : <><Copy size={10} /> Copiar</>}
          </button>
        </div>
      </div>
      <div
        className="rounded-xl p-4 font-mono text-[12px] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto no-scrollbar"
        style={{
          background: "hsl(0 0% 0% / 0.35)",
          borderLeft: `3px solid ${color}`,
          color: "hsl(var(--foreground) / 0.75)",
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
    <div className="rounded-xl py-3 px-4 animate-fade-in" style={{ borderLeft: `3px solid ${color}`, background: `${color}08` }}>
      <span className="text-overline flex items-center gap-1.5 mb-1.5" style={{ color }}>
        <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: `${color}15` }}>{icon}</span>
        {label}
      </span>
      <p className="text-body text-muted-foreground whitespace-pre-wrap m-0">{text}</p>
    </div>
  );
}

const SceneCard = memo(({ scene, index, defaultOpen = false, completed = false, onToggleComplete, onRegenerate, regenerating = false, onImageGenerated }: SceneCardProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const [generatingPrompt, setGeneratingPrompt] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const hasNano = scene.prompt_nano && scene.prompt_nano !== "null";
  const nanoIsNA = hasNano && scene.prompt_nano!.startsWith("N/A");

  const handleGenerate = async (promptText: string) => {
    setGeneratingPrompt(promptText);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login primeiro"); return; }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nano-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "generate_image",
          prompt: promptText,
          scene_index: index,
          enhance: true,
        }),
      });

      if (res.status === 429) { toast.error("Rate limit — aguarde e tente novamente"); return; }
      if (res.status === 402) { toast.error("Créditos insuficientes"); return; }

      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao gerar"); return; }

      setGeneratedUrl(data.url);
      onImageGenerated?.(data.url, index);
      toast.success("Imagem gerada com sucesso!");
    } catch (e) {
      console.error("Generate error:", e);
      toast.error("Erro ao gerar imagem");
    } finally {
      setGeneratingPrompt(null);
    }
  };

  return (
    <div
      className={cn(
        "glass rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up",
        completed && "opacity-50"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 border-none cursor-pointer transition-all duration-200 hover:bg-white/[0.03] bg-transparent"
      >
        <div className="flex items-center gap-3.5">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.08))",
              color: "hsl(var(--primary))",
              boxShadow: open ? "0 0 16px hsl(var(--primary) / 0.25)" : "none",
            }}
          >
            {index + 1}
          </span>
          <div className="text-left">
            <div className="flex items-center gap-2.5">
              <p className="text-foreground text-sm font-bold m-0">{scene.title}</p>
              {completed && <span className="badge-success">✓ Pronto</span>}
              {generatedUrl && <span className="badge-success flex items-center gap-1"><ImageIcon size={9} /> Gerada</span>}
            </div>
            <p className="text-caption m-0">{scene.duration}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleComplete && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggleComplete(); } }}
              className="p-2 rounded-lg transition-all hover:bg-white/5"
              style={{ color: completed ? "#22c55e" : "hsl(var(--muted-foreground) / 0.25)" }}
              title={completed ? "Marcar como pendente" : "Marcar como pronta"}
            >
              <CheckCircle2 size={18} fill={completed ? "#22c55e" : "none"} />
            </span>
          )}
          {onRegenerate && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); if (!regenerating) onRegenerate(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); if (!regenerating) onRegenerate(); } }}
              className="p-2 rounded-lg transition-all hover:bg-white/5 text-muted-foreground/30 hover:text-primary"
              title="Regenerar esta cena"
            >
              {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            </span>
          )}
          <ChevronDown
            size={16}
            className={cn("text-muted-foreground/40 transition-transform duration-300", open && "rotate-180")}
          />
        </div>
      </button>

      {/* Body */}
      <div className={cn("overflow-hidden transition-all duration-300", open ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="px-5 pb-5 flex flex-col gap-4">
          {/* Generated image preview */}
          {generatedUrl && (
            <div className="rounded-xl overflow-hidden border border-success/20 animate-scale-in">
              <img src={generatedUrl} alt={`Cena ${index + 1}`} className="w-full aspect-video object-cover" />
            </div>
          )}

          {hasNano && !nanoIsNA && (
            <PromptBlock
              label="NANO BANANA PRO"
              text={scene.prompt_nano!}
              color={promptColors.nano}
              icon={<Palette size={12} />}
              onGenerate={() => handleGenerate(scene.prompt_nano!)}
              generating={generatingPrompt === scene.prompt_nano}
            />
          )}
          {nanoIsNA && (
            <p className="text-muted-foreground/30 text-caption italic px-1">{scene.prompt_nano}</p>
          )}
          {scene.prompt_veo && scene.prompt_veo !== "null" && (
            <PromptBlock
              label="PROMPT VEO 3.1"
              text={scene.prompt_veo}
              color={promptColors.veo}
              icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.veo }} />}
              onGenerate={() => handleGenerate(scene.prompt_veo)}
              generating={generatingPrompt === scene.prompt_veo}
            />
          )}
          {scene.prompt_veo_b && scene.prompt_veo_b !== "null" && (
            <PromptBlock
              label="VEO 3.1 — SHOT B"
              text={scene.prompt_veo_b}
              color={promptColors.veob}
              icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.veob }} />}
              onGenerate={() => handleGenerate(scene.prompt_veo_b!)}
              generating={generatingPrompt === scene.prompt_veo_b}
            />
          )}
          {scene.prompt_kling && scene.prompt_kling !== "null" && (
            <PromptBlock
              label="PROMPT KLING 3.0"
              text={scene.prompt_kling}
              color={promptColors.kling}
              icon={<div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: promptColors.kling }} />}
              onGenerate={() => handleGenerate(scene.prompt_kling)}
              generating={generatingPrompt === scene.prompt_kling}
            />
          )}

          <InfoBlock icon={<Camera size={12} />} label="Câmera" text={scene.camera_direction} color="#a78bfa" />
          <InfoBlock icon={<Brain size={12} />} label="Neuro" text={scene.neuro_note} color="#fb7185" />
          <InfoBlock icon={<Mic size={12} />} label="Fala" text={scene.speech_timing || ""} color="#67e8f9" />
          <InfoBlock icon={<Settings size={12} />} label="Estratégia" text={scene.tech_strategy} color="#fcd34d" />
        </div>
      </div>
    </div>
  );
});

SceneCard.displayName = "SceneCard";

export default SceneCard;
