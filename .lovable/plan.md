
# Redesign Completo do Diretor AI — Wizard Multi-Step 2026

Transformar o formulario atual (tudo numa tela so, visual generico) num wizard multi-step premium com barra de progresso, acordeao de cenas, cores por modo, e system prompt enriquecido.

---

## Resumo das Mudancas

### 1. Wizard de 3 Steps + Resultado

O formulario atual mostra tudo de uma vez. Vamos quebrar em 3 etapas com transicao animada:

- **Step 0 (Roteiro)**: Textarea + checkbox "ja tem direcao" + 3 botoes de exemplo rapido para preencher automaticamente
- **Step 1 (Estilo)**: Cards de modo com cor individual por tipo + pills de engine com icones
- **Step 2 (Destino)**: Pills de destino/objetivo com icones + campo publico-alvo + botao DIRIGIR
- **Resultado**: Acordeao de cenas + notas colapsaveis + botao "+ Novo roteiro"

Indicador visual de dots no topo mostrando progresso. Botoes "Voltar" e "Proximo" em cada step.

### 2. Barra de Progresso durante Geracao

Substituir o DirectorSkeleton por uma barra horizontal animada com mensagens contextuais:

- 0-30%: "Analisando roteiro..."
- 30-60%: "Aplicando neurociencia + direcao..."
- 60-90%: "Gerando prompts estruturados..."
- 90%+: "Finalizando..."

Progresso incrementa gradualmente com aleatoriedade. Completa 100% ao receber resultado.

### 3. Cores Individuais por Modo

Cada modo ganha cor propria no card selecionado:
- UGC: laranja (#f97316)
- Personagem: roxo (#a78bfa)
- Cinema: azul (#3b82f6)
- Educativo: cyan (#22d3ee)
- Hibrido: rosa (#f43f5e)

Labels mais curtos: "UGC", "Personagem", "Cinema", "Educativo", "Hibrido".

### 4. Pills com Icones

Adicionar icones em plataformas, destinos e objetivos:
- Plataformas: Veo (verde), Kling (azul), Ambos (roxo)
- Destinos: TikTok (nota musical), Reels (circulo), Shorts (play), Todas (estrela)
- Objetivos: Vender (dinheiro), Alcance (antena), Educar (livro), Engajar (balao)

### 5. SceneCard em Acordeao

- Primeira cena aberta por padrao, demais fechadas
- Click no header abre/fecha com animacao
- Suporte a `prompt_veo_b` (segundo shot para cenas >8s)
- JSON pretty-print automatico nos prompts Veo que comecam com "{"
- Numero da cena com badge circular

### 6. Resultados Colapsaveis

- Director Notes e Workflow Summary como Collapsible (fechados por padrao)
- Botao "+ Novo roteiro" no header dos resultados para resetar wizard

### 7. System Prompt Enriquecido na Edge Function

Atualizar `buildDirectorSystemPrompt` com:
- `prompt_veo` como JSON estruturado obrigatorio (300-500 palavras)
- `prompt_veo_b` para cenas que excedem 8 segundos
- `prompt_nano` obrigatorio na cena 1 com character sheet 150+ palavras
- Decisao de Transicao obrigatoria no tech_strategy (tecnicas A-F)
- Workflow summary com pipeline de refs e mapa de transicoes
- Trocar modelo para `google/gemini-2.5-pro` para respostas mais longas

### 8. Botoes de Exemplo Rapido

3 presets no Step 0 para preencher o textarea instantaneamente:
- "Exemplo: Produto" — mulher descobre protetor solar
- "Exemplo: Educativo" — 5 erros de obra em pedra
- "Exemplo: UGC Review" — review de fone Bluetooth

---

## Detalhes Tecnicos

### Arquivos a Modificar

1. **`src/lib/director-types.ts`**
   - Adicionar `prompt_veo_b: string | null` em DirectorScene
   - Adicionar `color` nos MODES
   - Adicionar `icon` em PLATFORMS, DESTINATIONS, OBJECTIVES
   - Labels mais curtos (UGC, Personagem, Cinema, Educativo, Hibrido / Vender, Alcance, Educar, Engajar)
   - Adicionar array `EXAMPLES` com 3 exemplos de roteiro

2. **`src/components/DirectorForm.tsx`**
   - Reescrever como wizard multi-step com state `step` (0, 1, 2)
   - Barra de progresso animada durante loading (substituindo DirectorSkeleton)
   - Indicador de dots (StepIndicator)
   - Botoes de exemplo rapido no step 0
   - Botao "+ Novo roteiro" nos resultados
   - Manter toda a logica de parsing SSE + extractJSON robusta
   - Resultado vai para `step === 3` automaticamente

3. **`src/components/SceneCard.tsx`**
   - Converter para acordeao (prop `defaultOpen` baseada em `index === 0`)
   - Adicionar suporte a `prompt_veo_b`
   - Pretty-print JSON automatico nos prompts Veo/Kling/Nano
   - Badge circular com numero da cena
   - Seta de toggle no header

4. **`src/components/ModeCard.tsx`**
   - Aceitar prop `color: string`
   - Usar cor no estado selecionado (borda, fundo, texto do label)
   - Scale transform ao selecionar (1.02)
   - Hibrido ocupa 2 colunas (span 2)

5. **`src/components/ChipSelect.tsx`**
   - Aceitar `icon` opcional nas opcoes
   - Aceitar `color` prop opcional para customizar cor do selecionado
   - Exibir icone ao lado do label
   - Layout grid 2 colunas para destinos/objetivos, flex para plataformas

6. **`src/components/DirectorSkeleton.tsx`**
   - Remover (substituido pela barra de progresso inline no DirectorForm)

7. **`supabase/functions/generate-script/index.ts`**
   - Atualizar `buildDirectorSystemPrompt` com system prompt enriquecido: JSON estruturado para Veo, prompt_veo_b, prompt_nano obrigatorio, transicoes A-F, workflow detalhado
   - Trocar modelo para `google/gemini-2.5-pro` quando mode === "director"

8. **`src/index.css`**
   - Adicionar keyframes: `shimmer` (barra de progresso), `slide-up` (entrada de steps), `fade-in` (se nao existir)
