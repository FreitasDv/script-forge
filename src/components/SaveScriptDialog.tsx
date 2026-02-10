import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveScriptDialogProps {
  content: string;
  type: string;
  tone: string;
  size: string;
  onSaved: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#e2e8f0",
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s",
  minHeight: 44,
};

const SaveScriptDialog = ({ content, type, tone, size, onSaved }: SaveScriptDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Adicione um título");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("scripts").insert({
      user_id: user.id,
      title: title.trim(),
      content,
      type: type as "video" | "commercial" | "prompt",
      tone,
      size: size as "short" | "medium" | "long",
      category: category.trim() || null,
    });

    if (error) {
      toast.error("Erro ao salvar");
      console.error(error);
    } else {
      toast.success("Roteiro salvo!");
      setOpen(false);
      setTitle("");
      setCategory("");
      onSaved();
    }
    setSaving(false);
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(124,58,237,0.5)";
    e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)";
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.1)";
    e.target.style.boxShadow = "none";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          style={{
            background: "rgba(124,58,237,0.12)",
            color: "#a78bfa",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s",
          }}
        >
          💾 Salvar
        </button>
      </DialogTrigger>
      <DialogContent style={{ background: "#12121e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28 }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#e2e8f0", fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800 }}>Salvar Roteiro</DialogTitle>
        </DialogHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
          <div>
            <label style={{ color: "#64748b", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do roteiro"
              style={inputStyle}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>
          <div>
            <label style={{ color: "#64748b", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Categoria (opcional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Projeto X, Cliente Y"
              style={inputStyle}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              padding: "14px",
              background: saving ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              color: saving ? "#475569" : "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              transition: "all 0.3s",
              minHeight: 48,
            }}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveScriptDialog;
