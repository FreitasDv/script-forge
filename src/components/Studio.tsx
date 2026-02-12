import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ENGINE_LABELS, ENGINE_COLORS } from "@/lib/director-types";
import GenerateDialog from "@/components/GenerateDialog";
import ExtendPanel from "@/components/ExtendPanel";
import type { TimelineJob } from "@/components/VideoTimeline";
import {
  Image as ImageIcon, Film, Loader2, Download, Trash2, RefreshCw, Eye, X,
  Sparkles, Zap, Clock, CheckCircle2, AlertTriangle, Plus, Wallet,
  Filter, Play, Pause,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Job = TimelineJob & {
  job_type: string;
  scene_index: number;
  leonardo_generation_id: string | null;
};

type Tab = "gallery" | "queue" | "extend";
type FilterType = "all" | "image" | "video";
type SceneFilter = "all" | number;

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
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sceneFilter, setSceneFilter] = useState<SceneFilter>("all");
  const [totalCredits, setTotalCredits] = useState<number | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("id, job_type, status, prompt, result_url, result_metadata, engine, scene_index, credit_cost, error_message, created_at, leonardo_generation_id, parent_job_id, extend_mode")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) console.error("Error fetching jobs:", error);
    else setJobs((data as Job[]) || []);
    setLoading(false);
  }, []);

  const fetchCredits = useCallback(async () => {
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
      setTotalCredits(keys.filter((k: any) => k.is_active).reduce((s: number, k: any) => s + Math.max(0, k.remaining_credits - k.reserved_credits), 0));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchJobs(); fetchCredits(); }, [fetchJobs, fetchCredits]);

  // Poll processing jobs
  useEffect(() => {
    const processingJobs = jobs.filter(j => j.status === "processing" && j.leonardo_generation_id);
    if (processingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of processingJobs) {
        if (pollingIds.has(job.id)) continue;
        setPollingIds(prev => new Set(prev).add(job.id));
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
            body: JSON.stringify({ action: "check_status", generation_id: job.leonardo_generation_id, job_id: job.id }),
          });
          const data = await res.json();
          if (data.status === "completed" || data.status === "failed") {
            fetchJobs();
            fetchCredits();
          }
        } catch (e) { console.error("Poll error:", e); }
        finally {
          setPollingIds(prev => { const n = new Set(prev); n.delete(job.id); return n; });
        }
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [jobs, pollingIds, fetchJobs, fetchCredits]);

  const completedJobs = useMemo(() => jobs.filter(j => j.status === "completed" && j.result_url), [jobs]);
  const processingJobs = useMemo(() => jobs.filter(j => j.status === "processing" || j.status === "pending"), [jobs]);
  const failedJobs = useMemo(() => jobs.filter(j => j.status === "failed"), [jobs]);
  const videoJobs = useMemo(() => jobs.filter(j => (j.job_type === "video" || j.job_type === "video_extend") && j.result_url), [jobs]);

  const filteredCompleted = useMemo(() => {
    let filtered = completedJobs;
    if (filterType === "video") filtered = filtered.filter(j => j.result_url?.includes(".mp4"));
    else if (filterType === "image") filtered = filtered.filter(j => !j.result_url?.includes(".mp4"));
    if (sceneFilter !== "all") filtered = filtered.filter(j => j.scene_index === sceneFilter);
    return filtered;
  }, [completedJobs, filterType, sceneFilter]);

  const availableScenes = useMemo(() => {
    const scenes = new Set(completedJobs.map(j => j.scene_index));
    return Array.from(scenes).sort((a, b) => a - b);
  }, [completedJobs]);

  const completedJobsForRefs = useMemo(() =>
    jobs.filter(j => j.status === "completed" && j.result_url).map(j => ({
      id: j.id, result_url: j.result_url, result_metadata: (j as any).result_metadata,
      engine: j.engine, scene_index: j.scene_index, job_type: j.job_type,
    })),
    [jobs]
  );

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("generation_jobs").delete().eq("id", id);
    toast.success("Job removido");
    fetchJobs();
  }, [fetchJobs]);

  const handleDownloadSelected = useCallback(async () => {
    const toDownload = selectedJobs.size > 0
      ? completedJobs.filter(j => selectedJobs.has(j.id))
      : completedJobs;
    if (toDownload.length === 0) { toast.info("Nada para baixar"); return; }
    toast.info(`Baixando ${toDownload.length} arquivos...`);
    for (const job of toDownload) {
      try {
        const resp = await fetch(job.result_url!);
        const blob = await resp.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const ext = job.result_url!.includes(".mp4") ? "mp4" : "png";
        a.download = `scene_${job.scene_index}_${job.id.slice(0, 8)}.${ext}`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch { /* ignore */ }
    }
    toast.success(`${toDownload.length} arquivos baixados!`);
  }, [completedJobs, selectedJobs]);

  const toggleSelect = (id: string) => {
    setSelectedJobs(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "gallery", label: "Galeria", icon: <ImageIcon size={14} />, count: completedJobs.length },
    { id: "queue", label: "Fila", icon: <Clock size={14} />, count: processingJobs.length },
    { id: "extend", label: "Continuar", icon: <Film size={14} />, count: videoJobs.length },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all border",
                  activeTab === t.id ? "surface-primary text-primary" : "surface-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon} {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded-md"
                    style={{ background: activeTab === t.id ? "hsl(var(--primary) / 0.15)" : "hsl(0 0% 100% / 0.06)" }}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {totalCredits !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl surface-muted">
                <Wallet size={13} className="text-warning" />
                <span className="text-xs font-bold text-foreground"><AnimatedNumber value={totalCredits} /></span>
                <span className="text-caption">cr</span>
              </div>
            )}
            <button type="button" onClick={() => { fetchJobs(); fetchCredits(); }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold surface-muted text-muted-foreground hover:text-foreground transition-all">
              <RefreshCw size={12} /> Atualizar
            </button>
            <button type="button" onClick={() => setShowGenerateDialog(true)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold surface-primary text-primary hover:bg-primary/15 transition-all">
              <Plus size={12} /> Criar Nova Mídia
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {[
            { label: "Geradas", value: completedJobs.length, color: "#22c55e", icon: <CheckCircle2 size={18} /> },
            { label: "Processando", value: processingJobs.length, color: "#eab308", icon: <Loader2 size={18} /> },
            { label: "Erros", value: failedJobs.length, color: "#ef4444", icon: <AlertTriangle size={18} /> },
            { label: "Créditos Usados", value: jobs.reduce((s, j) => s + (j.credit_cost || 0), 0), color: "#a78bfa", icon: <Zap size={18} /> },
          ].map(s => (
            <GlassCard key={s.label} glow={s.color} className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                <div>
                  <p className="text-xl font-extrabold text-foreground"><AnimatedNumber value={s.value} /></p>
                  <p className="text-caption">{s.label}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* ═══ GALLERY TAB ═══ */}
        {activeTab === "gallery" && (
          <>
            {/* Filters */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1.5">
              {([
                  { id: "all" as const, label: "Todos" },
                  { id: "image" as const, label: "Imagens" },
                  { id: "video" as const, label: "Vídeos" },
                ]).map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterType(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border",
                      filterType === f.id ? "surface-primary text-primary" : "surface-muted text-muted-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                {availableScenes.length > 1 && (
                  <>
                    <span className="text-muted-foreground/30 mx-1">|</span>
                    <button
                      type="button"
                      onClick={() => setSceneFilter("all")}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                        sceneFilter === "all" ? "surface-primary text-primary" : "surface-muted text-muted-foreground"
                      )}
                    >
                      Todas Cenas
                    </button>
                    {availableScenes.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSceneFilter(s)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border",
                          sceneFilter === s ? "surface-primary text-primary" : "surface-muted text-muted-foreground"
                        )}
                      >
                        C{s + 1}
                      </button>
                    ))}
                  </>
                )}
              </div>
              {completedJobs.length > 0 && (
                <button type="button" onClick={handleDownloadSelected}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold surface-success text-success hover:bg-success/15 transition-all">
                  <Download size={12} /> Baixar {selectedJobs.size > 0 ? `(${selectedJobs.size})` : `Todos (${completedJobs.length})`}
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" /></div>
            ) : filteredCompleted.length === 0 ? (
              <div className="text-center py-16 opacity-40">
                <Sparkles size={48} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhuma geração ainda</p>
              </div>
            ) : (
              <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                {filteredCompleted.map(job => {
                  const isVideo = job.result_url?.includes(".mp4");
                  const eColor = ENGINE_COLORS[job.engine || ""] || "#7c3aed";
                  const isSelected = selectedJobs.has(job.id);
                  return (
                    <GlassCard key={job.id} className={cn("overflow-hidden group hover:border-white/[0.12] transition-all", isSelected && "ring-2 ring-primary")}>
                      <div className="relative aspect-video cursor-pointer" onClick={() => setSelectedMedia(job.result_url)}>
                        {isVideo ? (
                          <video
                            src={job.result_url!}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                            onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                          />
                        ) : (
                          <img src={job.result_url!} alt={`Imagem da cena ${job.scene_index + 1}, modelo ${ENGINE_LABELS[job.engine || ""] || job.engine}`} className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          {isVideo ? (
                            <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                          ) : (
                            <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${eColor}cc`, color: "#fff" }}>
                            {ENGINE_LABELS[job.engine || ""] || job.engine}
                          </span>
                        </div>
                        {isVideo && (
                          <div className="absolute top-2 right-2">
                            <Film size={14} className="text-white drop-shadow-lg" />
                          </div>
                        )}
                        {/* Select checkbox */}
                        <div className="absolute bottom-2 left-2" onClick={e => { e.stopPropagation(); toggleSelect(job.id); }}>
                          <div className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                            isSelected ? "bg-primary border-primary" : "border-white/40 bg-black/30 opacity-0 group-hover:opacity-100"
                          )}>
                            {isSelected && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-foreground truncate">Cena {job.scene_index + 1} — {ENGINE_LABELS[job.engine || ""] || job.engine}</p>
                          {job.credit_cost && (
                            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                              <Zap size={8} /> {job.credit_cost}
                            </span>
                          )}
                        </div>
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
            )}

            {/* Failed */}
            {failedJobs.length > 0 && (
              <div>
                <h3 className="text-label mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-accent" /> FALHAS ({failedJobs.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {failedJobs.slice(0, 5).map(job => (
                    <GlassCard key={job.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">Cena {job.scene_index + 1} — {(job as any).error_message || "Erro"}</p>
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
          </>
        )}

        {/* ═══ QUEUE TAB ═══ */}
        {activeTab === "queue" && (
          <div className="flex flex-col gap-3">
            {processingJobs.length === 0 ? (
              <div className="text-center py-16 opacity-40">
                <Clock size={48} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum job em processamento</p>
              </div>
            ) : (
              processingJobs.map(job => {
                const eColor = ENGINE_COLORS[job.engine || ""] || "#7c3aed";
                const sc = statusConfig[job.status] || statusConfig.pending;
                return (
                  <GlassCard key={job.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${sc.color}12` }}>
                        {sc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-bold text-foreground">Cena {job.scene_index + 1}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background: `${eColor}20`, color: eColor }}>
                            {ENGINE_LABELS[job.engine || ""] || job.engine}
                          </span>
                          {job.credit_cost && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                              <Zap size={8} /> {job.credit_cost} cr
                            </span>
                          )}
                          {job.extend_mode && (
                            <span className="badge-primary text-[9px]">{job.extend_mode}</span>
                          )}
                        </div>
                        <p className="text-caption truncate">{job.prompt.slice(0, 100)}</p>
                        <div className="mt-2 h-1 rounded-full overflow-hidden bg-white/[0.04]">
                          <div className="h-full rounded-full animate-shimmer" style={{
                            width: "60%",
                            background: `linear-gradient(90deg, ${sc.color}40, ${sc.color}, ${sc.color}40)`,
                            backgroundSize: "200% 100%",
                          }} />
                        </div>
                      </div>
                      <time className="text-[9px] text-muted-foreground/40 flex-shrink-0">
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                      </time>
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        )}

        {/* ═══ EXTEND TAB ═══ */}
        {activeTab === "extend" && (
          <ExtendPanel
            jobs={jobs}
            onJobCreated={() => { fetchJobs(); fetchCredits(); }}
          />
        )}

        {/* Lightbox */}
        {selectedMedia && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Visualização de mídia"
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
            onKeyDown={e => { if (e.key === "Escape") setSelectedMedia(null); }}
            tabIndex={-1}
            ref={el => el?.focus()}
          >
            <button type="button" aria-label="Fechar visualização" className="absolute top-4 right-4 text-white/60 hover:text-white p-2 min-w-[44px] min-h-[44px]" onClick={() => setSelectedMedia(null)}>
              <X size={24} />
            </button>
            {selectedMedia.includes(".mp4") ? (
              <video src={selectedMedia} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl" onClick={e => e.stopPropagation()} aria-label="Reprodução de vídeo" />
            ) : (
              <img src={selectedMedia} alt="Pré-visualização da mídia gerada" className="max-w-full max-h-[90vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
            )}
          </div>
        )}

        {/* Standalone GenerateDialog */}
        <GenerateDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          prompt=""
          sceneIndex={0}
          onJobCreated={() => { fetchJobs(); fetchCredits(); }}
          existingJobs={completedJobsForRefs}
        />
      </div>
    </TooltipProvider>
  );
});

Studio.displayName = "Studio";
export default Studio;
