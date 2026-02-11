export interface Template {
  id: string;
  name: string;
  description: string;
  type: "video" | "commercial" | "prompt" | "director";
  tone: string;
  size: "short" | "medium" | "long";
  context: string;
  iconName: string;
}

export const templates: Template[] = [
  // Video/YouTube
  {
    id: "tutorial",
    name: "Tutorial",
    description: "Script para vídeo tutorial passo a passo",
    type: "video",
    tone: "educativo",
    size: "medium",
    context: "Crie um roteiro de tutorial explicando passo a passo sobre o tema",
    iconName: "GraduationCap",
  },
  {
    id: "review",
    name: "Review de Produto",
    description: "Análise completa de um produto ou serviço",
    type: "video",
    tone: "casual",
    size: "medium",
    context: "Crie uma review detalhada com prós e contras sobre",
    iconName: "Star",
  },
  {
    id: "vlog",
    name: "Vlog",
    description: "Roteiro para vlog pessoal ou diário",
    type: "video",
    tone: "casual",
    size: "medium",
    context: "Crie um roteiro de vlog pessoal e autêntico sobre",
    iconName: "Video",
  },
  {
    id: "shorts",
    name: "Shorts / Reels",
    description: "Conteúdo curto e impactante para shorts",
    type: "video",
    tone: "persuasivo",
    size: "short",
    context: "Crie um script curto e viral para shorts/reels sobre",
    iconName: "Zap",
  },
  // Commercial
  {
    id: "social-ad",
    name: "Anúncio para Redes Sociais",
    description: "Copy para anúncio em redes sociais",
    type: "commercial",
    tone: "persuasivo",
    size: "short",
    context: "Crie um anúncio persuasivo para redes sociais sobre",
    iconName: "Megaphone",
  },
  {
    id: "sales-script",
    name: "Script de Vendas",
    description: "Roteiro para apresentação de vendas",
    type: "commercial",
    tone: "formal",
    size: "long",
    context: "Crie um script de vendas profissional e convincente sobre",
    iconName: "Briefcase",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    description: "Sequência de email para campanhas",
    type: "commercial",
    tone: "persuasivo",
    size: "medium",
    context: "Crie um email marketing envolvente e com call-to-action sobre",
    iconName: "Mail",
  },
  // AI Prompts
  {
    id: "image-prompt",
    name: "Prompt para Imagem",
    description: "Prompts otimizados para geração de imagem",
    type: "prompt",
    tone: "formal",
    size: "short",
    context: "Crie prompts detalhados e otimizados para geração de imagem sobre",
    iconName: "Image",
  },
  {
    id: "text-prompt",
    name: "Prompt para Texto",
    description: "Prompts para geração de texto com IA",
    type: "prompt",
    tone: "formal",
    size: "medium",
    context: "Crie prompts estruturados e eficientes para geração de texto sobre",
    iconName: "FileText",
  },
  {
    id: "data-prompt",
    name: "Prompt para Análise de Dados",
    description: "Prompts para análise e extração de insights",
    type: "prompt",
    tone: "formal",
    size: "medium",
    context: "Crie prompts para análise de dados e extração de insights sobre",
    iconName: "BarChart3",
  },
  // Director
  {
    id: "ugc-health",
    name: "UGC Produto de Saúde",
    description: "Vídeo estilo UGC para produto de saúde/wellness",
    type: "director",
    tone: "casual",
    size: "short",
    context: "Crie um vídeo UGC para um produto de saúde/wellness. Estilo autêntico, câmera de celular.",
    iconName: "Smartphone",
  },
  {
    id: "edu-tiktok",
    name: "Educativo para TikTok",
    description: "Animação educativa viral para TikTok",
    type: "director",
    tone: "educativo",
    size: "short",
    context: "Crie uma animação educativa viral otimizada para TikTok com hook nos primeiros 2 segundos.",
    iconName: "Brain",
  },
  {
    id: "brand-premium",
    name: "Comercial Premium",
    description: "Comercial cinematográfico para marca premium",
    type: "director",
    tone: "formal",
    size: "medium",
    context: "Crie um comercial cinematográfico premium com color grading intencional e composição sofisticada.",
    iconName: "Clapperboard",
  },
  {
    id: "hybrid-launch",
    name: "Hook Híbrido de Lançamento",
    description: "Vídeo híbrido que combina UGC + animação + cinema para lançamento",
    type: "director",
    tone: "persuasivo",
    size: "medium",
    context: "Crie um vídeo de lançamento que abre com UGC autêntico, transiciona para animação explicativa e fecha com CTA cinematográfico premium.",
    iconName: "Zap",
  },
];
