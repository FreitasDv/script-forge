import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import ModeCard from "@/components/ModeCard";
import ChipSelect from "@/components/ChipSelect";
import SceneCard from "@/components/SceneCard";
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

      // Read streamed response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch { /* partial chunk */ }
        }
      }

      // Parse JSON from response
      const cleaned = fullText.replace(/```json|```/g, "").trim();
      const parsed: DirectorResult = JSON.parse(cleaned);
      setResult(parsed);
      onGenerated?.(parsed, config, fullText);
    } catch (err) {
      console.error(err);
      setError("Erro ao processar. Tente novamente ou simplifique o roteiro.");
    } finally {
      setLoading(false);
    }
  }, [script, mode, platform, destination, objective, audience, hasDirection, onGenerated]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5 text-primary" />
            Diretor de Vídeo AI
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
            />
          </div>

          <Button onClick={generate} disabled={loading || !script.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
            {loading ? "Diretor processando..." : "DIRIGIR →"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.director_notes && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <h3 className="text-xs font-bold text-primary tracking-wider mb-2">💭 RACIOCÍNIO DO DIRETOR</h3>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{result.director_notes}</p>
              </CardContent>
            </Card>
          )}

          {result.workflow_summary && (
            <Card className="border-accent/20 bg-accent/5">
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
