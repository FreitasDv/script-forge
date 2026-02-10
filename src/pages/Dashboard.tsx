import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import GenerateForm from "@/components/GenerateForm";
import SaveScriptDialog from "@/components/SaveScriptDialog";
import DirectorForm from "@/components/DirectorForm";
import { templates, type Template } from "@/lib/templates";
import type { DirectorResult, DirectorConfig } from "@/lib/director-types";

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

const typeIcons: Record<string, string> = { video: "🎬", commercial: "📢", prompt: "🤖", director: "🎥" };
const typeLabels: Record<string, string> = { video: "Vídeo", commercial: "Comercial", prompt: "Prompt", director: "Diretor" };

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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "generate", label: "Gerar", icon: "✨" },
    { id: "director", label: "Diretor", icon: "🎬" },
    { id: "templates", label: "Templates", icon: "📋" },
    { id: "saved", label: "Meus Roteiros", icon: "🔍" },
  ];

  const stats = [
    { label: "Vídeos", count: counts.video, icon: "🎬", color: "#7c3aed" },
    { label: "Comerciais", count: counts.commercial, icon: "📢", color: "#f43f5e" },
    { label: "Prompts", count: counts.prompt, icon: "🤖", color: "#22d3ee" },
    { label: "Diretor", count: counts.director, icon: "🎥", color: "#f97316" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,10,20,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>✨</span>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>ScriptAI</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{user?.email}</span>
            <button
              type="button"
              onClick={() => { signOut(); navigate("/auth"); }}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, color: "#94a3b8", padding: "6px 10px", fontSize: 11, cursor: "pointer" }}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}20`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>{s.count}</p>
                <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8, overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                background: tab === t.id ? "rgba(124,58,237,0.15)" : "transparent",
                color: tab === t.id ? "#a78bfa" : "#64748b",
                border: tab === t.id ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Generate tab */}
        {tab === "generate" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <GenerateForm key={JSON.stringify(formInitial)} onGenerated={handleGenerated} initialValues={formInitial} />
            {generatedContent && generatedMeta && (
              <div style={{ display: "flex", gap: 8 }}>
                <SaveScriptDialog content={generatedContent} type={generatedMeta.type} tone={generatedMeta.tone} size={generatedMeta.size} onSaved={fetchScripts} />
                <button
                  type="button"
                  onClick={() => handleCopy(generatedContent)}
                  style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 16px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  📋 Copiar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Director tab */}
        {tab === "director" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleUseTemplate(t)}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1.5px solid rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</span>
                </div>
                <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>{t.description}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", color: "#94a3b8", padding: "3px 8px", borderRadius: 6 }}>{typeLabels[t.type] || t.type}</span>
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", color: "#94a3b8", padding: "3px 8px", borderRadius: 6, textTransform: "capitalize" }}>{t.tone}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Saved scripts tab */}
        {tab === "saved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search + filters */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
                <input
                  placeholder="Buscar roteiros..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    color: "#e2e8f0",
                    padding: "10px 14px 10px 36px",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              {["", "video", "commercial", "prompt", "director"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: filterType === f ? 700 : 400,
                    cursor: "pointer",
                    background: filterType === f ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.02)",
                    color: filterType === f ? "#a78bfa" : "#64748b",
                    border: filterType === f ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {f === "" ? "Todos" : typeLabels[f] || f}
                </button>
              ))}
            </div>

            {filteredScripts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", opacity: 0.4 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🤖</div>
                <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>Nenhum roteiro encontrado</p>
              </div>
            ) : (
              filteredScripts.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1.5px solid rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{typeIcons[s.type] || "📄"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                      {s.category && (
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.04)", color: "#94a3b8", padding: "2px 8px", borderRadius: 6 }}>{s.category}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 6px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.content}</p>
                    <p style={{ fontSize: 10, color: "#475569", margin: 0 }}>{new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "flex-start" }}>
                    <button type="button" onClick={() => handleToggleFavorite(s.id, s.is_favorite)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 }}>
                      {s.is_favorite ? "⭐" : "☆"}
                    </button>
                    <button type="button" onClick={() => handleCopy(s.content)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4, color: "#64748b" }}>
                      📋
                    </button>
                    <button type="button" onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 4, color: "#fb7185" }}>
                      🗑️
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
