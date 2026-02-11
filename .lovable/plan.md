

# Fix: Erro ao Salvar Roteiro do Diretor

## Problema

A tabela `scripts` tem uma constraint no banco de dados:
```
CHECK (type IN ('video', 'commercial', 'prompt'))
```

Quando o usuario salva um roteiro vindo do **Diretor**, o codigo passa `type="director"` (linha 298 do Dashboard.tsx), que nao e um valor permitido. O banco rejeita o insert.

## Solucao

Duas mudancas necessarias:

### 1. Adicionar "director" como tipo valido no banco
Alterar a constraint para aceitar o novo valor:
```sql
ALTER TABLE public.scripts DROP CONSTRAINT scripts_type_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_type_check 
  CHECK (type = ANY (ARRAY['video', 'commercial', 'prompt', 'director']));
```

### 2. Atualizar o type cast no SaveScriptDialog
No `src/components/SaveScriptDialog.tsx` (linha 40), o cast `type as "video" | "commercial" | "prompt"` precisa incluir `"director"`:
```typescript
type: type as "video" | "commercial" | "prompt" | "director",
```

## Arquivos modificados
1. **Migration SQL** — adicionar "director" a constraint `scripts_type_check`
2. **`src/components/SaveScriptDialog.tsx`** — atualizar o type cast na linha 40

## Impacto
- Zero mudanca visual
- Corrige o erro ao salvar roteiros gerados pelo Diretor
- Backwards compatible (tipos existentes continuam funcionando)
