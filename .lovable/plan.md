

# Fix: Salvar roteiro do Diretor + Melhorar qualidade dos prompts Nano + Evitar cortes na narracao

## 3 Problemas Identificados

### Problema 1: "Erro ao salvar"
Quando voce tenta salvar um roteiro do Diretor, o campo `size` recebe o valor da plataforma de destino (ex: `"reels"`, `"tiktok"`) em vez de um dos valores aceitos pelo banco (`"short"`, `"medium"`, `"long"`). O banco rejeita com o erro `scripts_size_check`.

### Problema 2: Prompt Nano Banana Pro fraco
O character sheet gerado pelo Diretor e generico demais. A imagem que voce compartilhou mostra que o resultado (Quartzito Taj Mahal) ficou com olhos como buracos circulares genericos e boca como uma linha simples. O system prompt atual pede "150+ palavras" mas nao enfatiza:
- Referencia visual concreta ao tipo de pedra real (veios, tonalidade, translucidez)
- Anatomia facial expressiva integrada ao material (nao "buracos" mas relevos esculpidos)
- Proporcoes e escala especificas do personagem
- Estilo artistico mais direcionado (atualmente diz "Pixar-adjacent" mas e vago)

### Problema 3: Narracao cortada
O roteiro tem 8 beats (38s), mas o system prompt limita a "2-6 cenas". Isso forca o modelo a comprimir beats, cortando falas e direcionamento. Alem disso, nao ha `max_tokens` configurado na chamada da API, o que pode causar truncamento em respostas longas.

---

## Solucoes

### 1. Fix do Save (Dashboard.tsx)
Mapear o `destination` do Diretor para um `size` valido antes de passar ao `SaveScriptDialog`:
- `"tiktok"` / `"shorts"` / `"reels"` com total < 20s → `"short"`
- Total entre 20-45s → `"medium"`
- Total > 45s → `"long"`
- Fallback: `"medium"`

### 2. Melhorar System Prompt do Nano (edge function)
Reforcar as instrucoes do prompt_nano no system prompt com:
- Exigir descricao de ANATOMIA FACIAL: como os olhos sao formados (nao buracos, mas areas polidas com iris esculpida), como a boca e formada (veiacao natural que se curva)
- Exigir referencia ao material REAL: "descreva como se fosse um briefing para um artista de VFX que nunca viu quartzito Taj Mahal"
- Aumentar o minimo de 150 para 200 palavras
- Adicionar exemplos concretos de descricao de material (roughness, SSS intensity, specular)
- Proibir descricoes genericas como "realistic stone", "natural features"

### 3. Evitar cortes na narracao (edge function)
- Mudar "Gere 2-6 cenas" para "Gere quantas cenas forem necessarias para cobrir TODOS os beats do roteiro. NAO comprima, NAO omita, NAO resuma beats."
- Adicionar regra: "Cada beat do roteiro DEVE aparecer na narracao/dialogo de alguma cena. Valide antes de responder."
- Adicionar `max_tokens: 16384` na chamada da API para evitar truncamento em roteiros longos

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Dashboard.tsx` (linha 289)
- Criar funcao `getSizeFromDirector()` que calcula o size baseado na duracao total das cenas
- Usar essa funcao no prop `size` do SaveScriptDialog

### Arquivo: `supabase/functions/generate-script/index.ts`
- Linha 57: Melhorar bloco NANO BANANA PRO com instrucoes mais especificas sobre anatomia facial e material
- Linha 135: Trocar "Gere 2-6 cenas" por instrucao que proibe omitir beats
- Linha 162: Adicionar `max_tokens: 16384` no body do fetch

### Arquivos modificados:
1. `src/pages/Dashboard.tsx` -- fix do size para salvar
2. `supabase/functions/generate-script/index.ts` -- melhorar prompt Nano + evitar cortes + max_tokens
