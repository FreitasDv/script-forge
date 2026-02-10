export interface DirectorScene {
  title: string;
  duration: string;
  prompt_veo: string | null;
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
  { id: "ugc", label: "UGC Converter", icon: "📱", desc: "Afiliado, review, depoimento — estética raw que ninguém detecta AI" },
  { id: "character", label: "Character World", icon: "🧸", desc: "Antropomórfico, 3D stylized, Pixar-adjacent com personalidade" },
  { id: "brand", label: "Brand Cinema", icon: "🎬", desc: "Premium cinematográfico, broadcast-quality, color grading intencional" },
  { id: "educational", label: "Educational Hook", icon: "🧠", desc: "Professor viral, corte rápido, dados visuais, TikTok SEO" },
  { id: "hybrid", label: "Hybrid Director", icon: "⚡", desc: "Combina modos — abre UGC, transiciona animação, fecha premium" },
] as const;

export const PLATFORMS = [
  { id: "veo", label: "Veo 3.1" },
  { id: "kling", label: "Kling 3.0" },
  { id: "both", label: "Ambos" },
] as const;

export const DESTINATIONS = [
  { id: "tiktok", label: "TikTok" },
  { id: "reels", label: "Reels" },
  { id: "shorts", label: "Shorts" },
  { id: "all", label: "Todas" },
] as const;

export const OBJECTIVES = [
  { id: "sale", label: "Venda/Conversão" },
  { id: "awareness", label: "Awareness" },
  { id: "education", label: "Educação" },
  { id: "engagement", label: "Engajamento" },
] as const;
