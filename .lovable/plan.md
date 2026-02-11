

# Transicoes Sem Interrupcao + Workflow Inteligente + Pos-Processamento

## Problema Atual

### 1. Tabs destroem estado
O Dashboard usa renderizacao condicional (`{tab === "generate" && ...}`), o que significa que trocar de tab **desmonta o componente inteiro**, perdendo:
- Formulario preenchido no GenerateForm
- Progresso de geracao no DirectorForm (se estiver carregando, perde tudo)
- Resultado ja gerado (some ao trocar e voltar)
- Posicao de scroll e estado do wizard

### 2. Zero inteligencia pos-geracao
Apos o Diretor gerar as cenas, o usuario so pode: salvar ou copiar. Falta:
- Copiar todos os prompts de uma vez (Veo, Kling, Nano separados)
- Regenerar uma cena individual sem refazer tudo
- Reordenar cenas (drag ou botoes)
- Exportar workflow estruturado para pos-producao

### 3. Nenhum facilitador de pos-processamento
O usuario precisa copiar prompt por prompt manualmente. Falta:
- Export em lote (todos os prompts Veo, todos os Kling, todos os Nano)
- Timeline visual das cenas com duracao
- Checklist de execucao (marcar cenas ja processadas)

---

## Solucoes

### 1. Tabs Persistentes (CSS display ao inves de unmount)

Trocar de renderizacao condicional para `display: none`/`display: block`. Todos os paineis ficam montados, so muda a visibilidade. Isso preserva:
- Estado do formulario (texto, selects)
- Geracao em andamento (loading continua em background)
- Resultado ja gerado (persiste ao navegar)

Implementacao: envolver cada tab content em uma `div` com `style={{ display: tab === "x" ? "block" : "none" }}` ao inves de `{tab === "x" && ...}`.

### 2. Barra de Acoes Inteligente pos-Diretor

Adicionar uma toolbar flutuante apos a geracao com:
- **Copiar Todos Veo**: concatena todos prompt_veo com separador de cena
- **Copiar Todos Kling**: idem para prompt_kling
- **Copiar Todos Nano**: idem para prompt_nano
- **Exportar JSON**: download do resultado completo como .json
- **Exportar TXT**: formato legivel com separadores visuais

### 3. Timeline Visual de Cenas

Uma barra horizontal mostrando as cenas como blocos proporcionais a duracao, com:
- Cor por indice (matching o gradiente do SceneCard)
- Tooltip com titulo e duracao
- Click para scrollar ate a cena
- Duracao total do video calculada e exibida

### 4. Checklist de Execucao

Em cada SceneCard, adicionar um toggle "Pronto" que o usuario marca quando ja processou aquela cena na engine. Isso:
- Muda a opacidade do card (visual de "feito")
- Mostra progresso geral (3/6 cenas prontas)
- Estado persiste localmente (localStorage) por script

### 5. Regenerar Cena Individual

Botao em cada SceneCard que re-envia apenas aquela cena ao Diretor para gerar uma variacao, mantendo o contexto do roteiro original. Util quando uma cena especifica nao ficou boa.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Dashboard.tsx`
- Substituir todas as renderizacoes condicionais (`{tab === "x" && ...}`) por divs com `display` controlado
- Mover `directorResult` e `generatedContent` para refs ou manter como state (ja persistem com a mudanca de display)
- Manter animacao de fade-in apenas na primeira montagem (usar ref de "ja mostrado")

### Arquivo: `src/components/DirectorForm.tsx`
- Adicionar toolbar de acoes pos-geracao (copiar em lote, exportar)
- Adicionar componente Timeline acima das SceneCards
- Adicionar estado de checklist por cena (array de booleans)
- Adicionar botao "Regenerar" em cada SceneCard
- Persistir checklist no localStorage com key baseada no hash do script

### Arquivo: `src/components/SceneCard.tsx`
- Adicionar prop `completed` e `onToggleComplete`
- Adicionar prop `onRegenerate`
- Visual de card completo (opacidade reduzida + badge "Pronto")
- Botao de regenerar no header do card

### Arquivo novo: `src/components/SceneTimeline.tsx`
- Barra horizontal com blocos proporcionais
- Labels de tempo
- Click handler para scroll
- Duracao total

### Arquivo novo: `src/components/DirectorToolbar.tsx`
- Botoes de copiar em lote (Veo, Kling, Nano)
- Botoes de exportar (JSON, TXT)
- Contador de progresso (X/Y cenas prontas)

### Arquivos modificados:
1. `src/pages/Dashboard.tsx` — tabs persistentes
2. `src/components/DirectorForm.tsx` — toolbar + timeline + checklist + regenerar
3. `src/components/SceneCard.tsx` — completed state + regenerar
4. `src/components/SceneTimeline.tsx` (novo) — timeline visual
5. `src/components/DirectorToolbar.tsx` (novo) — acoes em lote

