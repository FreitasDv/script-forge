import { useState, memo } from "react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Wand2, Loader2, CheckCircle2 } from "lucide-react";
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

const GenerateForm = memo(({ onGenerated, initialValues }: GenerateFormProps) => {
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
      <GlassCard className={isMobile ? "p-5" : "p-8"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="icon-container icon-container-md rounded-xl glow-sm">
            <Wand2 size={20} className="text-primary" />
          </div>
          <div>
            <span className="text-title block leading-tight">Gerar Conteúdo</span>
            <span className="text-caption">Preencha os campos e gere com IA</span>
          </div>
        </div>

        <div className={`grid gap-4 mb-6 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <div>
            <label className="text-label block mb-2.5">Tipo</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="input-glass h-12">
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
            <label className="text-label block mb-2.5">Tom</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="input-glass h-12">
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
            <label className="text-label block mb-2.5">Tamanho</label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger className="input-glass h-12">
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-label">Tema / Contexto</label>
            <span className="text-[10px] text-muted-foreground/30">{context.length} chars</span>
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o que você deseja gerar..."
            rows={4}
            className="input-glass resize-y leading-relaxed"
            style={{ minHeight: isMobile ? 110 : 140, fontFamily: "inherit" }}
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !canGenerate}
          className="btn-primary w-full py-4 text-[15px] flex items-center justify-center gap-2 min-h-[52px] font-extrabold"
        >
          {generating ? (
            <><Loader2 size={18} className="animate-spin" /> Gerando...</>
          ) : (
            <><Wand2 size={18} /> Gerar com IA</>
          )}
        </button>
      </GlassCard>

      {result && (
        <GlassCard className="animate-slide-up">
          <div className={isMobile ? "p-5" : "p-7"}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={16} className="text-success" />
              <h3 className="text-base font-bold text-foreground">Resultado</h3>
            </div>
            <div className="text-body text-muted-foreground whitespace-pre-wrap">{result}</div>
          </div>
        </GlassCard>
      )}
    </div>
  );
});

GenerateForm.displayName = "GenerateForm";

export default GenerateForm;
