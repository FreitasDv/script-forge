import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, RefreshCw, Plus, Power, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

type LeonardoKey = {
  id: string;
  label: string | null;
  is_active: boolean;
  remaining_credits: number;
  reserved_credits: number;
  total_uses: number;
  last_used_at: string | null;
  daily_limit: number | null;
  uses_today: number;
  notes: string;
  created_at: string;
};

const KeyManager = () => {
  const [keys, setKeys] = useState<LeonardoKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({ api_key: "", label: "", notes: "" });
  const [adding, setAdding] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const callEdge = useCallback(async (body: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leonardo-generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro na API");
    return data;
  }, []);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await callEdge({ action: "list_keys" });
      setKeys(data.keys || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar keys");
    } finally {
      setLoading(false);
    }
  }, [callEdge]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleAddKey = async () => {
    if (!newKey.api_key.trim()) { toast.error("Cole a API key"); return; }
    setAdding(true);
    try {
      await callEdge({ action: "add_key", api_key: newKey.api_key.trim(), label: newKey.label.trim() || null, notes: newKey.notes.trim() });
      toast.success("Key adicionada!");
      setNewKey({ api_key: "", label: "", notes: "" });
      setShowAddForm(false);
      fetchKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao adicionar");
    } finally {
      setAdding(false);
    }
  };

  const handleSync = async (keyId: string) => {
    setSyncing(keyId);
    try {
      const data = await callEdge({ action: "sync_credits", key_id: keyId });
      toast.success(`Créditos: ${data.credits}`);
      fetchKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar");
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const data = await callEdge({ action: "sync_all_credits" });
      toast.success(data.message);
      fetchKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleToggleActive = async (keyId: string, currentActive: boolean) => {
    try {
      await callEdge({ action: "update_key", key_id: keyId, is_active: !currentActive });
      toast.success(currentActive ? "Key desativada" : "Key ativada");
      fetchKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const handleRemoveKey = async (keyId: string) => {
    try {
      await callEdge({ action: "remove_key", key_id: keyId });
      toast.success("Key removida");
      fetchKeys();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const getHealthColor = (credits: number, reserved: number) => {
    const available = credits - reserved;
    if (available > 1000) return "#22c55e";
    if (available > 200) return "#eab308";
    return "#ef4444";
  };

  const totalCredits = keys.reduce((sum, k) => sum + (k.is_active ? k.remaining_credits : 0), 0);
  const totalReserved = keys.reduce((sum, k) => sum + (k.is_active ? k.reserved_credits : 0), 0);
  const activeCount = keys.filter((k) => k.is_active).length;

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { label: "Keys Ativas", value: activeCount, total: keys.length, color: "#a78bfa" },
          { label: "Créditos Disponíveis", value: (totalCredits - totalReserved).toLocaleString("pt-BR"), color: "#22c55e" },
          { label: "Créditos Reservados", value: totalReserved.toLocaleString("pt-BR"), color: "#eab308" },
        ].map((s) => (
          <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}18`, borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              {s.value}{(s as any).total !== undefined && <span style={{ fontSize: 12, color: "#64748b" }}> / {(s as any).total}</span>}
            </p>
            <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setShowAddForm(!showAddForm)} style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, color: "#a78bfa", padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> Adicionar Key
        </button>
        <button type="button" onClick={handleSyncAll} disabled={syncingAll} style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, color: "#22c55e", padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: syncingAll ? 0.6 : 1 }}>
          {syncingAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar Todas
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="API Key do Leonardo.ai" value={newKey.api_key} onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })} style={inputStyle} />
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Label (ex: Key #1)" value={newKey.label} onChange={(e) => setNewKey({ ...newKey, label: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            <input placeholder="Notas (opcional)" value={newKey.notes} onChange={(e) => setNewKey({ ...newKey, notes: e.target.value })} style={{ ...inputStyle, flex: 2 }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={handleAddKey} disabled={adding} style={{ background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: adding ? 0.6 : 1 }}>
              {adding ? "Adicionando..." : "Confirmar"}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#94a3b8", padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#475569" }}><Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} /></div>
      ) : keys.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, opacity: 0.4 }}>
          <Key size={48} style={{ color: "#475569", marginBottom: 8 }} />
          <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Nenhuma API key cadastrada</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {keys.map((k) => {
            const available = k.remaining_credits - k.reserved_credits;
            const healthColor = getHealthColor(k.remaining_credits, k.reserved_credits);
            const isExpanded = expandedKey === k.id;
            return (
              <div key={k.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${k.is_active ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.15)"}`, borderRadius: 12, overflow: "hidden", opacity: k.is_active ? 1 : 0.5 }}>
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpandedKey(isExpanded ? null : k.id)}>
                  {/* Health dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: healthColor, flexShrink: 0, boxShadow: `0 0 6px ${healthColor}40` }} />

                  {/* Label + credits */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif" }}>{k.label || "Sem label"}</span>
                      {!k.is_active && <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 8px", borderRadius: 6 }}>Inativa</span>}
                    </div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      <span>{available.toLocaleString("pt-BR")} créditos</span>
                      {k.reserved_credits > 0 && <span style={{ color: "#eab308" }}>({k.reserved_credits} reservados)</span>}
                      <span>{k.total_uses} usos</span>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleSync(k.id); }} disabled={syncing === k.id} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#64748b" }} title="Sincronizar créditos">
                    {syncing === k.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleActive(k.id, k.is_active); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: k.is_active ? "#22c55e" : "#ef4444" }} title={k.is_active ? "Desativar" : "Ativar"}>
                    <Power size={16} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} style={{ color: "#475569" }} /> : <ChevronDown size={16} style={{ color: "#475569" }} />}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                      <div><span style={{ color: "#475569" }}>Total créditos:</span> <span style={{ color: "#e2e8f0" }}>{k.remaining_credits.toLocaleString("pt-BR")}</span></div>
                      <div><span style={{ color: "#475569" }}>Usos hoje:</span> <span style={{ color: "#e2e8f0" }}>{k.uses_today}</span></div>
                      <div><span style={{ color: "#475569" }}>Limite diário:</span> <span style={{ color: "#e2e8f0" }}>{k.daily_limit ?? "Sem limite"}</span></div>
                    </div>
                    {k.last_used_at && (
                      <div style={{ fontSize: 11, color: "#475569" }}>Último uso: {new Date(k.last_used_at).toLocaleString("pt-BR")}</div>
                    )}
                    {k.notes && <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic" }}>{k.notes}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <button type="button" onClick={() => handleRemoveKey(k.id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", padding: "7px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeyManager;
