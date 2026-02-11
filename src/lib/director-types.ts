export interface DirectorScene {
  title: string;
  duration: string;
  prompt_veo: string | null;
  prompt_veo_b: string | null;
  prompt_kling: string | null;
  prompt_nano: string | null;
  camera_direction: string;
  neuro_note: string;
  speech_timing: string | null;
  tech_strategy: string;
}

export interface DirectorResult {
  scenes: DirectorScene[];
  workflow_summary: string;
  director_notes: string;
}

export interface DirectorConfig {
  mode: string;
  platform: string;
  destination: string;
  objective: string;
  audience: string;
  hasDirection: boolean;
  characterStyle?: string;
}

export const CHARACTER_STYLES = [
  { id: "cute_viral", label: "Fofo Viral", icon: "🥺", desc: "Objeto com carinha simples — olhinhos + boca. Textura original preservada", color: "#f97316" },
  { id: "stylized_3d", label: "Stylized 3D", icon: "✨", desc: "Personagem completo estilo Pixar/Illumination. Storytelling premium", color: "#a78bfa" },
  { id: "plushie", label: "Plushie / Toy", icon: "🧸", desc: "Pelúcia ou boneco de feltro. Proporções chibi, textura fofa", color: "#ec4899" },
] as const;

// Icon names reference Lucide icons used in DirectorForm
export const MODES = [
  { id: "ugc", label: "UGC", iconName: "Smartphone" as const, desc: "TikTok, review, depoimento", color: "#f97316" },
  { id: "character", label: "Personagem", iconName: "Bot" as const, desc: "3D, antropomórfico, animado", color: "#a78bfa" },
  { id: "brand", label: "Cinema", iconName: "Film" as const, desc: "Premium, cinematográfico", color: "#3b82f6" },
  { id: "educational", label: "Educativo", iconName: "GraduationCap" as const, desc: "Professor viral, dados visuais", color: "#22d3ee" },
  { id: "hybrid", label: "Híbrido", iconName: "Zap" as const, desc: "Combina modos na sequência", color: "#f43f5e" },
] as const;

export const PLATFORMS = [
  { id: "veo", label: "Veo 3.1", iconName: "Circle" as const, color: "#22c55e" },
  { id: "kling", label: "Kling", iconName: "Circle" as const, color: "#3b82f6" },
  { id: "both", label: "Ambos", iconName: "Circle" as const, color: "#a78bfa" },
] as const;

export const DESTINATIONS = [
  { id: "tiktok", label: "TikTok", iconName: "Music" as const },
  { id: "reels", label: "Reels", iconName: "Instagram" as const },
  { id: "shorts", label: "Shorts", iconName: "Play" as const },
  { id: "all", label: "Todas", iconName: "Globe" as const },
] as const;

export const OBJECTIVES = [
  { id: "sale", label: "Vender", iconName: "DollarSign" as const },
  { id: "awareness", label: "Alcance", iconName: "Radio" as const },
  { id: "education", label: "Educar", iconName: "BookOpen" as const },
  { id: "engagement", label: "Engajar", iconName: "MessageCircle" as const },
] as const;

export const EXAMPLES = [
  { label: "Exemplo: Produto", text: "Mulher descobre que o protetor solar dela não protege de verdade. Produto: FPS 90 da marca X." },
  { label: "Exemplo: Educativo", text: "5 erros que encarecem sua obra em pedra. Personagem: pedra Quartzito Taj Mahal, conselheiro." },
  { label: "Exemplo: UGC Review", text: "Review autêntico do novo fone Bluetooth. Tom de quem acabou de abrir a caixa e tá surpreso com a qualidade." },
] as const;
