import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clapperboard } from "lucide-react";
import { toast } from "sonner";
import ModeCard from "@/components/ModeCard";
import ChipSelect from "@/components/ChipSelect";
import SceneCard from "@/components/SceneCard";
import DirectorSkeleton from "@/components/DirectorSkeleton";
import {
  MODES,
  PLATFORMS,
  DESTINATIONS,
  OBJECTIVES,
  type DirectorResult,
  type DirectorConfig,
} from "@/lib/director-types";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-script`;

interface DirectorFormProps {
  onGenerated?: (result: DirectorResult, config: DirectorConfig, rawContent: string) => void;
}

/** Extract JSON object from messy text — tolerant of markdown fences, trailing text, etc. */
function extractJSON(raw: string): DirectorResult {
  // Strip markdown fences
  let text = raw.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // Find outermost { ... }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("truncated");
  }

  let jsonStr = text.substring(start, end + 1);

  // Fix trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");

  // Check balanced braces
  let depth = 0;
  for (const ch of jsonStr) {
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
  }
  if (depth !== 0) throw new Error("truncated");

  const parsed = JSON.parse(jsonStr);
  if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
    throw new Error("invalid_structure");
  }
  return parsed as DirectorResult;
}

const DirectorForm = ({ onGenerated }: DirectorFormProps) => {
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

      // Robust SSE parsing with text buffer
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep last potentially incomplete line in buffer
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
          } catch {
            // Partial JSON chunk — skip safely
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith("data: ") && trimmed.slice(6).trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(trimmed.slice(6).trim());
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch { /* skip */ }
        }
      }

      if (!fullText.trim()) {
        throw new Error("empty");
      }

      // Tolerant JSON extraction
      const parsed = extractJSON(fullText);
      setResult(parsed);
      onGenerated?.(parsed, config, fullText);
    } catch (err: any) {
      console.error("Director error:", err);
      const msg = err?.message || "";
      if (msg === "truncated") {
        setError("Resposta truncada — tente simplificar o roteiro ou reduzir o tamanho.");
      } else if (msg === "invalid_structure") {
        setError("Resposta sem estrutura de cenas válida. Tente novamente.");
      } else if (msg === "empty") {
        setError("Nenhuma resposta recebida. Tente novamente.");
      } else {
        setError("Erro ao processar. Tente novamente ou simplifique o roteiro.");
      }
    } finally {
      setLoading(false);
    }
  }, [script, mode, platform, destination, objective, audience, hasDirection, onGenerated]);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clapperboard className="h-5 w-5 text-primary" />
            </div>
            <span>Diretor de Vídeo AI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Script input */}
          <div className="space-y-2">
            <Label>Roteiro</Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder='Cole seu roteiro aqui... Pode ser bruto ("mulher descobre que...") ou com direção artística completa.'
              rows={5}
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={hasDirection} onCheckedChange={(v) => setHasDirection(!!v)} />
              <span className="text-xs text-muted-foreground">Roteiro já contém direção artística</span>
            </label>
          </div>

          {/* Mode selection */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Modo de Produção</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map((m) => (
                <ModeCard key={m.id} mode={m} selected={mode === m.id} onClick={() => setMode(m.id)} />
              ))}
            </div>
          </div>

          {/* Chips row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChipSelect options={PLATFORMS} value={platform} onChange={setPlatform} label="Engine" />
            <ChipSelect options={DESTINATIONS} value={destination} onChange={setDestination} label="Destino" />
            <ChipSelect options={OBJECTIVES} value={objective} onChange={setObjective} label="Objetivo" />
          </div>

          {/* Audience */}
          <div className="space-y-2">
            <Label>
              Público-alvo <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Ex: Mulheres 25-40 interessadas em skincare"
              className="transition-all duration-300 focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>

          <Button
            onClick={generate}
            disabled={loading || !script.trim()}
            className="w-full gap-2 h-12 text-base font-bold tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Diretor processando...
              </div>
            ) : (
              <>
                <Clapperboard className="h-4 w-4" />
                DIRIGIR →
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive animate-fade-in">
          {error}
        </div>
      )}

      {loading && <DirectorSkeleton />}

      {result && (
        <div className="space-y-4 animate-fade-in">
          {result.director_notes && (
            <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm animate-fade-in">
              <CardContent className="p-5">
                <h3 className="text-xs font-bold text-primary tracking-wider mb-2">💭 RACIOCÍNIO DO DIRETOR</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.director_notes}</p>
              </CardContent>
            </Card>
          )}

          {result.workflow_summary && (
            <Card className="border-accent/20 bg-accent/5 backdrop-blur-sm animate-fade-in" style={{ animationDelay: "100ms" }}>
              <CardContent className="p-5">
                <h3 className="text-xs font-bold text-accent tracking-wider mb-2">📋 WORKFLOW DE EXECUÇÃO</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.workflow_summary}</p>
              </CardContent>
            </Card>
          )}

          <h2 className="text-base font-bold">
            CENAS <span className="text-muted-foreground font-normal">({result.scenes?.length ?? 0})</span>
          </h2>
          {result.scenes?.map((scene, i) => (
            <SceneCard key={i} scene={scene} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectorForm;
