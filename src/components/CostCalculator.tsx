import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Volume2, ImageIcon, Film, Video, Trophy, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";

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

const CATEGORY_COLORS: Record<string, string> = { Kling: "#7c3aed", Veo: "#10b981", Hailuo: "#3b82f6", Motion: "#6b7280" };

const PRESETS = [
  { label: "$5 Pro", credits: 3125 },
  { label: "$10", credits: 6250 },
  { label: "$25", credits: 15625 },
];

function isFixed(costs: DurationCosts | FixedCost): costs is FixedCost { return "fixed" in costs; }
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
  <span className="badge-muted flex items-center gap-1">
    {icon} {label}
  </span>
);

const CostCalculator = () => {
  const isMobile = useIsMobile();
  const [keyCount, setKeyCount] = useState(1);
  const [creditsPerKey, setCreditsPerKey] = useState(3125);
  const totalCredits = keyCount * creditsPerKey;

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
    <div className="flex flex-col gap-8">
      {/* INPUT PANEL */}
      <GlassCard className={isMobile ? "p-5" : "p-7"}>
        <h2 className="text-title text-foreground mb-6 flex items-center gap-3">
          <div className="icon-container icon-container-md rounded-xl glow-sm">
            <Zap size={18} className="text-primary" />
          </div>
          Simulador de Produção
        </h2>

        <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
          <div>
            <label className="text-label mb-2.5 block">Quantidade de Keys</label>
            <div className="flex items-center gap-3">
              <input type="range" min={1} max={50} value={keyCount} onChange={(e) => setKeyCount(Number(e.target.value))} className="flex-1 accent-primary" />
              <input type="number" min={1} max={50} value={keyCount} onChange={(e) => setKeyCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="input-glass w-16 text-center font-bold text-[15px] p-2" />
            </div>
          </div>
          <div>
            <label className="text-label mb-2.5 block">Créditos por Key</label>
            <div className="flex items-center gap-3">
              <input type="range" min={500} max={25000} step={500} value={creditsPerKey} onChange={(e) => setCreditsPerKey(Number(e.target.value))} className="flex-1 accent-primary" />
              <input type="number" min={500} max={25000} step={500} value={creditsPerKey} onChange={(e) => setCreditsPerKey(Math.max(500, Math.min(25000, Number(e.target.value) || 500)))} className="input-glass w-20 text-center font-bold text-[15px] p-2" />
            </div>
            <div className="flex gap-2 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setCreditsPerKey(p.credits)}
                  className={`text-[11px] px-3 py-2 rounded-xl transition-all duration-200 ${
                    creditsPerKey === p.credits
                      ? "text-primary font-semibold surface-primary"
                      : "text-muted-foreground surface-muted"
                  }`}
                >
                  {p.label} ({p.credits.toLocaleString()})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 p-5 rounded-xl flex items-center justify-center gap-2 flex-wrap surface-primary">
          <span className="text-body text-muted-foreground">{keyCount} key{keyCount > 1 ? "s" : ""} × {creditsPerKey.toLocaleString()} =</span>
          <span className="text-3xl font-extrabold text-primary">
            <AnimatedNumber value={totalCredits} />
          </span>
          <span className="text-body text-muted-foreground">créditos</span>
        </div>
      </GlassCard>

      {/* MODEL GRID */}
      {categories.map((cat) => {
        const catModels = analysis.results.filter((r) => r.model.category === cat);
        if (catModels.length === 0) return null;
        const color = CATEGORY_COLORS[cat];

        return (
          <div key={cat}>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2.5" style={{ color }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {cat}
            </h3>
            <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"}`}>
              {catModels.map(({ model, durations }, idx) => (
                <GlassCard key={model.name} className="animate-slide-up group hover:border-white/[0.12] transition-all" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div className={isMobile ? "p-4" : "p-5"}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-foreground">{model.name}</span>
                      {analysis.bestModel === model.name && (
                        <span className="badge-success uppercase tracking-wide">Best</span>
                      )}
                    </div>

                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {model.features.audio && <FeatureBadge label="Audio" icon={<Volume2 size={9} />} />}
                      {model.features.startFrame && <FeatureBadge label="Start" icon={<ImageIcon size={9} />} />}
                      {model.features.endFrame && <FeatureBadge label="End" icon={<ImageIcon size={9} />} />}
                      {model.features.imageRef && <FeatureBadge label="Img" icon={<Film size={9} />} />}
                      {model.features.videoRef && <FeatureBadge label="Vid" icon={<Video size={9} />} />}
                    </div>

                    <div className="flex flex-col gap-3">
                      {durations.map((d) => {
                        const barPct = analysis.maxGens > 0 ? (d.gens / analysis.maxGens) * 100 : 0;
                        const gColor = genColor(d.gens);
                        return (
                          <div key={d.dur}>
                            <div className="flex justify-between items-baseline mb-1.5">
                              <span className="text-caption">{d.dur > 0 ? `${d.dur}s` : "Fixo"} — {d.cost.toLocaleString()} cr</span>
                              <span className="text-lg font-extrabold" style={{ color: gColor }}>{d.gens}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barPct}%`, background: `linear-gradient(90deg, ${gColor}, ${gColor}80)` }} />
                            </div>
                            {d.totalSec > 0 && (
                              <div className="text-[10px] text-muted-foreground/40 mt-1 flex items-center gap-1">
                                <Clock size={9} /> {formatTime(d.totalSec)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}

      {/* SUMMARY */}
      <GlassCard className={isMobile ? "p-5" : "p-7"}>
        <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
          <Trophy size={18} className="text-warning" /> Resumo Comparativo
        </h3>
        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
          <div className="p-5 rounded-xl text-center surface-success">
            <p className="text-overline mb-1.5 text-success">Melhor Custo-Benefício</p>
            <p className="text-base font-extrabold text-foreground">{analysis.bestModel}</p>
            <p className="text-caption">{analysis.bestDuration > 0 ? `${analysis.bestDuration}s — ${analysis.bestGens} gerações` : `${analysis.bestGens} gerações`}</p>
          </div>
          <div className="p-5 rounded-xl text-center surface-primary">
            <p className="text-overline mb-1.5 text-primary">Tempo de Conteúdo</p>
            <p className="text-base font-extrabold text-foreground">{analysis.bestDuration > 0 ? formatTime(analysis.bestGens * analysis.bestDuration) : "N/A"}</p>
          </div>
          <div className="p-5 rounded-xl text-center" style={{ background: "hsl(217 91% 60% / 0.05)", border: "1px solid hsl(217 91% 60% / 0.12)" }}>
            <p className="text-overline mb-1.5" style={{ color: "#3b82f6" }}>Créditos por Key</p>
            <p className="text-base font-extrabold text-foreground">{creditsPerKey.toLocaleString()}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CostCalculator;
