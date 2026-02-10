

# Correcao do Erro + Redesign Completo do Diretor

## Problema Identificado

O erro "Erro ao processar" acontece por duas razoes:

1. **Parsing SSE fragil**: O streaming divide chunks por `\n`, mas dados SSE podem chegar divididos entre chunks. Linhas parciais causam falha no `JSON.parse` do delta, e o conteudo se perde silenciosamente.

2. **Parsing JSON final sem tolerancia**: Apos acumular todo o texto, o codigo faz `JSON.parse(cleaned)` diretamente. Se o modelo retorna qualquer texto extra, backticks mal formatados, ou trunca o JSON, o parse falha e cai no catch generico.

---

## Correcoes Tecnicas

### 1. Parsing SSE robusto no DirectorForm

- Acumular buffer de texto entre chunks (nao splittar por `\n` e descartar parciais)
- Processar linha-por-linha com buffer residual entre leituras
- Tratar CRLF, linhas de comentario (`:`) e flush final

### 2. Extracao JSON tolerante

- Encontrar limites `{` e `}` no texto acumulado
- Limpar trailing commas, caracteres de controle
- Detectar truncamento (braces desbalanceados) e mostrar mensagem especifica
- Validar estrutura (`scenes` existe e e array)

### 3. Mensagens de erro especificas

- Truncamento: "Roteiro muito longo, simplifique"
- JSON invalido: "Resposta mal formatada, tente novamente"
- Rede: "Erro de conexao"

---

## Redesign Visual Completo

### DirectorForm.tsx

- Animacoes de entrada com CSS transitions nos cards de modo
- Gradiente animado no botao DIRIGIR (pulse sutil)
- Textarea com borda animada ao focar
- Loading state com skeleton animado e mensagens rotativas ("Analisando roteiro...", "Montando cenas...", "Aplicando neurociencia...")
- Resultado aparece com animacao fade-in escalonada (cada cena com delay)

### SceneCard.tsx

- Cards com hover elevado (shadow + scale sutil)
- Bordas laterais coloridas por tipo de prompt (roxo Veo, verde Kling, amarelo Nano)
- Animacao de entrada staggered (cada cena entra com delay de 100ms)
- Botao copiar com animacao de feedback (check verde com bounce)
- Secoes colapsaveis (camera, neuro, speech, tech) para nao sobrecarregar visualmente
- Icones animados nos headers de secao

### ModeCard.tsx

- Hover com glow sutil na cor do modo
- Icone com animacao de scale ao selecionar
- Transicao suave entre estados selecionado/nao-selecionado

### ChipSelect.tsx

- Chips com animacao de press (scale down ao clicar)
- Glow sutil no chip selecionado

### Cores e Design System

- Cada engine tem cor fixa: Veo = indigo/roxo, Kling = emerald/verde, Nano = amber/amarelo
- Secoes de informacao: Camera = roxo, Neuro = rosa, Speech = cyan, Tech = amarelo
- Cards de resultado com glassmorphism sutil (backdrop-blur + bg-opacity)

---

## Arquivos a Modificar

1. `src/components/DirectorForm.tsx` - Parsing robusto + UI animada + loading states
2. `src/components/SceneCard.tsx` - Design premium com animacoes e secoes colapsaveis
3. `src/components/ModeCard.tsx` - Hover glow e animacoes
4. `src/components/ChipSelect.tsx` - Press animation
5. `src/index.css` - Keyframes de animacao (fade-in, slide-up, pulse-glow)

## Sem alteracao na Edge Function

A edge function `generate-script` esta funcionando corretamente. O problema e 100% no parsing frontend.
