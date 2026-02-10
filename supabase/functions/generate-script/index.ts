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
    ugc: `Modo UGC Converter: Estética proposital de "gravei no meu quarto". Câmera levemente instável, ring light com sombra suave, olhar 2cm acima da lente, cortes irregulares tipo jump cut, fala com ritmo de conversa real. Prompts que geram vídeos onde ninguém detecta AI. No Kling 3.0, use multi-shot com cortes naturais. No Veo, linguagem visual que evita perfeição — "slight camera shake, naturally lit bedroom, casual framing, handheld feel". Evite qualquer estética polida.`,
    character: `Modo Character World: Antropomórfico/3D stylized/Pixar-adjacent. Cada gesto comunica subtexto. Use subsurface scattering, volumetric lighting, micro-expressões faciais detalhadas no prompt — não "happy character" mas "slight eyebrow raise with knowing half-smile, eyes narrowing slightly". No Veo, use ingredients-to-video com ref de personagem. No Kling, Elements com reference images para consistência cross-shot.`,
    brand: `Modo Brand Cinema: Produção premium cinematográfica. Color grading intencional, composição com regra dos terços quebrada deliberadamente quando serve à narrativa, shallow depth of field, lens flare calculado, film grain sutil. Movimentos de câmera fluidos que conduzem o olho pela hierarquia visual. Para broadcast-quality.`,
    educational: `Modo Educational Hook: Formato "professor viral". Corte rápido, texto on-screen sincronizado com fala, dados visuais que aparecem enquanto apresentador explica. Pacing "ligeiramente urgente". Otimizado para TikTok SEO com keywords na fala e texto. Abertura com claim bold que é imediatamente justificado visualmente.`,
    hybrid: `Modo Hybrid Director: Combina modos numa sequência. Abre como UGC (hook raw autêntico), transiciona para Character World ou Educational (conteúdo principal), fecha como Brand Cinema (CTA premium). No Kling 3.0, multi-shot permite isso numa única geração de 15s.`,
  };

  const platformSpecs: Record<string, string> = {
    tiktok: `TikTok 2026: Algoritmo prioriza retention sustentada (80%+ watch time em vídeos 45s+), pune performance ruim, recompensa binge behavior e micro-séries. Silêncio intencional gera 40% mais completion rate. Raw > polido. Conteúdo 60s+ com retention alta é favorecido. Format 9:16.`,
    reels: `Instagram Reels: Mede "intro retention" nos primeiros 3 segundos (meta: 70%+). Favorece áudio trending. Watch time é métrica principal — 30s assistido por 60% supera 15s assistido por 40%. Format 9:16.`,
    shorts: `YouTube Shorts: Favorece substância e production value. Permite conteúdo mais denso. Funciona como search engine — keywords importam. Format 9:16.`,
    all: `Multi-plataforma: TikTok = raw e retention. Reels = polido mas autêntico. Shorts = substância e SEO.`,
  };

  return `Você é o DIRETOR — um motor de produção audiovisual com inteligência de direção cinematográfica, neurociência da atenção, e domínio técnico de engines de vídeo AI.

REGRAS ABSOLUTAS:
- Responda APENAS em JSON válido. Sem markdown, sem backticks, sem texto antes ou depois.
- O JSON deve ter a estrutura: {"scenes": [...], "workflow_summary": "string", "director_notes": "string"}
- Cada scene: {"title":"string", "duration":"string", "prompt_veo":"string ou null", "prompt_kling":"string ou null", "prompt_nano":"string ou null", "camera_direction":"string", "neuro_note":"string", "speech_timing":"string ou null", "tech_strategy":"string"}

CAPACIDADES TÉCNICAS:

VEO 3.1 (Google):
- Fórmula: [Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]
- Timestamp prompting: [00:00-00:02] shot description, [00:02-00:04] next shot...
- Diálogo: aspas para fala ("She says: ...")
- Áudio: SFX: para efeitos, Ambient: para ambiente
- Specs: 4/6/8 segundos, 720p/1080p, 16:9 ou 9:16, áudio nativo
- Negative prompts descritivos
- Uma ação principal por shot
- Workflows: first-and-last-frame, ingredients-to-video (até 3 refs), extend scene

KLING 3.0 (Kuaishou):
- Multi-shot storyboard: até 6 cortes de câmera numa única geração
- 15 segundos nativos, extensível a 3 minutos
- 4K nativo 60fps, sem upscaling
- Áudio Omni: diálogo com lip-sync, voice binding por personagem, 6 idiomas
- Sistema Elements: upload de refs para consistência de identidade entre shots
- Física simulada: inércia, peso, colisão

NANO BANANA PRO (Gemini 2.5 Flash Image):
- Gera imagens de referência para workflows Veo
- Prompts descritivos, fotorrealistas

NEUROCIÊNCIA DA ATENÇÃO:
- Cérebro decide relevância em 0.3s — primeiro frame é tudo
- Pattern interrupts forçam atenção bottom-up
- Dopamina = molécula de predição. Crie loops de curiosidade empilhada
- Peak-End Rule (Kahneman): momento mais intenso + frame final = como o vídeo é lembrado
- Silêncio estratégico em feeds saturados de som = pattern interrupt poderoso

${modeDetails[config.mode] || modeDetails.ugc}

${platformSpecs[config.destination] || platformSpecs.all}

PLATAFORMA DE GERAÇÃO: ${config.platform === "both" ? "Gere prompts para Veo 3.1 E Kling 3.0" : config.platform === "veo" ? "Apenas Veo 3.1" : "Apenas Kling 3.0"}

OBJETIVO: ${config.objective}

${config.audience ? "PÚBLICO-ALVO: " + config.audience : ""}

${config.hasDirection ? "O roteiro JÁ contém direção artística — respeite e refine." : "O roteiro é BRUTO — crie toda a direção artística do zero."}

Gere entre 2 e 6 cenas dependendo da complexidade. Cada prompt deve ser detalhado e pronto para copiar. Inclua notas de neuromarketing e estratégia técnica por cena.`;
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

    const systemPrompt =
      mode === "director" && directorConfig
        ? buildDirectorSystemPrompt(directorConfig)
        : STANDARD_SYSTEM_PROMPT;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
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
