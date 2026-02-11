

# Calculadora de Custos -- Simulador de Producao

## Conceito

Um novo componente `CostCalculator.tsx` acessivel por uma nova aba "Calculadora" no Dashboard. O usuario informa quantas keys tem e quantos creditos por key, e ve instantaneamente quantas geracoes consegue fazer por modelo, com breakdowns visuais profissionais.

---

## UI/UX Design

### Layout em 3 secoes:

**1. Painel de Input (topo)**
- Slider + input numerico: "Quantidade de keys" (1-50)
- Slider + input numerico: "Creditos por key" (500-25000, step 500, default 3125 que e o plano Pro de $5)
- Presets rapidos: botoes "$5 Pro (3125)", "$10 (6250)", "$25 (15625)"
- Total automatico: "X keys x Y creditos = Z creditos totais"

**2. Tabela de Modelos (centro)**
- Grid responsivo com cards por modelo, agrupados em categorias:
  - **Kling**: 2.5 Turbo, 2.6, 3.0, O1, O3 Omni, 2.1 Pro
  - **Veo**: 3.1, 3.1 Fast, 3.0, 3.0 Fast
  - **Hailuo**: 2.3, 2.3 Fast
  - **Motion**: 2.0
- Cada card mostra:
  - Nome do modelo + badge de features (audio, start frame, end frame, image ref)
  - Por duracao: custo em creditos + quantidade de geracoes possiveis
  - Barra de progresso visual comparando com o modelo mais barato
  - Cor: verde (>20 gens), amarelo (5-20), vermelho (<5)

**3. Resumo Comparativo (bottom)**
- "Melhor custo-beneficio" highlight
- Total de geracoes possiveis se usar so um modelo
- Tempo estimado de conteudo (gens x duracao)

### Estilo Visual
- Mesmo dark theme do app (#0a0a14 background)
- Fontes Space Grotesk para numeros, Inter para texto
- Cards com bordas sutis `rgba(255,255,255,0.07)`
- Cores dos modelos: roxo Kling, verde Veo, azul Hailuo, cinza Motion
- Animacoes slide-up nos cards ao carregar
- Totalmente responsivo (grid 1 col mobile, 2-3 cols desktop)

---

## Dados de Custo (hardcoded no frontend, sem API call)

Todos os custos vem do `VIDEO_COSTS` ja definido na edge function, mas replicados como constante local no componente para evitar chamadas de API desnecessarias:

```text
MODEL_COSTS = {
  "Kling 2.5 Turbo":  { 5: 235, 10: 470 },
  "Kling 2.6":        { 5: 604, 10: 1208 },
  "Kling 3.0":        { 5: 604, 10: 1208 },
  "Kling O1":         { 5: 484, 10: 968 },
  "Kling O3 Omni":    { 5: 604, 10: 1208 },
  "Kling 2.1 Pro":    { 5: 600, 10: 1200 },
  "Veo 3.1":          { 4: 1070, 6: 1605, 8: 2140 },
  "Veo 3.1 Fast":     { 4: 546, 6: 819, 8: 1092 },
  "Veo 3.0":          { 4: 2140, 6: 1605, 8: 1070 },
  "Veo 3.0 Fast":     { 4: 1092, 6: 819, 8: 546 },
  "Hailuo 2.3":       { 5: 500, 10: 1000 },
  "Hailuo 2.3 Fast":  { 5: 300, 10: 600 },
  "Motion 2.0":       { fixed: 100 },
}
```

Cada modelo tambem tem metadata de features: `audio`, `startFrame`, `endFrame`, `imageRef`, `videoRef`.

---

## Integracao no Dashboard

1. Adicionar `"calculator"` ao type `Tab`
2. Nova aba com icone `Calculator` do Lucide
3. Renderizar `<CostCalculator />` quando `tab === "calculator"`

---

## Detalhes Tecnicos

### Arquivo novo: `src/components/CostCalculator.tsx`

- Componente funcional com `useState` para `keyCount` e `creditsPerKey`
- Calculo reativo: `totalCredits = keyCount * creditsPerKey`
- Para cada modelo e duracao: `generations = Math.floor(totalCredits / cost)`
- Para cada modelo e duracao: `totalSeconds = generations * duration`
- Formatacao: minutos e segundos para tempo total
- Agrupamento por categoria com headers visuais
- Sem dependencias externas alem de Lucide icons

### Arquivo editado: `src/pages/Dashboard.tsx`

- Import do `CostCalculator`
- Adicionar tab "Calculadora" com icone `Calculator`
- Renderizar no tab panel

### Nenhuma mudanca no backend -- tudo client-side

