import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 99,
            backgroundColor: i <= current ? "#7c3aed" : "rgba(255,255,255,0.08)",
            opacity: i <= current ? 1 : 0.4,
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function HelpTip({ text }: { text: string }) {
  return <span style={{ color: "#475569", fontSize: 10, fontWeight: 400 }}> — {text}</span>;
}

function Pill({
  selected,
  onClick,
  children,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        transition: "all 0.2s",
        background: selected ? `${color}15` : "rgba(255,255,255,0.02)",
        color: selected ? color : "#64748b",
        border: `1.5px solid ${selected ? `${color}40` : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {children}
    </button>
  );
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1.5px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: 24,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>🎬</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa", letterSpacing: "1.5px" }}>
              DIRETOR
            </span>
          </div>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
            Cole o roteiro → configure → receba prompts prontos
          </p>
        </div>

        {!result && <StepIndicator current={step} total={3} />}

        {/* Loading Bar */}
        {loading && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                background: "rgba(255,255,255,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite",
                  transition: "width 0.4s ease-out",
                }}
              />
            </div>
            <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center", marginTop: 8, fontWeight: 500 }}>
              {progress < 30
                ? "🎬 Analisando roteiro..."
                : progress < 60
                ? "🧠 Aplicando neurociência + direção..."
                : progress < 90
                ? "⚙️ Gerando prompts JSON estruturados..."
                : "✨ Finalizando..."}
            </p>
          </div>
        )}

        {/* STEP 0 — Script */}
        {step === 0 && !loading && !result && (
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 10,
              }}
            >
              ① ROTEIRO
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Cole seu roteiro aqui..."
              style={{
                width: "100%",
                minHeight: 140,
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                color: "#e2e8f0",
                padding: 14,
                fontSize: 14,
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7c3aed55")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScript(ex.text)}
                  style={{
                    background: "rgba(139,92,246,0.08)",
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.15)",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={hasDirection}
                onChange={(e) => setHasDirection(e.target.checked)}
                style={{ accentColor: "#7c3aed" }}
              />
              <span style={{ color: "#64748b", fontSize: 12 }}>Já tem direção artística</span>
            </label>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canProceed}
              style={{
                width: "100%",
                padding: "13px",
                marginTop: 16,
                background: canProceed
                  ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                  : "rgba(255,255,255,0.04)",
                color: canProceed ? "#fff" : "#334155",
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: canProceed ? "pointer" : "default",
                transition: "all 0.3s",
              }}
            >
              Próximo →
            </button>
          </div>
        )}

        {/* STEP 1 — Mode + Platform */}
        {step === 1 && !loading && !result && (
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 10,
              }}
            >
              ② COMO VOCÊ QUER O VÍDEO?
              <HelpTip text="Escolha o estilo visual e a engine de geração" />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  style={{
                    background: mode === m.id ? `${m.color}15` : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${mode === m.id ? `${m.color}55` : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.25s",
                    transform: mode === m.id ? "scale(1.02)" : "scale(1)",
                    gridColumn: m.id === "hybrid" ? "span 2" : "auto",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                  <div
                    style={{
                      color: mode === m.id ? m.color : "#e2e8f0",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {m.label}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 8,
              }}
            >
              ENGINE DE VÍDEO AI
            </label>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {PLATFORMS.map((p) => (
                <Pill
                  key={p.id}
                  selected={platform === p.id}
                  onClick={() => setPlatform(p.id)}
                  color="#7c3aed"
                >
                  <span>{p.icon}</span> {p.label}
                </Pill>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setStep(0)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Destination + Objective + Generate */}
        {step === 2 && !loading && !result && (
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 10,
              }}
            >
              ③ ONDE VAI PUBLICAR?
              <HelpTip text="O prompt é otimizado pra cada plataforma" />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
              {DESTINATIONS.map((d) => (
                <Pill
                  key={d.id}
                  selected={destination === d.id}
                  onClick={() => setDestination(d.id)}
                  color="#22d3ee"
                >
                  <span style={{ fontSize: 14 }}>{d.icon}</span> {d.label}
                </Pill>
              ))}
            </div>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 8,
              }}
            >
              OBJETIVO DO VÍDEO
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
              {OBJECTIVES.map((o) => (
                <Pill
                  key={o.id}
                  selected={objective === o.id}
                  onClick={() => setObjective(o.id)}
                  color="#f43f5e"
                >
                  <span>{o.icon}</span> {o.label}
                </Pill>
              ))}
            </div>
            <label
              style={{
                color: "#94a3b8",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.8px",
                display: "block",
                marginBottom: 6,
              }}
            >
              PÚBLICO <span style={{ fontWeight: 400, color: "#334155" }}>(opcional)</span>
            </label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: Mulheres 25-40 em reforma"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#e2e8f0",
                padding: "10px 14px",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(255,255,255,0.04)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={generate}
                style={{
                  flex: 2,
                  padding: "13px",
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                🎬 DIRIGIR
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              padding: 14,
              background: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.2)",
              borderRadius: 12,
              color: "#fb7185",
              fontSize: 12,
              marginBottom: 16,
              marginTop: 8,
            }}
          >
            ⚠️ {error}
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              style={{
                display: "block",
                marginTop: 8,
                background: "rgba(244,63,94,0.15)",
                color: "#fb7185",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Tentar de novo
            </button>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && step === 0 && !script && (
          <div style={{ textAlign: "center", padding: "30px 0 10px", opacity: 0.4 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div>
            <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>
              Seu assistente de direção começa aqui
            </p>
          </div>
        )}
      </div>

      {/* RESULTS */}
      {result && (
        <div ref={resultRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <h2 style={{ color: "#e2e8f0", fontSize: 16, fontWeight: 800, margin: 0 }}>
              🎬 Resultado{" "}
              <span style={{ color: "#64748b", fontWeight: 400, fontSize: 13 }}>
                ({result.scenes?.length} cenas)
              </span>
            </h2>
            <button
              type="button"
              onClick={resetWizard}
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              + Novo roteiro
            </button>
          </div>

          {/* Director Notes */}
          {result.director_notes && (
            <details>
              <summary
                style={{
                  color: "#a78bfa",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "12px 16px",
                  background: "rgba(139,92,246,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(139,92,246,0.1)",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>💭</span> Raciocínio do Diretor
                <span
                  style={{
                    color: "#475569",
                    fontWeight: 400,
                    marginLeft: "auto",
                    fontSize: 10,
                  }}
                >
                  toque para expandir
                </span>
              </summary>
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(139,92,246,0.03)",
                  borderRadius: "0 0 12px 12px",
                  border: "1px solid rgba(139,92,246,0.08)",
                  borderTop: "none",
                }}
              >
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result.director_notes}
                </p>
              </div>
            </details>
          )}

          {/* Workflow */}
          {result.workflow_summary && (
            <details>
              <summary
                style={{
                  color: "#22d3ee",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "12px 16px",
                  background: "rgba(34,211,238,0.05)",
                  borderRadius: 12,
                  border: "1px solid rgba(34,211,238,0.1)",
                  listStyle: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📋</span> Workflow de Execução
                <span
                  style={{
                    color: "#475569",
                    fontWeight: 400,
                    marginLeft: "auto",
                    fontSize: 10,
                  }}
                >
                  toque para expandir
                </span>
              </summary>
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(34,211,238,0.03)",
                  borderRadius: "0 0 12px 12px",
                  border: "1px solid rgba(34,211,238,0.08)",
                  borderTop: "none",
                }}
              >
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
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

      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
};

export default DirectorForm;
