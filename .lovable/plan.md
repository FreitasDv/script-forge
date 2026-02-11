
# Upgrade do Modo Personagem — Sub-estilos + Prompting Avancado

## O Problema

O modo "Personagem" atual tem um unico estilo: ultra-detalhado estilo Pixar/Elemental com especificacoes de material extremamente tecnicas (SSS, IOR, roughness, FACS AU codes). Isso produz resultados com acabamento excessivo que **quebram a essencia viral** de videos antropomorficos simples — aqueles onde uma fruta, pedra ou produto ganha rostinho e fala de forma fofa/engraçada.

Alem disso, o prompt nao tem orientacoes especificas sobre:
- Tom de voz e timing de fala viral (pausas comicas, entonacao exagerada)
- Hook patterns que funcionam para personagens (reacao antes da fala)
- Controle de "nivel de humanizacao" (so face vs corpo inteiro animado)
- Tecnicas anti-narração (evitar lip sync ruim, usar angulos que escondem boca)

## A Solucao

### 1. Sub-estilos de Personagem (nova opcao no wizard)

Quando o usuario seleciona "Personagem", aparece uma segunda escolha:

| Sub-estilo | Descricao | Quando usar |
|---|---|---|
| **Fofo Viral** | Objeto com face simples (olhinhos + boca), textura original do material, sem corpo humanizado. Estilo "talking food" do TikTok | Videos virais curtos, humor, produto |
| **Stylized 3D** | Personagem completo com corpo, estilo Pixar/Illumination, material storytelling. O modo atual | Storytelling longo, branding, educativo premium |
| **Plushie / Toy** | Objeto como boneco de pelucia ou action figure. Textura fofa, proporcoes chibi | Tendencia viral, merch, infantil |

### 2. Reescrita completa do prompt "character" com 3 variantes

**Fofo Viral (novo — foco principal):**
- Face: APENAS olhos googly/cartoon simples + boca minimalista no objeto REAL. O objeto mantem sua textura/forma original
- Proibido: corpo humanoide, membros, mãos, pes, roupas
- Expressoes: squash/stretch leve no objeto inteiro (5-8%), olhos que piscam e movem
- Camera: angulos que favorecem a "face" — frontal ou 3/4 levemente acima
- Fala: voz aguda/fofa com timing comico — pausa antes do punchline, "micro-reacao" de 0.3s antes de falar
- Anti lip-sync: preferir angulo 3/4 ou close nos olhos durante fala, boca move de forma simplificada (abre-fecha, sem fonemas)
- Hook: objeto em situacao inesperada, reacao exagerada, ou "quebrando a 4a parede"
- Iluminacao: natural/casual, nao studio perfeito
- Grain: leve para parecer "real" / filmado

**Stylized 3D (modo atual refinado):**
- Mantém o conteudo atual mas com ajustes:
- Reduz verbosidade do character sheet (foco no que importa, menos medidas em mm)
- Adiciona regras de timing de fala e hook
- Melhora anti-artefatos

**Plushie / Toy (novo):**
- Objeto como pelucia/boneco com textura de tecido/feltro
- Proporcoes chibi (cabeça grande, corpo pequeno)
- Expressoes via deformacao do material (tecido amassando em "sorriso")
- Ambiente real (mesa, prateleira) com profundidade de campo curta

### 3. Tecnicas avancadas de prompting integradas

Para TODOS os sub-estilos:
- **Anti-narração**: regras para evitar fala longa com lip sync. Preferir: narração em off + personagem reagindo, fala curta (max 5 palavras por take), angulo 3/4 durante fala
- **Hook formula para personagens**: "Reação emocional exagerada primeiro (0.5s) → revelação do contexto (1s) → fala curta com punchline"
- **Timing comico**: pausa de 0.3-0.5s antes do punchline, velocidade de fala 20% mais rapida que normal, "micro-olhada para camera" antes de falar
- **Kling 3.0 multi-shot**: usar Shot 1 para setup + Shot 2 para reação (em vez de tudo em 1 take)
- **Consistencia**: usar character ref do Nano Banana como imagem de referencia para manter o objeto consistente

### 4. Mudancas na UI (DirectorForm)

- Ao clicar em "Personagem" no Step 1, aparece um sub-seletor com 3 opcoes visuais (Fofo Viral, Stylized 3D, Plushie)
- O sub-estilo e passado no `directorConfig` como `characterStyle`
- Default: "Fofo Viral" (o mais usado/viral)

---

## Detalhes Tecnicos

### Arquivos modificados:

1. **`src/lib/director-types.ts`**
   - Adicionar array `CHARACTER_STYLES` com os 3 sub-estilos
   - Adicionar campo `characterStyle` ao `DirectorConfig`

2. **`src/components/DirectorForm.tsx`**
   - Adicionar estado `characterStyle`
   - Renderizar sub-seletor quando `mode === "character"` no Step 1
   - Passar `characterStyle` no `directorConfig`

3. **`supabase/functions/generate-script/index.ts`**
   - Reescrever `modeDetails.character` com 3 blocos condicionais baseados em `config.characterStyle`
   - Bloco "cute_viral": prompt focado em face simples, timing comico, anti lip-sync, hooks virais
   - Bloco "stylized_3d": prompt atual refinado (menos verbose, mais foco em timing/hook)
   - Bloco "plushie": prompt para textura pelucia, proporcoes chibi, ambiente real
   - Adicionar secao compartilhada de "ANTI-NARRAÇÃO" e "HOOK FORMULA PARA PERSONAGENS" para todos os sub-estilos
   - Ler `directorConfig.characterStyle` e selecionar o bloco correto

### Conteudo dos novos prompts (resumo):

**Bloco "cute_viral":**
```
Modo Character — FOFO VIRAL (Talking Objects 2026):
Estética "objeto com carinha" — a textura, cor e forma do objeto original são 100% preservadas.
A unica adição é: olhos expressivos + boca minimalista diretamente NA SUPERFICIE do objeto.

REGRAS DE FACE:
- Olhos: 2 estilos permitidos — (A) olhos googly 3D (esferas brancas com iris preta, levemente
  saltados 2-3mm da superficie) OU (B) olhos cartoon pintados na superficie (2D, estilo emoji).
  NUNCA olhos realistas humanos.
- Boca: linha curva simples ou "D" shape. Moves: aberta/fechada, sorriso, "O" de surpresa.
  SEM fonemas complexos, SEM dentes detalhados. A boca DEFORMA o material levemente.
- Sobrancelhas: OPCIONAIS — se presentes, são linhas simples ou vincos do material.
- PROIBIDO: nariz humano, orelhas, membros, mãos, pés, roupas, cabelo.
  O objeto É o personagem. Não humanize além da face.

EXPRESSOES VIA OBJETO:
- Squash/stretch do OBJETO INTEIRO: 5-8% máximo. Alegria = stretch vertical.
  Tristeza = squash. Surpresa = stretch + olhos 30% maiores.
- Inclinacao: objeto "olha" inclinando 5-10°. Para cima = curiosidade. Para lado = dúvida.
- Tremor: vibração de 1-2mm = raiva ou excitação.
- Pulo: deslocamento vertical 5-10% da altura = empolgação.

ANTI LIP-SYNC (CRITICO):
- Fala CURTA: máximo 5-8 palavras por take. Frases longas = narração em off.
- Durante fala: preferir ângulo 3/4 (boca parcialmente oculta) ou close nos olhos.
- Boca: abre-fecha simples sincronizado com sílabas fortes, NÃO fonemas.
- Alternativa: personagem "pensa" (balão de pensamento) em vez de falar.
- Voz: aguda/fofa, levemente acelerada (1.1x), com personalidade do material.

HOOK PARA PERSONAGENS VIRAIS:
- Frame 1: objeto em REAÇÃO emocional exagerada (olhos arregalados, boca aberta).
  O espectador vê a emoção ANTES de entender o contexto.
- 0.3-0.5s: contexto revelado (zoom out, texto, ou segundo objeto).
- 1-2s: fala curta com punchline. Pausa de 0.3s ANTES do punchline.
- "Micro-olhada para câmera" = quebra da 4a parede, 0.2s, gera conexão.

CAMERA:
- Frontal ou 3/4 levemente acima (10-15° down angle) — favorece a "face" do objeto.
- Close-up: olhos ocupam 40% do frame durante reações.
- Ambiente: mesa/bancada/prateleira real, DoF curto (f/2.8), fundo desfocado.
- Iluminação: natural ou ring light — NÃO studio cinematográfico.

CHARACTER SHEET (prompt_nano):
- Objeto visto de frente com face aplicada. Fundo branco ou cinza neutro.
- Descreva o OBJETO REAL primeiro (material, cor, tamanho, forma).
- Depois: posição e estilo dos olhos e boca NA SUPERFICIE.
- 80-120 palavras (mais curto que stylized — aqui simplicidade é a estética).
```

**Secao compartilhada "TIMING COMICO E PACING VIRAL" (para todos sub-estilos character):**
```
TIMING COMICO PARA PERSONAGENS:
- "Beat comico": ação → pausa 0.3s → reação. A PAUSA é o que gera a risada.
- Velocidade de fala: 1.1-1.2x normal. Frases curtas. Pontuação = pausa.
- "Olhar para câmera": 0.2s de contato visual direto = cumplicidade com espectador.
- Repetição com escalada: mesma reação 3x com intensidade crescente (5%, 15%, 30%).
- Som de "plop/bonk/ding" no momento da reação amplifica humor.

REGRAS DE NARRAÇÃO PARA EVITAR ERROS:
- Se a cena tem fala > 8 palavras: narração em OFF + personagem REAGE à narração.
- Se a cena tem diálogo: dividir em takes de 3-5 palavras máximo.
- Nunca: frase longa com câmera no rosto + lip sync. Sempre falha.
- Preferir: (A) narrador em off + personagem expressivo, (B) fala curta + corte, (C) texto on-screen + reação facial.
```

### Impacto:
- Novo sub-seletor visual no Step 1 quando "Personagem" esta selecionado
- 3 estilos de personagem com prompts especializados
- Tecnicas anti lip-sync e timing comico integradas
- Character sheets mais simples para "fofo viral" (80-120 palavras vs 250+)
- Hooks virais especificos para personagens
- Mantém o modo Stylized 3D atual (refinado) para quem quer qualidade premium
