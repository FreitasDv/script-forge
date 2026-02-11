
# Plano Completo: Motores Kling + Extensao Veo + Gestao de 50 Chaves

## Resumo

Tres grandes entregas em uma unica implementacao:
1. Adicionar os 3 modelos Kling (2.1 Pro, 2.5 Turbo, 2.6) na edge function e no system prompt do Diretor
2. Implementar extensao de clips Veo 3.1 (ultimo frame como start frame do proximo)
3. Criar sistema robusto de gestao de ate 50 chaves com reserva de creditos e UI de administracao

---

## Parte 1: Modelos Kling na Edge Function

### Descobertas da pesquisa (confirmado na documentacao oficial docs.leonardo.ai):

| Modelo | API ID | API Version | Endpoint | Duracao | Custo (credits) | Audio | Start Frame | End Frame |
|--------|--------|-------------|----------|---------|-----------------|-------|-------------|-----------|
| Kling 2.6 | `kling-2.6` | **v2** | `/api/rest/v2/generations` | 5s, 10s | 604 / 1208 | Sim | Sim (opcional) | Nao |
| Kling 2.5 Turbo | `KLING2_5` | v1 | `/generations-text-to-video` e `image-to-video` | 5s, 10s | 235 / 470 | Nao | Sim | Nao |
| Kling 2.1 Pro | `KLING2_1` | v1 | `/generations-image-to-video` | 5s, 10s | ~600 / ~1200 | Nao | **Obrigatorio** | Sim |
| Veo 3.1 | `VEO3_1` | v1 | ambos | 4s, 6s, 8s | 1070 / 1605 / 2140 | Sim | Sim | Sim (so 8s) |
| Veo 3.1 Fast | `VEO3_1FAST` | v1 | ambos | 4s, 6s, 8s | 546 / 819 / 1092 | Sim | Sim | Sim (so 8s) |
| Veo 3 | `VEO3` | v1 | ambos | 4s, 6s, 8s | 2140 / 1605 / 1070 | Sim | Sim | Nao |
| Veo 3 Fast | `VEO3FAST` | v1 | ambos | 4s, 6s, 8s | ~1092 | Sim | Sim | Nao |
| Motion 2.0 | `MOTION2` | v1 | ambos | - | ~100 | Nao | Sim | Nao |

### Aspect ratios Kling (todos):
- 16:9 = 1920x1080
- 1:1 = 1440x1440
- 9:16 = 1080x1920

### Mudancas no `leonardo-generate/index.ts`:

1. Adicionar `LEONARDO_BASE_V2 = "https://cloud.leonardo.ai/api/rest/v2"`
2. Mapear todos os modelos Kling em `VIDEO_MODELS` com duracoes e resolucoes
3. Adicionar custos reais em `VIDEO_COSTS` para cada Kling
4. Criar funcao `leonardoPostV2()` para requests na API v2
5. Criar funcao `generateVideoKling26()` especifica para o formato v2 (com `parameters.guidances`)
6. Atualizar `generateVideoFromImage` para suportar `KLING2_5` e `KLING2_1`
7. Atualizar `generateVideoFromText` para suportar `KLING2_5`
8. Adicionar roteamento automatico: se modelo e `KLING2_6`, usar v2; senao, v1

### Formato do request Kling 2.6 (API v2) -- confirmado na documentacao:

```text
POST /api/rest/v2/generations
{
  "model": "kling-2.6",
  "public": false,
  "parameters": {
    "prompt": "descricao",
    "duration": 5,
    "width": 1080,
    "height": 1920,
    "guidances": {
      "start_frame": [{
        "image": { "id": "uuid", "type": "GENERATED" }
      }]
    }
  }
}
```

---

## Parte 2: Extensao de Clips Veo 3.1

### Como funciona (pesquisa confirmada):

A API do Leonardo.ai **nao tem endpoint nativo "extend"** -- diferente do Google Vertex AI que tem `veo3-1-extend-video`. No Leonardo, a extensao funciona via workflow manual:

1. Gerar video original (8s) via `text-to-video` ou `image-to-video`
2. Ao completar, o response contem `generated_images[0].id` (o frame/thumbnail gerado)
3. Usar esse `id` como `imageId` no proximo `image-to-video` com novo prompt ou mesmo prompt
4. O ultimo frame do video anterior vira o primeiro frame do proximo -- continuidade visual

### Tres modos de extensao:

| Modo | Descricao | Implementacao |
|------|-----------|---------------|
| **last_frame** | Continua de onde parou | Pega `imageId` do video anterior, usa como start frame em `image-to-video` |
| **start_end_frame** | Transicao controlada entre 2 refs | Usa start + end frame (Veo 3.1 forca 8s, Kling 2.1 Pro tambem suporta) |
| **direct** | Novo clip sem referencia visual | `text-to-video` com prompt ajustado, corte seco |

### Novo action `extend_video` na edge function:

Recebe:
- `source_job_id`: ID do job no banco (para buscar `result_metadata` com `imageId`)
- `extend_mode`: `last_frame` | `start_end_frame` | `direct`
- `prompt`: prompt do novo clip
- `end_frame_image_id` (opcional, so para `start_end_frame`)
- `model`, `duration`, `resolution` (opcionais)

Fluxo:
1. Buscar o job original no banco
2. Extrair `imageId` do `result_metadata.raw.generated_images[0].id`
3. Chamar `image-to-video` com esse `imageId` como start frame
4. Registrar novo job com `parent_job_id` e `extend_mode`

### Novo action `estimate_cost`:

Recebe parametros da geracao, retorna custo estimado sem executar. Permite ao frontend confirmar antes de gastar.

---

## Parte 3: Gestao de 50 Chaves com Reserva de Creditos

### Migration no banco de dados:

```text
-- leonardo_keys: campos de gestao avancada
ALTER TABLE leonardo_keys ADD COLUMN reserved_credits integer NOT NULL DEFAULT 0;
ALTER TABLE leonardo_keys ADD COLUMN daily_limit integer DEFAULT NULL;
ALTER TABLE leonardo_keys ADD COLUMN uses_today integer NOT NULL DEFAULT 0;
ALTER TABLE leonardo_keys ADD COLUMN last_reset_date date DEFAULT CURRENT_DATE;
ALTER TABLE leonardo_keys ADD COLUMN notes text DEFAULT '';

-- generation_jobs: campos de extensao e rastreamento
ALTER TABLE generation_jobs ADD COLUMN parent_job_id uuid REFERENCES generation_jobs(id);
ALTER TABLE generation_jobs ADD COLUMN extend_mode text;
ALTER TABLE generation_jobs ADD COLUMN credit_cost integer DEFAULT 0;
ALTER TABLE generation_jobs ADD COLUMN source_frame_id text;
```

### Logica de reserva de creditos (evita usar key pela metade):

A funcao `getNextKey` muda para considerar `reserved_credits`:

```text
SELECT id, api_key, remaining_credits, reserved_credits
FROM leonardo_keys
WHERE is_active = true
  AND (remaining_credits - reserved_credits) > [custo_estimado]
  AND (daily_limit IS NULL OR uses_today < daily_limit)
ORDER BY (remaining_credits - reserved_credits) DESC
LIMIT 1
```

Fluxo de reserva:
1. **Antes** de chamar a API: `reserved_credits += custo`
2. **Apos sucesso**: `reserved_credits -= custo`, `remaining_credits -= custo`
3. **Apos falha**: `reserved_credits -= custo` (libera)

Isso garante que 50 chaves nunca sejam escolhidas com creditos insuficientes por processos concorrentes.

### Novos actions na edge function para gestao de chaves:

| Action | Descricao |
|--------|-----------|
| `add_key` | Adiciona nova API key (recebe `api_key`, `label`, `notes`) |
| `remove_key` | Desativa uma key por ID |
| `update_key` | Atualiza `label`, `daily_limit`, `notes`, `is_active` |
| `sync_credits` | Chama `GET /api/rest/v1/me` no Leonardo para pegar saldo real (`apiPaidTokens` + `apiSubscriptionTokens`) e atualiza `remaining_credits` |
| `sync_all_credits` | Sincroniza todas as keys ativas de uma vez |
| `list_keys` | (ja existe) Lista todas com os novos campos |
| `estimate_cost` | Retorna custo estimado sem executar |

### Sync de creditos -- endpoint confirmado:

```text
GET https://cloud.leonardo.ai/api/rest/v1/me
Authorization: Bearer <API_KEY>

Response: {
  "user_details": [{
    "apiPaidTokens": 45677,
    "apiSubscriptionTokens": 13,
    ...
  }]
}

remaining = apiPaidTokens + apiSubscriptionTokens
```

---

## Parte 4: UI de Gestao de Chaves

### Novo componente `KeyManager.tsx` + nova aba "Keys" no Dashboard

Funcionalidades:
- Tabela com todas as keys: label, creditos disponiveis (remaining - reserved), reservados, usos hoje, ultimo uso, status
- Indicador visual de saude: verde (>1000), amarelo (200-1000), vermelho (<200)
- Botao "Adicionar Key": input para colar API key + label + notas
- Botao "Sincronizar Creditos" por key ou todas
- Toggle ativar/desativar por key
- Campo de notas editavel
- Resumo no topo: total de keys, creditos totais disponiveis, creditos reservados

### Mudanca no Dashboard:

- Adicionar tab `"keys"` ao type `Tab`
- Adicionar aba na navegacao com icone `Key`
- Renderizar `<KeyManager />` quando `tab === "keys"`

---

## Parte 5: Correcoes no System Prompt do Diretor

### Arquivo `generate-script/index.ts`:

Corrigir as specs de Kling no system prompt:
- Remover "Kling 3.0 (Higgsfield, nao Leonardo)" -- **Kling 3.0 e da Higgsfield/fal.ai, nao esta na API do Leonardo**
- Documentar corretamente os 3 Kling disponiveis no Leonardo:
  - Kling 2.6: audio nativo, 5s/10s, 604/1208 credits
  - Kling 2.5 Turbo: sem audio, rapido e barato, 5s/10s, 235/470 credits
  - Kling 2.1 Pro: UNICO com start+end frame, obrigatorio start frame, 5s/10s, ~600/~1200 credits
- Atualizar regras de duracao e quebra
- Linha 122: mudar "Kling 3.0" para referencia correta

### Arquivo `director-types.ts`:

- Linha 40: mudar label de `"Kling 3.0"` para `"Kling"` (cobre 2.1/2.5/2.6)

---

## Resumo de Arquivos Modificados

1. **`supabase/functions/leonardo-generate/index.ts`** -- Reescrita significativa: API v2, 3 modelos Kling, extend_video, reserva de creditos, CRUD de keys, sync_credits, estimate_cost
2. **`supabase/functions/generate-script/index.ts`** -- Correcao do system prompt do Diretor (specs Kling)
3. **`src/lib/director-types.ts`** -- Label da plataforma Kling
4. **`src/components/KeyManager.tsx`** -- Novo componente de gestao de chaves
5. **`src/pages/Dashboard.tsx`** -- Nova aba "Keys"
6. **Migration SQL** -- Colunas novas em `leonardo_keys` e `generation_jobs`
