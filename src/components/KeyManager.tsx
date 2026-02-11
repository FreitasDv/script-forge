import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, RefreshCw, Plus, Power, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn } from "@/lib/utils";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Keys Ativas", value: activeCount, extra: `/ ${keys.length}`, color: "#a78bfa" },
          { label: "Créditos Disponíveis", value: totalCredits - totalReserved, color: "#22c55e" },
          { label: "Créditos Reservados", value: totalReserved, color: "#eab308" },
        ].map((s) => (
          <GlassCard key={s.label} glow={s.color} className="p-4">
            <p className="text-xl font-extrabold text-foreground">
              <AnimatedNumber value={typeof s.value === "number" ? s.value : 0} />
              {s.extra && <span className="text-xs text-muted-foreground ml-1">{s.extra}</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
          <Plus size={14} /> Adicionar Key
        </button>
        <button type="button" onClick={handleSyncAll} disabled={syncingAll} className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all" style={{ background: "hsl(152 69% 40% / 0.08)", color: "hsl(var(--success))", border: "1px solid hsl(152 69% 40% / 0.2)", opacity: syncingAll ? 0.6 : 1 }}>
          {syncingAll ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sincronizar Todas
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <GlassCard className="p-4 animate-slide-down">
          <div className="flex flex-col gap-2.5">
            <input placeholder="API Key do Leonardo.ai" value={newKey.api_key} onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })} className="input-glass text-[13px]" />
            <div className="flex gap-2">
              <input placeholder="Label (ex: Key #1)" value={newKey.label} onChange={(e) => setNewKey({ ...newKey, label: e.target.value })} className="input-glass text-[13px] flex-1" />
              <input placeholder="Notas (opcional)" value={newKey.notes} onChange={(e) => setNewKey({ ...newKey, notes: e.target.value })} className="input-glass text-[13px] flex-[2]" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleAddKey} disabled={adding} className="btn-primary px-5 py-2.5 text-[13px]" style={{ opacity: adding ? 0.6 : 1 }}>
                {adding ? "Adicionando..." : "Confirmar"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-ghost px-4 py-2.5 text-[13px]">
                Cancelar
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" /></div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 opacity-40">
          <Key size={48} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Nenhuma API key cadastrada</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {keys.map((k) => {
            const available = k.remaining_credits - k.reserved_credits;
            const healthColor = getHealthColor(k.remaining_credits, k.reserved_credits);
            const isExpanded = expandedKey === k.id;
            return (
              <GlassCard key={k.id} className={cn("transition-all", !k.is_active && "opacity-50")}>
                <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedKey(isExpanded ? null : k.id)}>
                  {/* Health dot with pulse */}
                  <div className="relative flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: healthColor }} />
                    {k.is_active && available > 1000 && <div className="absolute inset-0 rounded-full animate-glow-pulse" style={{ background: healthColor, filter: "blur(4px)" }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{k.label || "Sem label"}</span>
                      {!k.is_active && <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "hsl(0 62% 30% / 0.12)", color: "hsl(0 62% 50%)" }}>Inativa</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{available.toLocaleString("pt-BR")} créditos</span>
                      {k.reserved_credits > 0 && <span style={{ color: "#eab308" }}>({k.reserved_credits} res.)</span>}
                      <span>{k.total_uses} usos</span>
                    </div>
                  </div>

                  <button type="button" onClick={(e) => { e.stopPropagation(); handleSync(k.id); }} disabled={syncing === k.id} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground" title="Sincronizar">
                    {syncing === k.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleActive(k.id, k.is_active); }} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: k.is_active ? "#22c55e" : "#ef4444" }} title={k.is_active ? "Desativar" : "Ativar"}>
                    <Power size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>

                <div className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
                  <div className="px-4 pb-3 pt-2 border-t border-white/5 flex flex-col gap-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><span className="text-muted-foreground/50">Total:</span> <span className="text-foreground">{k.remaining_credits.toLocaleString("pt-BR")}</span></div>
                      <div><span className="text-muted-foreground/50">Hoje:</span> <span className="text-foreground">{k.uses_today}</span></div>
                      <div><span className="text-muted-foreground/50">Limite:</span> <span className="text-foreground">{k.daily_limit ?? "∞"}</span></div>
                    </div>
                    {k.last_used_at && <div className="text-[11px] text-muted-foreground/50">Último uso: {new Date(k.last_used_at).toLocaleString("pt-BR")}</div>}
                    {k.notes && <div className="text-xs text-muted-foreground italic">{k.notes}</div>}
                    <button type="button" onClick={() => handleRemoveKey(k.id)} className="flex items-center gap-1 self-start text-xs px-3 py-1.5 rounded-lg transition-all" style={{ background: "hsl(0 62% 30% / 0.08)", color: "hsl(0 62% 50%)", border: "1px solid hsl(0 62% 30% / 0.15)" }}>
                      <Trash2 size={12} /> Remover
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KeyManager;
