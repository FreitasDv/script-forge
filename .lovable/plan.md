
# Redesign Visual Completo — Estetica Cinematografica 2026

## Problema

O codigo atual usa componentes shadcn genericos (Button, Input, Textarea, Progress) com classes Tailwind padrao. Isso produz um visual de template Bootstrap — limpo mas sem personalidade. A referencia tem uma estetica dark cinematografica com glassmorphism, cores vibrantes, e uma identidade visual forte.

## Solucao

Reescrever completamente o visual do DirectorForm, SceneCard, ModeCard e ChipSelect eliminando a dependencia de componentes shadcn genericos e usando estilos customizados inline/Tailwind que reproduzem a estetica da referencia.

---

## Mudancas Visuais Especificas

### 1. DirectorForm.tsx — Reescrita Visual Completa

- Remover imports de Button, Textarea, Input, Progress, Checkbox do shadcn
- Usar elementos HTML nativos com estilos inline seguindo a referencia
- Fundo do card principal: `rgba(255,255,255,0.02)` com `border: 1.5px solid rgba(255,255,255,0.06)`
- Header com badge "DIRETOR" em gradiente sutil, nao um badge shadcn generico
- Textarea com fundo `rgba(255,255,255,0.03)`, borda `rgba(255,255,255,0.08)`, foco muda borda para `#7c3aed55`
- Botoes de exemplo com `background: rgba(139,92,246,0.08)`, `color: #a78bfa`
- Barra de progresso customizada (div com gradiente animado shimmer, nao o componente Progress)
- Botoes "Proximo" e "DIRIGIR" com `background: linear-gradient(135deg, #7c3aed, #6d28d9)`
- Botao "Voltar" com `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.06)`
- Checkbox nativo com `accentColor: "#7c3aed"`
- Step Indicator com dots: ativo = 24px wide pill roxo, inativo = 8px dot cinza
- Empty state com emoji grande e opacidade 0.4
- Input de publico com mesmo estilo do textarea

### 2. SceneCard.tsx — Acordeao Cinematografico

- Card com fundo `rgba(255,255,255,0.02)`, borda `rgba(255,255,255,0.06)`, borderRadius 16px
- Header do acordeao: badge circular numerado com fundo roxo, seta toggle
- Header quando aberto: fundo `rgba(139,92,246,0.06)`
- Prompt blocks com fundo `rgba(0,0,0,0.3)`, borda colorida por engine, font monospace
- Botao copiar: fundo `rgba(cor,0.15)`, feedback verde com "Copiado!"
- Info blocks (camera, neuro, speech, tech) com `borderLeft: 3px solid cor`, fundo `rgba(cor,0.08)`
- Labels coloridos por secao: Camera=#a78bfa, Neuro=#fb7185, Speech=#67e8f9, Tech=#fcd34d
- Nano com N/A exibe texto italic cinza discreto
- JSON formatado com pretty-print automatico

### 3. ModeCard.tsx — Cards com Identidade

- Cada modo usa sua cor propria no estado selecionado
- Selecionado: `background: cor+"15"`, `border: 1.5px solid cor+"55"`, `transform: scale(1.02)`
- Nao selecionado: `background: rgba(255,255,255,0.02)`, `border: rgba(255,255,255,0.06)`
- Icone 20px, label em negrito com cor do modo quando selecionado
- Descricao em `#64748b`, 10px
- Hibrido ocupa 2 colunas (gridColumn span 2)

### 4. ChipSelect.tsx — Pills Coloridas

- Pills selecionadas usam a cor passada via prop: `background: cor+"15"`, `border: cor+"40"`, `color: cor`
- Pills nao selecionadas: `background: rgba(255,255,255,0.02)`, `border: rgba(255,255,255,0.06)`, `color: #64748b`
- Icone ao lado do label
- Transicao suave 0.2s
- fontWeight 600 quando selecionado, 400 quando nao

### 5. Resultados — Collapsibles Cinematograficos

- Director Notes: summary com fundo `rgba(139,92,246,0.05)`, borda `rgba(139,92,246,0.1)`, cor `#a78bfa`
- Workflow: summary com fundo `rgba(34,211,238,0.05)`, borda `rgba(34,211,238,0.1)`, cor `#22d3ee`
- Ambos com "toque para expandir" em cinza no canto direito
- Conteudo expandido com fundo mais claro, borda matching, sem borderTop
- Botao "+ Novo roteiro" no header dos resultados

---

## Detalhes Tecnicos

### Arquivos a Modificar

1. **`src/components/DirectorForm.tsx`** — Reescrever visual completo: remover shadcn Button/Textarea/Input/Progress/Checkbox, usar HTML nativo com estilos inline da referencia. Manter toda logica de negocio (streaming SSE, extractJSON, step wizard, progress simulation) intacta.

2. **`src/components/SceneCard.tsx`** — Reescrever visual: remover shadcn Button/Collapsible, usar HTML nativo com estilos inline. Manter logica de acordeao, copy, formatPrompt.

3. **`src/components/ModeCard.tsx`** — Ajustar estilos para usar inline styles da referencia em vez de classes Tailwind genericas.

4. **`src/components/ChipSelect.tsx`** — Ajustar estilos para pills com inline styles, cores customizadas por prop.

### O Que NAO Muda

- Logica de negocio (streaming, parsing, step wizard)
- Edge function
- Tipos em director-types.ts
- Dashboard.tsx (apenas o DirectorForm interno muda)
- Outros componentes fora do Diretor
