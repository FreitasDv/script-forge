

# Studio Robusto v2 — Revisao Critica e Upgrade Completo

## Analise Critica: O Que Esta Faltando

Apos revisao detalhada de todos os arquivos, identifiquei 14 gaps criticos organizados por gravidade:

### GAPS CRITICOS (funcionalidade quebrada ou inexistente)

| # | Gap | Onde | Impacto |
|---|-----|------|---------|
| 1 | **GenerateDialog NAO suporta anexo de imagens** | `GenerateDialog.tsx` | Modelos como Veo 3.1, Kling O3 Omni, O1 aceitam image refs (ate 5 imagens) — o dialog so envia texto puro. Ingredients to Video e impossivel. |
| 2 | **GenerateDialog NAO suporta video ref** | `GenerateDialog.tsx` | Kling O3 Omni aceita video reference — nao ha campo para isso |
| 3 | **GenerateDialog NAO diferencia text-to-video vs image-to-video** | `GenerateDialog.tsx` | Sempre chama `generate_video_from_text`. Se o usuario quer usar uma imagem como start frame (Ingredients to Video), nao consegue |
| 4 | **GenerateDialog NAO suporta end frame** | `GenerateDialog.tsx` | Veo 3.1, Kling 3.0, O3, O1, 2.1 suportam end frame — nao ha campo |
| 5 | **ExtendPanel aspect ratio e resolucao hardcoded** | `ExtendPanel.tsx` L74-75 | Sempre envia `9:16` e `RESOLUTION_720` — usuario nao pode escolher |
| 6 | **ExtendPanel nao mostra TODOS os modelos** | `ExtendPanel.tsx` L172 | `.slice(0, 6)` corta modelos — Hailuo e Motion ficam fora |
| 7 | **GenerateDialog com prompt vazio no standalone** | `Studio.tsx` L468 | "Nova Geracao" abre dialog com `prompt=""` — botao gera com prompt vazio |
| 8 | **Delete de jobs nao funciona** | `Studio.tsx` L128-132 | RLS da tabela `generation_jobs` NAO tem policy DELETE — o `supabase.delete()` falha silenciosamente |

### GAPS MEDIOS (funcionalidade incompleta)

| # | Gap | Onde | Impacto |
|---|-----|------|---------|
| 9 | **Sem upload de imagens proprias** | Todo o frontend | Usuario nao pode enviar imagem do computador como referencia — so pode usar imagens ja geradas pelo sistema |
| 10 | **GenerateDialog nao mostra features como acionaveis** | `GenerateDialog.tsx` L327-341 | Badges "Audio nativo", "End Frame", "Image Ref" sao apenas informativos — deveriam ser controles interativos |
| 11 | **Sem preset style para imagens Leonardo** | `GenerateDialog.tsx` | Edge function suporta 25 preset styles (DYNAMIC, PHOTOGRAPHY, etc.) — dialog nao oferece |
| 12 | **Motion 2.0 sem motion control** | `GenerateDialog.tsx` | Edge function suporta 18 camera controls (dolly_in, orbit_left, etc.) — nao ha UI para isso |
| 13 | **Galeria nao filtra por cena** | `Studio.tsx` | Filtro so tem "Todos/Imagens/Videos" — falta filtro por scene_index |
| 14 | **Polling usa qualquer key para check_status** | Edge function L536-537 | `getNextKey(adminClient, 0)` pode falhar se todas as keys estiverem ocupadas, mas check_status nao custa creditos |

---

## Plano de Implementacao

### 1. GenerateDialog v2 — Suporte Completo a Anexos

Reescrever o `GenerateDialog.tsx` com seções condicionais baseadas nas features do modelo selecionado:

**Novas secoes no dialog (aparecem apenas quando modelo suporta):**

- **Image References** (quando `features.imageRef = true`): Area de upload/selecao de ate 5 imagens. O usuario pode:
  - Selecionar imagens ja geradas (da galeria/generation_jobs)
  - Upload de imagens do computador (via Storage bucket `generations`)
  - Drag & drop

- **Start Frame** (quando `features.startFrame = true` ou modo Image-to-Video): Campo para selecionar/upload 1 imagem como start frame

- **End Frame** (quando `features.endFrame = true`): Campo para selecionar/upload 1 imagem como end frame

- **Video Reference** (quando `features.videoRef = true`, so Kling O3 Omni): Campo para selecionar video ja gerado como referencia

- **Preset Style** (quando tipo = imagem e modelo != nano): Dropdown com os 25 preset styles do Leonardo

- **Motion Control** (quando modelo = Motion 2.0): Dropdown com os 18 camera movements

- **Prompt editavel**: O campo de prompt deixa de ser read-only — usuario pode editar antes de gerar

- **Modo de geracao explicito**: Toggle "Texto puro" vs "Com imagem de referencia" que muda a action entre `generate_video_from_text` e `generate_video_from_image`

**Logica de action:**
```text
Se tipo = imagem → action = "generate_image"
Se tipo = video:
  Se tem imageRefs ou startFrame → action = "generate_video_from_image"
  Se so texto → action = "generate_video_from_text"
```

### 2. Upload de Imagens via Storage

Novo componente `ImageUploader` reutilizavel:
- Upload para o bucket `generations` (ja existe e e publico)
- Retorna URL publica para uso como referencia
- Preview da imagem uploadada
- Usado no GenerateDialog e ExtendPanel

Para usar como image ref na API Leonardo, apos upload no Storage:
- Chama `generate_image` com a URL como init image, OU
- Usa o endpoint de upload da Leonardo para obter um `imageId` nativo

**Decisao tecnica**: A API Leonardo aceita `imageId` (de imagens geradas nela) ou URLs diretas dependendo do endpoint. Para image refs no V2, precisamos de um `imageId`. Opcoes:
- A) Usar imagens ja geradas no Leonardo (pegar imageId do `result_metadata.raw.generated_images[0].id`) — funciona para imagens do sistema
- B) Para imagens externas, fazer upload para Leonardo via `/init-image` primeiro, obter o `imageId`, depois usar

Implementar opcao A primeiro (selecionar da galeria) e depois B (upload externo).

### 3. ExtendPanel v2 — Controles Completos

- Adicionar selectors de aspect ratio e resolucao (mesmo design do GenerateDialog)
- Mostrar TODOS os modelos (remover `.slice(0, 6)`)
- Adicionar campo de end frame quando modo = `start_end_frame`
- Mostrar custo estimado ao lado do botao

### 4. Correcao do Delete (RLS Policy)

Adicionar policy de DELETE na tabela `generation_jobs`:
```sql
CREATE POLICY "Users can delete own generation jobs"
ON generation_jobs FOR DELETE
USING (auth.uid() = user_id);
```

### 5. GenerateDialog Standalone com Prompt Editavel

Quando aberto sem prompt (botao "Nova Geracao"), mostrar textarea editavel em vez de preview truncado.

### 6. Fix: check_status sem depender de key com creditos

No edge function, o `check_status` nao consome creditos. Mudar para buscar qualquer key ativa (sem verificar creditos):

```typescript
case "check_status": {
  // check_status nao consome creditos, usar qualquer key ativa
  const { data: anyKey } = await adminClient
    .from("leonardo_keys")
    .select("api_key")
    .eq("is_active", true)
    .limit(1)
    .single();
  if (!anyKey) return errorResponse("Nenhuma API key ativa");
  // ... rest of logic
}
```

### 7. Filtro por Cena na Galeria

Adicionar chips de filtro por `scene_index` na galeria, alem dos filtros existentes.

---

## Detalhes Tecnicos

### Arquivos modificados:

1. **`src/components/GenerateDialog.tsx`** — Reescrita completa (~450 linhas)
   - Seções condicionais por features do modelo
   - Image refs selector (da galeria + upload)
   - Start/end frame selectors
   - Video ref selector
   - Preset style dropdown (imagens)
   - Motion control dropdown (Motion 2.0)
   - Prompt editavel
   - Toggle text-to-video vs image-to-video
   - Props adicionais: `existingJobs` (para selecionar refs da galeria)

2. **`src/components/ExtendPanel.tsx`** — Upgrade (~300 linhas)
   - Aspect ratio selector
   - Resolucao selector
   - Todos os modelos visiveis
   - End frame field no modo start_end_frame

3. **`src/components/Studio.tsx`** — Ajustes
   - Passar `jobs` para GenerateDialog (para selecao de refs)
   - Filtro por cena na galeria
   - Prompt editavel no standalone dialog

4. **`supabase/functions/leonardo-generate/index.ts`** — Fix check_status key selection

### Arquivo novo:

5. **`src/components/ImageRefSelector.tsx`** (~150 linhas)
   - Grid de imagens ja geradas (do generation_jobs)
   - Upload de novas imagens (para Storage)
   - Selecao multipla (ate 5 para image refs)
   - Preview com X para remover

### Migracao SQL:

6. Policy DELETE para `generation_jobs`

### Impacto:
- Ingredients to Video funcional (image refs como input)
- Start/end frame para extends e transicoes
- Video ref para Kling O3 Omni
- Upload de imagens proprias como referencia
- Preset styles para imagens Leonardo
- Motion controls para Motion 2.0
- Delete de jobs funcionando
- check_status confiavel sem depender de creditos
- Prompt editavel na geracao standalone
- Filtro por cena na galeria
- Todos os modelos acessiveis no ExtendPanel
- Aspect ratio e resolucao configuráveis no ExtendPanel
