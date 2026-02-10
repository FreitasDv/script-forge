
# Redesign dos Stats Cards — Lucide Icons + Contexto Claro

## Problema

Os stats cards atuais tem dois problemas graves:
1. **Emojis como icones** — parecem amadores, sem profissionalismo
2. **Sem contexto** — "0 Videos" nao explica nada. Sao roteiros salvos? Gerados? Total do que?

## Solucao

### 1. Substituir emojis por icones Lucide

Trocar todos os emojis por icones SVG profissionais do `lucide-react` (ja instalado no projeto):

| Antes | Depois | Icone Lucide |
|-------|--------|-------------|
| `🎬` Videos | Roteiros de Video | `Video` |
| `📢` Comerciais | Scripts Comerciais | `Megaphone` |
| `🤖` Prompts | Prompts IA | `Sparkles` |
| `🎥` Diretor | Producoes Diretor | `Clapperboard` |

Cada icone renderizado com a cor tematica do card (stroke color matching), tamanho 20px, dentro de um container circular com fundo semi-transparente da mesma cor.

### 2. Adicionar subtitulo explicativo

Cada card ganha um subtitulo "Roteiros salvos" para deixar claro que e a contagem de scripts salvos no banco.

### 3. Tambem trocar emojis do header, tabs e templates

- **Header**: trocar `✨` por icone Lucide `Wand2` ou simplesmente texto estilizado
- **Tabs**: trocar emojis por icones Lucide pequenos (16px)
  - Gerar: `Wand2`
  - Diretor: `Clapperboard`
  - Templates: `LayoutTemplate`
  - Salvos: `Archive`
- **Filtros de tipo** nos salvos: mesmos icones Lucide dos stats
- **Botao Sair**: adicionar icone `LogOut`

### 4. Emojis nos saved scripts list

Trocar `typeIcons` de emojis para Lucide icons tambem, mantendo consistencia.

---

## Detalhes Tecnicos

### Arquivo a modificar

**`src/pages/Dashboard.tsx`**

Mudancas:
- Adicionar imports: `import { Video, Megaphone, Sparkles, Clapperboard, Wand2, LayoutTemplate, Archive, LogOut, Copy, Star, Trash2 } from "lucide-react";`
- Stats array: trocar `icon: "emoji"` por componentes Lucide com cor e container circular
- Tabs array: trocar `icon: "emoji"` por componentes Lucide inline
- `typeIcons` map: trocar de strings emoji para componentes Lucide
- Subtitulo "roteiros salvos" em cada stat card
- Botoes de acao nos saved scripts: trocar emojis por `<Star>`, `<Copy>`, `<Trash2>`
- Botao Sair: adicionar `<LogOut size={14} />`

### O que NAO muda
- Logica de negocio, queries, estado
- Outros arquivos
- DirectorForm, SceneCard (esses usam emojis tematicos propositais como UGC 📱 que fazem sentido no contexto)
