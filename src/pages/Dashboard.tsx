import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import GenerateForm from "@/components/GenerateForm";
import SaveScriptDialog from "@/components/SaveScriptDialog";
import DirectorForm from "@/components/DirectorForm";
import { templates, type Template } from "@/lib/templates";
import type { DirectorResult, DirectorConfig } from "@/lib/director-types";
import { Video, Megaphone, Sparkles, Clapperboard, Wand2, LayoutTemplate, Archive, LogOut, Copy, Star, Trash2, Search } from "lucide-react";

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

type Tab = "generate" | "director" | "templates" | "saved";

const typeIconMap: Record<string, ReactNode> = {
  video: <Video size={16} />,
  commercial: <Megaphone size={16} />,
  prompt: <Sparkles size={16} />,
  director: <Clapperboard size={16} />,
};
const typeLabels: Record<string, string> = { video: "Vídeo", commercial: "Comercial", prompt: "Prompt", director: "Diretor" };

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
    { id: "generate", label: "Gerar", icon: <Wand2 size={16} /> },
    { id: "director", label: "Diretor", icon: <Clapperboard size={16} /> },
    { id: "templates", label: "Templates", icon: <LayoutTemplate size={16} /> },
    { id: "saved", label: "Salvos", icon: <Archive size={16} /> },
  ];

  const stats = [
    { label: "Roteiros de Vídeo", sub: "salvos", count: counts.video, icon: <Video size={20} />, color: "#7c3aed" },
    { label: "Scripts Comerciais", sub: "salvos", count: counts.commercial, icon: <Megaphone size={20} />, color: "#f43f5e" },
    { label: "Prompts IA", sub: "salvos", count: counts.prompt, icon: <Sparkles size={20} />, color: "#22d3ee" },
    { label: "Produções Diretor", sub: "salvas", count: counts.director, icon: <Clapperboard size={20} />, color: "#f97316" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,10,20,0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "12px 16px" : "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wand2 size={20} style={{ color: "#a78bfa" }} />
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>ScriptAI</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isMobile && <span style={{ fontSize: 12, color: "#475569" }}>{user?.email}</span>}
            <button
              type="button"
              onClick={() => { signOut(); navigate("/auth"); }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#94a3b8",
                padding: "7px 14px",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "20px 16px" : "28px 24px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}18`,
                borderRadius: 14,
                padding: isMobile ? "12px 14px" : "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                animation: `slide-up 0.4s ease-out ${i * 0.05}s both`,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{
                width: isMobile ? 36 : 42,
                height: isMobile ? 36 : 42,
                borderRadius: "50%",
                background: `${s.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color,
                flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div>
                <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{s.count}</p>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.3 }}>{s.label}</p>
                <p style={{ fontSize: 10, color: "#334155", margin: 0 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 24,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: 10,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: isMobile ? "8px 14px" : "9px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t.id ? "rgba(124,58,237,0.12)" : "transparent",
                color: tab === t.id ? "#a78bfa" : "#475569",
                border: tab === t.id ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Generate tab */}
        {tab === "generate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.3s ease-out" }}>
            <GenerateForm key={JSON.stringify(formInitial)} onGenerated={handleGenerated} initialValues={formInitial} />
            {generatedContent && generatedMeta && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <SaveScriptDialog content={generatedContent} type={generatedMeta.type} tone={generatedMeta.tone} size={generatedMeta.size} onSaved={fetchScripts} />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedContent)}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#94a3b8",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Director tab */}
        {tab === "director" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.3s ease-out" }}>
            <DirectorForm onGenerated={(result, config, raw) => setDirectorResult({ result, config, raw })} />
            {directorResult && (
              <div style={{ display: "flex", gap: 8 }}>
                <SaveScriptDialog content={JSON.stringify(directorResult.result, null, 2)} type="director" tone={directorResult.config.mode} size={directorResult.config.destination} onSaved={fetchScripts} />
              </div>
            )}
          </div>
        )}

        {/* Templates tab */}
        {tab === "templates" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, animation: "fade-in 0.3s ease-out" }}>
            {templates.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleUseTemplate(t)}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: isMobile ? 16 : 20,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  animation: `slide-up 0.4s ease-out ${i * 0.03}s both`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{t.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</span>
                </div>
                <p style={{ fontSize: 13, color: "#475569", margin: "0 0 12px", lineHeight: 1.6 }}>{t.description}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", color: "#64748b", padding: "4px 10px", borderRadius: 6 }}>{typeLabels[t.type] || t.type}</span>
                  <span style={{ fontSize: 11, background: "rgba(255,255,255,0.04)", color: "#64748b", padding: "4px 10px", borderRadius: 6, textTransform: "capitalize" }}>{t.tone}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Saved scripts tab */}
        {tab === "saved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fade-in 0.3s ease-out" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: isMobile ? "100%" : 200, position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                <input
                  placeholder="Buscar roteiros..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#e2e8f0",
                    padding: "11px 14px 11px 38px",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(124,58,237,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, ...(isMobile ? { width: "100%" } : {}) }}>
                {["", "video", "commercial", "prompt", "director"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterType(f)}
                    style={{
                      padding: isMobile ? "8px 12px" : "8px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: filterType === f ? 700 : 500,
                      cursor: "pointer",
                      background: filterType === f ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.03)",
                      color: filterType === f ? "#a78bfa" : "#475569",
                      border: filterType === f ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.07)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    {f !== "" && typeIconMap[f]} {f === "" ? "Todos" : typeLabels[f] || f}
                  </button>
                ))}
              </div>
            </div>

            {filteredScripts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", opacity: 0.4 }}>
                <Archive size={48} style={{ color: "#475569", marginBottom: 8 }} />
                <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Nenhum roteiro encontrado</p>
              </div>
            ) : (
              filteredScripts.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14,
                    padding: isMobile ? 14 : 18,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    animation: `slide-up 0.3s ease-out ${i * 0.03}s both`,
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "#64748b" }}>{typeIconMap[s.type] || <Video size={16} />}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</span>
                      {s.category && (
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", color: "#64748b", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>{s.category}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: "#475569", margin: "0 0 6px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.content}</p>
                    <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 2, flexShrink: 0, alignItems: "flex-start" }}>
                    <button type="button" onClick={() => handleToggleFavorite(s.id, s.is_favorite)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, transition: "transform 0.15s", color: s.is_favorite ? "#facc15" : "#475569" }}>
                      <Star size={18} fill={s.is_favorite ? "#facc15" : "none"} />
                    </button>
                    <button type="button" onClick={() => handleCopy(s.content)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#475569" }}>
                      <Copy size={16} />
                    </button>
                    <button type="button" onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#fb7185" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
