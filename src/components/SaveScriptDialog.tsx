import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Roteiro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do roteiro" />
          </div>
          <div className="space-y-2">
            <Label>Categoria (opcional)</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Projeto X, Cliente Y" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveScriptDialog;
