import { useState, useCallback, useEffect, useRef } from "react";
import { Clapperboard, ArrowLeft, ArrowRight, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import ModeCard from "@/components/ModeCard";
import ChipSelect from "@/components/ChipSelect";
import SceneCard from "@/components/SceneCard";
import {
  MODES,
  PLATFORMS,
  DESTINATIONS,
  OBJECTIVES,
  EXAMPLES,
  type DirectorResult,
  type DirectorConfig,
} from "@/lib/director-types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

interface DirectorFormProps {
  onGenerated?: (result: DirectorResult, config: DirectorConfig, rawContent: string) => void;
}

function extractJSON(raw: string): DirectorResult {
  let text = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("truncated");
  let jsonStr = text.substring(start, end + 1);
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
  let depth = 0;
  for (const ch of jsonStr) {
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
  }
  if (depth !== 0) throw new Error("truncated");
  const parsed = JSON.parse(jsonStr);
  if (!parsed.scenes || !Array.isArray(parsed.scenes)) throw new Error("invalid_structure");
  return parsed as DirectorResult;
}

/* ── Step Indicator Dots ── */
const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center justify-center gap-2">
    {Array.from({ length: total }, (_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === current ? 24 : 8,
          height: 8,
          backgroundColor: i <= current ? "hsl(var(--primary))" : "hsl(var(--muted))",
          opacity: i <= current ? 1 : 0.4,
        }}
      />
    ))}
  </div>
);

/* ── Progress Messages ── */
function getProgressMessage(p: number): string {
  if (p < 30) return "🎬 Analisando roteiro...";
  if (p < 60) return "🧠 Aplicando neurociência + direção...";
  if (p < 90) return "⚙️ Gerando prompts JSON estruturados...";
  return "✨ Finalizando...";
}

const DirectorForm = ({ onGenerated }: DirectorFormProps) => {
  const [step, setStep] = useState(0);
  const [script, setScript] = useState("");
  const [mode, setMode] = useState("ugc");
  const [platform, setPlatform] = useState("both");
  const [destination, setDestination] = useState("reels");
  const [objective, setObjective] = useState("sale");
  const [hasDirection, setHasDirection] = useState(false);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DirectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Simulated progress
  useEffect(() => {
    if (loading) {
      setProgress(0);
      const t = setInterval(() => setProgress((p) => (p >= 92 ? 92 : p + Math.random() * 8)), 600);
      return () => clearInterval(t);
    } else {
      setProgress(result ? 100 : 0);
    }
  }, [loading, result]);

  const generate = useCallback(async () => {
    if (!script.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const config: DirectorConfig = { mode, platform, destination, objective, audience, hasDirection };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "director",
          directorConfig: config,
          messages: [{ role: "user", content: `Roteiro:\n\n${script}` }],
        }),
      });

      if (resp.status === 429) { toast.error("Limite de requisições excedido."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("Créditos insuficientes."); setLoading(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Erro ao gerar."); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch {}
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ") && trimmed.slice(6).trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(trimmed.slice(6).trim());
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch {}
        }
      }

      if (!fullText.trim()) throw new Error("empty");

      const parsed = extractJSON(fullText);
      setResult(parsed);
      setStep(3);
      onGenerated?.(parsed, config, fullText);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err: any) {
      console.error("Director error:", err);
      const msg = err?.message || "";
      if (msg === "truncated") setError("Resposta truncada — tente simplificar o roteiro.");
      else if (msg === "invalid_structure") setError("Resposta sem estrutura válida. Tente novamente.");
      else if (msg === "empty") setError("Nenhuma resposta recebida. Tente novamente.");
      else setError("Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [script, mode, platform, destination, objective, audience, hasDirection, onGenerated]);

  const canProceed = step === 0 ? script.trim().length > 10 : true;

  const resetWizard = () => {
    setResult(null);
    setStep(0);
    setScript("");
    setError(null);
    setProgress(0);
  };

  return (
    <div className="space-y-5">
      {/* Main Card */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Clapperboard className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary tracking-wider">DIRETOR</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole o roteiro → configure → receba prompts prontos
          </p>
        </div>

        {/* Step Indicator */}
        {!result && <StepIndicator current={step} total={3} />}

        {/* ── Loading Bar ── */}
        {loading && (
          <div className="space-y-2 animate-fade-in">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center font-medium">
              {getProgressMessage(progress)}
            </p>
          </div>
        )}

        {/* ── STEP 0 — Script ── */}
        {step === 0 && !loading && !result && (
          <div className="space-y-4 animate-fade-in">
            <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
              ① Roteiro
            </span>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Cole seu roteiro aqui..."
              rows={5}
              className="bg-background/50 border-border/50 focus:border-primary/40 transition-all duration-200"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScript(ex.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/8 text-primary/80 border border-primary/15 hover:bg-primary/15 hover:text-primary transition-all duration-200"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={hasDirection} onCheckedChange={(v) => setHasDirection(!!v)} />
              <span className="text-xs text-muted-foreground">Já tem direção artística</span>
            </label>
            <Button
              onClick={() => setStep(1)}
              disabled={!canProceed}
              className="w-full h-11 font-bold tracking-wide gap-2"
            >
              Próximo <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── STEP 1 — Mode + Platform ── */}
        {step === 1 && !loading && !result && (
          <div className="space-y-5 animate-fade-in">
            <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
              ② Como você quer o vídeo?
            </span>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <ModeCard key={m.id} mode={m} selected={mode === m.id} onClick={() => setMode(m.id)} />
              ))}
            </div>
            <ChipSelect
              options={PLATFORMS}
              value={platform}
              onChange={setPlatform}
              label="Engine de Vídeo AI"
              color="#7c3aed"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={() => setStep(2)} className="flex-[2] font-bold gap-1">
                Próximo <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Destination + Objective + Generate ── */}
        {step === 2 && !loading && !result && (
          <div className="space-y-5 animate-fade-in">
            <ChipSelect
              options={DESTINATIONS}
              value={destination}
              onChange={setDestination}
              label="③ Onde vai publicar?"
              color="#22d3ee"
              layout="grid"
            />
            <ChipSelect
              options={OBJECTIVES}
              value={objective}
              onChange={setObjective}
              label="Objetivo do vídeo"
              color="#f43f5e"
              layout="grid"
            />
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground tracking-wider uppercase">
                Público <span className="font-normal opacity-60">(opcional)</span>
              </span>
              <Input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Ex: Mulheres 25-40 em reforma"
                className="bg-background/50 border-border/50 focus:border-primary/40"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={generate} className="flex-[2] h-12 font-extrabold text-base gap-2 tracking-wide">
                <Clapperboard className="h-4 w-4" /> DIRIGIR
              </Button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive animate-fade-in space-y-2">
            <p>⚠️ {error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setError(null); setStep(2); }}
              className="text-destructive hover:text-destructive"
            >
              Tentar de novo
            </Button>
          </div>
        )}

        {/* ── Empty State ── */}
        {!result && !loading && step === 0 && !script && (
          <div className="text-center py-6 opacity-40">
            <div className="text-5xl mb-2">🎬</div>
            <p className="text-xs text-muted-foreground">Seu assistente de direção começa aqui</p>
          </div>
        )}
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div ref={resultRef} className="space-y-3 animate-fade-in">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground">
              🎬 Resultado{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({result.scenes?.length} cenas)
              </span>
            </h2>
            <Button variant="outline" size="sm" onClick={resetWizard} className="gap-1 text-xs">
              <Plus className="h-3 w-3" /> Novo roteiro
            </Button>
          </div>

          {/* Director Notes — Collapsible */}
          {result.director_notes && (
            <details className="group rounded-xl border border-primary/15 overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-bold text-primary bg-primary/5 hover:bg-primary/8 transition-colors list-none">
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
                <span>💭 Raciocínio do Diretor</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-normal group-open:hidden">
                  toque para expandir
                </span>
              </summary>
              <div className="px-4 py-3 bg-primary/3 border-t border-primary/10">
                <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {result.director_notes}
                </p>
              </div>
            </details>
          )}

          {/* Workflow — Collapsible */}
          {result.workflow_summary && (
            <details className="group rounded-xl border border-accent/15 overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-xs font-bold text-accent bg-accent/5 hover:bg-accent/8 transition-colors list-none">
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-180" />
                <span>📋 Workflow de Execução</span>
                <span className="ml-auto text-[10px] text-muted-foreground font-normal group-open:hidden">
                  toque para expandir
                </span>
              </summary>
              <div className="px-4 py-3 bg-accent/3 border-t border-accent/10">
                <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {result.workflow_summary}
                </p>
              </div>
            </details>
          )}

          {/* Scenes */}
          {result.scenes?.map((scene, i) => (
            <SceneCard key={i} scene={scene} index={i} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectorForm;
