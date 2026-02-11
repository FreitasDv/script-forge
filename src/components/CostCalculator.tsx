import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Volume2, ImageIcon, Film, Video, Trophy, Clock, Zap,
} from "lucide-react";

type DurationCosts = Record<number, number>;
type FixedCost = { fixed: number };

interface ModelInfo {
  name: string;
  category: "Kling" | "Veo" | "Hailuo" | "Motion";
  costs: DurationCosts | FixedCost;
  features: { audio?: boolean; startFrame?: boolean; endFrame?: boolean; imageRef?: boolean; videoRef?: boolean };
}

const MODELS: ModelInfo[] = [
  { name: "Kling 2.5 Turbo", category: "Kling", costs: { 5: 235, 10: 470 }, features: { startFrame: true, endFrame: true, imageRef: true } },
  { name: "Kling 2.6", category: "Kling", costs: { 5: 604, 10: 1208 }, features: { startFrame: true, endFrame: true, imageRef: true } },
  { name: "Kling 3.0", category: "Kling", costs: { 5: 604, 10: 1208 }, features: { startFrame: true, endFrame: true, imageRef: true } },
  { name: "Kling O1", category: "Kling", costs: { 5: 484, 10: 968 }, features: { startFrame: true, imageRef: true } },
  { name: "Kling O3 Omni", category: "Kling", costs: { 5: 604, 10: 1208 }, features: { startFrame: true, imageRef: true } },
  { name: "Kling 2.1 Pro", category: "Kling", costs: { 5: 600, 10: 1200 }, features: { startFrame: true, endFrame: true } },
  { name: "Veo 3.1", category: "Veo", costs: { 4: 1070, 6: 1605, 8: 2140 }, features: { audio: true, startFrame: true, imageRef: true } },
  { name: "Veo 3.1 Fast", category: "Veo", costs: { 4: 546, 6: 819, 8: 1092 }, features: { audio: true, startFrame: true, imageRef: true } },
  { name: "Veo 3.0", category: "Veo", costs: { 4: 2140, 6: 1605, 8: 1070 }, features: { audio: true, startFrame: true } },
  { name: "Veo 3.0 Fast", category: "Veo", costs: { 4: 1092, 6: 819, 8: 546 }, features: { audio: true, startFrame: true } },
  { name: "Hailuo 2.3", category: "Hailuo", costs: { 5: 500, 10: 1000 }, features: { startFrame: true, imageRef: true } },
  { name: "Hailuo 2.3 Fast", category: "Hailuo", costs: { 5: 300, 10: 600 }, features: { startFrame: true, imageRef: true } },
  { name: "Motion 2.0", category: "Motion", costs: { fixed: 100 }, features: {} },
];

const CATEGORY_COLORS: Record<string, string> = {
  Kling: "#7c3aed",
  Veo: "#10b981",
  Hailuo: "#3b82f6",
  Motion: "#6b7280",
};

const PRESETS = [
  { label: "$5 Pro", credits: 3125 },
  { label: "$10", credits: 6250 },
  { label: "$25", credits: 15625 },
];

function isFixed(costs: DurationCosts | FixedCost): costs is FixedCost {
  return "fixed" in costs;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

function genColor(gens: number): string {
  if (gens > 20) return "#10b981";
  if (gens >= 5) return "#f59e0b";
  return "#ef4444";
}

const FeatureBadge = ({ label, icon }: { label: string; icon: React.ReactNode }) => (
  <span
    style={{
      fontSize: 10,
      padding: "2px 7px",
      borderRadius: 5,
      background: "rgba(255,255,255,0.05)",
      color: "#94a3b8",
      display: "inline-flex",
      alignItems: "center",
      gap: 3,
    }}
  >
    {icon} {label}
  </span>
);

const CostCalculator = () => {
  const isMobile = useIsMobile();
  const [keyCount, setKeyCount] = useState(1);
  const [creditsPerKey, setCreditsPerKey] = useState(3125);

  const totalCredits = keyCount * creditsPerKey;

  // Find the max generations across all models for progress bar scaling
  const analysis = useMemo(() => {
    let maxGens = 0;
    let bestModel = "";
    let bestGens = 0;
    let bestDuration = 0;

    const results = MODELS.map((model) => {
      const durations: { dur: number; cost: number; gens: number; totalSec: number }[] = [];

      if (isFixed(model.costs)) {
        const gens = Math.floor(totalCredits / model.costs.fixed);
        if (gens > maxGens) maxGens = gens;
        durations.push({ dur: 0, cost: model.costs.fixed, gens, totalSec: 0 });
        if (gens > bestGens) { bestGens = gens; bestModel = model.name; bestDuration = 0; }
      } else {
        for (const [durStr, cost] of Object.entries(model.costs)) {
          const dur = Number(durStr);
          const gens = Math.floor(totalCredits / cost);
          if (gens > maxGens) maxGens = gens;
          durations.push({ dur, cost, gens, totalSec: gens * dur });
          if (gens > bestGens) { bestGens = gens; bestModel = model.name; bestDuration = dur; }
        }
      }

      return { model, durations };
    });

    return { results, maxGens, bestModel, bestGens, bestDuration };
  }, [totalCredits]);

  const categories = ["Kling", "Veo", "Hailuo", "Motion"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* INPUT PANEL */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: isMobile ? 18 : 24,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#e2e8f0",
            margin: "0 0 20px",
            fontFamily: "'Space Grotesk', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Zap size={18} style={{ color: "#a78bfa" }} /> Simulador de Produção
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          {/* Key count */}
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, display: "block" }}>
              Quantidade de Keys
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={1}
                max={50}
                value={keyCount}
                onChange={(e) => setKeyCount(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#7c3aed" }}
              />
              <input
                type="number"
                min={1}
                max={50}
                value={keyCount}
                onChange={(e) => setKeyCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                style={{
                  width: 56,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  padding: "6px 8px",
                  fontSize: 15,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Credits per key */}
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, display: "block" }}>
              Creditos por Key
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={500}
                max={25000}
                step={500}
                value={creditsPerKey}
                onChange={(e) => setCreditsPerKey(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#7c3aed" }}
              />
              <input
                type="number"
                min={500}
                max={25000}
                step={500}
                value={creditsPerKey}
                onChange={(e) => setCreditsPerKey(Math.max(500, Math.min(25000, Number(e.target.value) || 500)))}
                style={{
                  width: 72,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  padding: "6px 8px",
                  fontSize: 15,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  textAlign: "center",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setCreditsPerKey(p.credits)}
                  style={{
                    fontSize: 11,
                    padding: "5px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: creditsPerKey === p.credits ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                    color: creditsPerKey === p.credits ? "#a78bfa" : "#64748b",
                    border: creditsPerKey === p.credits ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {p.label} ({p.credits.toLocaleString()})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            borderRadius: 12,
            background: "rgba(124,58,237,0.08)",
            border: "1px solid rgba(124,58,237,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {keyCount} key{keyCount > 1 ? "s" : ""} x {creditsPerKey.toLocaleString()} creditos =
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#a78bfa",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {totalCredits.toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: "#94a3b8" }}>creditos totais</span>
        </div>
      </div>

      {/* MODEL GRID BY CATEGORY */}
      {categories.map((cat) => {
        const catModels = analysis.results.filter((r) => r.model.category === cat);
        if (catModels.length === 0) return null;
        const color = CATEGORY_COLORS[cat];

        return (
          <div key={cat}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 700,
                color,
                marginBottom: 12,
                fontFamily: "'Space Grotesk', sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              {cat}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 10,
              }}
            >
              {catModels.map(({ model, durations }, idx) => (
                <div
                  key={model.name}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${color}18`,
                    borderRadius: 14,
                    padding: isMobile ? 14 : 18,
                    animation: `slide-up 0.4s ease-out ${idx * 0.04}s both`,
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Model header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#e2e8f0",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {model.name}
                    </span>
                    {analysis.bestModel === model.name && (
                      <span
                        style={{
                          fontSize: 9,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(16,185,129,0.12)",
                          color: "#10b981",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Best Value
                      </span>
                    )}
                  </div>

                  {/* Feature badges */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                    {model.features.audio && <FeatureBadge label="Audio" icon={<Volume2 size={9} />} />}
                    {model.features.startFrame && <FeatureBadge label="Start Frame" icon={<ImageIcon size={9} />} />}
                    {model.features.endFrame && <FeatureBadge label="End Frame" icon={<ImageIcon size={9} />} />}
                    {model.features.imageRef && <FeatureBadge label="Img Ref" icon={<Film size={9} />} />}
                    {model.features.videoRef && <FeatureBadge label="Vid Ref" icon={<Video size={9} />} />}
                  </div>

                  {/* Duration rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {durations.map((d) => {
                      const barPct = analysis.maxGens > 0 ? (d.gens / analysis.maxGens) * 100 : 0;
                      const gColor = genColor(d.gens);
                      return (
                        <div key={d.dur}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <span style={{ fontSize: 11, color: "#64748b" }}>
                              {d.dur > 0 ? `${d.dur}s` : "Fixo"} — {d.cost.toLocaleString()} cr
                            </span>
                            <span
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: gColor,
                                fontFamily: "'Space Grotesk', sans-serif",
                              }}
                            >
                              {d.gens}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div
                            style={{
                              height: 4,
                              borderRadius: 2,
                              background: "rgba(255,255,255,0.05)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${barPct}%`,
                                background: gColor,
                                borderRadius: 2,
                                transition: "width 0.4s ease-out",
                              }}
                            />
                          </div>
                          {d.totalSec > 0 && (
                            <div style={{ fontSize: 10, color: "#475569", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                              <Clock size={9} /> {formatTime(d.totalSec)} de conteudo
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* SUMMARY */}
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: isMobile ? 18 : 24,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#e2e8f0",
            margin: "0 0 16px",
            fontFamily: "'Space Grotesk', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Trophy size={16} style={{ color: "#f59e0b" }} /> Resumo Comparativo
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {/* Best value */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 10, color: "#10b981", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              Melhor Custo-Beneficio
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", margin: "0 0 2px", fontFamily: "'Space Grotesk', sans-serif" }}>
              {analysis.bestModel}
            </p>
            {analysis.bestDuration > 0 && (
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                {analysis.bestDuration}s — {analysis.bestGens} geracoes
              </p>
            )}
            {analysis.bestDuration === 0 && (
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                {analysis.bestGens} geracoes
              </p>
            )}
          </div>

          {/* Total content time for best model */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(124,58,237,0.06)",
              border: "1px solid rgba(124,58,237,0.15)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 10, color: "#a78bfa", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              Tempo de Conteudo (melhor)
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              {analysis.bestDuration > 0 ? formatTime(analysis.bestGens * analysis.bestDuration) : "N/A"}
            </p>
          </div>

          {/* Credit efficiency */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.15)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 10, color: "#3b82f6", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              Creditos por Key
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              {creditsPerKey.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCalculator;
