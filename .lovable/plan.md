

# Templates e Geracao de Roteiros — Correcao Critica + Upgrade Inteligente

## Problemas Encontrados (5 criticos)

### 1. Templates NUNCA aplicam valores no formulario
O `GenerateForm` usa `useState(initialValues?.type || "")` que so le valores na primeira montagem. Como o componente fica montado permanentemente (com `display:none`), clicar em qualquer template nao muda nada no formulario. O `memo` agrava o problema.

### 2. Templates de tipo "director" quebrados
4 templates tem `type: "director"` mas `handleUseTemplate` redireciona para a aba "generate", que so aceita video/commercial/prompt. O tipo "director" nao existe no formulario.

### 3. Contextos sao instrucoes de IA, nao topicos do usuario
Templates preenchem o campo com frases como "Crie um roteiro de tutorial sobre o tema" — isso e uma instrucao pro modelo, nao o tema do usuario. O usuario ve isso e nao sabe o que fazer.

### 4. Saida generica para todos os templates
Todos usam o mesmo system prompt. Um template "Shorts/Reels" gera a mesma saida que "Email Marketing". Sem estrutura especifica (hooks, CTAs, subject lines, etc).

### 5. 14 templates em grid plano sem filtro
Sem agrupamento por categoria. Dificil encontrar o que precisa.

---

## Plano de Correcao

### 1. Corrigir GenerateForm para reagir a mudancas de initialValues

Adicionar `useEffect` que sincroniza state quando `initialValues` muda:

```text
useEffect(() => {
  if (initialValues?.type) setType(initialValues.type);
  if (initialValues?.tone) setTone(initialValues.tone);
  if (initialValues?.size) setSize(initialValues.size);
  if (initialValues?.context !== undefined) setContext(initialValues.context);
}, [initialValues]);
```

Remover `memo` wrapper (causa staleness com props que mudam).

### 2. Separar contexto de template do topico do usuario

Redesenhar o modelo de Template para ter dois campos:
- `systemContext`: instrucao que vai para o system prompt (invisivel ao usuario)
- `placeholder`: exemplo didatico que aparece como placeholder do textarea

O usuario ve um campo VAZIO com placeholder explicativo. Ex:
- Template "Tutorial": placeholder = "Ex: Como fazer pao caseiro em 5 passos simples"
- Template "Shorts": placeholder = "Ex: 3 erros que todo iniciante comete na academia"

### 3. System prompts especificos por template

Cada template tera um `systemContext` rico que e INJETADO no prompt enviado a IA:

```text
Shorts/Reels:
  "Crie um script de 15-30s otimizado para Shorts/Reels.
   ESTRUTURA: Hook (0-2s) com pattern interrupt → Conteudo denso (3-25s)
   com mudanca a cada 3s → CTA integrado (ultimos 3s).
   FORMATO: [HOOK] texto / [CORTE] texto / [CTA] texto.
   Use frases curtas, ritmo rapido, numeros especificos."

Email Marketing:
  "Crie um email marketing completo.
   ESTRUTURA: Subject Line (max 50 chars) → Preheader (max 80 chars)
   → Abertura com hook → Corpo com beneficios → CTA claro → PS.
   FORMATO: separar cada secao com labels claros."

Tutorial:
  "Crie um roteiro de tutorial passo a passo.
   ESTRUTURA: [INTRO] contextualizacao + promessa → [PASSO 1-N] cada
   passo com explicacao + dica pratica → [RECAP] resumo → [CTA].
   Numere cada passo. Inclua timestamps estimados."
```

### 4. Templates de tipo "director" redirecionam para aba Diretor

Em `handleUseTemplate`, se `t.type === "director"`, mudar para `setTab("director")` e pre-preencher o DirectorForm com os valores do template (modo, contexto, destino).

### 5. Templates agrupados por categoria com filtro

Adicionar filtro por tipo na aba Templates:
- Chips: "Todos" | "Video/YouTube" | "Comercial" | "Prompts IA" | "Diretor"
- Templates agrupados visualmente com headers de secao
- Cada grupo mostra uma descricao curta do que aquela categoria faz

### 6. Novos templates uteis + remocao de redundantes

Adicionar templates que faltam para cobrir casos de uso reais:
- **Podcast/Entrevista**: roteiro com perguntas estruturadas
- **Landing Page Copy**: headline + subheadline + bullets + CTA
- **Carrossel Instagram**: 5-10 slides com hook → conteudo → CTA

Remover templates redundantes ou vagos (ex: "Prompt para Texto" e "Prompt para Analise de Dados" sao muito genericos).

---

## Detalhes Tecnicos

### Arquivos modificados:

1. **`src/lib/templates.ts`** — Reestruturar interface Template: adicionar `systemContext` e `placeholder`. Reescrever cada template com contextos especificos e placeholders didaticos. Adicionar novos templates. Remover redundantes.

2. **`src/components/GenerateForm.tsx`** — Remover `memo`. Adicionar `useEffect` para sincronizar com `initialValues`. Usar `placeholder` do template no textarea. Enviar `systemContext` como parte do prompt.

3. **`src/pages/Dashboard.tsx`** — Logica de `handleUseTemplate`: direcionar director templates para aba Diretor. Adicionar filtro por tipo na secao Templates. Agrupar templates visualmente.

4. **`src/lib/streamChat.ts`** — Aceitar parametro opcional `systemContext` para injetar instrucoes especificas do template no prompt.

5. **`supabase/functions/generate-script/index.ts`** — Aceitar campo `templateContext` no body e injeta-lo como parte do system prompt quando presente, mantendo o `STANDARD_SYSTEM_PROMPT` como base.

### Impacto:
- Templates aplicam valores no formulario corretamente
- Cada template gera saida com estrutura propria e profissional
- Usuario sabe exatamente o que preencher (placeholder didatico)
- Templates de Diretor funcionam e redirecionam para a aba correta
- Navegacao por categoria facilita encontrar o template certo
- Saida da IA e estruturada, util e pronta para uso
