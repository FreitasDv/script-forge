
# Studio Robusto — Geracao de Video via Leonardo.ai Direto no App

## Visao Geral

Transformar o Studio de uma galeria simples em uma estacao de producao completa onde o usuario gera imagens E videos diretamente, usando Leonardo.ai (Veo 3.1, Kling 3.0, etc.) com controle total de modelo, duracao, aspect ratio, resolucao, e workflow de extend.

## O Que Muda

### 1. Novo Componente: `GenerateDialog` (modal de geracao)

Quando o usuario clica "Gerar" em qualquer prompt do SceneCard, em vez de chamar direto o Nano Banana, abre um dialog com opcoes:

| Opcao | Valores |
|---|---|
| **Tipo** | Imagem (Nano Banana, Phoenix, Flux) ou Video (Veo, Kling, Hailuo) |
| **Modelo** | Dropdown com todos os modelos disponveis (Veo 3.1, Veo 3.1 Fast, Kling 3.0, Kling 2.6, Kling O3 Omni, etc.) |
| **Duracao** | Chipset com opcoes validas para o modelo selecionado (4s, 5s, 6s, 8s, 10s) |
| **Aspect Ratio** | 9:16 (vertical), 16:9 (horizontal), 1:1 (quadrado) |
| **Resolucao** | 720p ou 1080p (quando disponivel) |
| **Custo estimado** | Mostrado em tempo real conforme muda modelo/duracao |

O dialog tambem mostra:
- Creditos disponiveis (soma das keys ativas)
- Features do modelo selecionado (audio nativo, start/end frame, image ref, video ref)
- Botao "Gerar Imagem" ou "Gerar Video" conforme o tipo

### 2. Upgrade do SceneCard

- Botao "Gerar" agora abre o `GenerateDialog` em vez de chamar direto
- Cada prompt block tem um dropdown "Gerar como..." com atalhos rapidos:
  - "Imagem Nano" (rapido, sem custo Leonardo)
  - "Video Veo 3.1 8s" (atalho para o mais usado)
  - "Video Kling 3.0 5s"
  - "Personalizar..." (abre GenerateDialog completo)

### 3. Studio Robusto (upgrade completo)

O Studio ganha 3 secoes principais:

**A) Fila de Producao (queue)**
- Lista de jobs em processamento com barra de progresso visual
- Polling inteligente: 8s para Leonardo, ate status mudar
- Botao "Cancelar" (quando possivel)
- Badge com modelo/duracao/custo

**B) Galeria Avancada**
- Filtros: por tipo (imagem/video), por modelo, por cena
- Videos com player inline (play on hover, controles ao clicar)
- Preview em lightbox com controles de video completos
- Ordenacao: recente, por cena, por tipo
- Selecao multipla para download em lote

**C) Painel de Extend (workflow de video)**
- Selecionar um video completado como "fonte"
- Escolher modo: Last Frame (continuidade), Start+End Frame (transicao), Direct (nova geracao)
- Inserir prompt do proximo clip
- Escolher modelo e duracao
- Visualizar o video fonte ao lado do campo de prompt
- Timeline visual mostrando a sequencia de clips extendidos (parent_job_id chain)

### 4. Timeline de Clips (componente visual)

Novo componente que mostra a cadeia de extends como uma timeline horizontal:
- Cada clip e um card com thumbnail
- Setas conectando clips
- Click para ver/baixar
- Destaque do clip selecionado como fonte para extend

---

## Detalhes Tecnicos

### Arquivos novos:

1. **`src/components/GenerateDialog.tsx`** (~300 linhas)
   - Modal com selecao de tipo (imagem/video)
   - Modelo picker com chips coloridos por categoria (Veo=verde, Kling=roxo, Hailuo=azul)
   - Duracao como chips (filtrados pelo modelo)
   - Aspect ratio picker visual (3 retangulos)
   - Resolucao toggle (720p/1080p)
   - Custo estimado em tempo real (chama `estimate_cost` no edge function)
   - Creditos disponiveis (chama `list_keys` e soma)
   - Botao de gerar que chama `leonardo-generate` com action correta
   - Suporte a image ref (quando o usuario ja tem imagem gerada de uma cena anterior)

2. **`src/components/ExtendPanel.tsx`** (~250 linhas)
   - Selecao do video fonte (dropdown dos jobs completados tipo video)
   - Preview do video fonte
   - Modo de extend (last_frame, start_end_frame, direct)
   - Campo de prompt para o proximo clip
   - Modelo/duracao picker (reutiliza componentes do GenerateDialog)
   - Botao "Estender Video"
   - Timeline visual dos clips encadeados

3. **`src/components/VideoTimeline.tsx`** (~100 linhas)
   - Timeline horizontal de clips conectados por parent_job_id
   - Thumbnails clicaveis
   - Status badges por clip

### Arquivos modificados:

4. **`src/components/SceneCard.tsx`**
   - Importar e usar `GenerateDialog`
   - Botao "Gerar" abre dialog em vez de chamar direto
   - Manter atalho rapido para Nano Banana (Shift+Click ou botao separado)

5. **`src/components/Studio.tsx`** (reescrita significativa ~500 linhas)
   - Adicionar tabs internas: "Galeria" | "Fila" | "Extend"
   - Galeria com filtros e player de video melhorado
   - Fila com detalhes de cada job
   - Painel de Extend integrado
   - Botao "Nova Geracao" que abre GenerateDialog standalone (sem prompt pre-definido)
   - Creditos totais no header do Studio

6. **`src/lib/director-types.ts`**
   - Adicionar tipos de geracao: `GenerationType`, `GenerationEngine`, `GenerationConfig`

### Fluxo de geracao de video:

```text
SceneCard "Gerar" 
  → GenerateDialog (escolhe modelo, duracao, etc.)
    → POST /leonardo-generate { action: "generate_video_from_text", prompt, options: { model, duration, aspect_ratio, resolution } }
      → Edge function: rotacao de chave → API Leonardo → insert generation_jobs (status: processing)
        → Studio polling: check_status a cada 8s
          → Quando COMPLETE: atualiza result_url, aparece na galeria
            → Usuario pode "Extend" a partir desse video
```

### Fluxo de extend:

```text
Studio "Extend" tab
  → Seleciona video completado como fonte
    → Escolhe modo (last_frame / start_end_frame / direct)
      → Escreve prompt do proximo clip
        → POST /leonardo-generate { action: "extend_video", source_job_id, extend_mode, prompt, options }
          → Edge function extrai frame do job anterior → gera novo video
            → Polling → resultado aparece na timeline encadeada
```

### Estimativa de custo em tempo real:

O GenerateDialog faz um request leve ao edge function:
```
POST /leonardo-generate { action: "estimate_cost", estimate_action: "generate_video_from_text", options: { model: "VEO3_1", duration: 8 } }
```
Retorna `{ estimated_cost: 2140, model_label: "Veo 3.1" }` — mostrado no botao de gerar.

### Impacto:
- Video generation completo dentro do app (sem sair para Leonardo.ai)
- Workflow de extend sequencial com timeline visual
- Estimativa de custo antes de gerar (evita surpresas)
- Galeria com player de video, filtros e download em lote
- Suporte a TODOS os modelos ja configurados no edge function (Veo 3.1, Kling 3.0, O3 Omni, Hailuo, etc.)
- Zero mudanca no edge function — toda a logica de API ja existe
- Compativel com o sistema de rotacao de chaves existente
