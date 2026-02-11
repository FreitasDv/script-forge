import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Check, Loader2 } from "lucide-react";

interface SaveScriptDialogProps {
  content: string;
  type: string;
  tone: string;
  size: string;
  onSaved: () => void;
}

const SaveScriptDialog = ({ content, type, tone, size, onSaved }: SaveScriptDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
      setSaved(true);
      toast.success("Roteiro salvo!");
      setTimeout(() => {
        setOpen(false);
        setTitle("");
        setCategory("");
        setSaved(false);
        onSaved();
      }, 800);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            color: "hsl(var(--primary))",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <Save size={14} /> Salvar
        </button>
      </DialogTrigger>
      <DialogContent className="glass rounded-2xl border-none" style={{ background: "hsl(230 20% 10% / 0.95)", backdropFilter: "blur(40px)", padding: 28 }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-extrabold flex items-center gap-2">
            {saved ? <Check size={20} className="text-success" /> : <Save size={18} className="text-primary" />}
            {saved ? "Salvo!" : "Salvar Roteiro"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <label className="text-muted-foreground text-xs font-semibold block mb-2">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do roteiro"
              className="input-glass"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-xs font-semibold block mb-2">Categoria (opcional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Projeto X, Cliente Y"
              className="input-glass"
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 min-h-[48px]"
          >
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : saved ? <><Check size={16} /> Salvo!</> : "Salvar"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveScriptDialog;
