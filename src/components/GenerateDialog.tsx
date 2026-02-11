import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  VIDEO_MODELS, IMAGE_MODELS, ENGINE_LABELS,
  type GenerationType, type GenerationEngine, type VideoModelInfo,
} from "@/lib/director-types";
import {
  Film, ImageIcon, Zap, Volume2, Loader2, MonitorSmartphone,
  RectangleHorizontal, Square, RectangleVertical, Wallet, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  sceneIndex: number;
  scriptId?: string | null;
  onJobCreated?: () => void;
}

const ASPECT_OPTIONS = [
  { id: "9:16", label: "9:16", icon: RectangleVertical, desc: "Vertical" },
  { id: "16:9", label: "16:9", icon: RectangleHorizontal, desc: "Horizontal" },
  { id: "1:1", label: "1:1", icon: Square, desc: "Quadrado" },
] as const;

const GenerateDialog = React.memo(({ open, onOpenChange, prompt, sceneIndex, scriptId, onJobCreated }: GenerateDialogProps) => {
  const [type, setType] = useState<GenerationType>("video");
  const [videoModel, setVideoModel] = useState<GenerationEngine>("VEO3_1");
  const [imageModel, setImageModel] = useState<string>("nano_pro");
  const [duration, setDuration] = useState(8);
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [resolution, setResolution] = useState("720p");
  const [generating, setGenerating] = useState(false);
  const [totalCredits, setTotalCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const selectedVideoModel = useMemo(() =>
    VIDEO_MODELS.find(m => m.id === videoModel), [videoModel]
  );

  const estimatedCost = useMemo(() => {
    if (type === "image") return 24;
    return selectedVideoModel?.costs[duration] || 0;
  }, [type, selectedVideoModel, duration]);

  // Auto-fix duration when model changes
  useEffect(() => {
    if (selectedVideoModel && !selectedVideoModel.durations.includes(duration)) {
      setDuration(selectedVideoModel.durations[selectedVideoModel.durations.length - 1] || 8);
    }
  }, [selectedVideoModel, duration]);

  // Auto-fix resolution
  useEffect(() => {
    if (selectedVideoModel && !selectedVideoModel.resolutions.includes(resolution)) {
      setResolution(selectedVideoModel.resolutions[0] || "720p");
    }
  }, [selectedVideoModel, resolution]);

  // Fetch credits
  const fetchCredits = useCallback(async () => {
    setLoadingCredits(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leonardo-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action: "list_keys" }),
      });
      const data = await res.json();
      const keys = data.keys || [];
      const total = keys.filter((k: any) => k.is_active).reduce((s: number, k: any) => s + (k.remaining_credits - k.reserved_credits), 0);
      setTotalCredits(total);
    } catch { /* ignore */ }
    finally { setLoadingCredits(false); }
  }, []);

  useEffect(() => { if (open) fetchCredits(); }, [open, fetchCredits]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login primeiro"); return; }

      let action: string;
      let options: Record<string, unknown> = {};

      if (type === "image") {
        if (imageModel === "nano_pro") {
          // Use nano-generate endpoint
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nano-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ action: "generate_image", prompt, scene_index: sceneIndex, enhance: true }),
          });
          const data = await res.json();
          if (!res.ok) { toast.error(data.error || "Erro ao gerar"); return; }
          toast.success("Imagem gerada com sucesso!");
          onJobCreated?.();
          onOpenChange(false);
          return;
        }
        action = "generate_image";
        options = { sd_version: imageModel };
      } else {
        action = "generate_video_from_text";
        options = {
          model: videoModel,
          duration,
          aspect_ratio: aspectRatio,
          resolution: resolution === "1080p" ? "RESOLUTION_1080" : "RESOLUTION_720",
        };
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leonardo-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, prompt, options, scene_index: sceneIndex, script_id: scriptId }),
      });

      if (res.status === 503) { toast.error("Sem chaves com créditos suficientes"); return; }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao gerar"); return; }

      toast.success(`${type === "video" ? "Vídeo" : "Imagem"} enviado para geração! (${estimatedCost} créditos)`);
      onJobCreated?.();
      onOpenChange(false);
    } catch (e) {
      console.error("Generate error:", e);
      toast.error("Erro ao gerar");
    } finally {
      setGenerating(false);
    }
  };

  const categories = ["Veo", "Kling", "Hailuo", "Motion"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass border-white/[0.1]">
        <DialogHeader>
          <DialogTitle className="text-title flex items-center gap-2">
            <Sparkles size={20} className="text-primary" /> Gerar Mídia
          </DialogTitle>
          <DialogDescription className="text-caption">
            Cena {sceneIndex + 1} — Escolha modelo, duração e qualidade
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-2">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "image" as const, label: "Imagem", icon: ImageIcon },
              { id: "video" as const, label: "Vídeo", icon: Film },
            ]).map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all border",
                  type === t.id
                    ? "surface-primary text-primary"
                    : "surface-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {/* Model picker */}
          {type === "video" ? (
            <div>
              <span className="text-label block mb-2">Modelo de Vídeo</span>
              <div className="flex flex-col gap-2">
                {categories.map(cat => {
                  const models = VIDEO_MODELS.filter(m => m.category === cat);
                  if (models.length === 0) return null;
                  return (
                    <div key={cat}>
                      <span className="text-[9px] font-bold tracking-widest uppercase mb-1 block" style={{ color: models[0].color }}>
                        {cat}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {models.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setVideoModel(m.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border",
                              videoModel === m.id
                                ? "font-bold"
                                : "surface-muted text-muted-foreground hover:text-foreground"
                            )}
                            style={videoModel === m.id ? {
                              background: `${m.color}15`,
                              color: m.color,
                              borderColor: `${m.color}40`,
                            } : undefined}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <span className="text-label block mb-2">Modelo de Imagem</span>
              <div className="flex flex-wrap gap-1.5">
                {IMAGE_MODELS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setImageModel(m.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border",
                      imageModel === m.id ? "font-bold" : "surface-muted text-muted-foreground hover:text-foreground"
                    )}
                    style={imageModel === m.id ? {
                      background: `${m.color}15`,
                      color: m.color,
                      borderColor: `${m.color}40`,
                    } : undefined}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration (video only) */}
          {type === "video" && selectedVideoModel && selectedVideoModel.durations.length > 0 && (
            <div>
              <span className="text-label block mb-2">Duração</span>
              <div className="flex gap-2">
                {selectedVideoModel.durations.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                      duration === d ? "surface-primary text-primary" : "surface-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aspect Ratio (video only) */}
          {type === "video" && (
            <div>
              <span className="text-label block mb-2">Aspect Ratio</span>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_OPTIONS.map(ar => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition-all border",
                      aspectRatio === ar.id ? "surface-primary text-primary" : "surface-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ar.icon size={20} />
                    {ar.desc}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resolution (video only) */}
          {type === "video" && selectedVideoModel && selectedVideoModel.resolutions.length > 1 && (
            <div>
              <span className="text-label block mb-2">Resolução</span>
              <div className="flex gap-2">
                {selectedVideoModel.resolutions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                      resolution === r ? "surface-primary text-primary" : "surface-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {type === "video" && selectedVideoModel && Object.values(selectedVideoModel.features).some(Boolean) && (
            <div className="flex flex-wrap gap-1.5">
              {selectedVideoModel.features.audio && (
                <span className="badge-success flex items-center gap-1"><Volume2 size={9} /> Áudio nativo</span>
              )}
              {selectedVideoModel.features.endFrame && (
                <span className="badge-primary flex items-center gap-1"><ImageIcon size={9} /> End Frame</span>
              )}
              {selectedVideoModel.features.imageRef && (
                <span className="badge-primary flex items-center gap-1"><ImageIcon size={9} /> Image Ref</span>
              )}
              {selectedVideoModel.features.videoRef && (
                <span className="badge-primary flex items-center gap-1"><Film size={9} /> Video Ref</span>
              )}
            </div>
          )}

          {/* Cost + Credits bar */}
          <div className="rounded-xl p-4 flex items-center justify-between surface-muted">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-warning" />
              <div>
                <p className="text-sm font-bold text-foreground">{estimatedCost.toLocaleString()} créditos</p>
                <p className="text-caption">Custo estimado</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <Wallet size={14} className="text-muted-foreground" />
                {loadingCredits ? (
                  <Loader2 size={14} className="animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-sm font-bold text-foreground">{totalCredits !== null ? totalCredits.toLocaleString() : "—"}</p>
                )}
              </div>
              <p className="text-caption">Disponível</p>
            </div>
          </div>

          {/* Prompt preview */}
          <div className="rounded-xl p-3 surface-muted max-h-24 overflow-y-auto no-scrollbar">
            <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-1">PROMPT</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{prompt.slice(0, 300)}{prompt.length > 300 ? "..." : ""}</p>
          </div>

          {/* Generate button */}
          <button
            type="button"
            disabled={generating || (totalCredits !== null && estimatedCost > totalCredits)}
            onClick={handleGenerate}
            className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 size={16} className="animate-spin" /> Gerando...</>
            ) : (
              <><Zap size={16} /> Gerar {type === "video" ? "Vídeo" : "Imagem"} ({estimatedCost} cr)</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

GenerateDialog.displayName = "GenerateDialog";
export default GenerateDialog;
