import { useState } from "react";
import type { DirectorScene } from "@/lib/director-types";
import { Camera, Brain, Mic, Settings, Palette, ChevronDown, Check, Copy } from "lucide-react";

interface SceneCardProps {
  scene: DirectorScene;
  index: number;
  defaultOpen?: boolean;
}

function formatPrompt(text: unknown): string {
  if (!text) return "";
  if (typeof text === "object") {
    return JSON.stringify(text, null, 2);
  }
  const str = String(text);
  try {
    if (str.trim().startsWith("{")) {
      return JSON.stringify(JSON.parse(str), null, 2);
    }
  } catch {}
  return str;
}

function PromptBlock({
  label,
  text,
  color,
  index,
  k,
  icon,
}: {
  label: string;
  text: string;
  color: string;
  index: number;
  k: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>{icon} {label}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); copy(); }}
          style={{
            background: copied ? "rgba(34,197,94,0.15)" : `${color}15`,
            color: copied ? "#22c55e" : color,
            border: "none",
            borderRadius: 6,
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {copied ? <><Check size={10} /> Copiado!</> : <><Copy size={10} /> Copiar</>}
        </button>
      </div>
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${color}25`,
          borderRadius: 10,
          padding: 12,
          fontFamily: "monospace",
          fontSize: 11,
          color: "rgba(226,232,240,0.75)",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          maxHeight: 256,
          overflowY: "auto",
        }}
      >
        {formatPrompt(text)}
      </div>
    </div>
  );
}

function InfoBlock({ icon, label, text, color }: { icon: React.ReactNode; label: string; text: string; color: string }) {
  if (!text || text === "null") return null;
  return (
    <div
      style={{
        borderLeft: `3px solid ${color}`,
        background: `${color}12`,
        borderRadius: "0 10px 10px 0",
        padding: "10px 12px",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        {icon} {label}
      </span>
      <p style={{ color: "rgba(226,232,240,0.7)", fontSize: 12, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {text}
      </p>
    </div>
  );
}

const SceneCard = ({ scene, index, defaultOpen = false }: SceneCardProps) => {
  const [open, setOpen] = useState(defaultOpen);

  const hasNano = scene.prompt_nano && scene.prompt_nano !== "null";
  const nanoIsNA = hasNano && scene.prompt_nano!.startsWith("N/A");

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1.5px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "all 0.3s",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          background: open ? "rgba(139,92,246,0.06)" : "transparent",
          border: "none",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(124,58,237,0.15)",
              color: "#a78bfa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {index + 1}
          </span>
          <div style={{ textAlign: "left" }}>
            <p style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, margin: 0 }}>{scene.title}</p>
            <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>{scene.duration}</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          style={{
            color: "#64748b",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Nano */}
          {hasNano && !nanoIsNA && (
            <PromptBlock
              label="NANO BANANA PRO"
              text={scene.prompt_nano!}
              color="#eab308"
              index={index}
              k={`nano-${index}`}
              icon={<Palette size={12} />}
            />
          )}
          {nanoIsNA && (
            <div style={{ color: "rgba(100,116,139,0.6)", fontSize: 11, fontStyle: "italic", padding: "0 4px" }}>
              {scene.prompt_nano}
            </div>
          )}

          {/* Veo */}
          {scene.prompt_veo && scene.prompt_veo !== "null" && (
            <PromptBlock label="PROMPT VEO 3.1" text={scene.prompt_veo} color="#a78bfa" index={index} k={`veo-${index}`} icon={<div style={{ width: 10, height: 10, borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />} />
          )}

          {/* Veo B */}
          {scene.prompt_veo_b && scene.prompt_veo_b !== "null" && (
            <PromptBlock label="VEO 3.1 — SHOT B" text={scene.prompt_veo_b} color="#8b5cf6" index={index} k={`veob-${index}`} icon={<div style={{ width: 10, height: 10, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }} />} />
          )}

          {/* Kling */}
          {scene.prompt_kling && scene.prompt_kling !== "null" && (
            <PromptBlock label="PROMPT KLING 3.0" text={scene.prompt_kling} color="#22c55e" index={index} k={`kling-${index}`} icon={<div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />} />
          )}

          {/* Info blocks */}
          <InfoBlock icon={<Camera size={12} />} label="Câmera" text={scene.camera_direction} color="#a78bfa" />
          <InfoBlock icon={<Brain size={12} />} label="Neuro" text={scene.neuro_note} color="#fb7185" />
          <InfoBlock icon={<Mic size={12} />} label="Fala" text={scene.speech_timing || ""} color="#67e8f9" />
          <InfoBlock icon={<Settings size={12} />} label="Estratégia" text={scene.tech_strategy} color="#fcd34d" />
        </div>
      )}
    </div>
  );
};

export default SceneCard;
