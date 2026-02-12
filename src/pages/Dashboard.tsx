import { useState, useEffect, useCallback, useMemo, lazy, Suspense, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import GenerateForm from "@/components/GenerateForm";
import SaveScriptDialog from "@/components/SaveScriptDialog";
import DirectorForm from "@/components/DirectorForm";
const KeyManager = lazy(() => import("@/components/KeyManager"));
const CostCalculator = lazy(() => import("@/components/CostCalculator"));
const Studio = lazy(() => import("@/components/Studio"));
import { templates, type Template } from "@/lib/templates";
import type { DirectorResult, DirectorConfig } from "@/lib/director-types";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { AnimatedNumber } from "@/components/ui/animated-number";
import {
  Video, Megaphone, Sparkles, Clapperboard, Wand2, LayoutTemplate, Archive, LogOut,
  Copy, Star, Trash2, Search, GraduationCap, Zap, Smartphone, Brain, Briefcase,
  Mail, Image, FileText, BarChart3, Key, Calculator, Palette,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

type Tab = "generate" | "director" | "templates" | "saved" | "keys" | "calculator" | "studio";

const typeIconMap: Record<string, ReactNode> = {
  video: <Video size={16} aria-hidden="true" />,
  commercial: <Megaphone size={16} aria-hidden="true" />,
  prompt: <Sparkles size={16} aria-hidden="true" />,
  director: <Clapperboard size={16} aria-hidden="true" />,
};
const typeLabels: Record<string, string> = { video: "Vídeo", commercial: "Comercial", prompt: "Prompt", director: "Diretor" };
const typeBadgeColors: Record<string, string> = {
  video: "badge-primary",
  commercial: "badge-accent",
  prompt: "badge-warning",
  director: "badge-success",
};

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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generatedMeta, setGeneratedMeta] = useState<{ type: string; tone: string; size: string; context: string } | null>(null);
  const [formInitial, setFormInitial] = useState<{ type?: string; tone?: string; size?: string; context?: string } | undefined>();
  const [directorResult, setDirectorResult] = useState<{ result: DirectorResult; config: DirectorConfig; raw: string } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchScripts = useCallback(async () => {
    const { data } = await supabase.from("scripts").select("*").order("created_at", { ascending: false });
    if (data) {
      setScripts(data as Script[]);
    }
  }, []);

  const counts = useMemo(() => ({
    video: scripts.filter((s) => s.type === "video").length,
    commercial: scripts.filter((s) => s.type === "commercial").length,
    prompt: scripts.filter((s) => s.type === "prompt").length,
    director: scripts.filter((s) => s.type === "director").length,
  }), [scripts]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const handleGenerated = useCallback((content: string, meta: { type: string; tone: string; size: string; context: string }) => {
    setGeneratedContent(content);
    setGeneratedMeta(meta);
  }, []);

  const handleCopy = useCallback((text: string) => { navigator.clipboard.writeText(text); toast.success("Copiado!"); }, []);
  const handleToggleFavorite = useCallback(async (id: string, current: boolean) => { await supabase.from("scripts").update({ is_favorite: !current }).eq("id", id); fetchScripts(); }, [fetchScripts]);
  const handleDelete = useCallback(async (id: string) => { await supabase.from("scripts").delete().eq("id", id); toast.success("Roteiro excluído"); fetchScripts(); }, [fetchScripts]);
  const handleUseTemplate = useCallback((t: Template) => { setFormInitial({ type: t.type, tone: t.tone, size: t.size, context: t.context + " " }); setTab("generate"); }, []);

  const filteredScripts = useMemo(() => scripts.filter((s) => {
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q);
    const matchType = filterType ? s.type === filterType : true;
    return matchSearch && matchType;
  }), [scripts, debouncedSearch, filterType]);

  const creationTabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "generate", label: "Gerar", icon: <Wand2 size={18} aria-hidden="true" /> },
    { id: "director", label: "Diretor", icon: <Clapperboard size={18} aria-hidden="true" /> },
    { id: "studio", label: "Studio", icon: <Palette size={18} aria-hidden="true" /> },
    { id: "templates", label: "Templates", icon: <LayoutTemplate size={18} aria-hidden="true" /> },
  ];
  const manageTabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "saved", label: `Salvos${scripts.length ? ` (${scripts.length})` : ""}`, icon: <Archive size={18} aria-hidden="true" /> },
    { id: "keys", label: "Keys", icon: <Key size={18} aria-hidden="true" /> },
    { id: "calculator", label: "Custos", icon: <Calculator size={18} aria-hidden="true" /> },
  ];
  const allTabs = [...creationTabs, ...manageTabs];

  const stats = [
    { label: "Roteiros de Vídeo", sub: "total salvos", count: counts.video, icon: <Video size={22} aria-hidden="true" /> },
    { label: "Scripts Comerciais", sub: "total salvos", count: counts.commercial, icon: <Megaphone size={22} aria-hidden="true" /> },
    { label: "Prompts IA", sub: "total salvos", count: counts.prompt, icon: <Sparkles size={22} aria-hidden="true" /> },
    { label: "Produções Diretor", sub: "total salvas", count: counts.director, icon: <Clapperboard size={22} aria-hidden="true" /> },
  ];

  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "U";

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen bg-background relative noise">
      {/* Skip navigation */}
      <a href="#main-content" className="skip-nav">Pular para o conteúdo principal</a>

      {/* Header */}
      <header role="banner" className="glass sticky top-0 z-50 border-b border-white/[0.06]">
        <div className={`max-w-[1000px] mx-auto flex items-center justify-between ${isMobile ? "px-4 py-3" : "px-8 py-4"}`}>
          <div className="flex items-center gap-3">
            <div className="icon-container icon-container-sm rounded-lg glow-sm">
              <Wand2 size={16} className="text-primary" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tighter">
              <GradientText>ScriptAI</GradientText>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!isMobile && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-primary-foreground ring-2 ring-primary/20"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                  {userInitials}
                </div>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => { signOut(); navigate("/auth"); }}
                  aria-label="Sair da conta"
                  className="btn-ghost p-2.5"
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
          </div>
        </div>
        {/* Gradient separator */}
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />
      </header>

      <main id="main-content" role="main" aria-label="Painel principal" className={`max-w-[1000px] mx-auto ${isMobile ? "px-4 py-6" : "px-8 py-8"}`}>
        {/* Stats */}
        <section aria-label="Estatísticas de roteiros" className={`grid gap-3 mb-8 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
          {stats.map((s, i) => (
            <GlassCard
              key={s.label}
              glow={statColors[i]}
              className="animate-slide-up group cursor-default hover:scale-[1.02] transition-transform duration-300"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div role="status" aria-label={`${s.count} ${s.label}`} className={`flex items-center gap-3.5 ${isMobile ? "p-4" : "p-5"}`}>
                <div
                  className="flex-shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{
                    width: isMobile ? 40 : 46,
                    height: isMobile ? 40 : 46,
                    background: `linear-gradient(135deg, ${statColors[i]}20, ${statColors[i]}08)`,
                    color: statColors[i],
                    boxShadow: `0 0 24px ${statColors[i]}15`,
                  }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className={`font-extrabold text-foreground ${isMobile ? "text-2xl" : "text-3xl"}`} style={{ color: s.count > 0 ? statColors[i] : undefined }}>
                    <AnimatedNumber value={s.count} />
                  </p>
                  <p className="text-caption leading-tight">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground/40 mt-0.5">{s.sub}</p>
                </div>
              </div>
              {/* Sparkline */}
              <svg className="absolute bottom-0 left-0 right-0 h-8 opacity-20" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d={`M0,18 Q15,${8 + i * 3} 30,12 T60,${10 - i} T100,14 V20 H0 Z`} fill={statColors[i]} />
              </svg>
            </GlassCard>
          ))}
        </section>

        {/* Tabs — pill bar */}
        <nav
          role="tablist"
          aria-label="Navegação do painel"
          className="no-scrollbar flex gap-0.5 mb-8 overflow-x-auto pb-1 glass rounded-xl p-1.5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {creationTabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap flex-shrink-0 text-[13px] rounded-lg transition-all duration-300 ${
                  isMobile ? "px-3.5 py-2.5" : "px-4 py-2.5"
                } ${isActive
                  ? "text-primary font-bold surface-primary"
                  : "text-muted-foreground font-medium hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {t.icon} {t.label}
              </button>
            );
          })}

          {/* Separator */}
          <div className="w-px mx-1 my-1 flex-shrink-0 bg-white/[0.06]" />

          {manageTabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap flex-shrink-0 text-[13px] rounded-lg transition-all duration-300 ${
                  isMobile ? "px-3.5 py-2.5" : "px-4 py-2.5"
                } ${isActive
                  ? "text-primary font-bold surface-primary"
                  : "text-muted-foreground font-medium hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
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

        {/* Studio tab — lazy loaded */}
        <section id="panel-studio" role="tabpanel" aria-label="Studio de Criação" style={{ display: tab === "studio" ? "block" : "none" }}>
          {tab === "studio" && (
            <Suspense fallback={<div className="text-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>}>
              <Studio />
            </Suspense>
          )}
        </section>

        {/* Templates tab — persistent */}
        <section id="panel-templates" role="tabpanel" aria-label="Templates disponíveis" className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-[repeat(auto-fill,minmax(280px,1fr))]"}`} style={{ display: tab === "templates" ? "grid" : "none" }}>
          {templates.map((t, i) => (
            <GlassCard
              key={t.id}
              hover
              className="cursor-pointer animate-slide-up group"
              style={{ animationDelay: `${i * 0.03}s` }}
              onClick={() => handleUseTemplate(t)}
            >
              <div className={`${isMobile ? "p-5" : "p-6"}`} role="button" aria-label={`Usar template: ${t.name}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="icon-container icon-container-sm rounded-lg text-primary transition-transform duration-300 group-hover:scale-110 glow-sm">
                    {templateIconMap[t.iconName] || <Sparkles size={22} aria-hidden="true" />}
                  </div>
                  <span className="text-[15px] font-bold text-foreground">{t.name}</span>
                </div>
                <p className="text-body text-muted-foreground mb-4 leading-relaxed">{t.description}</p>
                <div className="flex gap-2">
                  <span className="badge-muted">{typeLabels[t.type] || t.type}</span>
                  <span className="badge-muted capitalize">{t.tone}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </section>

        {/* Saved scripts tab — persistent */}
        <section id="panel-saved" role="tabpanel" aria-label="Roteiros salvos" className="flex flex-col gap-4" style={{ display: tab === "saved" ? "flex" : "none" }}>
          <div className="flex gap-3 flex-wrap">
            <div className={`flex-1 relative ${isMobile ? "min-w-full" : "min-w-[200px]"}`}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" aria-hidden="true" />
              <input
                placeholder="Buscar roteiros..."
                aria-label="Buscar roteiros salvos"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-glass pl-11"
              />
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto flex-shrink-0" role="group" aria-label="Filtrar por tipo" style={isMobile ? { width: "100%" } : {}}>
              {["", "video", "commercial", "prompt", "director"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  aria-pressed={filterType === f}
                  className={`flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 text-xs rounded-xl transition-all duration-200 ${
                    isMobile ? "px-3 py-2.5" : "px-4 py-2.5"
                  } ${filterType === f
                    ? "text-primary font-bold surface-primary"
                    : "text-muted-foreground hover:text-foreground surface-muted"
                  }`}
                >
                  {f !== "" && typeIconMap[f]} {f === "" ? "Todos" : typeLabels[f] || f}
                </button>
              ))}
            </div>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="text-center py-16 opacity-40" role="status">
              <Archive size={48} className="text-muted-foreground mx-auto mb-3" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">Nenhum roteiro encontrado</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {filteredScripts.map((s, i) => (
                <li key={s.id}>
                  <GlassCard hover className="animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
                    <article aria-label={`Roteiro: ${s.title}`} className={`flex justify-between gap-4 ${isMobile ? "p-4" : "p-6"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className={typeBadgeColors[s.type] || "badge-muted"}>
                            {typeLabels[s.type] || s.type}
                          </span>
                          <span className="text-sm font-bold text-foreground truncate">{s.title}</span>
                          {s.category && (
                            <span className="badge-muted flex-shrink-0">{s.category}</span>
                          )}
                        </div>
                        <p className="text-body text-muted-foreground mb-2 leading-relaxed line-clamp-3 relative">
                          {s.content}
                        </p>
                        <time className="text-caption" dateTime={s.created_at}>
                          {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ptBR })}
                        </time>
                      </div>
                      <div className={`flex gap-1 flex-shrink-0 ${isMobile ? "flex-col" : "flex-row"} items-start`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" onClick={() => handleToggleFavorite(s.id, s.is_favorite)} aria-label={s.is_favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: s.is_favorite ? "#facc15" : "hsl(var(--muted-foreground) / 0.4)" }}>
                              <Star size={16} fill={s.is_favorite ? "#facc15" : "none"} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{s.is_favorite ? "Remover favorito" : "Favoritar"}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" onClick={() => handleCopy(s.content)} aria-label="Copiar" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/40 hover:text-foreground">
                              <Copy size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" onClick={() => handleDelete(s.id)} aria-label="Excluir" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground/40 hover:text-accent">
                              <Trash2 size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </article>
                  </GlassCard>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Keys tab — lazy loaded */}
        <section id="panel-keys" role="tabpanel" aria-label="Gestão de API Keys" style={{ display: tab === "keys" ? "block" : "none" }}>
          {tab === "keys" && (
            <Suspense fallback={<div className="text-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>}>
              <KeyManager />
            </Suspense>
          )}
        </section>

        {/* Calculator tab — lazy loaded */}
        <section id="panel-calculator" role="tabpanel" aria-label="Calculadora de custos" style={{ display: tab === "calculator" ? "block" : "none" }}>
          {tab === "calculator" && (
            <Suspense fallback={<div className="text-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>}>
              <CostCalculator />
            </Suspense>
          )}
        </section>
      </main>
    </div>
    </TooltipProvider>
  );
};

export default Dashboard;
