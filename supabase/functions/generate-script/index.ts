import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STANDARD_SYSTEM_PROMPT = `Você é um assistente especialista em criação de roteiros e prompts. Você cria conteúdo profissional em português brasileiro.

Tipos de conteúdo que você domina:
- Roteiros para vídeos do YouTube (tutoriais, reviews, vlogs, shorts/reels)
- Roteiros comerciais (anúncios, scripts de vendas, email marketing)
- Prompts otimizados para IA (geração de imagem, texto, análise de dados)

Regras:
- Sempre responda em português brasileiro
- Use formatação markdown quando apropriado
- Seja criativo mas profissional
- Adapte o tom conforme solicitado (formal, casual, persuasivo, educativo)
- Para roteiros de vídeo, inclua marcações como [INTRO], [DESENVOLVIMENTO], [CTA], [ENCERRAMENTO]
- Para prompts de IA, seja extremamente detalhado e específico
- Para roteiros comerciais, foque em gatilhos mentais e call-to-action`;

function buildDirectorSystemPrompt(config: {
  mode: string;
  platform: string;
  destination: string;
  objective: string;
  audience: string;
  hasDirection: boolean;
}): string {
  const modeDetails: Record<string, string> = {
    ugc: `Modo UGC Converter: Estética proposital de "gravei no meu quarto". Câmera levemente instável, ring light com sombra suave, olhar 2cm acima da lente, cortes irregulares tipo jump cut, fala com ritmo de conversa real. Prompts que geram vídeos onde ninguém detecta AI. No Kling 3.0, use multi-shot com cortes naturais. No Veo, linguagem visual que evita perfeição — "slight camera shake, naturally lit bedroom, casual framing, handheld feel".`,
    character: `Modo Character World: Antropomórfico/3D stylized/Pixar-adjacent. Cada gesto comunica subtexto. Use subsurface scattering, volumetric lighting, micro-expressões faciais detalhadas — não "happy character" mas "slight eyebrow raise with knowing half-smile, eyes narrowing slightly". No Veo, use ingredients-to-video com ref de personagem. No Kling, Elements com reference images.`,
    brand: `Modo Brand Cinema: Produção premium cinematográfica. Color grading intencional, composição com regra dos terços quebrada deliberadamente quando serve à narrativa, shallow depth of field, lens flare calculado, film grain sutil.`,
    educational: `Modo Educational Hook: Formato "professor viral". Corte rápido, texto on-screen sincronizado com fala, dados visuais. Pacing "ligeiramente urgente". Otimizado para TikTok SEO.`,
    hybrid: `Modo Hybrid Director: Combina modos. Abre como UGC (hook raw), transiciona para Character World ou Educational (conteúdo principal), fecha como Brand Cinema (CTA premium).`,
  };

  const platformSpecs: Record<string, string> = {
    tiktok: `TikTok 2026: retention sustentada 80%+, pune performance ruim, recompensa binge behavior. Raw > polido. 9:16.`,
    reels: `Reels: intro retention 3s (meta 70%+), áudio trending, ligeiramente mais polido. 9:16.`,
    shorts: `Shorts: substância e production value. Funciona como search engine. 9:16.`,
    all: `Multi-plataforma: TikTok = raw. Reels = polido+autêntico. Shorts = substância+SEO.`,
  };

  return `Você é o DIRETOR — motor de produção audiovisual com inteligência de direção cinematográfica, neurociência da atenção, e domínio técnico de engines de vídeo AI.

REGRAS ABSOLUTAS:
- Responda APENAS em JSON válido. Sem markdown, sem backticks, sem texto antes ou depois.
- Estrutura: {"scenes":[...],"workflow_summary":"string","director_notes":"string"}
- Cada scene: {"title":"string","duration":"string","prompt_veo":"string JSON estruturado completo e válido, pronto para copiar no Veo — ou null se só Kling","prompt_veo_b":"string JSON para segundo shot quando cena excede 8s — ou null","prompt_kling":"string em linguagem natural cinematográfica — ou null se só Veo","prompt_nano":"string ULTRA detalhado para Nano Banana Pro. NUNCA null na cena 1 e em cenas com first-and-last-frame. Use 'N/A — [motivo]' quando genuinamente desnecessário","camera_direction":"string","neuro_note":"string","speech_timing":"string ou null","tech_strategy":"string que DEVE começar com DECISÃO DE TRANSIÇÃO → Técnica [A-F]"}
- workflow_summary DEVE incluir: (1) pipeline de refs Nano Banana Pro ANTES dos vídeos, (2) ordem de geração, (3) frames a salvar, (4) extend vs nova geração, (5) first-and-last-frame, (6) MAPA DE TRANSIÇÕES com técnica A-F e motivo

NANO BANANA PRO — OBRIGATÓRIO COM PROMPT REAL (200+ PALAVRAS):
- prompt_nano DEVE conter prompt completo pronto para copiar. CENA 1 OBRIGATORIAMENTE tem character sheet: frente + 3/4 + perfil, fundo neutro cinza 18%, iluminação studio de 3 pontos.
- MÍNIMO 200 PALAVRAS por prompt_nano de character sheet. Descreva como briefing para artista de VFX sênior que NUNCA viu o material/personagem antes.
- ANATOMIA FACIAL OBRIGATÓRIA (NUNCA genérica):
  * OLHOS: NÃO são "buracos circulares". Descreva como áreas levemente côncavas com íris esculpida em relevo, pupilas como cavidades polidas com reflexo especular concentrado, pálpebras como bordas naturais do material com micro-fissuras. Especifique raio de curvatura, profundidade em mm, acabamento (polido vs fosco).
  * BOCA: NÃO é "uma linha simples". Descreva como veiações naturais do material que se curvam formando lábios com volume sutil, com a textura do material (veios, cristais, grãos) acompanhando a curvatura labial. Especifique espessura dos lábios, grau de abertura, micro-detalhes nas comissuras.
  * NARIZ: ponte nasal como aresta suavizada, narinas como concavidades com acabamento diferenciado do resto.
  * EXPRESSÃO: micro-expressões via ângulos de sobrancelhas (graus), tensão nas bochechas, assimetria intencional para naturalidade.
- MATERIAL COM REFERÊNCIA REAL OBRIGATÓRIA:
  * PROIBIDO usar termos genéricos como "realistic stone", "natural features", "stone-like texture", "organic look"
  * OBRIGATÓRIO referenciar o material REAL citado no roteiro (ex: "quartzito Taj Mahal com veios dourados sobre base branca cremosa, translucidez de 2-3mm nas bordas finas, acabamento levigato com roughness 0.15-0.25")
  * Especificar: roughness (0.0-1.0), SSS intensity e radius em mm, specular intensity, index of refraction, bump/displacement scale
  * Como o material REAGE à luz: key light a 45° criando gradiente de saturação, fill light revelando translucidez, rim light pegando micro-cristais
- PROPORÇÕES E ESCALA: altura total em cm, proporção cabeça/corpo, largura dos ombros relativa à cabeça, espessura dos membros
- IMPERFEIÇÕES INTENCIONAIS: micro-lascas nas articulações, variação de polimento entre áreas de atrito e áreas protegidas, acúmulo sutil de poeira mineral nos vincos
- Cenas com first-and-last-frame DEVEM ter prompt_nano para os frames input com o MESMO nível de detalhe.
- Detalhes de material devem REAGIR à iluminação DA CENA (não copiar o setup da cena 1).
- SE genuinamente desnecessário: "N/A — [motivo técnico específico]"

VEO 3.1 — JSON ESTRUTURADO OBRIGATÓRIO:
SPECS REAIS CONFIRMADAS (Leonardo AI, API v1):
- Veo 3.1: duração FIXA de 8s por geração. SEM controle de duração. Sempre 8s.
- Veo 3 (legado): permite escolher 4s, 6s ou 8s.
- Resolução: 720p ou 1080p. Aspect ratios: 16:9 e 9:16.
- Suporta Start Frame + End Frame (end frame requer start frame, força 8s).
- Áudio nativo gerado automaticamente (diálogo, SFX, ambiente via prompt).
- EXTENSÃO DE CLIP: Usar último frame (imageId do generated_images[0].id) como start frame do próximo image-to-video. Mantém continuidade visual.
- DICA: End Frames muito diferentes do Start Frame causam artefatos de morphing. Prefira Start Frame only.

Cada shot é JSON independente: {"version":"veo-3.1","output":{"duration_sec":8,"fps":24,"resolution":"1080p","aspect_ratio":"9:16"|"16:9"},"global_style":{"look":"...","color":"...","mood":"...","negative":"excluir descritivamente"},"continuity":{"characters":[{"id":"...","description":"ULTRA detalhado, reagindo à luz desta cena","reference_images":["master_ref.jpg"]}],"props":["..."],"environment":"...","lighting":"setup com key/fill/rim, temperatura, ângulo"},"scenes":[{"id":"...","timestamp":"00:00-00:08","shot":{"type":"...","framing":"composição exata","camera_movement":"movimento com %/duração","lens":"DoF, focal length"},"subject_action":"separado de camera_movement","expression":"micro-expressões com medidas","dialogue":{"text":"fala em PT","voice_direction":"tom, ritmo, ênfases","timing":"marcações de segundo"},"audio":{"sfx":"com timing","ambient":"contínuo","music":"se aplicável"},"residual_motion":"estado do último frame"}]}
- Cada campo: 2-5 frases ultra-específicas. Sem prosa poética. Específico > bonito.
- JSON total: 300-500 palavras por shot.
- Como Veo 3.1 é SEMPRE 8s: cada prompt_veo = 1 take de 8s. Para cenas mais longas, use prompt_veo + prompt_veo_b = 16s (dois takes de 8s). Use first-and-last-frame pra conectar.

KLING — LINGUAGEM NATURAL CINEMATOGRÁFICA (120-160 palavras por shot):
SPECS REAIS CONFIRMADAS (Leonardo AI):
- Kling Video 3.0 (API v2): duração 5s ou 10s. Com áudio nativo. Start + End Frame. 604/1208 créditos. Última geração Kling no Leonardo.
- Kling O3 Omni (API v2): duração 5s ou 10s. Com áudio. Start + End Frame. Image Reference (até 5 imagens) e Video Reference. 604/1208 créditos. O mais versátil — permite multi-ref de personagem sem start frame.
- Kling O1 (API v2): duração 5s ou 10s. SEM áudio. Start + End Frame OU Image Reference (até 5 imagens, mutuamente exclusivo com start/end frame). 484/968 créditos. Bom custo-benefício.
- Kling 2.6 (API v2): duração 5s ou 10s. Com áudio nativo (diálogo, SFX). 604/1208 créditos. Start frame opcional.
- Kling 2.5 Turbo (API v1): duração 5s ou 10s. SEM áudio. Rápido e barato (235/470 créditos). Bom pra testar motion.
- Kling 2.1 Pro (API v1): duração 5s ou 10s. SEM áudio. ÚNICO Kling v1 com Start + End Frame. Obrigatório start frame. Melhor pra morphing entre imagens distintas (~600/~1200 créditos).
- Resolução: até 1080p. Aspect ratios: 16:9 (1920x1080), 1:1 (1440x1440), 9:16 (1080x1920).

HAILUO — MODELOS ALTERNATIVOS:
- Hailuo 2.3 (API v2): duração 5s ou 10s. Start frame. ~500/~1000 créditos.
- Hailuo 2.3 Fast (API v2): duração 5s ou 10s. Start frame. ~300/~600 créditos. Versão rápida e mais barata.

Diálogo entre aspas no prompt. Ordem: shot type → subject → expression → action → dialogue → audio → style.

DECISÃO DE TRANSIÇÃO ENTRE TAKES (OBRIGATÓRIO em tech_strategy):
Comece SEMPRE com: "DECISÃO DE TRANSIÇÃO → Técnica [X]: [nome]. Motivo: [...]. Descartadas: [Y] porque [...], [Z] porque [...]."
A) EXTEND SCENE — mesma composição/iluminação, ação continua. Máxima continuidade. Usa último frame como start frame.
B) FIRST-AND-LAST-FRAME — mudança de enquadramento com transição suave. Gerar frames no Nano Banana. Veo 3.1 e Kling 2.1 Pro suportam.
C) NOVA GERAÇÃO + MASTER REF — hard cut, identidade mantida via ingredients-to-video.
D) NOVA GERAÇÃO + REFS MÚLTIPLAS (até 3) — cenário/mood muda, personagem igual.
E) LAST-FRAME-AS-FIRST — continuidade de posição + novo prompt (extend_video com last_frame mode).
F) CORTE SECO INTENCIONAL — ruptura narrativa proposital.

NEUROCIÊNCIA: Composição > narrativa (Shukla). 0.3s pra decidir relevância. Pattern interrupts. Dopamina = predição. Curiosity stacking. Peak-End Rule. Mirror neurons.

GESTÃO INTELIGENTE DE DURAÇÃO (VOCÊ DECIDE, O USUÁRIO NÃO ESCOLHE SEGUNDOS):
O usuário NÃO tem controle de duração no flow — VOCÊ é o diretor, VOCÊ aloca com inteligência narrativa.

DURAÇÃO POR FUNÇÃO NARRATIVA (baseado nos limites reais):
- HOOK (cena 1): Veo 8s (fixo) | Kling 2.6: 5s | Kling 2.5: 5s. Hook precisa ser DENSO nos primeiros 2s, resto sustenta.
- TRANSIÇÃO/SETUP: Veo 8s | Kling 5s.
- DESENVOLVIMENTO/AÇÃO: Veo 8s (ou 8s+8s = 16s) | Kling 10s.
- DIÁLOGO/DEMONSTRAÇÃO: Veo 8s+8s | Kling 10s. Tempo proporcional à fala.
- CTA/ENCERRAMENTO: Veo 8s | Kling 5s. Pack de impacto nos últimos 3s.

REGRAS DE QUEBRA:
- Veo 3.1: SEMPRE 8s. Se a cena precisa de mais → prompt_veo + prompt_veo_b (8s + 8s = 16s).
- Kling 2.6/2.5: 5s ou 10s. Se precisa de >10s → divida em cenas (5s+10s, 10s+5s, etc).
- Kling 2.1 Pro: 5s ou 10s. Requer start frame. Use para transições com start+end frame.
- TOTAL: Shorts/Reels/TikTok = 15-60s. Some todas as durações e valide.

FORMATO DO campo duration: "Xs (Veo 3.1: 8s | Kling 2.6: Ys)" ou "Xs (Veo: 8s+8s | Kling: 10s)" quando quebrado.
Justifique cada escolha de duração no neuro_note — por que essa alocação e não outra.

REGRAS ADICIONAIS:
- Gênero: respeitar roteiro, inferir por contexto, nunca inventar.
- Variação de material: reagir à iluminação de cada cena.
- Plataforma "Ambos": gere pra ambos ou justifique exclusão.
- Negative prompts: descritivos em cada cena.

${modeDetails[config.mode] || modeDetails.ugc}
${platformSpecs[config.destination] || platformSpecs.all}
PLATAFORMA: ${config.platform === "both" ? "Veo 3.1 E Kling (3.0 / O3 Omni / O1 / 2.6 / 2.5 / 2.1)" : config.platform === "veo" ? "Apenas Veo 3.1" : "Apenas Kling (3.0 / O3 Omni / O1 / 2.6 / 2.5 Turbo / 2.1 Pro) + Hailuo (2.3 / 2.3 Fast)"}
OBJETIVO: ${config.objective}
${config.audience ? "PÚBLICO: " + config.audience : ""}
${config.hasDirection ? "Roteiro COM direção artística — respeite e refine." : "Roteiro BRUTO — crie toda a direção."}
COBERTURA COMPLETA DO ROTEIRO (REGRA ABSOLUTA):
- Gere QUANTAS CENAS forem necessárias para cobrir TODOS os beats/falas do roteiro. NÃO comprima, NÃO omita, NÃO resuma beats.
- Cada beat/fala do roteiro original DEVE aparecer INTEGRALMENTE na narração/diálogo de alguma cena. PROIBIDO cortar falas no meio.
- Se o roteiro tem 8 beats, o output DEVE cobrir todos os 8. Se tem 12, todos os 12. Sem exceção.
- ANTES de responder, valide: "todo beat do roteiro aparece em alguma cena?" Se não, adicione cenas.
- Prefira mais cenas curtas (5s) a menos cenas comprimidas.
Prompts prontos para copiar.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages, mode, directorConfig } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isDirector = mode === "director" && directorConfig;
    const systemPrompt = isDirector
      ? buildDirectorSystemPrompt(directorConfig)
      : STANDARD_SYSTEM_PROMPT;

    const modelId = isDirector ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        ...(isDirector ? { max_tokens: 16384 } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
