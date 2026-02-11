import { useState } from "react";
import type { DirectorResult } from "@/lib/director-types";
import { toast } from "sonner";
import { Copy, Download, Check, FileJson, FileText } from "lucide-react";

interface DirectorToolbarProps {
  result: DirectorResult;
  completedScenes: boolean[];
}

function copyAllPrompts(result: DirectorResult, type: "veo" | "kling" | "nano") {
  const key = type === "veo" ? "prompt_veo" : type === "kling" ? "prompt_kling" : "prompt_nano";
  const label = type === "veo" ? "VEO 3.1" : type === "kling" ? "KLING 3.0" : "NANO BANANA";
  const prompts = result.scenes
    .map((s, i) => {
      const val = s[key];
      if (!val || val === "null" || val.startsWith("N/A")) return null;
      return `── CENA ${i + 1}: ${s.title} (${s.duration}) ──\n${val}`;
    })
    .filter(Boolean);

  if (prompts.length === 0) {
    toast.info(`Nenhum prompt ${label} disponível`);
    return;
  }
  navigator.clipboard.writeText(prompts.join("\n\n"));
  toast.success(`${prompts.length} prompts ${label} copiados!`);
}

function exportJSON(result: DirectorResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `director-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("JSON exportado!");
}

function exportTXT(result: DirectorResult) {
  let txt = `═══ RESULTADO DO DIRETOR ═══\n\n`;
  if (result.director_notes) txt += `📋 NOTAS: ${result.director_notes}\n\n`;
  if (result.workflow_summary) txt += `📝 WORKFLOW: ${result.workflow_summary}\n\n`;
  txt += `═══ ${result.scenes.length} CENAS ═══\n\n`;
  result.scenes.forEach((s, i) => {
    txt += `── CENA ${i + 1}: ${s.title} (${s.duration}) ──\n`;
    if (s.prompt_veo && s.prompt_veo !== "null") txt += `[VEO] ${s.prompt_veo}\n`;
    if (s.prompt_veo_b && s.prompt_veo_b !== "null") txt += `[VEO B] ${s.prompt_veo_b}\n`;
    if (s.prompt_kling && s.prompt_kling !== "null") txt += `[KLING] ${s.prompt_kling}\n`;
    if (s.prompt_nano && s.prompt_nano !== "null" && !s.prompt_nano.startsWith("N/A")) txt += `[NANO] ${s.prompt_nano}\n`;
    if (s.camera_direction) txt += `[CAM] ${s.camera_direction}\n`;
    if (s.neuro_note) txt += `[NEURO] ${s.neuro_note}\n`;
    if (s.tech_strategy) txt += `[TECH] ${s.tech_strategy}\n`;
    txt += `\n`;
  });
  const blob = new Blob([txt], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `director-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("TXT exportado!");
}

const promptButtons: { type: "veo" | "kling" | "nano"; label: string; color: string }[] = [
  { type: "veo", label: "Veo", color: "#a78bfa" },
  { type: "kling", label: "Kling", color: "#22c55e" },
  { type: "nano", label: "Nano", color: "#eab308" },
];

const DirectorToolbar = ({ result, completedScenes }: DirectorToolbarProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const completedCount = completedScenes.filter(Boolean).length;

  const handleCopy = (type: "veo" | "kling" | "nano") => {
    copyAllPrompts(result, type);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="glass rounded-xl p-3 flex flex-wrap items-center gap-2">
      {/* Copy all buttons */}
      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mr-1">Copiar todos:</span>
      {promptButtons.map((b) => (
        <button
          key={b.type}
          type="button"
          onClick={() => handleCopy(b.type)}
          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
          style={{
            background: copied === b.type ? "hsl(152 69% 40% / 0.12)" : `${b.color}10`,
            color: copied === b.type ? "hsl(152 69% 40%)" : b.color,
            border: `1px solid ${copied === b.type ? "hsl(152 69% 40% / 0.2)" : `${b.color}20`}`,
          }}
        >
          {copied === b.type ? <Check size={10} /> : <Copy size={10} />}
          {b.label}
        </button>
      ))}

      {/* Separator */}
      <div className="w-px h-5 mx-1" style={{ background: "hsl(0 0% 100% / 0.06)" }} />

      {/* Export buttons */}
      <button
        type="button"
        onClick={() => exportJSON(result)}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
        style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--glass-border))" }}
      >
        <FileJson size={10} /> JSON
      </button>
      <button
        type="button"
        onClick={() => exportTXT(result)}
        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
        style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--glass-border))" }}
      >
        <FileText size={10} /> TXT
      </button>

      {/* Progress */}
      {result.scenes.length > 0 && (
        <>
          <div className="w-px h-5 mx-1" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
          <span className="text-[11px] font-bold ml-auto" style={{ color: completedCount === result.scenes.length ? "#22c55e" : "hsl(var(--muted-foreground))" }}>
            {completedCount}/{result.scenes.length} prontas
          </span>
        </>
      )}
    </div>
  );
};

export default DirectorToolbar;
