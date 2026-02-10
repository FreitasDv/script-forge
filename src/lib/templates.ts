export interface Template {
  id: string;
  name: string;
  description: string;
  type: "video" | "commercial" | "prompt";
  tone: string;
  size: "short" | "medium" | "long";
  context: string;
  icon: string;
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
    icon: "🎓",
  },
  {
    id: "review",
    name: "Review de Produto",
    description: "Análise completa de um produto ou serviço",
    type: "video",
    tone: "casual",
    size: "medium",
    context: "Crie uma review detalhada com prós e contras sobre",
    icon: "⭐",
  },
  {
    id: "vlog",
    name: "Vlog",
    description: "Roteiro para vlog pessoal ou diário",
    type: "video",
    tone: "casual",
    size: "medium",
    context: "Crie um roteiro de vlog pessoal e autêntico sobre",
    icon: "📹",
  },
  {
    id: "shorts",
    name: "Shorts / Reels",
    description: "Conteúdo curto e impactante para shorts",
    type: "video",
    tone: "persuasivo",
    size: "short",
    context: "Crie um script curto e viral para shorts/reels sobre",
    icon: "⚡",
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
    icon: "📢",
  },
  {
    id: "sales-script",
    name: "Script de Vendas",
    description: "Roteiro para apresentação de vendas",
    type: "commercial",
    tone: "formal",
    size: "long",
    context: "Crie um script de vendas profissional e convincente sobre",
    icon: "💼",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    description: "Sequência de email para campanhas",
    type: "commercial",
    tone: "persuasivo",
    size: "medium",
    context: "Crie um email marketing envolvente e com call-to-action sobre",
    icon: "✉️",
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
    icon: "🖼️",
  },
  {
    id: "text-prompt",
    name: "Prompt para Texto",
    description: "Prompts para geração de texto com IA",
    type: "prompt",
    tone: "formal",
    size: "medium",
    context: "Crie prompts estruturados e eficientes para geração de texto sobre",
    icon: "📝",
  },
  {
    id: "data-prompt",
    name: "Prompt para Análise de Dados",
    description: "Prompts para análise e extração de insights",
    type: "prompt",
    tone: "formal",
    size: "medium",
    context: "Crie prompts para análise de dados e extração de insights sobre",
    icon: "📊",
  },
];
