import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VIDEO_MODELS, ENGINE_LABELS, ENGINE_COLORS, type GenerationEngine } from "@/lib/director-types";
import VideoTimeline, { type TimelineJob } from "@/components/VideoTimeline";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Film, Play, Loader2, Zap, ArrowRight, Layers, Link2, Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtendPanelProps {
  jobs: TimelineJob[];
  onJobCreated?: () => void;
}

const EXTEND_MODES = [
  { id: "last_frame", label: "Last Frame", desc: "Continuidade do último frame", icon: Link2 },
  { id: "start_end_frame", label: "Start + End", desc: "Transição entre frames", icon: Layers },
  { id: "direct", label: "Direto", desc: "Nova geração sem referência", icon: Unlink },
] as const;

const ExtendPanel = React.memo(({ jobs, onJobCreated }: ExtendPanelProps) => {
  const [sourceJobId, setSourceJobId] = useState<string | null>(null);
  const [extendMode, setExtendMode] = useState<string>("last_frame");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<GenerationEngine>("VEO3_1");
  const [duration, setDuration] = useState(8);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const completedVideos = useMemo(() =>
    jobs.filter(j => j.status === "completed" && j.result_url?.includes(".mp4")),
    [jobs]
  );

  const selectedModel = useMemo(() => VIDEO_MODELS.find(m => m.id === model), [model]);
  const estimatedCost = useMemo(() => selectedModel?.costs[duration] || 0, [selectedModel, duration]);

  // Auto-fix duration
  useEffect(() => {
    if (selectedModel && !selectedModel.durations.includes(duration)) {
      setDuration(selectedModel.durations[selectedModel.durations.length - 1] || 8);
    }
  }, [selectedModel, duration]);

  const sourceJob = useMemo(() => jobs.find(j => j.id === sourceJobId), [jobs, sourceJobId]);

  const handleExtend = async () => {
    if (!sourceJobId || !prompt.trim()) {
      toast.error("Selecione um vídeo fonte e escreva o prompt");
      return;
    }
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login"); return; }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leonardo-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          action: "extend_video",
          source_job_id: sourceJobId,
          extend_mode: extendMode,
          prompt: prompt.trim(),
          options: {
            model,
            duration,
            aspect_ratio: "9:16",
            resolution: "RESOLUTION_720",
          },
          scene_index: sourceJob?.prompt ? 0 : 0,
        }),
      });

      if (res.status === 503) { toast.error("Sem chaves disponíveis"); return; }
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro"); return; }

      toast.success(`Extend enviado! (${estimatedCost} créditos)`);
      setPrompt("");
      onJobCreated?.();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao estender vídeo");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Timeline */}
      <VideoTimeline
        jobs={jobs}
        selectedJobId={sourceJobId}
        onSelectJob={setSourceJobId}
        onPreview={setPreviewUrl}
      />

      {/* Video preview */}
      {previewUrl && (
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
          <video src={previewUrl} controls className="w-full max-h-64 object-contain bg-black" />
        </div>
      )}

      {/* Source selector */}
      <div>
        <span className="text-label block mb-2">Vídeo Fonte</span>
        {completedVideos.length === 0 ? (
          <p className="text-caption">Nenhum vídeo completado disponível para extend</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {completedVideos.map(j => {
              const eColor = ENGINE_COLORS[j.engine || ""] || "#7c3aed";
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => {
                    setSourceJobId(j.id);
                    if (j.result_url) setPreviewUrl(j.result_url);
                  }}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[11px] font-semibold border transition-all flex items-center gap-1.5",
                    sourceJobId === j.id ? "ring-1 ring-primary" : "surface-muted text-muted-foreground"
                  )}
                  style={sourceJobId === j.id ? { background: `${eColor}12`, color: eColor, borderColor: `${eColor}30` } : undefined}
                >
                  <Film size={11} />
                  {ENGINE_LABELS[j.engine || ""] || "Video"} — {j.prompt.slice(0, 30)}...
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Extend mode */}
      <div>
        <span className="text-label block mb-2">Modo de Extend</span>
        <div className="grid grid-cols-3 gap-2">
          {EXTEND_MODES.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setExtendMode(m.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-3 text-xs font-medium transition-all border",
                extendMode === m.id ? "surface-primary text-primary" : "surface-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <m.icon size={18} />
              {m.label}
              <span className="text-[9px] opacity-60">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Model + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-label block mb-2">Modelo</span>
          <div className="flex flex-wrap gap-1.5">
            {VIDEO_MODELS.filter(m => m.category === "Veo" || m.category === "Kling").slice(0, 6).map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModel(m.id)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border",
                  model === m.id ? "font-bold" : "surface-muted text-muted-foreground"
                )}
                style={model === m.id ? { background: `${m.color}15`, color: m.color, borderColor: `${m.color}40` } : undefined}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-label block mb-2">Duração</span>
          <div className="flex gap-2">
            {selectedModel?.durations.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border",
                  duration === d ? "surface-primary text-primary" : "surface-muted text-muted-foreground"
                )}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div>
        <span className="text-label block mb-2">Prompt do Próximo Clip</span>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Descreva a ação, câmera e áudio do próximo clip. NÃO redescreva o personagem — extend carrega identidade do clip anterior."
          rows={4}
          className="input-glass w-full resize-none"
        />
      </div>

      {/* Cost + Generate */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Zap size={14} className="text-warning" />
          {estimatedCost.toLocaleString()} créditos
        </span>
        <button
          type="button"
          disabled={generating || !sourceJobId || !prompt.trim()}
          onClick={handleExtend}
          className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          Estender Vídeo
        </button>
      </div>
    </div>
  );
});

ExtendPanel.displayName = "ExtendPanel";
export default ExtendPanel;
