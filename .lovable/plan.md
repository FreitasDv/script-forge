

# Absorvendo o Workflow V4 — Implementacao dos Aprendizados

## O que ja esta implementado (nao precisa mudar)

O system prompt do Diretor ja contem:
- Timestamps exatos no formato JSON do Veo (00:00-00:08)
- Hierarquia de prioridade (enquadramento > camera > audio > negative)
- Calibracao por motor (Veo JSON longo, Kling natural compacto)
- Framework de neurociencia (Hook-Retention-Peak-End)
- Workflow de Extend com regras de continuidade
- Anti-artefatos (morphing, flickering, uncanny valley)
- prompt_veo_alt (Plano B sem timestamps)
- Portugues Formal obrigatorio em falas

## O que FALTA implementar (gaps reais)

### 1. Campo `negative` ausente no tipo DirectorScene

O system prompt pede "negative prompts descritivos em cada cena" mas o tipo `DirectorScene` nao tem campo `negative`. O JSON gerado pela IA pode incluir, mas o frontend ignora. O SceneCard nao exibe.

**Mudanca**: Adicionar `negative: string | null` ao tipo e exibir no SceneCard.

### 2. SceneCard nao exibe negative prompts

Mesmo que a IA gere, o card nao mostra. Precisamos de uma secao "Negative" no SceneCard para que o usuario copie.

### 3. Template "Pack de Producao Comercial"

Inspirado no workflow do documento — gera 5-7 criativos coordenados para o mesmo produto, com variacoes de formato. Template tipo "director" com systemContext especifico.

### 4. Template "Produto com Personagem"

O workflow mostra a forca de personagens antropomorficos vendendo produto (como a pedra Quartzito). Template dedicado para esse caso de uso.

### 5. Sugestao inteligente de motor no DirectorForm

Baseado no modo selecionado, mostrar uma dica contextual sobre qual motor funciona melhor:
- UGC com narracao → "Veo 3.1 recomendado (audio nativo)"
- Character com lip-sync → "Kling 3.0 recomendado (multi-shot)"
- Brand cinema → "Veo 3.1 recomendado (color science)"

Apenas uma frase informativa, nao muda a selecao automaticamente.

### 6. Validacao de cobertura no workflow_summary

O prompt ja pede que o workflow_summary inclua checklist, mas o campo `tech_strategy` no SceneCard exibe de forma generica. Melhorar o label para destacar a tecnica de transicao.

---

## Plano Tecnico

### Arquivo 1: `src/lib/director-types.ts`
- Adicionar `negative: string | null` ao `DirectorScene`

### Arquivo 2: `src/components/SceneCard.tsx`
- Adicionar bloco de exibicao do campo `negative` quando presente
- Label: "Excluir do video" (linguagem amigavel) com tooltip "Negative prompt — descreve o que NAO deve aparecer"

### Arquivo 3: `src/lib/templates.ts`
- Adicionar template "Pack de Producao Comercial" (tipo director)
- Adicionar template "Produto com Personagem" (tipo director)

### Arquivo 4: `src/components/DirectorForm.tsx`
- Adicionar dica contextual de motor abaixo do seletor de plataforma
- Logica: mapear modo → texto de recomendacao
- Exibir como nota sutil (nao intrusiva)

### Arquivo 5: `src/pages/Dashboard.tsx`
- Adicionar icone "Package" ao templateIconMap para o novo template Pack

### Nenhuma mudanca na Edge Function
O system prompt ja cobre tudo. A IA ja gera negative prompts — so precisamos exibi-los.

---

## Impacto

- Negative prompts visiveis e copiaveis no resultado do Diretor
- 2 novos templates inspirados no workflow real de producao
- Dicas de motor ajudam iniciantes a escolher sem bloquear experts
- Zero mudanca no backend — tudo frontend

