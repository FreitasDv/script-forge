import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

interface GenerateFormProps {
  onGenerated: (content: string, meta: { type: string; tone: string; size: string; context: string }) => void;
  initialValues?: { type?: string; tone?: string; size?: string; context?: string };
}

const GenerateForm = ({ onGenerated, initialValues }: GenerateFormProps) => {
  const [type, setType] = useState(initialValues?.type || "");
  const [tone, setTone] = useState(initialValues?.tone || "");
  const [size, setSize] = useState(initialValues?.size || "");
  const [context, setContext] = useState(initialValues?.context || "");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");

  const typeLabels: Record<string, string> = {
    video: "📹 Roteiro de Vídeo/YouTube",
    commercial: "📢 Roteiro Comercial",
    prompt: "🤖 Prompt para IA",
  };

  const toneOptions = ["formal", "casual", "persuasivo", "educativo", "divertido", "inspirador"];
  const sizeLabels: Record<string, string> = { short: "Curto", medium: "Médio", long: "Longo" };

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
        onDelta: (chunk) => {
          accumulated += chunk;
          setResult(accumulated);
        },
        onDone: () => {
          setGenerating(false);
          onGenerated(accumulated, { type, tone, size, context });
        },
        onError: (err) => {
          toast.error(err);
          setGenerating(false);
        },
      });
    } catch {
      toast.error("Erro ao gerar conteúdo");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">📹 Vídeo/YouTube</SelectItem>
                  <SelectItem value="commercial">📢 Comercial</SelectItem>
                  <SelectItem value="prompt">🤖 Prompt para IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue placeholder="Selecione o tom" /></SelectTrigger>
                <SelectContent>
                  {toneOptions.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger><SelectValue placeholder="Selecione o tamanho" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Curto</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="long">Longo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tema / Contexto</Label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Descreva o que você deseja gerar. Ex: Tutorial sobre como usar o ChatGPT para criar posts no Instagram..."
              rows={4}
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Gerando..." : "Gerar com IA"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">{result}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GenerateForm;
