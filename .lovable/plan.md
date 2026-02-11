

# Otimizacao de Performance — Mais Rapido Sem Perder Qualidade

## Problemas Identificados

### 1. Google Fonts bloqueia renderizacao
A linha `@import url('https://fonts.googleapis.com/css2?family=...')` no `index.css` bloqueia o CSS inteiro ate carregar as fontes externas. Isso adiciona 200-500ms ao first paint.

### 2. Zero code splitting
Todos os componentes (Dashboard, Auth, KeyManager, CostCalculator, DirectorForm, etc.) sao importados de forma sincrona. O usuario carrega TUDO mesmo que so veja a tela de Auth.

### 3. Animacoes CSS rodando infinitamente
- `btn-primary` tem `animation: gradient-shift 4s ease infinite` — roda o tempo todo em TODOS os botoes, mesmo invisiveis
- `.animate-mesh` roda 3 blobs com transforms em loop infinito na Auth page
- `.animate-border-shimmer` roda infinitamente na borda do form card
- `.animate-glow-pulse` roda em health dots do KeyManager
- Cada animacao infinita consome GPU constantemente

### 4. backdrop-filter pesado
`.glass` usa `backdrop-filter: blur(24px) saturate(1.2)` — blur de 24px e extremamente pesado em GPU, especialmente com muitos elementos glass empilhados (header + cards + tabs + scene cards).

### 5. Noise texture SVG como pseudo-element
`.noise::before` aplica um SVG com `feTurbulence` como overlay no body inteiro. Isso e recalculado em cada repaint.

### 6. Tabs montadas sem React.memo
Com tabs persistentes (display:none), TODOS os componentes ficam montados. Quando `scripts` muda, Dashboard re-renderiza e TODOS os children re-renderizam (GenerateForm, DirectorForm, KeyManager, CostCalculator, etc.).

### 7. fetchScripts sem cache
Cada CRUD (favoritar, deletar) chama `fetchScripts()` que refaz a query inteira e re-renderiza tudo. Nao usa React Query nem cache.

### 8. AnimatedNumber re-anima desnecessariamente
Quando o valor nao muda mas o parent re-renderiza, `AnimatedNumber` cria novas closures desnecessariamente.

---

## Solucoes

### 1. Font loading otimizado
Mover o import de fontes para `index.html` com `<link rel="preconnect">` + `<link rel="preload">` + `font-display: swap`. Remove o `@import` do CSS que bloqueia renderizacao.

### 2. Lazy loading de rotas e componentes pesados
- Usar `React.lazy()` para Auth e Dashboard no App.tsx
- Usar `React.lazy()` para KeyManager, CostCalculator dentro do Dashboard (so carregam quando o usuario acessa a tab)

### 3. Reduzir animacoes infinitas
- `btn-primary`: remover `animation: gradient-shift infinite` — usar gradient estatico com shift apenas no hover (via transition)
- `.animate-mesh`: adicionar `will-change: transform` para otimizar GPU e reduzir para 2 blobs em vez de 3
- `.animate-border-shimmer`: manter mas adicionar `will-change: background-position`
- `.animate-glow-pulse`: manter (e leve)

### 4. Reduzir blur do glass
Reduzir `blur(24px)` para `blur(16px)` — a diferenca visual e minima mas o custo de GPU cai ~35%. Adicionar `will-change: backdrop-filter` nos elementos glass do header (fixo).

### 5. Noise texture otimizada
Trocar o SVG `feTurbulence` por uma imagem PNG pre-gerada de noise (tile de 200x200px). Muito mais leve pois nao precisa recalcular o filtro SVG.

### 6. React.memo nos componentes pesados
Envolver `GenerateForm`, `DirectorForm`, `KeyManager`, `CostCalculator`, `SceneCard`, `DirectorToolbar`, `SceneTimeline` em `React.memo()` para evitar re-renders quando as props nao mudam.

### 7. Otimizar fetchScripts
Usar `useCallback` com dependencias corretas e evitar re-fetch desnecessario. Memoizar `counts` e `filteredScripts` com `useMemo`.

### 8. Debounce no search
O filtro de scripts roda a cada keystroke. Adicionar debounce de 200ms para evitar re-renders excessivos durante digitacao.

---

## Detalhes Tecnicos

### Arquivo: `index.html`
- Adicionar `<link rel="preconnect" href="https://fonts.googleapis.com">`
- Adicionar `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- Adicionar `<link rel="stylesheet" href="...fonts..." media="print" onload="this.media='all'">`

### Arquivo: `src/index.css`
- Remover `@import url(...)` do Google Fonts
- Reduzir `blur(24px)` para `blur(16px)` no `.glass`
- Remover `animation: gradient-shift` infinito do `.btn-primary`
- Trocar noise SVG por imagem PNG base64 pre-gerada (tile pequeno)
- Adicionar `will-change` em elementos com animacao contínua

### Arquivo: `src/App.tsx`
- Usar `React.lazy()` + `Suspense` para Auth e Dashboard

### Arquivo: `src/pages/Dashboard.tsx`
- Lazy load de KeyManager e CostCalculator
- Memoizar `counts`, `filteredScripts` com `useMemo`
- Memoizar handlers com `useCallback`
- Debounce no search input (200ms)

### Arquivo: `src/components/GenerateForm.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/DirectorForm.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/SceneCard.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/DirectorToolbar.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/SceneTimeline.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/KeyManager.tsx`
- Envolver em `React.memo()`

### Arquivo: `src/components/CostCalculator.tsx`
- Envolver em `React.memo()`

### Resumo do impacto estimado:
- **First paint**: ~300-500ms mais rapido (fonts + code splitting)
- **Interacoes**: mais fluidas (menos re-renders + menos animacoes GPU)
- **Memoria**: menor consumo (lazy loading de tabs)
- **GPU**: ~30-40% menos uso (blur reduzido + menos animacoes infinitas)
- **Zero mudanca visual perceptivel** para o usuario

