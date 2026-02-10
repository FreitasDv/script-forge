import { useState } from "react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

interface GenerateFormProps {
  onGenerated: (content: string, meta: { type: string; tone: string; size: string; context: string }) => void;
  initialValues?: { type?: string; tone?: string; size?: string; context?: string };
}

const typeOptions = [
  { id: "video", label: "📹 Vídeo/YouTube" },
  { id: "commercial", label: "📢 Comercial" },
  { id: "prompt", label: "🤖 Prompt para IA" },
];

const toneOptions = ["formal", "casual", "persuasivo", "educativo", "divertido", "inspirador"];
const sizeOptions = [
  { id: "short", label: "Curto" },
  { id: "medium", label: "Médio" },
  { id: "long", label: "Longo" },
];

const typeLabels: Record<string, string> = {
  video: "📹 Roteiro de Vídeo/YouTube",
  commercial: "📢 Roteiro Comercial",
  prompt: "🤖 Prompt para IA",
};

const sizeLabels: Record<string, string> = { short: "Curto", medium: "Médio", long: "Longo" };

function SelectCustom({ value, onChange, placeholder, options }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 10,
        color: value ? "#e2e8f0" : "#64748b",
        padding: "10px 14px",
        fontSize: 13,
        outline: "none",
        boxSizing: "border-box",
        appearance: "none",
        cursor: "pointer",
      }}
    >
      <option value="" style={{ background: "#0a0a14", color: "#64748b" }}>{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id} style={{ background: "#0a0a14", color: "#e2e8f0" }}>{o.label}</option>
      ))}
    </select>
  );
}

const GenerateForm = ({ onGenerated, initialValues }: GenerateFormProps) => {
  const [type, setType] = useState(initialValues?.type || "");
  const [tone, setTone] = useState(initialValues?.tone || "");
  const [size, setSize] = useState(initialValues?.size || "");
  const [context, setContext] = useState(initialValues?.context || "");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Form Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1.5px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
          padding: 24,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>Gerar Conteúdo</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>TIPO</label>
            <SelectCustom value={type} onChange={setType} placeholder="Selecione" options={typeOptions} />
          </div>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>TOM</label>
            <SelectCustom value={tone} onChange={setTone} placeholder="Selecione" options={toneOptions.map((t) => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} />
          </div>
          <div>
            <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>TAMANHO</label>
            <SelectCustom value={size} onChange={setSize} placeholder="Selecione" options={sizeOptions} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", display: "block", marginBottom: 6 }}>TEMA / CONTEXTO</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Descreva o que você deseja gerar..."
            rows={4}
            style={{
              width: "100%",
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
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !canGenerate}
          style={{
            width: "100%",
            padding: "13px",
            background: canGenerate && !generating ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.04)",
            color: canGenerate && !generating ? "#fff" : "#334155",
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: canGenerate && !generating ? "pointer" : "default",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {generating ? "⏳ Gerando..." : "✨ Gerar com IA"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1.5px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", margin: "0 0 12px", fontFamily: "'Space Grotesk', sans-serif" }}>Resultado</h3>
          <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result}</div>
        </div>
      )}
    </div>
  );
};

export default GenerateForm;
