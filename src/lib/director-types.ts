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
}

export const MODES = [
  { id: "ugc", label: "UGC", icon: "📱", desc: "TikTok, review, depoimento", color: "#f97316" },
  { id: "character", label: "Personagem", icon: "🧸", desc: "3D, antropomórfico, animado", color: "#a78bfa" },
  { id: "brand", label: "Cinema", icon: "🎬", desc: "Premium, cinematográfico", color: "#3b82f6" },
  { id: "educational", label: "Educativo", icon: "🧠", desc: "Professor viral, dados visuais", color: "#22d3ee" },
  { id: "hybrid", label: "Híbrido", icon: "⚡", desc: "Combina modos na sequência", color: "#f43f5e" },
] as const;

export const PLATFORMS = [
  { id: "veo", label: "Veo 3.1", icon: "🟢" },
  { id: "kling", label: "Kling 3.0", icon: "🔵" },
  { id: "both", label: "Ambos", icon: "🟣" },
] as const;

export const DESTINATIONS = [
  { id: "tiktok", label: "TikTok", icon: "♪" },
  { id: "reels", label: "Reels", icon: "◎" },
  { id: "shorts", label: "Shorts", icon: "▶" },
  { id: "all", label: "Todas", icon: "✦" },
] as const;

export const OBJECTIVES = [
  { id: "sale", label: "Vender", icon: "💰" },
  { id: "awareness", label: "Alcance", icon: "📡" },
  { id: "education", label: "Educar", icon: "📚" },
  { id: "engagement", label: "Engajar", icon: "💬" },
] as const;

export const EXAMPLES = [
  { label: "Exemplo: Produto", text: "Mulher descobre que o protetor solar dela não protege de verdade. Produto: FPS 90 da marca X." },
  { label: "Exemplo: Educativo", text: "5 erros que encarecem sua obra em pedra. Personagem: pedra Quartzito Taj Mahal, conselheiro." },
  { label: "Exemplo: UGC Review", text: "Review autêntico do novo fone Bluetooth. Tom de quem acabou de abrir a caixa e tá surpreso com a qualidade." },
] as const;
