import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import GenerateForm from "@/components/GenerateForm";
import SaveScriptDialog from "@/components/SaveScriptDialog";
import DirectorForm from "@/components/DirectorForm";
import KeyManager from "@/components/KeyManager";
import CostCalculator from "@/components/CostCalculator";
import { templates, type Template } from "@/lib/templates";
import type { DirectorResult, DirectorConfig } from "@/lib/director-types";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Video, Megaphone, Sparkles, Clapperboard, Wand2, LayoutTemplate, Archive, LogOut,
  Copy, Star, Trash2, Search, GraduationCap, Zap, Smartphone, Brain, Briefcase,
  Mail, Image, FileText, BarChart3, Key, Calculator,
} from "lucide-react";

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

type Tab = "generate" | "director" | "templates" | "saved" | "keys" | "calculator";

const typeIconMap: Record<string, ReactNode> = {
  video: <Video size={16} aria-hidden="true" />,
  commercial: <Megaphone size={16} aria-hidden="true" />,
  prompt: <Sparkles size={16} aria-hidden="true" />,
  director: <Clapperboard size={16} aria-hidden="true" />,
};
const typeLabels: Record<string, string> = { video: "Vídeo", commercial: "Comercial", prompt: "Prompt", director: "Diretor" };

const templateIconMap: Record<string, ReactNode> = {
  GraduationCap: <GraduationCap size={22} aria-hidden="true" />,
  Star: <Star size={22} aria-hidden="true" />,
  Video: <Video size={22} aria-hidden="true" />,
  Zap: <Zap size={22} aria-hidden="true" />,
  Megaphone: <Megaphone size={22} aria-hidden="true" />,
  Briefcase: <Briefcase size={22} aria-hidden="true" />,
  Mail: <Mail size={22} aria-hidden="true" />,
  Image: <Image size={22} aria-hidden="true" />,
  FileText: <FileText size={22} aria-hidden="true" />,
  BarChart3: <BarChart3 size={22} aria-hidden="true" />,
  Smartphone: <Smartphone size={22} aria-hidden="true" />,
  Brain: <Brain size={22} aria-hidden="true" />,
  Clapperboard: <Clapperboard size={22} aria-hidden="true" />,
};

const statColors = ["#7c3aed", "#f43f5e", "#22d3ee", "#f97316"];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>("generate");
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedMeta, setGeneratedMeta] = useState<{ type: string; tone: string; size: string; context: string } | null>(null);
  const [formInitial, setFormInitial] = useState<{ type?: string; tone?: string; size?: string; context?: string } | undefined>();
  const [counts, setCounts] = useState({ video: 0, commercial: 0, prompt: 0, director: 0 });
  const [directorResult, setDirectorResult] = useState<{ result: DirectorResult; config: DirectorConfig; raw: string } | null>(null);

  const fetchScripts = async () => {
    const { data } = await supabase.from("scripts").select("*").order("created_at", { ascending: false });
    if (data) {
      setScripts(data as Script[]);
      setCounts({
        video: data.filter((s) => s.type === "video").length,
        commercial: data.filter((s) => s.type === "commercial").length,
        prompt: data.filter((s) => s.type === "prompt").length,
        director: data.filter((s) => s.type === "director").length,
      });
    }
  };

  useEffect(() => { fetchScripts(); }, []);

  const handleGenerated = (content: string, meta: { type: string; tone: string; size: string; context: string }) => {
    setGeneratedContent(content);
    setGeneratedMeta(meta);
  };

  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); };
  const handleToggleFavorite = async (id: string, current: boolean) => { await supabase.from("scripts").update({ is_favorite: !current }).eq("id", id); fetchScripts(); };
  const handleDelete = async (id: string) => { await supabase.from("scripts").delete().eq("id", id); toast.success("Roteiro excluído"); fetchScripts(); };
  const handleUseTemplate = (t: Template) => { setFormInitial({ type: t.type, tone: t.tone, size: t.size, context: t.context + " " }); setTab("generate"); };

  const filteredScripts = scripts.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType ? s.type === filterType : true;
    return matchSearch && matchType;
  });

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "generate", label: "Gerar", icon: <Wand2 size={16} aria-hidden="true" /> },
    { id: "director", label: "Diretor", icon: <Clapperboard size={16} aria-hidden="true" /> },
    { id: "templates", label: "Templates", icon: <LayoutTemplate size={16} aria-hidden="true" /> },
    { id: "saved", label: `Salvos${scripts.length ? ` (${scripts.length})` : ""}`, icon: <Archive size={16} aria-hidden="true" /> },
    { id: "keys", label: "Keys", icon: <Key size={16} aria-hidden="true" /> },
    { id: "calculator", label: "Custos", icon: <Calculator size={16} aria-hidden="true" /> },
  ];

  const stats = [
    { label: "Roteiros de Vídeo", sub: "salvos", count: counts.video, icon: <Video size={20} aria-hidden="true" /> },
    { label: "Scripts Comerciais", sub: "salvos", count: counts.commercial, icon: <Megaphone size={20} aria-hidden="true" /> },
    { label: "Prompts IA", sub: "salvos", count: counts.prompt, icon: <Sparkles size={20} aria-hidden="true" /> },
    { label: "Produções Diretor", sub: "salvas", count: counts.director, icon: <Clapperboard size={20} aria-hidden="true" /> },
  ];

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-background relative noise">
      {/* Header */}
      <header
        role="banner"
        className="glass sticky top-0 z-50"
        style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <div className={`max-w-[960px] mx-auto flex items-center justify-between ${isMobile ? "px-4 py-3" : "px-6 py-3.5"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.12)" }}>
              <Wand2 size={16} className="text-primary" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">
              <GradientText>ScriptAI</GradientText>
            </h1>
            {!isMobile && (
              <span className="ml-2 text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary) / 0.6)" }}>
                {tabs.find(t => t.id === tab)?.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isMobile && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                  {userInitials}
                </div>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => { signOut(); navigate("/auth"); }}
              aria-label="Sair da conta"
              className="btn-ghost px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <LogOut size={14} aria-hidden="true" />
              {!isMobile && "Sair"}
            </button>
          </div>
        </div>
        {/* Gradient fade separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)" }} />
      </header>

      <main role="main" aria-label="Painel principal" className={`max-w-[960px] mx-auto ${isMobile ? "px-4 py-5" : "px-6 py-7"}`}>
        {/* Stats */}
        <section aria-label="Estatísticas de roteiros" className={`grid gap-3 mb-6 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {stats.map((s, i) => (
            <GlassCard
              key={s.label}
              glow={statColors[i]}
              className="animate-slide-up group cursor-default"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div role="status" aria-label={`${s.count} ${s.label} ${s.sub}`} className={`flex items-center gap-3 ${isMobile ? "p-3" : "p-4"}`}>
                <div
                  className="flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    width: isMobile ? 36 : 42,
                    height: isMobile ? 36 : 42,
                    background: `${statColors[i]}12`,
                    color: statColors[i],
                    boxShadow: `0 0 20px ${statColors[i]}10`,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className={`font-extrabold text-foreground ${isMobile ? "text-xl" : "text-2xl"}`} style={{ color: s.count > 0 ? statColors[i] : undefined }}>
                    <AnimatedNumber value={s.count} />
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
                </div>
              </div>
              {/* Sparkline decoration */}
              <svg className="absolute bottom-0 left-0 right-0 h-8 opacity-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d={`M0,18 Q15,${8 + i * 3} 30,12 T60,${10 - i} T100,14 V20 H0 Z`} fill={statColors[i]} />
              </svg>
            </GlassCard>
          ))}
        </section>

        {/* Tabs */}
        <nav
          role="tablist"
          aria-label="Navegação do painel"
          className="no-scrollbar flex gap-1 mb-6 overflow-x-auto pb-1 relative"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-[13px] rounded-lg transition-all duration-200 ${
                  isMobile ? "px-3.5 py-2" : "px-4 py-2.5"
                } ${isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground font-medium hover:text-foreground"
                }`}
                style={isActive ? {
                  background: "hsl(var(--primary) / 0.1)",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.08)",
                } : { background: "transparent" }}
              >
                {t.icon} {t.label}
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />}
              </button>
            );
          })}
          {/* Fade edges on mobile */}
          {isMobile && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-4 pointer-events-none" style={{ background: "linear-gradient(90deg, hsl(var(--background)), transparent)" }} />
              <div className="absolute right-0 top-0 bottom-0 w-4 pointer-events-none" style={{ background: "linear-gradient(270deg, hsl(var(--background)), transparent)" }} />
            </>
          )}
        </nav>

        {/* Generate tab — persistent */}
        <section id="panel-generate" role="tabpanel" aria-label="Gerar conteúdo" className="flex flex-col gap-4" style={{ display: tab === "generate" ? "block" : "none" }}>
          <GenerateForm onGenerated={handleGenerated} initialValues={formInitial} />
          {generatedContent && generatedMeta && (
            <div className="flex gap-2 flex-wrap mt-4">
              <SaveScriptDialog content={generatedContent} type={generatedMeta.type} tone={generatedMeta.tone} size={generatedMeta.size} onSaved={fetchScripts} />
              <button
                type="button"
                onClick={() => handleCopy(generatedContent)}
                aria-label="Copiar conteúdo gerado"
                className="btn-ghost px-4 py-2.5 text-[13px] flex items-center gap-1.5"
              >
                <Copy size={14} aria-hidden="true" /> Copiar
              </button>
            </div>
          )}
        </section>

        {/* Director tab — persistent */}
        <section id="panel-director" role="tabpanel" aria-label="Modo Diretor" className="flex flex-col gap-4" style={{ display: tab === "director" ? "block" : "none" }}>
          <DirectorForm onGenerated={(result, config, raw) => setDirectorResult({ result, config, raw })} />
          {directorResult && (
            <div className="flex gap-2 mt-4">
              <SaveScriptDialog content={JSON.stringify(directorResult.result, null, 2)} type="director" tone={directorResult.config.mode} size={(() => {
                const scenes = directorResult.result?.scenes;
                if (!scenes?.length) return "medium";
                let totalSeconds = 0;
                for (const scene of scenes) {
                  const match = scene.duration?.match(/(\d+)/);
                  totalSeconds += match ? parseInt(match[1], 10) : 8;
                }
                if (totalSeconds < 20) return "short";
                if (totalSeconds <= 45) return "medium";
                return "long";
              })()} onSaved={fetchScripts} />
            </div>
          )}
        </section>

        {/* Templates tab — persistent */}
        <section id="panel-templates" role="tabpanel" aria-label="Templates disponíveis" className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"}`} style={{ display: tab === "templates" ? "grid" : "none" }}>
          {templates.map((t, i) => (
            <GlassCard
              key={t.id}
              hover
              className="cursor-pointer animate-slide-up group"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => handleUseTemplate(t)}
            >
              <div className={`${isMobile ? "p-4" : "p-5"}`} role="button" aria-label={`Usar template: ${t.name}`}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-primary flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{templateIconMap[t.iconName] || <Sparkles size={22} aria-hidden="true" />}</span>
                  <span className="text-[15px] font-bold text-foreground">{t.name}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">{t.description}</p>
                <div className="flex gap-1.5">
                  <span className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground" style={{ background: "hsl(0 0% 100% / 0.04)" }}>{typeLabels[t.type] || t.type}</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-md text-muted-foreground capitalize" style={{ background: "hsl(0 0% 100% / 0.04)" }}>{t.tone}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>

        {/* Saved scripts tab — persistent */}
        <section id="panel-saved" role="tabpanel" aria-label="Roteiros salvos" className="flex flex-col gap-3" style={{ display: tab === "saved" ? "flex" : "none" }}>
          <div className="flex gap-2 flex-wrap">
            <div className={`flex-1 relative ${isMobile ? "min-w-full" : "min-w-[200px]"}`}>
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" aria-hidden="true" />
              <input
                placeholder="Buscar roteiros..."
                aria-label="Buscar roteiros salvos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-glass pl-10"
              />
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto flex-shrink-0" role="group" aria-label="Filtrar por tipo" style={isMobile ? { width: "100%" } : {}}>
              {["", "video", "commercial", "prompt", "director"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  aria-pressed={filterType === f}
                  className={`flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-xs rounded-lg transition-all duration-200 ${
                    isMobile ? "px-3 py-2" : "px-3.5 py-2"
                  } ${filterType === f
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={filterType === f ? {
                    background: "hsl(var(--primary) / 0.1)",
                    border: "1px solid hsl(var(--primary) / 0.2)",
                  } : {
                    background: "hsl(0 0% 100% / 0.03)",
                    border: "1px solid hsl(var(--glass-border))",
                  }}
                >
                  {f !== "" && typeIconMap[f]} {f === "" ? "Todos" : typeLabels[f] || f}
                </button>
              ))}
            </div>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="text-center py-12 opacity-40" role="status">
              <Archive size={48} className="text-muted-foreground mx-auto mb-2" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">Nenhum roteiro encontrado</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filteredScripts.map((s, i) => (
                <li key={s.id}>
                  <GlassCard hover className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    <article aria-label={`Roteiro: ${s.title}`} className={`flex justify-between gap-3 ${isMobile ? "p-3.5" : "p-5"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-muted-foreground">{typeIconMap[s.type] || <Video size={16} />}</span>
                          <span className="text-sm font-bold text-foreground truncate">{s.title}</span>
                          {s.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md text-muted-foreground flex-shrink-0" style={{ background: "hsl(0 0% 100% / 0.04)" }}>{s.category}</span>
                          )}
                        </div>
                        <p className="text-[13px] text-muted-foreground mb-1.5 leading-relaxed line-clamp-2">{s.content}</p>
                        <time className="text-[11px] text-muted-foreground/40" dateTime={s.created_at}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</time>
                      </div>
                      <div className={`flex gap-0.5 flex-shrink-0 ${isMobile ? "flex-col" : "flex-row"} items-start`}>
                        <button type="button" onClick={() => handleToggleFavorite(s.id, s.is_favorite)} aria-label={s.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: s.is_favorite ? "#facc15" : "hsl(var(--muted-foreground))" }}>
                          <Star size={16} fill={s.is_favorite ? "#facc15" : "none"} />
                        </button>
                        <button type="button" onClick={() => handleCopy(s.content)} aria-label="Copiar" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground">
                          <Copy size={14} />
                        </button>
                        <button type="button" onClick={() => handleDelete(s.id)} aria-label="Excluir" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "hsl(var(--accent))" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Keys tab — persistent */}
        <section id="panel-keys" role="tabpanel" aria-label="Gestão de API Keys" style={{ display: tab === "keys" ? "block" : "none" }}>
          <KeyManager />
        </section>

        {/* Calculator tab — persistent */}
        <section id="panel-calculator" role="tabpanel" aria-label="Calculadora de custos" style={{ display: tab === "calculator" ? "block" : "none" }}>
          <CostCalculator />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
