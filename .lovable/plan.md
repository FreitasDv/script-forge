

# Redesign Completo UI/UX — Nivel Profissional 2027

## Problema Atual

A interface usa inline styles em todo lugar, sem sistema de design consistente. Os componentes sao visuais planos sem profundidade, hierarquia visual fraca, e falta personalidade de marca. Cards sem glassmorphism real, tabs genericas, formularios com selects nativos, e zero microinteracoes.

## Filosofia do Redesign

Migrar de "app generico dark" para estetica **Studio-Grade Production Tool** — onde cada pixel comunica profissionalismo e confianca. Inspiracao: Linear, Raycast, Arc Browser, Framer.

## Mudancas por Componente

### 1. Sistema de Design Global (`src/index.css`)
- Adicionar CSS custom properties para glassmorphism reutilizavel (glass-bg, glass-border, glass-shadow)
- Noise texture sutil via SVG inline como background overlay
- Glow effects padronizados por cor da marca
- Tipografia com tracking e leading refinados
- Scrollbar customizada elegante
- Transicoes e easings padrao (cubic-bezier custom)
- Focus ring redesenhado com glow ao inves de outline grosso

### 2. Auth Page (`src/pages/Auth.tsx`)
- Painel esquerdo: adicionar grid de pontos animados (dot grid) como background pattern ao inves de blobs genericos
- Animacao de entrada com stagger nos feature items
- Form card com borda gradiente sutil (1px border-image)
- Input fields com icone a esquerda (Mail, Lock, User)
- Botao de submit com shimmer effect no hover
- Toggle login/signup com animacao de slide

### 3. Dashboard Header (`src/pages/Dashboard.tsx`)
- Logo com gradiente de texto ao inves de cor solida
- Breadcrumb ou badge mostrando a tab ativa
- Avatar do usuario com iniciais ao inves de so email
- Botao de sair mais discreto (ghost com tooltip)
- Separador visual sutil com gradiente fade

### 4. Stats Cards (`src/pages/Dashboard.tsx`)
- Glassmorphism real: backdrop-blur-xl + border gradiente
- Numero grande com gradient text matching a cor do tipo
- Micro-grafico sparkline decorativo (SVG puro, sem lib)
- Hover: elevacao + glow sutil da cor
- Badge "0" diferenciado quando vazio (tom mais apagado)

### 5. Tab Navigation (`src/pages/Dashboard.tsx`)
- Pill navigation com indicator animado (slider que desliza entre tabs)
- Icones com tamanho maior e cor ativa mais vibrante
- Badge de contagem nos tabs "Salvos" (numero de scripts)
- Separadores visuais entre grupos de tabs
- Mobile: scrollable com fade gradient nas bordas

### 6. GenerateForm (`src/components/GenerateForm.tsx`)
- Remover selects nativos — trocar por dropdown customizado com shadcn Select
- Card do formulario com header mais impactante (gradiente + icone maior)
- Labels com tooltip de ajuda
- Textarea com contador de caracteres e height auto-expand
- Botao de gerar com animacao de loading mais sofisticada (pulse + shimmer)
- Area de resultado com syntax highlight para roteiros e separacao visual clara

### 7. DirectorForm (`src/components/DirectorForm.tsx`)
- Step indicator redesenhado: linha conectora entre steps com preenchimento progressivo
- Cards de modo com ilustracao/icone maior e descricao mais legivel
- Pill buttons com feedback haptico visual (scale bounce)
- Textarea com borda que brilha quando focada (animated gradient border)
- Barra de progresso com etapas nomeadas visuais (nao so texto)
- Empty state com ilustracao SVG ao inves de icone generico

### 8. SceneCard (`src/components/SceneCard.tsx`)
- Header com gradiente sutil baseado no indice da cena
- Numero da cena em badge com glow
- Transicao de abertura suave com height animation (nao display toggle)
- Prompt blocks com syntax highlight e line numbers opcionais
- Botao copiar com animacao de checkmark
- Info blocks com icones mais ricos e layout mais espacado

### 9. SaveScriptDialog (`src/components/SaveScriptDialog.tsx`)
- Dialog com backdrop blur mais forte
- Header com icone animado
- Inputs com design consistente com o resto
- Feedback visual de sucesso antes de fechar

### 10. KeyManager (`src/components/KeyManager.tsx`)
- Summary cards com glassmorphism
- Health indicator com animacao de pulso
- Key cards com layout mais limpo e espacado
- Form de adicionar key como slide-down animado
- Empty state com ilustracao

### 11. CostCalculator (`src/components/CostCalculator.tsx`)
- Sliders customizados com cores da marca
- Cards de modelo com hover interativo
- Progress bars com gradiente e animacao
- Summary section com destaque visual mais forte
- Preset buttons como chips modernos

### 12. Componentes Auxiliares Novos
- **GlassCard**: componente reutilizavel com glassmorphism padrao
- **GradientText**: texto com gradiente reutilizavel
- **AnimatedNumber**: numeros que fazem count-up ao aparecer
- **Glow**: wrapper que adiciona glow effect

## Detalhes Tecnicos

### Arquivos criados:
1. `src/components/ui/glass-card.tsx` — componente GlassCard reutilizavel
2. `src/components/ui/gradient-text.tsx` — texto com gradiente
3. `src/components/ui/animated-number.tsx` — animacao de contagem

### Arquivos modificados:
1. `src/index.css` — sistema de design global, variaveis CSS, animacoes
2. `src/pages/Auth.tsx` — redesign completo da pagina de autenticacao
3. `src/pages/Dashboard.tsx` — header, stats, tabs, layout geral
4. `src/components/GenerateForm.tsx` — formulario com shadcn components
5. `src/components/DirectorForm.tsx` — wizard redesenhado
6. `src/components/SceneCard.tsx` — cards de cena refinados
7. `src/components/SaveScriptDialog.tsx` — dialog melhorado
8. `src/components/KeyManager.tsx` — gestao de keys redesenhada
9. `src/components/CostCalculator.tsx` — calculadora visual refinada
10. `tailwind.config.ts` — adicionar animacoes e utilitarios customizados

### Principios de implementacao:
- Migrar de inline styles para Tailwind classes em todos os componentes
- Usar CSS custom properties para valores reutilizaveis
- Manter toda a logica funcional intacta — so muda a apresentacao
- Mobile-first: garantir que tudo funciona em 375px
- Performance: evitar re-renders desnecessarios, usar CSS animations ao inves de JS

