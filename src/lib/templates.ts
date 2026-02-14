export interface Template {
  id: string;
  name: string;
  description: string;
  type: "video" | "commercial" | "prompt" | "director";
  tone: string;
  size: "short" | "medium" | "long";
  /** Placeholder didático para o textarea do usuário */
  placeholder: string;
  /** Instrução invisível enviada como system context para a IA */
  systemContext: string;
  iconName: string;
  /** Categoria para filtro visual */
  category: string;
}

export const templateCategories = [
  { id: "all", label: "Todos" },
  { id: "video", label: "Vídeo / YouTube" },
  { id: "commercial", label: "Comercial" },
  { id: "prompt", label: "Prompts IA" },
  { id: "director", label: "Diretor" },
] as const;

export const templates: Template[] = [
  // ─── VIDEO / YOUTUBE ───
  {
    id: "tutorial",
    name: "Tutorial",
    description: "Roteiro para vídeo tutorial passo a passo com timestamps",
    type: "video",
    tone: "educativo",
    size: "medium",
    category: "video",
    placeholder: "Ex: Como fazer pão caseiro em 5 passos simples",
    systemContext: `Crie um roteiro de tutorial passo a passo.
ESTRUTURA OBRIGATÓRIA:
[INTRO] Contextualização + promessa do que o espectador vai aprender (10-15s)
[PASSO 1] até [PASSO N] — cada passo com:
  - Explicação clara
  - Dica prática
  - Timestamp estimado
[RECAP] Resumo rápido dos passos (10s)
[CTA] Chamada para ação (5s)
Numere cada passo. Use linguagem acessível. Inclua timestamps estimados para cada seção.`,
    iconName: "GraduationCap",
  },
  {
    id: "review",
    name: "Review de Produto",
    description: "Análise completa com prós, contras e veredicto final",
    type: "video",
    tone: "casual",
    size: "medium",
    category: "video",
    placeholder: "Ex: Review do iPhone 16 Pro Max depois de 30 dias de uso",
    systemContext: `Crie uma review de produto completa e honesta.
ESTRUTURA OBRIGATÓRIA:
[HOOK] Veredicto provocativo em 1 frase (5s)
[UNBOXING/PRIMEIRO CONTATO] Primeiras impressões visuais e táteis (15-20s)
[PRÓS] Lista de 3-5 pontos positivos com exemplos reais (30-45s)
[CONTRAS] Lista de 2-3 pontos negativos honestos (20-30s)
[COMPARAÇÃO] vs. principal concorrente (15-20s)
[VEREDICTO] Para quem vale a pena / para quem NÃO vale (10s)
[CTA] Chamada para ação (5s)
Use linguagem de conversa natural. Seja honesto — credibilidade > elogio.`,
    iconName: "Star",
  },
  {
    id: "vlog",
    name: "Vlog",
    description: "Roteiro para vlog pessoal com estrutura narrativa",
    type: "video",
    tone: "casual",
    size: "medium",
    category: "video",
    placeholder: "Ex: Um dia na minha rotina como freelancer remoto em Lisboa",
    systemContext: `Crie um roteiro de vlog pessoal e autêntico.
ESTRUTURA:
[COLD OPEN] Cena interessante do meio do dia para capturar atenção (5-10s)
[INTRO] Contextualização rápida do dia/tema (10s)
[DESENVOLVIMENTO] 3-5 momentos-chave do dia com transições naturais
[REFLEXÃO] Momento pessoal/lição aprendida (15-20s)
[ENCERRAMENTO] Despedida + CTA natural (10s)
Tom de conversa com amigo. Inclua sugestões de B-roll entre seções.`,
    iconName: "Video",
  },
  {
    id: "shorts",
    name: "Shorts / Reels",
    description: "Script curto e viral otimizado para 15-60 segundos",
    type: "video",
    tone: "persuasivo",
    size: "short",
    category: "video",
    placeholder: "Ex: 3 erros que todo iniciante comete na academia",
    systemContext: `Crie um script de 15-60s otimizado para Shorts/Reels/TikTok.
ESTRUTURA OBRIGATÓRIA:
[HOOK] (0-2s) — Pattern interrupt. Frase curta e impactante que impede o scroll. Use números específicos, afirmações polêmicas, ou perguntas provocativas. PROIBIDO: "Você sabia?", "Oi pessoal".
[CONTEÚDO] (3-25s) — Informação densa com mudança visual a cada 3s. Frases curtas. Ritmo rápido. Dados específicos > generalizações.
[CTA] (últimos 3s) — Integrado ao conteúdo, não genérico. "Manda pra quem precisa ver" > "se inscreva".
FORMATO DE ENTREGA:
[HOOK] texto exato
[CORTE] texto exato  
[CORTE] texto exato
[CTA] texto exato
Use frases de no máximo 8 palavras por corte. Inclua sugestões de texto on-screen.`,
    iconName: "Zap",
  },
  // ─── COMERCIAL ───
  {
    id: "social-ad",
    name: "Anúncio para Redes Sociais",
    description: "Copy persuasiva com headline, corpo e CTA otimizados",
    type: "commercial",
    tone: "persuasivo",
    size: "short",
    category: "commercial",
    placeholder: "Ex: Curso online de culinária vegana com 50% de desconto",
    systemContext: `Crie um anúncio persuasivo para redes sociais.
ESTRUTURA OBRIGATÓRIA (AIDA):
[HEADLINE] — Atenção em 1 frase (max 10 palavras). Use número + benefício.
[SUBHEADLINE] — Interesse: qual problema resolve? (1-2 frases)
[CORPO] — Desejo: 3 benefícios com bullet points + prova social
[CTA] — Ação: botão claro + urgência/escassez
Gere 3 variações:
- Variação A: Dor → Solução
- Variação B: Curiosidade → Revelação  
- Variação C: Prova social → Oferta
Inclua sugestões de emoji e hashtags relevantes.`,
    iconName: "Megaphone",
  },
  {
    id: "sales-script",
    name: "Script de Vendas",
    description: "Roteiro para apresentação de vendas com gatilhos mentais",
    type: "commercial",
    tone: "formal",
    size: "long",
    category: "commercial",
    placeholder: "Ex: Software de gestão financeira para pequenas empresas",
    systemContext: `Crie um script de vendas profissional.
ESTRUTURA (Método SPIN Selling adaptado):
[SITUAÇÃO] Perguntas para entender o contexto do cliente (2-3 perguntas)
[PROBLEMA] Identificar a dor principal (com dados de mercado)
[IMPLICAÇÃO] O que acontece se NÃO resolver (consequências reais)
[NECESSIDADE] Como o produto/serviço resolve (benefícios > features)
[DEMONSTRAÇÃO] Pontos-chave para apresentar (3-5 slides sugeridos)
[OBJEÇÕES] Top 3 objeções + respostas preparadas
[FECHAMENTO] 2 técnicas de fechamento (alternativa + urgência)
[FOLLOW-UP] Script de acompanhamento pós-reunião
Tom profissional mas humano. Use gatilhos: autoridade, prova social, escassez.`,
    iconName: "Briefcase",
  },
  {
    id: "email-marketing",
    name: "Email Marketing",
    description: "Email completo com subject line, preview e sequência",
    type: "commercial",
    tone: "persuasivo",
    size: "medium",
    category: "commercial",
    placeholder: "Ex: Lançamento de nova coleção de roupas sustentáveis",
    systemContext: `Crie um email marketing completo e pronto para enviar.
ESTRUTURA OBRIGATÓRIA:
[SUBJECT LINE] — Max 50 caracteres. Gere 3 opções (curiosidade / benefício / urgência)
[PREHEADER] — Max 80 caracteres. Complementa o subject, NÃO repete.
[ABERTURA] — Hook pessoal em 2 frases. Nome do destinatário como variável {{nome}}.
[CORPO] — 3 benefícios com formatação escaneável (bullets, bold, espaçamento)
[PROVA SOCIAL] — Depoimento, número, ou resultado (1-2 frases)
[CTA PRINCIPAL] — Botão com texto de ação (max 4 palavras). Cor contrastante.
[PS] — Reforço de urgência ou bônus exclusivo.
Marque cada seção com labels claros. Inclua notas de design (cores, alinhamento).`,
    iconName: "Mail",
  },
  {
    id: "carousel",
    name: "Carrossel Instagram",
    description: "Roteiro de 5-10 slides com hook, conteúdo e CTA",
    type: "commercial",
    tone: "educativo",
    size: "medium",
    category: "commercial",
    placeholder: "Ex: 7 hábitos matinais que vão mudar sua produtividade",
    systemContext: `Crie um carrossel para Instagram com 5-10 slides.
ESTRUTURA OBRIGATÓRIA:
[SLIDE 1 — CAPA] Headline impactante + visual sugerido. Deve funcionar como hook no feed.
[SLIDE 2] Contextualização ou "por que isso importa"
[SLIDES 3-8] Conteúdo principal — 1 ponto por slide, com:
  - Título curto (max 5 palavras)
  - Texto de apoio (max 20 palavras)
  - Sugestão visual/ícone
[SLIDE PENÚLTIMO] Resumo visual ou checklist
[SLIDE FINAL — CTA] Chamada para ação + "Salve para consultar depois" + "Mande para alguém"
REGRAS: Max 30 palavras por slide. Tipografia legível. Cores consistentes.
Inclua sugestão de legenda do post (com hashtags).`,
    iconName: "BarChart3",
  },
  // ─── PROMPTS IA ───
  {
    id: "image-prompt",
    name: "Prompt para Imagem",
    description: "Prompts detalhados para Midjourney, DALL-E, Stable Diffusion",
    type: "prompt",
    tone: "formal",
    size: "short",
    category: "prompt",
    placeholder: "Ex: Foto profissional de café artesanal para cardápio de cafeteria",
    systemContext: `Crie prompts otimizados para geração de imagem com IA.
FORMATO DE ENTREGA (gere 3 variações):
Para cada variação, forneça:
[PROMPT] — Prompt principal em inglês (80-150 palavras)
  Estrutura: Subject → Action/Pose → Environment → Lighting → Style → Camera → Details
[NEGATIVE] — O que evitar (20-30 palavras)
[PARÂMETROS] — Settings sugeridos (aspect ratio, style, quality, etc)
[TRADUÇÃO] — Versão em PT-BR para referência

REGRAS:
- Comece pelo sujeito principal, depois ambiente, depois estilo
- Inclua referências de iluminação específicas (golden hour, studio lighting, etc)
- Especifique lente/câmera quando relevante (85mm, f/1.4, etc)
- Variação A: fotorealista / Variação B: artística / Variação C: conceitual`,
    iconName: "Image",
  },
  {
    id: "landing-copy",
    name: "Copy de Landing Page",
    description: "Headline, subheadline, bullets e CTA para página de vendas",
    type: "prompt",
    tone: "persuasivo",
    size: "medium",
    category: "prompt",
    placeholder: "Ex: Landing page para app de meditação guiada com plano mensal",
    systemContext: `Crie copy completa para landing page de alta conversão.
ESTRUTURA OBRIGATÓRIA:
[HERO]
  - Headline: max 10 palavras, benefício principal
  - Subheadline: 1-2 frases expandindo a promessa
  - CTA primário: texto do botão (max 4 palavras)
[PROVA SOCIAL] Números, logos, depoimentos (3 sugestões)
[BENEFÍCIOS] 3-4 blocos com ícone + título + descrição (20 palavras cada)
[COMO FUNCIONA] 3 passos simples
[FAQ] 4-5 perguntas frequentes com respostas
[CTA FINAL] Reforço da oferta + urgência
Gere 2 variações de headline: uma racional, uma emocional.`,
    iconName: "FileText",
  },
  // ─── DIRETOR ───
  {
    id: "ugc-health",
    name: "UGC Produto de Saúde",
    description: "Vídeo estilo UGC autêntico para produto de saúde/wellness",
    type: "director",
    tone: "casual",
    size: "short",
    category: "director",
    placeholder: "Ex: Suplemento de colágeno em pó, público feminino 30-50 anos",
    systemContext: "Crie um vídeo UGC para um produto de saúde/wellness. Estilo autêntico, câmera de celular.",
    iconName: "Smartphone",
  },
  {
    id: "edu-tiktok",
    name: "Educativo para TikTok",
    description: "Animação educativa viral para TikTok com hook nos primeiros 2s",
    type: "director",
    tone: "educativo",
    size: "short",
    category: "director",
    placeholder: "Ex: Como funciona o algoritmo do TikTok em 30 segundos",
    systemContext: "Crie uma animação educativa viral otimizada para TikTok com hook nos primeiros 2 segundos.",
    iconName: "Brain",
  },
  {
    id: "brand-premium",
    name: "Comercial Premium",
    description: "Comercial cinematográfico para marca premium",
    type: "director",
    tone: "formal",
    size: "medium",
    category: "director",
    placeholder: "Ex: Lançamento de perfume masculino de luxo, estilo cinematic",
    systemContext: "Crie um comercial cinematográfico premium com color grading intencional e composição sofisticada.",
    iconName: "Clapperboard",
  },
  {
    id: "hybrid-launch",
    name: "Hook Híbrido de Lançamento",
    description: "UGC + animação + cinema combinados para lançamento de produto",
    type: "director",
    tone: "persuasivo",
    size: "medium",
    category: "director",
    placeholder: "Ex: Lançamento de app de finanças pessoais para jovens adultos",
    systemContext: "Crie um vídeo de lançamento que abre com UGC autêntico, transiciona para animação explicativa e fecha com CTA cinematográfico premium.",
    iconName: "Zap",
  },
  {
    id: "pack-comercial",
    name: "Pack de Produção Comercial",
    description: "5-7 criativos coordenados para o mesmo produto com variações de formato",
    type: "director",
    tone: "persuasivo",
    size: "long",
    category: "director",
    placeholder: "Ex: Mármore Quartzito Taj Mahal — lançamento de coleção premium para arquitetos e designers",
    systemContext: "Gere um PACK DE PRODUÇÃO COMERCIAL com 5-7 criativos coordenados para o mesmo produto. Cada criativo deve ter formato diferente: 1) Comercial hero (cinema), 2) UGC review autêntico, 3) Educativo/tutorial, 4) Trend/viral curto, 5) Bastidor/making-of. Todos compartilham a mesma identidade visual e mensagem-chave, mas adaptados ao formato. Inclua character sheet do produto se aplicável.",
    iconName: "Package",
  },
  {
    id: "produto-personagem",
    name: "Produto com Personagem",
    description: "Personagem antropomórfico vendendo o produto — estilo viral com storytelling",
    type: "director",
    tone: "casual",
    size: "medium",
    category: "director",
    placeholder: "Ex: Pedra Quartzito Taj Mahal como conselheiro de obras — 5 erros que encarecem sua reforma",
    systemContext: "Crie um vídeo com PERSONAGEM ANTROPOMÓRFICO vendendo o produto. O produto ganha vida como personagem com personalidade definida (conselheiro, especialista, amigo). Use o estilo 'cute viral' com olhinhos e boca na textura original do material. O personagem deve ter falas em Português Formal e interagir com o cenário de uso real do produto. Inclua character sheet detalhado com física de materiais.",
    iconName: "Bot",
  },
  {
    id: "podcast-script",
    name: "Roteiro de Podcast",
    description: "Estrutura com perguntas, segmentos e notas de produção",
    type: "video",
    tone: "casual",
    size: "long",
    category: "video",
    placeholder: "Ex: Episódio sobre inteligência artificial no mercado de trabalho, com convidado especialista",
    systemContext: `Crie um roteiro de podcast/entrevista estruturado.
ESTRUTURA OBRIGATÓRIA:
[ABERTURA] Vinheta + apresentação do tema e convidado (30-60s)
[WARM-UP] 1-2 perguntas leves para quebrar o gelo
[BLOCO 1] Tema principal — 3-4 perguntas com follow-ups sugeridos
[BLOCO 2] Aprofundamento / controvérsia — 2-3 perguntas provocativas
[BLOCO 3] Aplicação prática — 2-3 perguntas "como fazer"
[RELÂMPAGO] 5 perguntas rápidas de resposta curta (diversão)
[ENCERRAMENTO] Onde encontrar o convidado + CTA do podcast
Inclua notas de produção: quando inserir vinheta, efeitos sonoros, destaques para corte.`,
    iconName: "FileText",
  },
];
