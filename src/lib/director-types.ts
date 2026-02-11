export interface DirectorScene {
  title: string;
  duration: string;
  prompt_veo: string | null;
  prompt_veo_b: string | null;
  prompt_veo_alt: string | null;
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

// ══ Generation Types (Studio Robusto) ══

export type GenerationType = "image" | "video";

export type GenerationEngine =
  | "nano" | "nano_pro" | "PHOENIX" | "FLUX" | "FLUX_DEV" | "KINO_2_0"
  | "VEO3_1" | "VEO3_1FAST" | "VEO3" | "VEO3FAST"
  | "KLING2_6" | "KLING_VIDEO_3_0" | "KLING_O3_OMNI" | "KLING_O1" | "KLING2_5" | "KLING2_1"
  | "HAILUO_2_3" | "HAILUO_2_3_FAST" | "MOTION2";

export interface VideoModelInfo {
  id: GenerationEngine;
  label: string;
  category: "Veo" | "Kling" | "Hailuo" | "Motion";
  color: string;
  durations: number[];
  resolutions: string[];
  features: {
    audio?: boolean;
    startFrame?: boolean;
    endFrame?: boolean;
    imageRef?: boolean;
    videoRef?: boolean;
  };
  costs: Record<number, number>;
}

export interface ImageModelInfo {
  id: string;
  label: string;
  category: "Leonardo" | "Nano";
  color: string;
}

export const VIDEO_MODELS: VideoModelInfo[] = [
  { id: "VEO3_1", label: "Veo 3.1", category: "Veo", color: "#10b981", durations: [4, 6, 8], resolutions: ["720p", "1080p"], features: { audio: true, endFrame: true }, costs: { 4: 1070, 6: 1605, 8: 2140 } },
  { id: "VEO3_1FAST", label: "Veo 3.1 Fast", category: "Veo", color: "#10b981", durations: [4, 6, 8], resolutions: ["720p", "1080p"], features: { audio: true, endFrame: true }, costs: { 4: 546, 6: 819, 8: 1092 } },
  { id: "VEO3", label: "Veo 3", category: "Veo", color: "#10b981", durations: [4, 6, 8], resolutions: ["720p", "1080p"], features: { audio: true }, costs: { 4: 2140, 6: 1605, 8: 1070 } },
  { id: "VEO3FAST", label: "Veo 3 Fast", category: "Veo", color: "#10b981", durations: [4, 6, 8], resolutions: ["720p", "1080p"], features: { audio: true }, costs: { 4: 1092, 6: 819, 8: 546 } },
  { id: "KLING_VIDEO_3_0", label: "Kling 3.0", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: { audio: true, endFrame: true }, costs: { 5: 604, 10: 1208 } },
  { id: "KLING2_6", label: "Kling 2.6", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: { audio: true }, costs: { 5: 604, 10: 1208 } },
  { id: "KLING_O3_OMNI", label: "Kling O3 Omni", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: { audio: true, endFrame: true, imageRef: true, videoRef: true }, costs: { 5: 604, 10: 1208 } },
  { id: "KLING_O1", label: "Kling O1", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: { endFrame: true, imageRef: true }, costs: { 5: 484, 10: 968 } },
  { id: "KLING2_5", label: "Kling 2.5 Turbo", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: {}, costs: { 5: 235, 10: 470 } },
  { id: "KLING2_1", label: "Kling 2.1 Pro", category: "Kling", color: "#7c3aed", durations: [5, 10], resolutions: ["1080p"], features: { startFrame: true, endFrame: true }, costs: { 5: 600, 10: 1200 } },
  { id: "HAILUO_2_3", label: "Hailuo 2.3", category: "Hailuo", color: "#3b82f6", durations: [5, 10], resolutions: ["1080p"], features: {}, costs: { 5: 500, 10: 1000 } },
  { id: "HAILUO_2_3_FAST", label: "Hailuo 2.3 Fast", category: "Hailuo", color: "#3b82f6", durations: [5, 10], resolutions: ["1080p"], features: {}, costs: { 5: 300, 10: 600 } },
  { id: "MOTION2", label: "Motion 2.0", category: "Motion", color: "#6b7280", durations: [4], resolutions: ["480p", "720p"], features: {}, costs: { 4: 100 } },
];

export const IMAGE_MODELS: ImageModelInfo[] = [
  { id: "nano_pro", label: "Nano Banana Pro", category: "Nano", color: "#eab308" },
  { id: "PHOENIX", label: "Leonardo Phoenix", category: "Leonardo", color: "#a78bfa" },
  { id: "FLUX", label: "Leonardo Flux", category: "Leonardo", color: "#8b5cf6" },
  { id: "FLUX_DEV", label: "Flux Dev", category: "Leonardo", color: "#8b5cf6" },
];

export interface GenerationConfig {
  type: GenerationType;
  engine: GenerationEngine;
  duration?: number;
  aspectRatio: "9:16" | "16:9" | "1:1";
  resolution: string;
}

export const ENGINE_LABELS: Record<string, string> = {
  nano: "Nano Banana", nano_pro: "Nano Pro", PHOENIX: "Leonardo Phoenix", FLUX: "Leonardo Flux",
  VEO3_1: "Veo 3.1", VEO3_1FAST: "Veo 3.1 Fast", VEO3: "Veo 3", VEO3FAST: "Veo 3 Fast",
  KLING2_5: "Kling 2.5", KLING2_6: "Kling 2.6", KLING_VIDEO_3_0: "Kling 3.0",
  KLING_O3_OMNI: "O3 Omni", KLING_O1: "Kling O1", KLING2_1: "Kling 2.1",
  HAILUO_2_3: "Hailuo 2.3", HAILUO_2_3_FAST: "Hailuo Fast", MOTION2: "Motion 2.0",
};

export const ENGINE_COLORS: Record<string, string> = {
  nano: "#eab308", nano_pro: "#f59e0b", PHOENIX: "#a78bfa", FLUX: "#8b5cf6",
  VEO3_1: "#10b981", VEO3_1FAST: "#10b981", VEO3: "#10b981", VEO3FAST: "#10b981",
  KLING2_5: "#7c3aed", KLING2_6: "#7c3aed", KLING_VIDEO_3_0: "#7c3aed",
  KLING_O3_OMNI: "#7c3aed", KLING_O1: "#7c3aed", KLING2_1: "#7c3aed",
  HAILUO_2_3: "#3b82f6", HAILUO_2_3_FAST: "#3b82f6", MOTION2: "#6b7280",
};
