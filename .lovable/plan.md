
# Fix: Melhorar tratamento de erro e resiliencia do JSON parsing no Diretor

## Problema

O `extractJSON()` em `DirectorForm.tsx` falha silenciosamente quando `JSON.parse` lanca um `SyntaxError`. O catch generico na linha 236 nao loga o conteudo da resposta da IA, impossibilitando debug. Com roteiros longos (8 beats, 38s), a resposta JSON do Gemini 2.5 Pro pode ter:
- Virgulas trailing em posicoes nao cobertas pelo regex atual
- Strings com aspas nao escapadas dentro de dialogos em portugues
- Caracteres de controle nos prompts Veo/Kling

## Solucao

### 1. Melhorar `extractJSON()` em `src/components/DirectorForm.tsx`

- Adicionar sanitizacao de caracteres de controle (tabs, newlines dentro de strings JSON)
- Melhorar regex de limpeza para cobrir mais edge cases
- Adicionar fallback: se o JSON principal falha, tentar reparar aspas nao escapadas
- Logar o texto raw no console.error quando o parse falha, para facilitar debug futuro

### 2. Melhorar o catch block (linhas 230-236)

- Capturar `SyntaxError` especificamente e mostrar mensagem mais util: "Resposta com formato invalido. Tente novamente."
- Logar `fullText` no console quando ocorre erro, para que possamos ver a resposta da IA nos logs do browser

### 3. Adicionar retry automatico (opcional mas recomendado)

- Se o parse falha, tentar uma vez mais automaticamente antes de mostrar erro
- Mostrar "Tentando novamente..." no progress bar

## Detalhes Tecnicos

### Arquivo: `src/components/DirectorForm.tsx`

**extractJSON melhorado:**
- Adicionar `.replace(/[\x00-\x1f\x7f]/g, ...)` para sanitizar caracteres de controle dentro de strings
- Tratar newlines escapados incorretamente (`\n` literal vs char)
- Melhor tratamento de trailing commas em arrays e objetos aninhados

**Catch block melhorado (linhas 230-236):**
```
catch (err: any) {
  console.error("Director error:", err);
  console.error("Director raw response:", fullText); // NOVO - permite debug
  const msg = err?.message || "";
  if (msg === "truncated") setError("Resposta truncada...");
  else if (msg === "invalid_structure") setError("Resposta sem estrutura valida...");
  else if (msg === "empty") setError("Nenhuma resposta recebida...");
  else if (err instanceof SyntaxError) setError("Resposta com formato invalido. Tente novamente.");
  else setError("Erro ao processar. Tente novamente.");
}
```

### Arquivos modificados:
1. `src/components/DirectorForm.tsx` -- melhorar extractJSON + catch block + logging
