

# Integracao do Workflow "Pilula em Panico" — Tecnicas Validadas no Diretor

## O que o workflow ensina que o sistema ainda NAO faz

O documento colado e um workflow completo que **ja deu certo** para criar viral animado. Analisando versus o sistema atual do Diretor, identifiquei 7 gaps criticos:

### Gaps no Prompting

| # | O que falta | Onde esta no workflow | Impacto |
|---|---|---|---|
| 1 | **Formula oficial de prompt Veo** | `[Camera/Shot] + [Subject] + [Action + Physics] + [Setting] + [Style] + [Audio]`, 75-125 palavras | Prompts atuais sao JSON verbose (300-500 palavras) — funciona para estrutura, mas o workflow mostra que prompts mais curtos com essa formula tambem funcionam |
| 2 | **Plano B sem timestamp** | Cada clip tem versao COM e SEM timestamp | Sistema atual gera apenas 1 versao — se timestamp falhar, usuario fica sem alternativa |
| 3 | **Extend workflow explicitado** | Clip 1 = Ingredients to Video, Clips 2-6 = Extend sequencial | `tech_strategy` ja menciona tecnicas A-F mas nao gera instrucoes de workflow tao claras quanto o doc |
| 4 | **Regras de continuidade para extend** | "Termine cada clip com pose estavel", "mantenha descritores de estilo", "camera estavel nas transicoes" | Falta no prompt do Diretor — regras especificas de como terminar cada cena para extend funcionar |
| 5 | **Troubleshooting integrado** | Portugues formal, expressoes especificas, identity drift, content policy | Sistema nao avisa sobre problemas comuns nem gera alternativas |
| 6 | **Duas versoes (Bravo/Safe)** | Versao organico vs ads com diferencas especificas | Sistema gera 1 versao — sem opcao de variantes para compliance |
| 7 | **Character refs como 3 imagens fixas** | Neutra + 3/4 + ambiente — NAO 6 expressoes | Alinhado com o que ja temos, mas falta explicitar no workflow_summary |

### Gaps na UI

| # | O que falta | Impacto |
|---|---|---|
| 8 | **Checklist de execucao** | O workflow tem checklist dia-a-dia — o sistema nao gera nenhum guia de execucao |
| 9 | **Campo para personagens secundarios** | Workflow define 4 personagens extras com design language — sistema so lida com 1 personagem |

---

## Solucao: 3 Melhorias Integradas

### 1. Regras de Extend e Continuidade no Prompt (edge function)

Adicionar ao system prompt do Diretor uma secao nova "WORKFLOW DE EXTEND — REGRAS DE CONTINUIDADE" com as tecnicas validadas do workflow:

- Cada cena deve terminar com **pose estavel** ("hold pose for final half second")
- Manter **mesmos descritores de estilo** em todos os prompts (paleta, iluminacao, grain)
- Camera **estavel** nas transicoes (dolly ou tripe, nao handheld)
- prompt_veo de extend foca APENAS em **acao + camera + audio** (nao redescever personagem)
- Adicionar campo `residual_motion` mais explicito com instrucoes de como terminar cada cena
- Regra: "Se transicao de ambiente falhar no extend, usar First Frame do ultimo frame bom"

### 2. Plano B (prompt alternativo) na Estrutura de Cena

Adicionar um campo opcional `prompt_veo_alt` ao `DirectorScene` para prompts alternativos sem timestamp. O Diretor gera automaticamente versao alternativa quando usar timestamp prompting.

- Novo campo em `DirectorScene`: `prompt_veo_alt: string | null`
- No SceneCard: mostrar como "VEO 3.1 -- PLANO B" com cor diferenciada
- No prompt do Diretor: instruir a gerar prompt_veo_alt SEM timestamps quando prompt_veo usa timestamps

### 3. Checklist de Execucao no workflow_summary

Instruir o Diretor a incluir no `workflow_summary` um checklist pratico de execucao com:
- Ordem de geracao das refs (Nano Banana Pro primeiro)
- Validacao de consistencia visual entre refs
- Ordem dos clips (Ingredients to Video → Extends sequenciais)
- Pontos de checagem por clip (identidade OK? expressao OK? audio sync?)
- Troubleshooting rapido (portugues formal, identity drift, content policy)

---

## Detalhes Tecnicos

### Arquivo: `src/lib/director-types.ts`
- Adicionar `prompt_veo_alt: string | null` ao `DirectorScene`

### Arquivo: `src/components/SceneCard.tsx`
- Renderizar `prompt_veo_alt` como PromptBlock com label "VEO 3.1 -- PLANO B" e cor diferenciada (ex: laranja)
- Adicionar cor `veo_alt` ao `promptColors`

### Arquivo: `supabase/functions/generate-script/index.ts`

**Secao nova "WORKFLOW DE EXTEND"** (adicionada ao system prompt, depois das regras anti-artefatos):

```
WORKFLOW DE EXTEND — REGRAS DE CONTINUIDADE (VALIDADAS EM PRODUCAO):
- CLIP 1 sempre usa Ingredients to Video (com refs). Clips subsequentes = Extend.
- Extend usa ultimo 1s (24 frames) como seed. O final de cada cena DETERMINA o inicio da proxima.
- REGRA DE FINAL DE CENA: toda cena DEVE terminar com:
  (A) Pose estavel — personagem em posicao clara, sem movimento mid-action
  (B) Camera estavel — dolly ou tripe, NUNCA handheld shake no final
  (C) Iluminacao consistente — mesma temperatura/intensidade do inicio da cena
  (D) "hold pose for final half second" — ultimo 0.5s e estatico
- PROMPT DE EXTEND: NAO redescreva o personagem. Extend carrega identidade do clip anterior.
  Foque APENAS em: acao + camera + audio + expressao.
- TRANSICAO DE AMBIENTE NO EXTEND: use palavras como "TRANSFORMS" ou "magically dissolves into".
  Descreva o novo ambiente com MAIS detalhe que o normal. Se falhar: fallback para First Frame.
- IDENTITY DRIFT: apos 40-60s de extends, drift fica visivel. Solucoes:
  (A) Sutil: aceitar (color grading unificado mascara)
  (B) Forte: voltar para Ingredients com MESMAS refs
  (C) Usar ultimo frame BOM como First Frame para reconectar
- PORTUGUES FORMAL OBRIGATORIO: adicionar em TODOS os prompts com fala:
  "Character speaks formal Brazilian Portuguese. Use 'para' never 'pra'. Use 'esta' never 'ta'. Use 'voce' never 'ce'. Clear professional enunciation."
- EXPRESSOES ESPECIFICAS (nunca vagas):
  NAO: "looks worried" → SIM: "eyebrows furrow inward, corners of mouth turn down, eyes dart side to side"
  NAO: "gets happy" → SIM: "eyes widen with sparkle, cheeks lift, mouth opens in big genuine smile"
```

**Secao "PLANO B"** (adicionada a regra de JSON output):

```
- prompt_veo_alt: quando prompt_veo usa timestamp prompting ([00:00-00:03]...[00:03-00:08]),
  gere uma versao ALTERNATIVA sem timestamps — mesma acao mas em prompt continuo.
  Timestamp prompting funciona na maioria dos casos mas NAO e feature oficial garantida.
  Se a cena NAO usa timestamps: prompt_veo_alt = null.
```

**Atualizar schema JSON** na regra de output:

```
Cada scene: {..., "prompt_veo_alt":"string sem timestamps OU null", ...}
```

**Melhorar workflow_summary** com instrucao de checklist:

```
- workflow_summary DEVE incluir CHECKLIST DE EXECUCAO:
  1. REFS: quais imagens gerar primeiro no Nano Banana Pro, validacao de consistencia
  2. CLIPS: ordem de geracao (Ingredients → Extends), pontos de checagem
  3. TROUBLESHOOTING: problemas comuns e solucoes rapidas
  4. POS-PRODUCAO: importar no editor, crossfade 0.2-0.3s, legendas, color grading
```

### Resumo do impacto:
- Prompts com regras de continuidade testadas em producao real
- Plano B automatico para cada cena com timestamps (resiliencia)
- Checklist de execucao pratico no workflow_summary
- Expressoes especificas em vez de vagas (melhora qualidade do output)
- Portugues formal forcado em todos os prompts com fala
- Zero mudanca breaking — campos novos sao opcionais (null)
- Mantém todo o progresso anterior (sub-estilos, anti lip-sync, timing comico)

