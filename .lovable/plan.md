

# Elevar a Engenharia de Prompt e Direção do DIRETOR

## Diagnostico

O system prompt atual no `supabase/functions/generate-script/index.ts` ja e extenso (~4000 palavras), mas tem lacunas importantes:

1. **Nano Banana Pro** - as instrucoes de anatomia facial foram adicionadas recentemente mas ainda faltam: paleta de iluminacao por mood, instrucoes de composicao de camera para o character sheet, e exemplos concretos de prompt (golden example)
2. **Modos visuais** - cada modo (UGC, Character, Brand, Educational, Hybrid) tem apenas 2-3 linhas genericas. Falta vocabulario visual tecnico atualizado (2026), referencias a tendencias reais de cada plataforma, e instrucoes de pacing por modo
3. **Neurociencia** - e uma unica linha generica. Precisa virar um framework aplicavel: como traduzir cada conceito neuro em decisao de prompt concreta
4. **Design de prompt Veo/Kling** - o template JSON do Veo e bom mas falta enfase em: negative prompts eficazes, como descrever expressoes que as engines entendem, e como evitar os artefatos mais comuns (morphing, flickering, static pose)
5. **Falta de golden examples** - o modelo nao tem nenhum exemplo concreto de prompt_nano ou prompt_veo bem feito para calibrar o nivel de detalhe esperado
6. **Plataforma specs desatualizadas** - TikTok/Reels/Shorts em 2026 tem metricas e comportamentos diferentes

## Solucao

Reescrever o system prompt do Diretor com as seguintes melhorias:

### 1. Modos visuais expandidos (5 modos)
- **UGC**: Adicionar vocabulario de "imperfection design" — como instruir a engine a gerar imperfeicao proposital (grain ISO especifico, color shift de ring light barato, reflexo de tela no olho)
- **Character World**: Adicionar instrucoes de animation principles (squash/stretch sutil, anticipation em gestos, secondary motion em acessorios/cabelo). Referencia a estetica Illumination/Pixar 2024-2026
- **Brand Cinema**: Adicionar referencia a color science (LUT names, color temperature K, teal-orange vs earthy tones), lens language (anamorphic vs spherical, specific focal lengths e o que comunicam emocionalmente)
- **Educational**: Adicionar framework de "visual hierarchy" — como o texto on-screen compete com o sujeito, regras de posicionamento, timing de aparicao
- **Hybrid**: Adicionar regras de transicao entre modos — como o corte visual sinaliza a mudanca de modo

### 2. Nano Banana Pro — golden example + composicao
- Incluir UM exemplo completo de prompt_nano (~250 palavras) que sirva de calibracao para o modelo
- Adicionar instrucoes de COMPOSICAO DO CHARACTER SHEET: camera angle exato para cada vista (frente = 0 graus, 3/4 = 35 graus, perfil = 90 graus), distancia focal, altura da camera relativa ao personagem
- Adicionar instrucoes de ILUMINACAO ADAPTATIVA: como a iluminacao do character sheet muda dependendo do mood do roteiro (sombrio = key light mais lateral, alegre = fill mais forte)
- Adicionar instrucoes de POSE E GESTUAL: postura base que comunica a personalidade do personagem, posicao das maos, inclinacao de cabeca

### 3. Neurociencia como framework aplicavel
Transformar a linha generica em blocos especificos:
- **Hook (0-2s)**: Pattern interrupt via composicao inesperada OU fala provocativa. Dopamina via gap de curiosidade. Instrucao concreta: "o primeiro frame DEVE conter tensao visual — contraste alto, sujeito off-center, ou movimento ja iniciado"
- **Retencao (2-8s)**: Curiosity stacking — cada 2-3s uma micro-revelacao. "Se o espectador consegue prever o proximo frame, voce perdeu"
- **Peak-End (ultimos 3s)**: O que o cerebro grava. CTA no pico emocional, nao depois. "O ultimo frame define se o video e salvo ou esquecido"
- **Mirror neurons**: Expressoes faciais do personagem ativam espelhamento. "Micro-expressao > dialogo para gerar empatia"

### 4. Anti-artefatos para Veo e Kling
Adicionar secao de problemas comuns e como evitar nos prompts:
- **Morphing/flickering**: "Evite end frames muito diferentes do start frame. Descreva residual_motion para o ultimo frame"
- **Static pose**: "NUNCA descreva apenas o estado final. Descreva a TRANSICAO — de onde pra onde o sujeito se move"
- **Uncanny valley em personagens**: "Use 'stylized 3D' explicito no prompt. Evite 'photorealistic' com personagens antropomorficos"
- **Audio desync**: "Timing de fala DEVE ser descrito em segundos no prompt. Ex: 'speaks at 1.5s, pauses at 3s, resumes at 4s'"

### 5. Plataforma specs 2026
- **TikTok**: Algoritmo prioriza completion rate > likes. Formato favorito: lista + hook forte. SEO via texto on-screen. 9:16 obrigatorio
- **Reels**: Meta prioriza original audio + shares. Formato: storytelling visual com punch final. Trending audio como boost. 9:16
- **Shorts**: YouTube prioriza watch time + subscribe click. Formato: valor informativo denso. Funciona como search engine. 9:16

### 6. Aumento do max_tokens
- Aumentar de 16384 para 32768 para acomodar o system prompt maior sem comprometer o espaco de resposta

## Detalhes Tecnicos

### Arquivo: `supabase/functions/generate-script/index.ts`

Reescrita completa da funcao `buildDirectorSystemPrompt()`:
- Expandir `modeDetails` com 8-12 linhas por modo (atual: 2-3)
- Expandir `platformSpecs` com metricas 2026
- Adicionar secao NEUROCIENCIA APLICADA (framework, nao lista)
- Adicionar secao ANTI-ARTEFATOS
- Adicionar golden example de prompt_nano no bloco NANO BANANA PRO
- Manter todas as specs tecnicas de Veo/Kling/Hailuo (ja estao boas)
- Alterar `max_tokens` de 16384 para 32768

### Arquivos modificados:
1. `supabase/functions/generate-script/index.ts` — reescrita do system prompt do Diretor

