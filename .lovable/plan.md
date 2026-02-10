
# Redesign UI/UX Completo — Mobile-First + Desktop Premium

## Problemas Identificados

1. **Mobile completamente quebrado**: Stats em 4 colunas esmagadas em 390px. Grid de 3 colunas no GenerateForm ilegivel. Tabs transbordam sem scroll visivel. Filtros de busca nao cabem.
2. **Auth sem impacto**: Painel esquerdo usa mix de inline style + Tailwind class que nao funciona. No mobile e so um card escuro sem alma.
3. **Zero responsividade**: Tudo e maxWidth 900 sem nenhuma media query ou adaptacao mobile.
4. **Sem microinteracoes**: Nenhum hover effect, nenhuma animacao de entrada, nenhum feedback visual nos botoes.
5. **SaveScriptDialog inconsistente**: Ainda usa shadcn Button/Input generico — destoa do resto.
6. **Tipografia fraca**: Hierarquia visual inexistente. Tudo parece o mesmo peso.

---

## Solucao: Redesign Mobile-First

### 1. Dashboard.tsx — Layout Responsivo

**Stats**: 4 colunas no desktop, 2 colunas no mobile. Usar CSS grid com `repeat(auto-fit, minmax(150px, 1fr))` em vez de `repeat(4, 1fr)` fixo.

**Tabs**: Scroll horizontal com `-webkit-overflow-scrolling: touch`, scrollbar escondido, e indicador de gradiente fade nas bordas.

**Header**: Esconder email no mobile (tela muito pequena). Manter logo + botao sair.

**Saved scripts filters**: Em mobile, filtros de tipo vao pra baixo do search (flex-wrap ja existe mas os botoes precisam de padding menor).

**Templates grid**: `minmax(260px, 1fr)` ja e ok mas precisa de `minmax(200px, 1fr)` no mobile pra evitar scroll horizontal.

### 2. Auth.tsx — Redesign Impactante

Remover o mix `display: none` + `className`. Usar apenas inline styles com media query via hook `useIsMobile`.

**Mobile**: Tela cheia com gradiente sutil no topo (nao o painel inteiro), logo centralizado, form card com glassmorphism forte.

**Desktop**: Manter layout split 50/50 mas com o painel esquerdo usando CSS puro (sem Tailwind class).

Adicionar animacao de entrada `slide-up` no form card.

### 3. GenerateForm.tsx — Adaptacao Mobile

**Selects**: 3 colunas no desktop, 1 coluna no mobile. Usar `useIsMobile` hook para alternar gridTemplateColumns entre `"1fr 1fr 1fr"` e `"1fr"`.

**Textarea**: Ajustar minHeight para 120px no mobile (menos espaco desperdicado).

**Botao gerar**: Aumentar padding no mobile pra melhor touch target (min 48px height).

### 4. DirectorForm.tsx — Mobile Polish

**Mode cards**: 2 colunas no desktop, 1 coluna no mobile. Cards maiores no mobile com mais padding pra toque.

**Pills (Plataformas, Destinos, Objetivos)**: Em mobile, grid 2 colunas em vez de flex row (evita pills muito estreitas).

**Textarea do roteiro**: minHeight 120px no mobile.

**Botoes Voltar/Proximo**: Stack vertical no mobile (flex-direction column) com ambos full-width.

### 5. SaveScriptDialog.tsx — Consistencia Visual

Substituir shadcn Button/Input por estilos inline consistentes com o resto do app. Manter Dialog do Radix (funcionalidade) mas customizar visual do DialogContent.

### 6. Microinteracoes Globais

**Hover effects**: Todos os botoes e cards ganham `transform: translateY(-1px)` e `box-shadow` sutil no hover.

**Transicoes de entrada**: Cards do dashboard com `animation: slide-up 0.3s ease-out` com delay escalonado.

**Botoes de acao**: Gradient buttons ganham `filter: brightness(1.1)` no hover.

**Focus states**: Todos os inputs com `box-shadow: 0 0 0 3px rgba(124,58,237,0.15)` no focus.

---

## Detalhes Tecnicos

### Arquivos a Modificar

1. **`src/pages/Dashboard.tsx`**
   - Import `useIsMobile` hook
   - Stats grid: `repeat(auto-fit, minmax(150px, 1fr))`
   - Tabs: adicionar `scrollbarWidth: "none"`, `msOverflowStyle: "none"` e pseudo-element CSS pra esconder scrollbar
   - Header: `user?.email` escondido no mobile
   - Templates grid: minmax menor no mobile
   - Saved scripts: padding/fontSize menores nos filtros mobile

2. **`src/pages/Auth.tsx`**
   - Import `useIsMobile`
   - Desktop: painel esquerdo visivel via condicional JS (nao CSS class)
   - Mobile: layout single-column com gradiente no header area
   - Animacao slide-up no form card
   - Melhorar touch targets (inputs com min-height 48px)

3. **`src/components/GenerateForm.tsx`**
   - Import `useIsMobile`
   - Grid adaptativo: 3 cols desktop, 1 col mobile
   - Touch-friendly buttons e inputs

4. **`src/components/DirectorForm.tsx`**
   - Import `useIsMobile`
   - Mode cards: condicional grid 2 cols / 1 col
   - Pills: grid 2 cols sempre (ja funciona bem)
   - Botoes nav: stack no mobile
   - Textarea: minHeight adaptativo

5. **`src/components/SaveScriptDialog.tsx`**
   - Remover shadcn Button/Input imports
   - Usar estilos inline consistentes
   - DialogContent com background/border matching o dark theme

6. **`src/index.css`**
   - Adicionar regra global para esconder scrollbar em containers com scroll horizontal
   - Adicionar keyframe `fade-in` se nao existir
   - Adicionar utility class `.no-scrollbar` com `scrollbar-width: none` e `::-webkit-scrollbar { display: none }`

### O Que NAO Muda

- Logica de negocio (auth, CRUD, streaming, parsing)
- Edge function
- Tipos
- Roteamento
- Estado global
