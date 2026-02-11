import { useState } from "react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wand2, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenerateFormProps {
  onGenerated: (content: string, meta: { type: string; tone: string; size: string; context: string }) => void;
  initialValues?: { type?: string; tone?: string; size?: string; context?: string };
}

const typeOptions = [
  { id: "video", label: "Vídeo/YouTube" },
  { id: "commercial", label: "Comercial" },
  { id: "prompt", label: "Prompt para IA" },
];

const toneOptions = ["formal", "casual", "persuasivo", "educativo", "divertido", "inspirador"];
const sizeOptions = [
  { id: "short", label: "Curto" },
  { id: "medium", label: "Médio" },
  { id: "long", label: "Longo" },
];

const typeLabels: Record<string, string> = {
  video: "Roteiro de Vídeo/YouTube",
  commercial: "Roteiro Comercial",
  prompt: "Prompt para IA",
};

const sizeLabels: Record<string, string> = { short: "Curto", medium: "Médio", long: "Longo" };

const GenerateForm = ({ onGenerated, initialValues }: GenerateFormProps) => {
  const [type, setType] = useState(initialValues?.type || "");
  const [tone, setTone] = useState(initialValues?.tone || "");
  const [size, setSize] = useState(initialValues?.size || "");
  const [context, setContext] = useState(initialValues?.context || "");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const isMobile = useIsMobile();

  const handleGenerate = async () => {
    if (!type || !tone || !size || !context.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    setGenerating(true);
    setResult("");

    const userMessage = `Crie um ${typeLabels[type]} com tom ${tone}, tamanho ${sizeLabels[size]}.\n\nTema/Contexto: ${context}`;
    let accumulated = "";
    try {
      await streamChat({
        messages: [{ role: "user", content: userMessage }],
        onDelta: (chunk) => { accumulated += chunk; setResult(accumulated); },
        onDone: () => { setGenerating(false); onGenerated(accumulated, { type, tone, size, context }); },
        onError: (err) => { toast.error(err); setGenerating(false); },
      });
    } catch {
      toast.error("Erro ao gerar conteúdo");
      setGenerating(false);
    }
  };

  const canGenerate = type && tone && size && context.trim();

  return (
    <div className="flex flex-col gap-4">
      <GlassCard className={isMobile ? "p-5" : "p-7"}>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
            <Wand2 size={18} className="text-primary" />
          </div>
          <div>
            <span className="text-base font-extrabold text-foreground block leading-tight">Gerar Conteúdo</span>
            <span className="text-[11px] text-muted-foreground">Preencha os campos e gere com IA</span>
          </div>
        </div>

        <div className={`grid gap-3 mb-5 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <div>
            <label className="text-muted-foreground text-xs font-semibold block mb-2">Tipo</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="input-glass h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-semibold block mb-2">Tom</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="input-glass h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-semibold block mb-2">Tamanho</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="input-glass h-11">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-muted-foreground text-xs font-semibold">Tema / Contexto</label>
            <span className="text-[10px] text-muted-foreground/40">{context.length} chars</span>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o que você deseja gerar..."
            rows={4}
            className="input-glass resize-y leading-relaxed"
            style={{ minHeight: isMobile ? 100 : 120, fontFamily: "inherit" }}
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !canGenerate}
          className="btn-primary w-full py-3.5 text-[15px] flex items-center justify-center gap-2 min-h-[48px]"
        >
          {generating ? (
            <><Loader2 size={16} className="animate-spin" /> Gerando...</>
          ) : (
            <><Wand2 size={16} /> Gerar com IA</>
          )}
        </button>
      </GlassCard>

      {result && (
        <GlassCard className="animate-slide-up">
          <div className={isMobile ? "p-4" : "p-6"}>
            <h3 className="text-[15px] font-bold text-foreground mb-3">Resultado</h3>
            <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{result}</div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default GenerateForm;
