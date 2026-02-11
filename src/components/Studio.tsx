import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Image as ImageIcon, Film, Loader2, Download, Trash2, RefreshCw, Eye, X,
  Sparkles, Zap, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

type Job = {
  id: string;
  job_type: string;
  status: string;
  prompt: string;
  result_url: string | null;
  engine: string | null;
  scene_index: number;
  credit_cost: number | null;
  error_message: string | null;
  created_at: string;
  leonardo_generation_id: string | null;
};

const engineLabels: Record<string, string> = {
  nano: "Nano Banana",
  nano_pro: "Nano Pro",
  PHOENIX: "Leonardo Phoenix",
  FLUX: "Leonardo Flux",
  VEO3_1: "Veo 3.1",
  VEO3_1FAST: "Veo 3.1 Fast",
  KLING2_5: "Kling 2.5",
  KLING2_6: "Kling 2.6",
  KLING_VIDEO_3_0: "Kling 3.0",
};

const engineColors: Record<string, string> = {
  nano: "#eab308",
  nano_pro: "#f59e0b",
  PHOENIX: "#a78bfa",
  FLUX: "#8b5cf6",
  VEO3_1: "#a78bfa",
  VEO3_1FAST: "#a78bfa",
  KLING2_5: "#22c55e",
  KLING2_6: "#22c55e",
  KLING_VIDEO_3_0: "#22c55e",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: "Pronto", color: "#22c55e", icon: <CheckCircle2 size={12} /> },
  processing: { label: "Gerando...", color: "#eab308", icon: <Loader2 size={12} className="animate-spin" /> },
  pending: { label: "Na fila", color: "#3b82f6", icon: <Clock size={12} /> },
  failed: { label: "Erro", color: "#ef4444", icon: <AlertTriangle size={12} /> },
};

const Studio = React.memo(() => {
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("id, job_type, status, prompt, result_url, engine, scene_index, credit_cost, error_message, created_at, leonardo_generation_id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      setJobs((data as Job[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Poll processing jobs
  useEffect(() => {
    const processingJobs = jobs.filter((j) => j.status === "processing" && j.leonardo_generation_id);
    if (processingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of processingJobs) {
        if (pollingIds.has(job.id)) continue;
        setPollingIds((prev) => new Set(prev).add(job.id));

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) continue;

          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leonardo-generate`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              action: "check_status",
              generation_id: job.leonardo_generation_id,
              job_id: job.id,
            }),
          });

          const data = await res.json();
          if (data.status === "completed" || data.status === "failed") {
            fetchJobs();
          }
        } catch (e) {
          console.error("Poll error:", e);
        } finally {
          setPollingIds((prev) => {
            const next = new Set(prev);
            next.delete(job.id);
            return next;
          });
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [jobs, pollingIds, fetchJobs]);

  const completedJobs = useMemo(() => jobs.filter((j) => j.status === "completed" && j.result_url), [jobs]);
  const processingJobs = useMemo(() => jobs.filter((j) => j.status === "processing" || j.status === "pending"), [jobs]);
  const failedJobs = useMemo(() => jobs.filter((j) => j.status === "failed"), [jobs]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("generation_jobs").delete().eq("id", id);
    toast.success("Job removido");
    fetchJobs();
  }, [fetchJobs]);

  const handleDownloadAll = useCallback(async () => {
    const urls = completedJobs.map((j) => j.result_url!);
    if (urls.length === 0) { toast.info("Nenhuma imagem para baixar"); return; }

    toast.info(`Baixando ${urls.length} arquivos...`);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const ext = url.includes(".mp4") ? "mp4" : "png";
        a.download = `scene_${completedJobs[i].scene_index}_${i + 1}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) {
        console.error("Download error:", e);
      }
    }
    toast.success(`${urls.length} arquivos baixados!`);
  }, [completedJobs]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6">
        {/* Summary */}
        <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {[
            { label: "Total Geradas", value: completedJobs.length, color: "#22c55e", icon: <ImageIcon size={20} /> },
            { label: "Em Processamento", value: processingJobs.length, color: "#eab308", icon: <Loader2 size={20} /> },
            { label: "Erros", value: failedJobs.length, color: "#ef4444", icon: <AlertTriangle size={20} /> },
            { label: "Créditos Usados", value: jobs.reduce((s, j) => s + (j.credit_cost || 0), 0), color: "#a78bfa", icon: <Zap size={20} /> },
          ].map((s) => (
            <GlassCard key={s.label} glow={s.color} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}15`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground"><AnimatedNumber value={s.value} /></p>
                  <p className="text-caption">{s.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={fetchJobs} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all surface-primary text-primary hover:bg-primary/15">
            <RefreshCw size={14} /> Atualizar
          </button>
          {completedJobs.length > 0 && (
            <button type="button" onClick={handleDownloadAll} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all surface-success text-success hover:bg-success/15">
              <Download size={14} /> Baixar Todos ({completedJobs.length})
            </button>
          )}
        </div>

        {/* Processing Queue */}
        {processingJobs.length > 0 && (
          <div>
            <h3 className="text-label mb-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-warning" /> EM PROCESSAMENTO
            </h3>
            <div className="flex flex-col gap-2">
              {processingJobs.map((job) => (
                <GlassCard key={job.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
                      style={{ background: "hsl(38 92% 50% / 0.1)" }}>
                      <Loader2 size={14} className="animate-spin text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">Cena {job.scene_index + 1}</p>
                      <p className="text-caption truncate">{job.prompt.slice(0, 80)}...</p>
                    </div>
                    <span className="badge-warning">{engineLabels[job.engine || ""] || job.engine}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : completedJobs.length === 0 && processingJobs.length === 0 ? (
          <div className="text-center py-16 opacity-40">
            <Sparkles size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma geração ainda</p>
            <p className="text-caption mt-1">Use o botão ⚡ nas cenas do Diretor para gerar imagens</p>
          </div>
        ) : (
          <div>
            <h3 className="text-label mb-3 flex items-center gap-2">
              <ImageIcon size={14} className="text-success" /> GALERIA ({completedJobs.length})
            </h3>
            <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
              {completedJobs.map((job) => {
                const isVideo = job.result_url?.includes(".mp4");
                const eColor = engineColors[job.engine || ""] || "#7c3aed";
                return (
                  <GlassCard key={job.id} className="overflow-hidden group hover:border-white/[0.12] transition-all">
                    <div className="relative aspect-video cursor-pointer" onClick={() => setSelectedImage(job.result_url)}>
                      {isVideo ? (
                        <video src={job.result_url!} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={job.result_url!} alt={`Scene ${job.scene_index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                        <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${eColor}cc`, color: "#fff" }}>
                          {engineLabels[job.engine || ""] || job.engine}
                        </span>
                      </div>
                      {isVideo && (
                        <div className="absolute top-2 right-2">
                          <Film size={14} className="text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-bold text-foreground truncate mb-1">Cena {job.scene_index + 1}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{job.prompt.slice(0, 60)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <time className="text-[9px] text-muted-foreground/40">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                        </time>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a href={job.result_url!} download className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/40 hover:text-foreground">
                                <Download size={12} />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>Baixar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/40 hover:text-accent">
                                <Trash2 size={12} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}

        {/* Failed Jobs */}
        {failedJobs.length > 0 && (
          <div>
            <h3 className="text-label mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent" /> FALHAS ({failedJobs.length})
            </h3>
            <div className="flex flex-col gap-2">
              {failedJobs.slice(0, 5).map((job) => (
                <GlassCard key={job.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">Cena {job.scene_index + 1} — {job.error_message || "Erro desconhecido"}</p>
                      <p className="text-caption truncate">{job.prompt.slice(0, 60)}</p>
                    </div>
                    <button type="button" onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground/40 hover:text-accent flex-shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
            <button type="button" className="absolute top-4 right-4 text-white/60 hover:text-white p-2" onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            {selectedImage.includes(".mp4") ? (
              <video src={selectedImage} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={selectedImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
});

Studio.displayName = "Studio";

export default Studio;