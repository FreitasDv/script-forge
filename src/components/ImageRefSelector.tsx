import React, { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageIcon, Upload, X, Loader2, Film } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaRef {
  url: string;
  imageId?: string; // Leonardo-generated image ID from result_metadata
  type: "GENERATED" | "UPLOADED";
  isVideo?: boolean;
}

interface ImageRefSelectorProps {
  label: string;
  /** Existing generation jobs to pick from */
  existingJobs: Array<{
    id: string;
    result_url: string | null;
    result_metadata: any;
    engine: string | null;
    scene_index: number;
    job_type: string;
  }>;
  /** Max number of selectable items */
  maxItems?: number;
  selected: MediaRef[];
  onSelectionChange: (refs: MediaRef[]) => void;
  /** Allow video selection (for video refs) */
  allowVideo?: boolean;
  /** Allow image upload */
  allowUpload?: boolean;
}

const ImageRefSelector: React.FC<ImageRefSelectorProps> = ({
  label, existingJobs, maxItems = 5, selected, onSelectionChange, allowVideo = false, allowUpload = true,
}) => {
  const [uploading, setUploading] = useState(false);

  const availableMedia = useMemo(() => {
    return existingJobs.filter(j => {
      if (!j.result_url) return false;
      const isVideo = j.result_url.includes(".mp4");
      if (isVideo && !allowVideo) return false;
      if (!isVideo && allowVideo) return false; // if allowVideo, only show videos
      return true;
    });
  }, [existingJobs, allowVideo]);

  const handleSelectExisting = useCallback((job: typeof availableMedia[0]) => {
    const isAlreadySelected = selected.some(s => s.url === job.result_url);
    if (isAlreadySelected) {
      onSelectionChange(selected.filter(s => s.url !== job.result_url));
      return;
    }
    if (selected.length >= maxItems) {
      toast.error(`Máximo de ${maxItems} ${allowVideo ? "vídeos" : "imagens"}`);
      return;
    }

    // Extract Leonardo imageId from metadata
    const raw = job.result_metadata?.raw;
    const imageId = raw?.generated_images?.[0]?.id;

    onSelectionChange([...selected, {
      url: job.result_url!,
      imageId,
      type: "GENERATED",
      isVideo: job.result_url?.includes(".mp4"),
    }]);
  }, [selected, maxItems, onSelectionChange, allowVideo]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são aceitas");
      return;
    }

    if (selected.length >= maxItems) {
      toast.error(`Máximo de ${maxItems} imagens`);
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Faça login"); return; }

      const ext = file.name.split(".").pop() || "png";
      const path = `${session.user.id}/uploads/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("generations").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("generations").getPublicUrl(path);

      onSelectionChange([...selected, {
        url: urlData.publicUrl,
        type: "UPLOADED",
      }]);
      toast.success("Imagem enviada!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [selected, maxItems, onSelectionChange]);

  const handleRemove = (url: string) => {
    onSelectionChange(selected.filter(s => s.url !== url));
  };

  return (
    <div>
      <span className="text-label block mb-2">{label} ({selected.length}/{maxItems})</span>

      {/* Selected preview */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.map((ref, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/[0.1] group">
              {ref.isVideo ? (
                <video src={ref.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={ref.url} alt="" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleRemove(ref.url)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={8} className="text-white" />
              </button>
              {ref.type === "UPLOADED" && (
                <span className="absolute bottom-0.5 left-0.5 text-[7px] bg-black/60 text-white px-1 rounded">Upload</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grid of available media */}
      {availableMedia.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5 mb-2 max-h-32 overflow-y-auto no-scrollbar">
          {availableMedia.slice(0, 20).map(job => {
            const isSelected = selected.some(s => s.url === job.result_url);
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => handleSelectExisting(job)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  isSelected ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-white/20"
                )}
              >
                {job.result_url?.includes(".mp4") ? (
                  <video src={job.result_url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={job.result_url!} alt="" className="w-full h-full object-cover" loading="lazy" />
                )}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">✓</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {allowUpload && !allowVideo && selected.length < maxItems && (
        <label className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold cursor-pointer transition-all border surface-muted text-muted-foreground hover:text-foreground",
          uploading && "opacity-50 pointer-events-none"
        )}>
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Upload de imagem
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}

      {availableMedia.length === 0 && !allowUpload && (
        <p className="text-caption">Nenhuma {allowVideo ? "vídeo" : "imagem"} disponível na galeria</p>
      )}
    </div>
  );
};

export default ImageRefSelector;
