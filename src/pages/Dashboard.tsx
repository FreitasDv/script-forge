import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Sparkles, Film, Megaphone, Bot, LogOut, Plus, Search, Star, Copy, Trash2 } from "lucide-react";
import GenerateForm from "@/components/GenerateForm";
import SaveScriptDialog from "@/components/SaveScriptDialog";
import { templates, type Template } from "@/lib/templates";

type Script = {
  id: string;
  title: string;
  content: string;
  type: string;
  tone: string | null;
  size: string | null;
  category: string | null;
  is_favorite: boolean;
  created_at: string;
};

type Tab = "generate" | "templates" | "saved";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("generate");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedMeta, setGeneratedMeta] = useState<{ type: string; tone: string; size: string; context: string } | null>(null);
  const [formInitial, setFormInitial] = useState<{ type?: string; tone?: string; size?: string; context?: string } | undefined>();
  const [counts, setCounts] = useState({ video: 0, commercial: 0, prompt: 0 });

  const fetchScripts = async () => {
    const { data } = await supabase
      .from("scripts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setScripts(data as Script[]);
      setCounts({
        video: data.filter((s) => s.type === "video").length,
        commercial: data.filter((s) => s.type === "commercial").length,
        prompt: data.filter((s) => s.type === "prompt").length,
      });
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleGenerated = (content: string, meta: { type: string; tone: string; size: string; context: string }) => {
    setGeneratedContent(content);
    setGeneratedMeta(meta);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await supabase.from("scripts").update({ is_favorite: !current }).eq("id", id);
    fetchScripts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("scripts").delete().eq("id", id);
    toast.success("Roteiro excluído");
    fetchScripts();
  };

  const handleUseTemplate = (t: Template) => {
    setFormInitial({ type: t.type, tone: t.tone, size: t.size, context: t.context + " " });
    setTab("generate");
  };

  const filteredScripts = scripts.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType ? s.type === filterType : true;
    return matchSearch && matchType;
  });

  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return <Film className="h-4 w-4" />;
      case "commercial": return <Megaphone className="h-4 w-4" />;
      case "prompt": return <Bot className="h-4 w-4" />;
      default: return null;
    }
  };

  const typeLabel = (type: string) => {
    switch (type) {
      case "video": return "Vídeo";
      case "commercial": return "Comercial";
      case "prompt": return "Prompt";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">ScriptAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/auth"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Film className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{counts.video}</p>
                <p className="text-xs text-muted-foreground">Vídeos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{counts.commercial}</p>
                <p className="text-xs text-muted-foreground">Comerciais</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{counts.prompt}</p>
                <p className="text-xs text-muted-foreground">Prompts</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b pb-2">
          <Button variant={tab === "generate" ? "default" : "ghost"} onClick={() => setTab("generate")} className="gap-2">
            <Plus className="h-4 w-4" /> Gerar
          </Button>
          <Button variant={tab === "templates" ? "default" : "ghost"} onClick={() => setTab("templates")} className="gap-2">
            <Sparkles className="h-4 w-4" /> Templates
          </Button>
          <Button variant={tab === "saved" ? "default" : "ghost"} onClick={() => setTab("saved")} className="gap-2">
            <Search className="h-4 w-4" /> Meus Roteiros
          </Button>
        </div>

        {/* Generate tab */}
        {tab === "generate" && (
          <div className="space-y-4">
            <GenerateForm key={JSON.stringify(formInitial)} onGenerated={handleGenerated} initialValues={formInitial} />
            {generatedContent && generatedMeta && (
              <div className="flex gap-2">
                <SaveScriptDialog
                  content={generatedContent}
                  type={generatedMeta.type}
                  tone={generatedMeta.tone}
                  size={generatedMeta.size}
                  onSaved={fetchScripts}
                />
                <Button variant="outline" onClick={() => handleCopy(generatedContent)} className="gap-2">
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Templates tab */}
        {tab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => handleUseTemplate(t)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-2xl">{t.icon}</span>
                    {t.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                  <div className="flex gap-2">
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">{typeLabel(t.type)}</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">{t.tone}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Saved scripts tab */}
        {tab === "saved" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar roteiros..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant={filterType === "" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterType("")}>Todos</Button>
              <Button variant={filterType === "video" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterType("video")}>Vídeo</Button>
              <Button variant={filterType === "commercial" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterType("commercial")}>Comercial</Button>
              <Button variant={filterType === "prompt" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterType("prompt")}>Prompt</Button>
            </div>

            {filteredScripts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum roteiro encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScripts.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {typeIcon(s.type)}
                            <h3 className="font-semibold truncate">{s.title}</h3>
                            {s.category && (
                              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{s.category}</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{s.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(s.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleFavorite(s.id, s.is_favorite)}>
                            <Star className={`h-4 w-4 ${s.is_favorite ? "fill-warning text-warning" : ""}`} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(s.content)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
