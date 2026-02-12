
# Acessibilidade Universal — ScriptAI para Todos

## Objetivo

Tornar o ScriptAI utilizavel por criancas, idosos, usuarios com deficiencia e experts exigentes. Isso envolve melhorias em ARIA, navegacao por teclado, linguagem amigavel, tamanhos de toque, contraste e feedback sensorial.

---

## Diagnostico Atual

| Area | Status | Problema |
|------|--------|----------|
| ARIA labels | Parcial | Dashboard tem alguns, Studio/GenerateDialog/ExtendPanel praticamente zero |
| Navegacao por teclado | Fraco | Botoes funcionam, mas lightbox nao fecha com Escape, modais sem focus trap nativo |
| Tamanhos de toque | Parcial | Alguns botoes com 24px (abaixo do minimo de 44px para mobile/idosos) |
| Linguagem | Tecnica demais | "Aspect Ratio", "RLS", "Extend", "Start Frame", "Engine" — ininteligivel para leigos |
| Feedback | Parcial | Toasts existem, mas sem indicadores visuais de progresso claros |
| Contraste | Bom | O tema dark tem bom contraste geral, mas textos `text-caption` e `text-[9px]` sao muito pequenos |
| Alt text | Fraco | Imagens na galeria tem alt generico, videos sem descricao |
| Skip navigation | Ausente | Sem link "pular para conteudo" |
| Reducao de movimento | Ausente | Animacoes nao respeitam `prefers-reduced-motion` |
| Screen reader | Fraco | Status de jobs, badges e progress bars sem `aria-live` |

---

## Plano de Implementacao

### 1. CSS Global — Base de Acessibilidade (`src/index.css`)

- Adicionar `@media (prefers-reduced-motion: reduce)` para desabilitar todas as animacoes
- Aumentar tamanho minimo de fonte de `9px`/`10px` para `11px` minimo
- Garantir que todos os elementos interativos tenham `min-height: 44px` e `min-width: 44px`
- Adicionar classe utilitaria `.sr-only` para textos apenas para screen readers

### 2. Dashboard — Skip Navigation e ARIA Live (`src/pages/Dashboard.tsx`)

- Adicionar link "Pular para conteudo principal" no topo
- Adicionar `aria-live="polite"` nas areas de resultado (gerado, diretor)
- Melhorar labels nos stats cards com textos descritivos

### 3. GenerateDialog — Linguagem Amigavel + ARIA (`src/components/GenerateDialog.tsx`)

Mudancas de linguagem (PT-BR amigavel):
- "Aspect Ratio" → "Formato do Video"
- "Start Frame" → "Imagem Inicial (opcional)"
- "End Frame" → "Imagem Final (opcional)"
- "Image Ref" → "Imagens de Referencia"
- "Video Ref" → "Video de Referencia"
- "Motion Control" → "Movimento da Camera"
- "Preset Style" → "Estilo Visual"
- "Resolution" → "Qualidade"
- Badges informativos recebem tooltips explicativos ("Audio nativo" → tooltip "Este modelo gera som junto com o video")

Acessibilidade tecnica:
- Todos os botoes de selecao recebem `aria-pressed` ou `aria-selected`
- Textarea do prompt recebe `aria-label="Descreva o que deseja gerar"`
- Botao de gerar recebe `aria-busy={generating}`
- Secoes condicionais recebem `role="group"` com `aria-label`
- Custo/creditos recebem `aria-live="polite"` para anunciar mudancas

### 4. Studio — Galeria Acessivel (`src/components/Studio.tsx`)

- Tabs recebem `role="tablist"` / `role="tab"` / `aria-selected`
- Cards da galeria recebem `role="article"` com `aria-label` descritivo
- Checkbox de selecao recebe `role="checkbox"` + `aria-checked` + `aria-label`
- Lightbox: fechar com `Escape`, focus trap, `role="dialog"` + `aria-modal`
- Videos na galeria: `aria-label` com engine + cena + data
- Filtros: `role="radiogroup"` com `aria-label="Filtrar por tipo"`
- Botao "Nova Geracao" → "Criar Nova Midia" (mais claro)
- Labels na galeria: "Cena X" → "Cena X — [engine] — [tipo]"

### 5. ExtendPanel — Traducao e Toque (`src/components/ExtendPanel.tsx`)

- "Extend" → "Continuar Video"
- "Last Frame" → "A partir do ultimo quadro"
- "Start + End" → "Transicao entre quadros"
- "Direto" → "Nova geracao sem referencia"
- "Modo de Extend" → "Como continuar?"
- Todos os botoes de modelo com `min-height: 44px`
- Secao de duracao/formato/qualidade com `role="radiogroup"` + `aria-label`

### 6. ImageRefSelector — Interacao Inclusiva (`src/components/ImageRefSelector.tsx`)

- Thumbnails recebem `aria-label` descritivo ("Imagem da cena 3, motor Veo 3.1")
- Botao de remover: `aria-label="Remover imagem"` (nao apenas um X)
- Upload: `aria-label="Enviar imagem do seu computador"`
- Estado vazio: mensagem mais amigavel ("Voce ainda nao tem imagens. Gere ou envie uma!")
- Drag area com `aria-dropeffect="copy"` quando suportado

### 7. SceneCard — Clareza para Leigos (`src/components/SceneCard.tsx`)

- Labels de prompt: "NANO BANANA PRO" → "Imagem Estilizada"
- "PROMPT VEO 3.1" → "Video Cinematografico"
- "PROMPT KLING 3.0" → "Video Realista"
- Botao "Gerar" recebe tooltip explicando o que vai acontecer
- "Personalizar..." → "Escolher modelo e opcoes..."
- InfoBlocks: "Neuro" → "Nota Psicologica", "Tech Strategy" → "Estrategia Tecnica"
- Botao de expandir cena: `aria-expanded={open}`

### 8. DirectorForm — Wizard Amigavel (`src/components/DirectorForm.tsx`)

- Steps recebem `aria-current="step"` no passo atual
- Labels com descricoes mais claras:
  - "ENGINE DE VIDEO AI" → "Motor de Geracao de Video"
  - "DESTINO" → "Onde sera publicado?"
  - "OBJETIVO" → "Qual o objetivo?"
- Campo de roteiro: placeholder mais didatico ("Cole aqui o texto do seu video. Pode ser uma ideia, um roteiro completo ou ate uma lista de topicos.")
- Botoes de exemplo: adicionar tooltip "Clique para usar este exemplo"
- Checkbox "Ja tem direcao artistica" → tooltip explicando o que isso significa

### 9. GenerateForm — Simplicidade (`src/components/GenerateForm.tsx`)

- Labels: "Tema / Contexto" → "Sobre o que e o seu conteudo?"
- Placeholder: "Descreva o que voce deseja gerar..." → "Ex: Um video sobre como plantar tomates em casa, com dicas praticas para iniciantes"
- Selects recebem `aria-required="true"`
- Resultado: area com `aria-live="polite"` para screen readers acompanharem streaming

---

## Detalhes Tecnicos

### Arquivos modificados:

1. **`src/index.css`** — Adicionar `prefers-reduced-motion`, `.sr-only`, min-touch-target
2. **`src/pages/Dashboard.tsx`** — Skip nav, aria-live regions
3. **`src/components/GenerateDialog.tsx`** — Traducao de labels, ARIA attributes
4. **`src/components/Studio.tsx`** — Tabs ARIA, lightbox a11y, galeria descritiva
5. **`src/components/ExtendPanel.tsx`** — Traducao, touch targets, radiogroups
6. **`src/components/ImageRefSelector.tsx`** — Alt text, aria-labels, mensagens amigaveis
7. **`src/components/SceneCard.tsx`** — Labels amigaveis, aria-expanded, tooltips
8. **`src/components/DirectorForm.tsx`** — aria-current, labels didaticos, tooltips
9. **`src/components/GenerateForm.tsx`** — Placeholders didaticos, aria-required, aria-live

### Nenhum arquivo novo necessario.

### Impacto:
- Criancas e idosos entendem cada botao e secao
- Screen readers anunciam estados, progresso e resultados
- Navegacao por teclado funcional em todos os componentes
- Animacoes respeitam preferencias do usuario
- Tamanhos de toque atendem WCAG 2.2 Level AA (44px minimo)
- Linguagem 100% PT-BR sem jargao tecnico desnecessario
- Experts nao perdem funcionalidade — termos tecnicos disponíveis via tooltips
