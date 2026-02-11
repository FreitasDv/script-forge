
# Adicionar Kling 3.0, O3 Omni, O1, e Hailuo na API Leonardo

## Modelos Encontrados no Screenshot (que faltam no codigo)

A partir do screenshot da UI do Leonardo.ai e da documentacao oficial, estes modelos precisam ser adicionados:

| Modelo | API Model ID | API | Duracao | Features | Custo (credits) | Status Doc |
|--------|-------------|-----|---------|----------|-----------------|------------|
| Kling Video 3.0 | `kling-video-3-0` (inferido) | v2 | 5s, 10s | Start Frame, End Frame, Audio | ~604/~1208 (estimar) | Sem doc oficial ainda |
| Kling Video O3 Omni | `kling-video-o-3-omni` (inferido) | v2 | 5s, 10s | Start Frame, End Frame, Image Ref, Video Ref, Audio | ~604/~1208 (estimar) | Sem doc oficial ainda |
| Kling O1 Video | `kling-video-o-1` (confirmado) | v2 | 5s, 10s | Start Frame, End Frame, Image Ref (ate 5) | 484 / 968 | Confirmado na doc |
| Hailuo 2.3 | `hailuo-2-3` (inferido) | v2 | 5s, 10s? | Start Frame | ~500 (estimar) | Sem doc oficial ainda |
| Hailuo 2.3 Fast | `hailuo-2-3-fast` (inferido) | v2 | 5s, 10s? | Start Frame | ~300 (estimar) | Sem doc oficial ainda |

### Modelo Confirmado com Documentacao Completa: Kling O1

Da documentacao oficial do Leonardo.ai:
- Model ID: `kling-video-o-1`
- API: v2 (`/api/rest/v2/generations`)
- Suporta: `start_frame`, `end_frame`, `image_reference` (ate 5 imagens)
- Restricao: `start_frame`/`end_frame` NAO pode ser usado junto com `image_reference`
- Custo: 484 credits (5s), 968 credits (10s)
- Mesmas dimensoes dos outros Kling: 1920x1080, 1440x1440, 1080x1920

### Modelos sem documentacao API oficial (ainda)

Kling Video 3.0, O3 Omni, Hailuo 2.3 e Hailuo 2.3 Fast estao visiveis na UI do Leonardo mas **ainda nao possuem receitas/guias na documentacao oficial da API** (retornam 404). Os model IDs sao inferidos com base no padrao de nomenclatura (`kling-2.6`, `kling-video-o-1`).

**Estrategia**: Adicionar todos com os IDs inferidos, usando a mesma estrutura v2 confirmada para O1 e 2.6. Se algum ID estiver errado, o erro da API sera capturado e logado, facilitando a correcao.

---

## Plano de Implementacao

### 1. Atualizar `supabase/functions/leonardo-generate/index.ts`

**VIDEO_MODELS** -- adicionar 5 novos modelos:

```
"KLING_VIDEO_3_0":  { label: "Kling Video 3.0",     durations: [5, 10], apiVersion: "v2", supportsEndFrame: true, supportsAudio: true }
"KLING_O3_OMNI":    { label: "Kling O3 Omni",       durations: [5, 10], apiVersion: "v2", supportsEndFrame: true, supportsAudio: true, supportsImageRef: true, supportsVideoRef: true }
"KLING_O1":         { label: "Kling O1",             durations: [5, 10], apiVersion: "v2", supportsEndFrame: true, supportsImageRef: true }
"HAILUO_2_3":       { label: "Hailuo 2.3",           durations: [5, 10], apiVersion: "v2" }
"HAILUO_2_3_FAST":  { label: "Hailuo 2.3 Fast",      durations: [5, 10], apiVersion: "v2" }
```

**VIDEO_COSTS** -- adicionar custos:

```
"KLING_VIDEO_3_0":  { 5: 604, 10: 1208 }  // estimativa, ajustar quando doc sair
"KLING_O3_OMNI":    { 5: 604, 10: 1208 }  // estimativa
"KLING_O1":         { 5: 484, 10: 968 }   // CONFIRMADO na doc
"HAILUO_2_3":       { 5: 500, 10: 1000 }  // estimativa
"HAILUO_2_3_FAST":  { 5: 300, 10: 600 }   // estimativa
```

**Mapa de model IDs** para a API v2 (novo objeto):

```
V2_MODEL_IDS = {
  "KLING2_6":          "kling-2.6",
  "KLING_VIDEO_3_0":   "kling-video-3-0",
  "KLING_O3_OMNI":     "kling-video-o-3-omni",
  "KLING_O1":          "kling-video-o-1",
  "HAILUO_2_3":        "hailuo-2-3",
  "HAILUO_2_3_FAST":   "hailuo-2-3-fast",
}
```

**Refatorar `generateVideoKling26`** para ser generico `generateVideoV2` que funcione com qualquer modelo v2:
- Aceita o model ID interno, traduz para o ID da API via `V2_MODEL_IDS`
- Suporta `guidances.image_reference` (para O3 Omni e O1)
- Suporta `guidances.end_frame` (para 3.0, O3 Omni, O1)
- Suporta `guidances.video_reference` (para O3 Omni)

**Atualizar roteamento** em `generateVideoFromImage`, `generateVideoFromText`, e `extend_video`:
- Verificar se `VIDEO_MODELS[model].apiVersion === "v2"` → rotear para `generateVideoV2`
- Senao → manter logica v1 existente

### 2. Atualizar `supabase/functions/generate-script/index.ts`

**Corrigir a linha 83** que diz "NAO existe Kling 3.0 na API do Leonardo" -- remover essa afirmacao incorreta.

**Adicionar specs dos novos modelos** na secao KLING do system prompt:
- Kling Video 3.0: audio, start+end frame, 5s/10s
- Kling O3 Omni: audio, start+end frame, image ref (ate 5), video ref
- Kling O1: start+end frame, image ref (ate 5), sem video ref
- Hailuo 2.3 / 2.3 Fast: start frame, custo baixo

**Atualizar referencia de plataforma** para incluir os novos modelos quando `config.platform` inclui kling.

### 3. Atualizar `src/lib/director-types.ts`

Expandir PLATFORMS para oferecer mais granularidade ou manter "Kling" como umbrella que cobre todos os modelos Kling (3.0, O3 Omni, O1, 2.6, 2.5 Turbo, 2.1 Pro).

### 4. Adicionar `supportsImageRef` e `supportsVideoRef` ao tipo VIDEO_MODELS

Novos campos booleanos para que o frontend saiba quais modelos aceitam referencias de imagem/video (relevante para O3 Omni e O1).

---

## Detalhes Tecnicos

### Formato do request Kling O1 com Image Reference (confirmado):

```text
POST /api/rest/v2/generations
{
  "model": "kling-video-o-1",
  "public": false,
  "parameters": {
    "prompt": "descricao",
    "guidances": {
      "image_reference": [
        { "image": { "id": "uuid1", "type": "GENERATED" } },
        { "image": { "id": "uuid2", "type": "UPLOADED" } }
      ]
    },
    "duration": 5,
    "width": 1080,
    "height": 1920
  }
}
```

Restricao: `image_reference` NAO pode ser usado junto com `start_frame`/`end_frame`.

### Funcao `generateVideoV2` refatorada:

```text
async function generateVideoV2(apiKey, modelInternal, prompt, options) {
  const apiModelId = V2_MODEL_IDS[modelInternal];
  const modelSpec = VIDEO_MODELS[modelInternal];
  const dims = KLING_DIMENSIONS[options.aspect_ratio || "9:16"];
  
  const parameters = { prompt, duration: options.duration || 5, width: dims.width, height: dims.height };
  const guidances = {};
  
  if (options.imageId && !options.imageRefs) {
    guidances.start_frame = [{ image: { id: options.imageId, type: options.imageType || "GENERATED" } }];
  }
  if (options.endFrameImageId && modelSpec.supportsEndFrame) {
    guidances.end_frame = [{ image: { id: options.endFrameImageId, type: "GENERATED" } }];
  }
  if (options.imageRefs && modelSpec.supportsImageRef) {
    guidances.image_reference = options.imageRefs.map(ref => ({ image: { id: ref.id, type: ref.type || "GENERATED" } }));
  }
  
  if (Object.keys(guidances).length > 0) parameters.guidances = guidances;
  
  return leonardoPostV2("/generations", apiKey, { model: apiModelId, public: false, parameters });
}
```

### Arquivos modificados:

1. `supabase/functions/leonardo-generate/index.ts` -- 5 novos modelos, refatorar para `generateVideoV2` generico, novos campos `supportsImageRef`/`supportsVideoRef`
2. `supabase/functions/generate-script/index.ts` -- corrigir system prompt, adicionar specs dos novos modelos
3. `src/lib/director-types.ts` -- manter PLATFORMS atualizado

### Nota sobre model IDs nao confirmados:

Os IDs de Kling Video 3.0, O3 Omni, Hailuo 2.3 e Hailuo 2.3 Fast sao inferidos. Sera adicionado um log de erro detalhado para que, caso algum ID esteja incorreto, a mensagem de erro da API seja facilmente visivel nos logs e possamos corrigir rapidamente.
