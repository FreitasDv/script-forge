

# Melhorias Inspiradas no Script DiretorAI

Analisando o script colado, identifiquei 6 areas de melhoria significativas para o ScriptAI.

---

## 1. Novo Modo "Diretor de Video AI" (feature principal)

Adicionar uma nova aba/modo no Dashboard chamado **"Diretor"** que replica a funcionalidade central do script:

- **Modos de producao**: UGC Converter, Character World, Brand Cinema, Educational Hook, Hybrid Director -- cada um com descricao detalhada e sistema de selecao visual (cards clicaveis, nao selects)
- **Engine de video**: Selecao entre Veo 3.1, Kling 3.0, ou Ambos
- **Destino**: TikTok, Reels, Shorts, Todas
- **Objetivo**: Venda/Conversao, Awareness, Educacao, Engajamento
- **Publico-alvo**: Campo texto opcional
- **Checkbox "ja tem direcao artistica"**: Muda o comportamento do prompt

O resultado sera estruturado em **cenas** (JSON), cada uma com:
- Prompt Veo / Prompt Kling / Prompt Nano Banana (com botao copiar individual)
- Direcao de camera
- Nota de neuromarketing
- Timing de fala
- Estrategia tecnica
- Notas do diretor e workflow de execucao

---

## 2. System Prompt Especializado

Criar uma nova edge function `generate-director` (ou adicionar branching na existente) com o system prompt rico do DiretorAI, incluindo:

- Especificacoes tecnicas detalhadas de Veo 3.1 e Kling 3.0
- Principios de neurociencia da atencao
- Specs por plataforma (TikTok, Reels, Shorts)
- Instrucoes por modo de producao
- **Saida estruturada via tool calling** (JSON com scenes, workflow_summary, director_notes) em vez de pedir JSON no prompt

---

## 3. Componente SceneCard com Copiar por Secao

Criar componente `SceneCard` com design profissional:

- Cada cena em card separado com titulo, duracao
- Blocos coloridos por tipo (Veo = roxo, Kling = verde, Nano = amarelo)
- Botao "Copiar" individual por prompt
- Secoes visuais distintas: direcao de camera, neuromarketing, timing de fala, estrategia tecnica
- Cada secao com cor e icone proprio (bordas coloridas laterais)

---

## 4. Selecao Visual com Chips/Cards (UI melhorada)

Substituir os `<Select>` dropdowns do formulario atual por:

- **Cards clicaveis** para opcoes com descricao (como os modos de producao)
- **Chips/botoes toggle** para opcoes simples (destino, objetivo, engine)
- Feedback visual claro de selecao (borda e fundo coloridos)

---

## 5. Novos Templates de Diretor

Adicionar templates especificos para o modo Diretor:
- UGC para produto de saude
- Animacao educativa para TikTok
- Comercial cinematografico para marca premium
- Hook hibrido para lancamento

---

## 6. Salvar Roteiros de Diretor

Atualizar a tabela `scripts` no banco para suportar o novo formato:
- Novo tipo `"director"` no campo type
- Campo `metadata` (JSONB) para armazenar scenes, director_notes, workflow_summary, configuracoes (modo, engine, destino, objetivo)
- Na listagem de roteiros salvos, exibir o resultado formatado com SceneCards

---

## Detalhes Tecnicos

### Nova Edge Function ou Branching

Opcao A (preferida): Adicionar parametro `mode` na edge function existente `generate-script`. Se `mode === "director"`, usa o system prompt do diretor e tool calling para saida estruturada.

Opcao B: Criar edge function separada `generate-director`.

### Migracao SQL

```sql
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
```

Isso permite salvar as configuracoes do diretor (scenes, notes, etc.) sem alterar a estrutura existente.

### Arquivos a Criar/Modificar

- `src/components/DirectorForm.tsx` -- formulario completo do modo Diretor
- `src/components/SceneCard.tsx` -- card de cena com prompts e copiar
- `src/components/ChipSelect.tsx` -- componente de selecao com chips
- `src/components/ModeCard.tsx` -- card de modo de producao
- `src/pages/Dashboard.tsx` -- adicionar aba "Diretor"
- `src/lib/templates.ts` -- novos templates de diretor
- `supabase/functions/generate-script/index.ts` -- branching para modo diretor com tool calling
- Migracao SQL para campo `metadata`

### Prioridade de Implementacao

1. Migracao SQL (campo metadata)
2. Edge function com branching e system prompt do Diretor
3. Componentes visuais (SceneCard, ChipSelect, ModeCard, DirectorForm)
4. Integracao no Dashboard (nova aba)
5. Templates de diretor
6. Salvar/carregar roteiros de diretor

