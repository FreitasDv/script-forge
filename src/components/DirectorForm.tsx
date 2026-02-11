import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import SceneCard from "@/components/SceneCard";
import SceneTimeline from "@/components/SceneTimeline";
import DirectorToolbar from "@/components/DirectorToolbar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MODES,
  PLATFORMS,
  DESTINATIONS,
  OBJECTIVES,
  EXAMPLES,
  CHARACTER_STYLES,
  type DirectorResult,
  type DirectorConfig,
} from "@/lib/director-types";
import {
  Clapperboard, Smartphone, Bot, Film, GraduationCap, Zap,
  Circle, Music, Instagram, Play, Globe,
  DollarSign, Radio, BookOpen, MessageCircle,
  AlertTriangle, Brain, Settings, ListChecks, MessageSquare, Loader2, Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

const modeIconMap: Record<string, React.ReactNode> = {
  ugc: <Smartphone size={20} />,
  character: <Bot size={20} />,
  brand: <Film size={20} />,
  educational: <GraduationCap size={20} />,
  hybrid: <Zap size={20} />,
};

const platformIconMap: Record<string, React.ReactNode> = {
  veo: <Circle size={12} fill="#22c55e" color="#22c55e" />,
  kling: <Circle size={12} fill="#3b82f6" color="#3b82f6" />,
  both: <Circle size={12} fill="#a78bfa" color="#a78bfa" />,
};

const destIconMap: Record<string, React.ReactNode> = {
  tiktok: <Music size={14} />,
  reels: <Instagram size={14} />,
  shorts: <Play size={14} />,
  all: <Globe size={14} />,
};

const objIconMap: Record<string, React.ReactNode> = {
  sale: <DollarSign size={14} />,
  awareness: <Radio size={14} />,
  education: <BookOpen size={14} />,
  engagement: <MessageCircle size={14} />,
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

interface DirectorFormProps {
  onGenerated?: (result: DirectorResult, config: DirectorConfig, rawContent: string) => void;
}

function sanitizeJsonString(s: string): string {
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  s = s.replace(/\t/g, "\\t");
  s = s.replace(/,\s*([}\]])/g, "$1");
  return s;
}

function tryRepairAndParse(jsonStr: string): any {
  try { return JSON.parse(jsonStr); } catch {}
  let repaired = sanitizeJsonString(jsonStr);
  try { return JSON.parse(repaired); } catch {}
  repaired = repaired.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  try { return JSON.parse(repaired); } catch {}
  repaired = repaired.replace(
    /: "((?:[^"\\]|\\.)*)"/g,
    (match) => {
      const inner = match.slice(3, -1);
      const fixed = inner.replace(/(?<!\\)"/g, '\\"');
      return ': "' + fixed + '"';
    }
  );
  try { return JSON.parse(repaired); } catch {}
  return null;
}

function extractJSON(raw: string): DirectorResult {
  let text = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("truncated");
  let jsonStr = text.substring(start, end + 1);
  let depth = 0;
  for (const ch of jsonStr) {
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
  }
  if (depth !== 0) throw new Error("truncated");
  const parsed = tryRepairAndParse(jsonStr);
  if (!parsed) {
    console.error("extractJSON: all repair attempts failed. Raw JSON string:", jsonStr);
    throw new SyntaxError("invalid_json");
  }
  if (!parsed.scenes || !Array.isArray(parsed.scenes)) throw new Error("invalid_structure");
  return parsed as DirectorResult;
}

/* ---- UI Sub-components ---- */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 flex items-center">
          <div
            className="h-1.5 w-full rounded-full transition-all duration-500"
            style={{
              background: i <= current ? "hsl(var(--primary))" : "hsl(0 0% 100% / 0.06)",
              boxShadow: i === current ? "0 0 10px hsl(var(--primary) / 0.4)" : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function Pill({ selected, onClick, children, color }: { selected: boolean; onClick: () => void; children: React.ReactNode; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-[13px] transition-all duration-200 border active:scale-95 min-h-[44px]",
        selected ? "font-semibold" : "font-normal text-muted-foreground"
      )}
      style={{
        background: selected ? `${color}12` : "hsl(0 0% 100% / 0.02)",
        color: selected ? color : undefined,
        borderColor: selected ? `${color}35` : "hsl(var(--glass-border))",
      }}
    >
      {children}
    </button>
  );
}

const stepNames = ["Roteiro", "Estilo", "Publicar"];

/* ---- Main Component ---- */

const DirectorForm = ({ onGenerated }: DirectorFormProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [script, setScript] = useState("");
  const [mode, setMode] = useState("ugc");
  const [characterStyle, setCharacterStyle] = useState("cute_viral");
  const [platform, setPlatform] = useState("both");
  const [destination, setDestination] = useState("reels");
  const [objective, setObjective] = useState("sale");
  const [hasDirection, setHasDirection] = useState(false);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DirectorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedScenes, setCompletedScenes] = useState<boolean[]>([]);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    const config: DirectorConfig = { mode, platform, destination, objective, audience, hasDirection, ...(mode === "character" ? { characterStyle } : {}) };
    let fullText = "";

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
      fullText = "";
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
      setCompletedScenes(new Array(parsed.scenes?.length || 0).fill(false));
      setStep(3);
      onGenerated?.(parsed, config, fullText);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err: any) {
      console.error("Director error:", err);
      console.error("Director raw response:", fullText);
      const msg = err?.message || "";
      if (msg === "truncated") setError("Resposta truncada — tente simplificar o roteiro.");
      else if (msg === "invalid_structure") setError("Resposta sem estrutura válida. Tente novamente.");
      else if (msg === "empty") setError("Nenhuma resposta recebida. Tente novamente.");
      else if (msg === "invalid_json" || err instanceof SyntaxError) setError("Resposta com formato inválido. Tente novamente.");
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
    setCompletedScenes([]);
  };

  const toggleSceneComplete = (i: number) => {
    setCompletedScenes((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const scrollToScene = (i: number) => {
    sceneRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Main Card */}
      <GlassCard className={isMobile ? "p-5" : "p-8"}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-2 surface-primary">
            <Clapperboard size={14} className="text-primary" />
            <span className="text-overline text-primary">DIRETOR</span>
          </div>
          <p className="text-caption text-sm">Cole o roteiro → configure → receba prompts prontos</p>
        </div>

        {/* Step names + indicator */}
        {!result && (
          <div className="mb-5">
            <div className="flex justify-between mb-3 px-2">
              {stepNames.map((name, i) => (
                <span key={name} className={cn(
                  "text-overline transition-colors",
                  i <= step ? "text-primary" : "text-muted-foreground/20"
                )}>
                  {name}
                </span>
              ))}
            </div>
            <StepIndicator current={step} total={3} />
          </div>
        )}

        {/* Loading Bar */}
        {loading && (
          <div className="mt-5">
            <div className="h-2 rounded-full overflow-hidden bg-white/[0.04]">
              <div
                className="h-full rounded-full animate-shimmer transition-[width] duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, hsl(var(--primary)), hsl(280 90% 72%), hsl(var(--primary)))",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>
            <p className="text-caption text-center mt-3 font-medium">
              {progress < 30 ? "Analisando roteiro..." : progress < 60 ? "Aplicando neurociência + direção..." : progress < 90 ? "Gerando prompts JSON estruturados..." : "Finalizando..."}
            </p>
          </div>
        )}

        {/* STEP 0 — Script */}
        {step === 0 && !loading && !result && (
          <div className="mt-5 animate-fade-in">
            <label className="text-overline block mb-3">① ROTEIRO</label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Cole seu roteiro aqui..."
              className="input-glass resize-y leading-relaxed"
              style={{ minHeight: isMobile ? 110 : 160, fontFamily: "inherit" }}
            />
            <div className="flex gap-2 mt-3 flex-wrap">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScript(ex.text)}
                  className="text-[11px] rounded-xl px-3 py-2 transition-all active:scale-95 surface-primary text-primary hover:bg-primary/15"
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2.5 mt-4 cursor-pointer">
              <input type="checkbox" checked={hasDirection} onChange={(e) => setHasDirection(e.target.checked)} className="accent-primary w-4 h-4" />
              <span className="text-caption text-sm">Já tem direção artística</span>
            </label>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canProceed}
              className="btn-primary w-full py-3.5 mt-5 text-sm min-h-[48px] font-bold"
            >
              Próximo →
            </button>
          </div>
        )}

        {/* STEP 1 — Mode + Platform */}
        {step === 1 && !loading && !result && (
          <div className="mt-5 animate-fade-in">
            <label className="text-overline block mb-3">
              ② ESTILO VISUAL
              <span className="font-normal text-muted-foreground/30 ml-1 normal-case tracking-normal">— escolha o modo e engine</span>
            </label>
            <div className={`grid gap-3 mb-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-xl p-4 text-left transition-all duration-200 border active:scale-[0.98]",
                    m.id === "hybrid" && "col-span-full"
                  )}
                  style={{
                    background: mode === m.id ? `${m.color}10` : "hsl(0 0% 100% / 0.02)",
                    borderColor: mode === m.id ? `${m.color}40` : "hsl(var(--glass-border))",
                    boxShadow: mode === m.id ? `0 0 24px ${m.color}10` : "none",
                  }}
                >
                  <div className="mb-1.5 transition-colors" style={{ color: mode === m.id ? m.color : "hsl(var(--muted-foreground))" }}>{modeIconMap[m.id]}</div>
                  <div className="text-sm font-bold" style={{ color: mode === m.id ? m.color : "hsl(var(--foreground))" }}>{m.label}</div>
                  <div className="text-caption mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Character Sub-style Selector */}
            {mode === "character" && (
              <div className="mb-6 animate-fade-in">
                <label className="text-overline block mb-2.5">
                  SUB-ESTILO DO PERSONAGEM
                  <span className="font-normal text-muted-foreground/30 ml-1 normal-case tracking-normal">— nível de humanização</span>
                </label>
                <div className={`grid gap-2 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
                  {CHARACTER_STYLES.map((cs) => (
                    <button
                      key={cs.id}
                      type="button"
                      onClick={() => setCharacterStyle(cs.id)}
                      className={cn(
                        "rounded-xl p-3.5 text-left transition-all duration-200 border active:scale-[0.98]"
                      )}
                      style={{
                        background: characterStyle === cs.id ? `${cs.color}10` : "hsl(0 0% 100% / 0.02)",
                        borderColor: characterStyle === cs.id ? `${cs.color}40` : "hsl(var(--glass-border))",
                        boxShadow: characterStyle === cs.id ? `0 0 20px ${cs.color}10` : "none",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cs.icon}</span>
                        <span className="text-[13px] font-bold" style={{ color: characterStyle === cs.id ? cs.color : "hsl(var(--foreground))" }}>{cs.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{cs.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="text-overline block mb-2.5">ENGINE DE VÍDEO AI</label>
            <div className="flex gap-2 mb-5">
              {PLATFORMS.map((p) => (
                <Pill key={p.id} selected={platform === p.id} onClick={() => setPlatform(p.id)} color="#7c3aed">
                  {platformIconMap[p.id]} {p.label}
                </Pill>
              ))}
            </div>
            <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
              <button type="button" onClick={() => setStep(0)} className="btn-ghost flex-1 py-3 text-[13px] min-h-[48px]">← Voltar</button>
              <button type="button" onClick={() => setStep(2)} className="btn-primary flex-[2] py-3 text-sm min-h-[48px] font-bold">Próximo →</button>
            </div>
          </div>
        )}

        {/* STEP 2 — Destination + Objective + Generate */}
        {step === 2 && !loading && !result && (
          <div className="mt-5 animate-fade-in">
            <label className="text-overline block mb-3">
              ③ ONDE VAI PUBLICAR?
              <span className="font-normal text-muted-foreground/30 ml-1 normal-case tracking-normal">— otimizado por plataforma</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {DESTINATIONS.map((d) => (
                <Pill key={d.id} selected={destination === d.id} onClick={() => setDestination(d.id)} color="#22d3ee">
                  {destIconMap[d.id]} {d.label}
                </Pill>
              ))}
            </div>
            <label className="text-overline block mb-2.5">OBJETIVO DO VÍDEO</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {OBJECTIVES.map((o) => (
                <Pill key={o.id} selected={objective === o.id} onClick={() => setObjective(o.id)} color="#f43f5e">
                  {objIconMap[o.id]} {o.label}
                </Pill>
              ))}
            </div>
            <label className="text-overline block mb-2">
              PÚBLICO <span className="font-normal text-muted-foreground/30 normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: Mulheres 25-40 em reforma"
              className="input-glass mb-5"
            />
            <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
              <button type="button" onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 text-[13px] min-h-[48px]">← Voltar</button>
              <button type="button" onClick={generate} className="btn-primary flex-[2] py-4 text-[15px] font-extrabold min-h-[52px] flex items-center justify-center gap-2">
                <Clapperboard size={18} /> DIRIGIR
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl animate-scale-in surface-accent">
            <span className="flex items-center gap-2 text-xs text-accent">
              <AlertTriangle size={14} /> {error}
            </span>
            <button
              type="button"
              onClick={() => { setError(null); setStep(2); }}
              className="block mt-2.5 text-[11px] px-3.5 py-2 rounded-lg bg-accent/10 text-accent border-none cursor-pointer hover:bg-accent/15 transition-all"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && step === 0 && !script && (
          <div className="text-center pt-8 pb-3 opacity-25">
            <Clapperboard size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-caption">Seu assistente de direção começa aqui</p>
          </div>
        )}
      </GlassCard>

      {/* RESULTS */}
      {result && (
        <div ref={resultRef} className="flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-title text-foreground flex items-center gap-2">
              <Clapperboard size={18} /> Resultado
              <span className="badge-primary ml-1">{result.scenes?.length} cenas</span>
            </h2>
            <button type="button" onClick={resetWizard} className="btn-ghost px-3.5 py-2 text-[11px]">
              + Novo roteiro
            </button>
          </div>

          {/* Toolbar */}
          <DirectorToolbar result={result} completedScenes={completedScenes} />

          {/* Timeline */}
          <SceneTimeline scenes={result.scenes} completedScenes={completedScenes} onClickScene={scrollToScene} />

          {/* Director Notes */}
          {result.director_notes && (
            <details>
              <summary className="text-xs font-bold cursor-pointer p-4 rounded-xl flex items-center gap-2 list-none transition-all surface-primary text-primary">
                <MessageSquare size={14} /> Raciocínio do Diretor
                <span className="text-muted-foreground/30 font-normal ml-auto text-[10px]">expandir</span>
              </summary>
              <div className="p-4 rounded-b-xl bg-primary/[0.02] border border-primary/[0.06] border-t-0">
                <p className="text-body text-muted-foreground whitespace-pre-wrap m-0">{result.director_notes}</p>
              </div>
            </details>
          )}

          {/* Workflow */}
          {result.workflow_summary && (
            <details>
              <summary className="text-xs font-bold cursor-pointer p-4 rounded-xl flex items-center gap-2 list-none transition-all" style={{ color: "#22d3ee", background: "hsl(187 92% 69% / 0.05)", border: "1px solid hsl(187 92% 69% / 0.1)" }}>
                <ListChecks size={14} /> Workflow de Execução
                <span className="text-muted-foreground/30 font-normal ml-auto text-[10px]">expandir</span>
              </summary>
              <div className="p-4 rounded-b-xl" style={{ background: "hsl(187 92% 69% / 0.02)", border: "1px solid hsl(187 92% 69% / 0.06)", borderTop: "none" }}>
                <p className="text-body text-muted-foreground whitespace-pre-wrap m-0">{result.workflow_summary}</p>
              </div>
            </details>
          )}

          {/* Scenes */}
          {result.scenes?.map((scene, i) => (
            <div key={i} ref={(el) => { sceneRefs.current[i] = el; }}>
              <SceneCard
                scene={scene}
                index={i}
                defaultOpen={i === 0}
                completed={completedScenes[i] || false}
                onToggleComplete={() => toggleSceneComplete(i)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectorForm;
