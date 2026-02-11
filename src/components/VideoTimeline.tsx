import React, { useMemo } from "react";
import { ENGINE_LABELS, ENGINE_COLORS } from "@/lib/director-types";
import { ArrowRight, Play, Clock, CheckCircle2, AlertTriangle, Loader2, Film } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineJob {
  id: string;
  status: string;
  engine: string | null;
  result_url: string | null;
  prompt: string;
  parent_job_id: string | null;
  extend_mode: string | null;
  credit_cost: number | null;
  created_at: string;
}

interface VideoTimelineProps {
  jobs: TimelineJob[];
  selectedJobId?: string | null;
  onSelectJob?: (jobId: string) => void;
  onPreview?: (url: string) => void;
}

function buildChain(jobs: TimelineJob[], rootId: string): TimelineJob[] {
  const chain: TimelineJob[] = [];
  const root = jobs.find(j => j.id === rootId);
  if (!root) return chain;
  chain.push(root);
  let currentId = rootId;
  // Find children (jobs whose parent_job_id is currentId)
  const findNext = () => jobs.find(j => j.parent_job_id === currentId);
  let next = findNext();
  while (next) {
    chain.push(next);
    currentId = next.id;
    next = findNext();
  }
  return chain;
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={10} className="text-success" />,
  processing: <Loader2 size={10} className="animate-spin text-warning" />,
  pending: <Clock size={10} className="text-primary" />,
  failed: <AlertTriangle size={10} className="text-accent" />,
};

const VideoTimeline = React.memo(({ jobs, selectedJobId, onSelectJob, onPreview }: VideoTimelineProps) => {
  // Find root jobs (video jobs without parent)
  const chains = useMemo(() => {
    const roots = jobs.filter(j =>
      !j.parent_job_id &&
      (j.status === "completed" || j.status === "processing" || j.status === "pending")
    );
    return roots.map(r => buildChain(jobs, r.id)).filter(c => c.length > 0);
  }, [jobs]);

  if (chains.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {chains.map((chain, ci) => (
        <div key={chain[0].id} className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2">
          {chain.map((job, i) => {
            const eColor = ENGINE_COLORS[job.engine || ""] || "#7c3aed";
            const isSelected = job.id === selectedJobId;
            return (
              <React.Fragment key={job.id}>
                {i > 0 && (
                  <ArrowRight size={14} className="text-muted-foreground/30 flex-shrink-0 mx-0.5" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (job.status === "completed" && job.result_url && onPreview) onPreview(job.result_url);
                    onSelectJob?.(job.id);
                  }}
                  className={cn(
                    "flex-shrink-0 rounded-xl border p-2 transition-all w-28",
                    isSelected ? "ring-2 ring-primary" : "hover:border-white/[0.15]",
                    "surface-muted"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video rounded-lg overflow-hidden mb-1.5 relative"
                    style={{ background: `${eColor}10` }}>
                    {job.status === "completed" && job.result_url ? (
                      job.result_url.includes(".mp4") ? (
                        <video src={job.result_url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={job.result_url} alt="" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={16} style={{ color: eColor }} />
                      </div>
                    )}
                    <div className="absolute top-1 right-1">{statusIcons[job.status] || null}</div>
                  </div>
                  <p className="text-[8px] font-bold truncate" style={{ color: eColor }}>
                    {ENGINE_LABELS[job.engine || ""] || job.engine}
                  </p>
                  {job.extend_mode && (
                    <p className="text-[7px] text-muted-foreground truncate">{job.extend_mode}</p>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </div>
  );
});

VideoTimeline.displayName = "VideoTimeline";
export default VideoTimeline;
