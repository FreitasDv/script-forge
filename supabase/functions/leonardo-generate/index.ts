import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";
const LEONARDO_BASE_V2 = "https://cloud.leonardo.ai/api/rest/v2";

// ── Modelos de vídeo disponíveis na API ──
const VIDEO_MODELS: Record<string, { label: string; durations: number[]; resolutions: string[]; apiVersion: string; requiresStartFrame?: boolean; supportsEndFrame?: boolean; supportsAudio?: boolean; supportsImageRef?: boolean; supportsVideoRef?: boolean }> = {
  "VEO3_1":           { label: "Veo 3.1",           durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"], apiVersion: "v1", supportsEndFrame: true, supportsAudio: true },
  "VEO3_1FAST":       { label: "Veo 3.1 Fast",      durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"], apiVersion: "v1", supportsEndFrame: true, supportsAudio: true },
  "VEO3":             { label: "Veo 3",              durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"], apiVersion: "v1", supportsAudio: true },
  "VEO3FAST":         { label: "Veo 3 Fast",         durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"], apiVersion: "v1", supportsAudio: true },
  "KLING2_6":         { label: "Kling 2.6",          durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2", supportsAudio: true },
  "KLING_VIDEO_3_0":  { label: "Kling Video 3.0",    durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2", supportsEndFrame: true, supportsAudio: true },
  "KLING_O3_OMNI":    { label: "Kling O3 Omni",      durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2", supportsEndFrame: true, supportsAudio: true, supportsImageRef: true, supportsVideoRef: true },
  "KLING_O1":         { label: "Kling O1",            durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2", supportsEndFrame: true, supportsImageRef: true },
  "KLING2_5":         { label: "Kling 2.5 Turbo",    durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v1" },
  "KLING2_1":         { label: "Kling 2.1 Pro",      durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v1", requiresStartFrame: true, supportsEndFrame: true },
  "HAILUO_2_3":       { label: "Hailuo 2.3",          durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2" },
  "HAILUO_2_3_FAST":  { label: "Hailuo 2.3 Fast",     durations: [5, 10],   resolutions: ["RESOLUTION_1080"], apiVersion: "v2" },
  "MOTION2":          { label: "Motion 2.0",          durations: [],        resolutions: ["RESOLUTION_480", "RESOLUTION_720"], apiVersion: "v1" },
};

// ── Custos em API Credits (documentação oficial) ──
const VIDEO_COSTS: Record<string, Record<number, number>> = {
  "VEO3_1":           { 4: 1070, 6: 1605, 8: 2140 },
  "VEO3_1FAST":       { 4: 546,  6: 819,  8: 1092 },
  "VEO3":             { 4: 2140, 6: 1605, 8: 1070 },
  "VEO3FAST":         { 4: 1092, 6: 819,  8: 546 },
  "KLING2_6":         { 5: 604,  10: 1208 },
  "KLING_VIDEO_3_0":  { 5: 604,  10: 1208 },  // estimativa
  "KLING_O3_OMNI":    { 5: 604,  10: 1208 },  // estimativa
  "KLING_O1":         { 5: 484,  10: 968 },    // confirmado na doc
  "KLING2_5":         { 5: 235,  10: 470 },
  "KLING2_1":         { 5: 600,  10: 1200 },
  "HAILUO_2_3":       { 5: 500,  10: 1000 },   // estimativa
  "HAILUO_2_3_FAST":  { 5: 300,  10: 600 },    // estimativa
  "MOTION2":          { 4: 100,  6: 100,  8: 100 },
};

// ── Aspect ratio → dimensões Kling ──
const KLING_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "1:1":  { width: 1440, height: 1440 },
  "9:16": { width: 1080, height: 1920 },
};

// ── Estilos de imagem disponíveis ──
const IMAGE_PRESET_STYLES = [
  "DYNAMIC", "PHOTOGRAPHY", "ANIME", "CREATIVE", "ENVIRONMENT",
  "ILLUSTRATION", "RAYTRACED", "RENDER_3D", "SKETCH_BW", "SKETCH_COLOR",
  "CINEMATIC", "CINEMATIC_CLOSEUP", "FASHION", "FILM", "HDR",
  "LONG_EXPOSURE", "MACRO", "MINIMALISTIC", "MONOCHROME", "MOODY",
  "PORTRAIT", "RETRO", "STOCK_PHOTO", "VIBRANT", "NONE",
];

const SD_VERSIONS = [
  "PHOENIX", "FLUX", "FLUX_DEV", "KINO_2_0",
  "SDXL_1_0", "SDXL_LIGHTNING", "v1_5", "v2",
];

// ── Motion Control UUIDs (Motion 2.0) ──
const MOTION_CONTROLS: Record<string, string> = {
  "dolly_in":        "ece8c6a9-3deb-430e-8c93-4d5061b6adbf",
  "dolly_out":       "772cb36a-7d18-4250-b4aa-0c3f1a8431a0",
  "dolly_left":      "f507880a-3fa8-4c3a-96bb-3ce3b70ac53b",
  "dolly_right":     "587a0109-30be-4781-a18e-e353b580fd10",
  "orbit_left":      "74bea0cc-9942-4d45-9977-28c25078bfd4",
  "orbit_right":     "aec24e36-a2e8-4fae-920c-127d276bbe4b",
  "crane_up":        "c765bd57-cdc5-4317-a600-69a8bd6c4ce6",
  "crane_down":      "5a1d2a6a-7709-4097-9158-1b7ae6c9e647",
  "tilt_up":         "6ad6de1f-bd15-4d0b-ae0e-81d1a4c6c085",
  "tilt_down":       "a1923b1b-854a-46a1-9e26-07c435098b87",
  "crash_zoom_in":   "b0191ad1-a723-439c-a4bc-a3f5d5884db3",
  "crash_zoom_out":  "1975ac74-92ca-46b3-81b3-6f191a9ae438",
  "super_dolly_in":  "a3992d78-34fc-44c6-b157-e2755d905197",
  "super_dolly_out": "906b93f2-beb3-42be-9283-92236cc90ed6",
  "bullet_time":     "fbed015e-594e-4f78-b4be-3b07142aaa1e",
  "handheld":        "75722d13-108f-4cea-9471-cb7e5fc049fe",
  "medium_zoom_in":  "f46d8e7f-e0ca-4f6a-90ab-141d731f47ae",
  "crane_overhead":  "1054d533-168c-4821-bd3d-a56182afa4f3",
};

// ── Key Rotation with credit reservation ──
async function getNextKey(adminClient: any, estimatedCost: number = 0): Promise<{ id: string; api_key: string; remaining_credits: number } | null> {
  // Reset daily counters for keys whose last_reset_date is before today
  await adminClient
    .from("leonardo_keys")
    .update({ uses_today: 0, last_reset_date: new Date().toISOString().split("T")[0] })
    .eq("is_active", true)
    .lt("last_reset_date", new Date().toISOString().split("T")[0]);

  const { data, error } = await adminClient
    .from("leonardo_keys")
    .select("id, api_key, remaining_credits, reserved_credits, daily_limit, uses_today")
    .eq("is_active", true)
    .order("remaining_credits", { ascending: false });

  if (error || !data || data.length === 0) return null;

  // Find first key with enough available credits and within daily limit
  for (const key of data) {
    const available = key.remaining_credits - key.reserved_credits;
    const withinDailyLimit = key.daily_limit === null || key.uses_today < key.daily_limit;
    if (available > estimatedCost && withinDailyLimit) {
      return { id: key.id, api_key: key.api_key, remaining_credits: key.remaining_credits };
    }
  }
  return null;
}

// ── Reserve credits before API call ──
async function reserveCredits(adminClient: any, keyId: string, cost: number) {
  await adminClient.rpc("", {}).catch(() => {}); // no-op fallback
  // Use raw update with increment
  const { data: key } = await adminClient.from("leonardo_keys").select("reserved_credits").eq("id", keyId).single();
  if (key) {
    await adminClient.from("leonardo_keys").update({ reserved_credits: key.reserved_credits + cost }).eq("id", keyId);
  }
}

// ── Settle credits after API call ──
async function settleCredits(adminClient: any, keyId: string, cost: number, success: boolean) {
  const { data: key } = await adminClient.from("leonardo_keys").select("reserved_credits, remaining_credits, total_uses").eq("id", keyId).single();
  if (!key) return;

  const update: Record<string, any> = {
    reserved_credits: Math.max(0, key.reserved_credits - cost),
  };
  if (success) {
    update.remaining_credits = Math.max(0, key.remaining_credits - cost);
    update.total_uses = (key.total_uses || 0) + 1;
    update.last_used_at = new Date().toISOString();
    update.uses_today = (key as any).uses_today ? (key as any).uses_today + 1 : 1;
  }
  await adminClient.from("leonardo_keys").update(update).eq("id", keyId);
}

// ── Leonardo API helpers ──
async function leonardoPost(path: string, apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEONARDO_BASE}${path}`, {
    method: "POST",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function leonardoPostV2(path: string, apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEONARDO_BASE_V2}${path}`, {
    method: "POST",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo API v2 error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function leonardoGet(path: string, apiKey: string) {
  const res = await fetch(`${LEONARDO_BASE}${path}`, {
    method: "GET",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Image Generation ──
async function generateImage(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = {
    prompt,
    num_images: options.num_images || 1,
    width: options.width || 1024,
    height: options.height || 1024,
    alchemy: options.alchemy !== false,
    presetStyle: options.presetStyle || "DYNAMIC",
  };
  if (options.modelId) { body.modelId = options.modelId; }
  else { body.sd_version = options.sd_version || "PHOENIX"; }
  if (options.negative_prompt) body.negative_prompt = options.negative_prompt;
  if (options.guidance_scale) body.guidance_scale = options.guidance_scale;
  if (options.seed) body.seed = options.seed;
  if (options.contrast) body.contrast = options.contrast;
  if (options.enhancePrompt) body.enhancePrompt = options.enhancePrompt;
  if (options.transparency) body.transparency = options.transparency;
  if (options.photoReal) { body.photoReal = true; body.photoRealVersion = options.photoRealVersion || "v2"; }

  const result = await leonardoPost("/generations", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── V2 Model ID mapping ──
const V2_MODEL_IDS: Record<string, string> = {
  "KLING2_6":         "kling-2.6",
  "KLING_VIDEO_3_0":  "kling-video-3-0",
  "KLING_O3_OMNI":    "kling-video-o-3-omni",
  "KLING_O1":         "kling-video-o-1",
  "HAILUO_2_3":       "hailuo-2-3",
  "HAILUO_2_3_FAST":  "hailuo-2-3-fast",
};

// ── Generic V2 Video Generation (Kling 2.6, 3.0, O3 Omni, O1, Hailuo) ──
async function generateVideoV2(apiKey: string, modelInternal: string, prompt: string, options: Record<string, unknown> = {}) {
  const apiModelId = V2_MODEL_IDS[modelInternal];
  if (!apiModelId) throw new Error(`Model ${modelInternal} not found in V2_MODEL_IDS`);
  const modelSpec = VIDEO_MODELS[modelInternal];

  const aspect = (options.aspect_ratio as string) || "9:16";
  const dims = KLING_DIMENSIONS[aspect] || KLING_DIMENSIONS["9:16"];
  const duration = options.duration || 5;

  const parameters: Record<string, unknown> = {
    prompt,
    duration,
    width: dims.width,
    height: dims.height,
  };

  const guidances: Record<string, unknown> = {};

  // Start frame (not allowed alongside image_reference)
  if (options.imageId && !options.imageRefs) {
    guidances.start_frame = [{
      image: { id: options.imageId, type: options.imageType || "GENERATED" },
    }];
  }

  // End frame (Kling 3.0, O3 Omni, O1)
  if (options.endFrameImageId && modelSpec?.supportsEndFrame) {
    guidances.end_frame = [{
      image: { id: options.endFrameImageId, type: options.endFrameImageType || "GENERATED" },
    }];
  }

  // Image reference (O3 Omni, O1 — up to 5 images, mutually exclusive with start/end frame)
  if (options.imageRefs && modelSpec?.supportsImageRef) {
    const refs = options.imageRefs as Array<{ id: string; type?: string }>;
    guidances.image_reference = refs.map(ref => ({
      image: { id: ref.id, type: ref.type || "GENERATED" },
    }));
    // Remove start/end frame if image_reference is used (API restriction)
    delete guidances.start_frame;
    delete guidances.end_frame;
  }

  // Video reference (O3 Omni only)
  if (options.videoRef && modelSpec?.supportsVideoRef) {
    const vRef = options.videoRef as { id: string; type?: string };
    guidances.video_reference = [{
      video: { id: vRef.id, type: vRef.type || "GENERATED" },
    }];
  }

  if (Object.keys(guidances).length > 0) parameters.guidances = guidances;

  const body = { model: apiModelId, public: false, parameters };
  console.log(`[V2] Generating with model ${apiModelId} (${modelInternal}):`, JSON.stringify(body));
  const result = await leonardoPostV2("/generations", apiKey, body);
  return result?.sdGenerationJob?.generationId || result?.generationId || null;
}

// ── Video from Image (v1 — Veo, Kling 2.5, Kling 2.1 | v2 — Kling 2.6/3.0/O3/O1, Hailuo) ──
async function generateVideoFromImage(apiKey: string, imageId: string, prompt: string, options: Record<string, unknown> = {}) {
  const model = (options.model as string) || "VEO3_1";

  // Route v2 models to generateVideoV2
  if (VIDEO_MODELS[model]?.apiVersion === "v2") {
    return generateVideoV2(apiKey, model, prompt, { ...options, imageId });
  }

  const body: Record<string, unknown> = { imageId, imageType: options.imageType || "GENERATED", prompt, model };

  if (model === "KLING2_5" || model === "KLING2_1") {
    const aspect = (options.aspect_ratio as string) || "9:16";
    const dims = KLING_DIMENSIONS[aspect] || KLING_DIMENSIONS["9:16"];
    body.width = dims.width;
    body.height = dims.height;
    body.duration = options.duration || 5;
    body.resolution = "RESOLUTION_1080";

    // End frame (Kling 2.1 Pro only)
    if (options.endFrameImageId && model === "KLING2_1") {
      body.endFrameImage = { id: options.endFrameImageId, type: options.endFrameImageType || "GENERATED" };
    }
  } else if (model === "VEO3_1" || model === "VEO3_1FAST" || model === "VEO3" || model === "VEO3FAST") {
    body.resolution = options.resolution || "RESOLUTION_720";
    body.duration = options.duration || 8;
    if (body.resolution === "RESOLUTION_1080") { body.width = 1920; body.height = 1080; }
    else { body.width = 1280; body.height = 720; }

    // End frame (Veo 3.1 only, forces 8s)
    if (options.endFrameImageId && (model === "VEO3_1" || model === "VEO3_1FAST")) {
      body.endFrameImage = { id: options.endFrameImageId, type: options.endFrameImageType || "GENERATED" };
      body.duration = 8;
    }
  } else {
    // Motion 2.0
    body.resolution = options.resolution || "RESOLUTION_720";
    if (options.frameInterpolation !== undefined) body.frameInterpolation = options.frameInterpolation;
    if (options.promptEnhance !== undefined) body.promptEnhance = options.promptEnhance;
    if (options.motionControl) {
      const akUUID = MOTION_CONTROLS[options.motionControl as string];
      if (akUUID) body.elements = [{ akUUID, weight: options.motionWeight || 1 }];
    }
  }

  const result = await leonardoPost("/generations-image-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Video from Text (v1 — Veo, Kling 2.5 | v2 — Kling 2.6/3.0/O3/O1, Hailuo) ──
async function generateVideoFromText(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const model = (options.model as string) || "VEO3_1";

  // Route v2 models to generateVideoV2
  if (VIDEO_MODELS[model]?.apiVersion === "v2") {
    return generateVideoV2(apiKey, model, prompt, options);
  }

  // Kling 2.1 Pro requires start frame — reject text-to-video
  if (model === "KLING2_1") {
    throw new Error("Kling 2.1 Pro requer start frame (imagem). Use generate_video_from_image.");
  }

  const body: Record<string, unknown> = { prompt, model };

  if (model === "KLING2_5") {
    const aspect = (options.aspect_ratio as string) || "9:16";
    const dims = KLING_DIMENSIONS[aspect] || KLING_DIMENSIONS["9:16"];
    body.width = dims.width;
    body.height = dims.height;
    body.duration = options.duration || 5;
    body.resolution = "RESOLUTION_1080";
  } else {
    body.resolution = options.resolution || "RESOLUTION_720";
    body.duration = options.duration || 8;
  }

  const result = await leonardoPost("/generations-text-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Calculate credit cost ──
function calculateCreditCost(action: string, options: Record<string, unknown> = {}): number {
  if (action === "generate_image") return 24;
  if (action === "generate_video_from_image" || action === "generate_video_from_text" || action === "extend_video") {
    const model = (options.model as string) || "VEO3_1";
    const duration = (options.duration as number) || 8;
    return VIDEO_COSTS[model]?.[duration] || 1000;
  }
  return 0;
}

// ── Sync credits from Leonardo API ──
async function syncKeyCredits(apiKey: string): Promise<number> {
  const res = await fetch(`${LEONARDO_BASE}/me`, {
    method: "GET",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo /me error ${res.status}: ${JSON.stringify(data)}`);
  const details = data?.user_details?.[0];
  if (!details) throw new Error("Could not read user_details from Leonardo /me");
  return (details.apiPaidTokens || 0) + (details.apiSubscriptionTokens || 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = user.id;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, prompt, options = {}, job_id, script_id, scene_index = 0 } = body;

    let result: any = null;

    switch (action) {
      // ── Generate Image ──
      case "generate_image": {
        const creditCost = calculateCreditCost("generate_image", options);
        const keyData = await getNextKey(adminClient, creditCost);
        if (!keyData) return new Response(JSON.stringify({ error: "Nenhuma API key disponível com créditos suficientes." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        await reserveCredits(adminClient, keyData.id, creditCost);
        try {
          const generationId = await generateImage(keyData.api_key, prompt, options);
          await settleCredits(adminClient, keyData.id, creditCost, true);
          await userClient.from("generation_jobs").insert({
            user_id: userId, script_id: script_id || null, scene_index, job_type: options.job_type || "character_sheet",
            status: "processing", leonardo_generation_id: generationId, leonardo_key_id: keyData.id, prompt,
            engine: options.sd_version || "PHOENIX", credit_cost: creditCost,
          });
          result = { generationId, status: "processing", message: "Imagem sendo gerada...", credit_cost: creditCost };
        } catch (e) {
          await settleCredits(adminClient, keyData.id, creditCost, false);
          throw e;
        }
        break;
      }

      // ── Generate Video from Image ──
      case "generate_video_from_image": {
        const model = options.model || "VEO3_1";
        const creditCost = calculateCreditCost("generate_video_from_image", options);
        const keyData = await getNextKey(adminClient, creditCost);
        if (!keyData) return new Response(JSON.stringify({ error: "Nenhuma API key disponível com créditos suficientes." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        await reserveCredits(adminClient, keyData.id, creditCost);
        try {
          const generationId = await generateVideoFromImage(keyData.api_key, options.imageId, prompt, options);
          await settleCredits(adminClient, keyData.id, creditCost, true);
          await userClient.from("generation_jobs").insert({
            user_id: userId, script_id: script_id || null, scene_index, job_type: options.job_type || "video",
            status: "processing", leonardo_generation_id: generationId, leonardo_key_id: keyData.id, prompt,
            engine: model, credit_cost: creditCost,
          });
          result = { generationId, status: "processing", message: "Vídeo sendo gerado...", credit_cost: creditCost };
        } catch (e) {
          await settleCredits(adminClient, keyData.id, creditCost, false);
          throw e;
        }
        break;
      }

      // ── Generate Video from Text ──
      case "generate_video_from_text": {
        const model = options.model || "VEO3_1";
        const creditCost = calculateCreditCost("generate_video_from_text", options);
        const keyData = await getNextKey(adminClient, creditCost);
        if (!keyData) return new Response(JSON.stringify({ error: "Nenhuma API key disponível com créditos suficientes." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        await reserveCredits(adminClient, keyData.id, creditCost);
        try {
          const generationId = await generateVideoFromText(keyData.api_key, prompt, options);
          await settleCredits(adminClient, keyData.id, creditCost, true);
          await userClient.from("generation_jobs").insert({
            user_id: userId, script_id: script_id || null, scene_index, job_type: options.job_type || "video",
            status: "processing", leonardo_generation_id: generationId, leonardo_key_id: keyData.id, prompt,
            engine: model, credit_cost: creditCost,
          });
          result = { generationId, status: "processing", message: "Vídeo sendo gerado...", credit_cost: creditCost };
        } catch (e) {
          await settleCredits(adminClient, keyData.id, creditCost, false);
          throw e;
        }
        break;
      }

      // ── Extend Video ──
      case "extend_video": {
        const { source_job_id, extend_mode, end_frame_image_id } = body;
        if (!source_job_id) throw new Error("source_job_id required");
        if (!extend_mode) throw new Error("extend_mode required (last_frame | start_end_frame | direct)");

        const model = options.model || "VEO3_1";
        const creditCost = calculateCreditCost("extend_video", { ...options, model });
        const keyData = await getNextKey(adminClient, creditCost);
        if (!keyData) return new Response(JSON.stringify({ error: "Nenhuma API key disponível com créditos suficientes." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        // Fetch source job to get frame reference
        const { data: sourceJob } = await userClient.from("generation_jobs").select("*").eq("id", source_job_id).single();
        if (!sourceJob) throw new Error("Job de origem não encontrado");

        let generationId: string | null = null;
        let sourceFrameId: string | null = null;

        await reserveCredits(adminClient, keyData.id, creditCost);
        try {
          if (extend_mode === "last_frame") {
            // Extract imageId from source job's result_metadata
            const raw = (sourceJob.result_metadata as any)?.raw;
            const frameId = raw?.generated_images?.[0]?.id;
            if (!frameId) throw new Error("Não foi possível extrair frame do vídeo anterior. Verifique se o job completou.");
            sourceFrameId = frameId;
            generationId = await generateVideoFromImage(keyData.api_key, frameId, prompt, { ...options, model, imageType: "GENERATED" });
          } else if (extend_mode === "start_end_frame") {
            const raw = (sourceJob.result_metadata as any)?.raw;
            const startFrameId = raw?.generated_images?.[0]?.id;
            if (!startFrameId) throw new Error("Não foi possível extrair start frame do vídeo anterior.");
            sourceFrameId = startFrameId;
            generationId = await generateVideoFromImage(keyData.api_key, startFrameId, prompt, {
              ...options, model, imageType: "GENERATED",
              endFrameImageId: end_frame_image_id, endFrameImageType: "GENERATED",
            });
          } else {
            // direct — new text-to-video
            generationId = await generateVideoFromText(keyData.api_key, prompt, { ...options, model });
          }

          await settleCredits(adminClient, keyData.id, creditCost, true);
          await userClient.from("generation_jobs").insert({
            user_id: userId, script_id: script_id || null, scene_index, job_type: "video_extend",
            status: "processing", leonardo_generation_id: generationId, leonardo_key_id: keyData.id, prompt,
            engine: model, credit_cost: creditCost, parent_job_id: source_job_id,
            extend_mode, source_frame_id: sourceFrameId,
          });
          result = { generationId, status: "processing", message: "Extensão de vídeo sendo gerada...", credit_cost: creditCost, extend_mode };
        } catch (e) {
          await settleCredits(adminClient, keyData.id, creditCost, false);
          throw e;
        }
        break;
      }

      // ── Check Status ──
      case "check_status": {
        if (!body.generation_id) throw new Error("generation_id required");
        // check_status doesn't consume credits — use any active key
        const { data: anyActiveKey } = await adminClient
          .from("leonardo_keys")
          .select("api_key")
          .eq("is_active", true)
          .limit(1)
          .single();
        if (!anyActiveKey) return new Response(JSON.stringify({ error: "Nenhuma API key ativa." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const keyData = { api_key: anyActiveKey.api_key };

        const gen = await leonardoGet(`/generations/${body.generation_id}`, keyData.api_key);
        const genData = gen?.generations_by_pk;

        if (genData?.status === "COMPLETE") {
          const images = genData.generated_images || [];
          const urls = images.map((img: any) => img.url).filter(Boolean);
          const videoUrls = images.map((img: any) => img.motionMP4URL).filter(Boolean);
          if (job_id) {
            await userClient.from("generation_jobs").update({
              status: "completed", result_url: videoUrls[0] || urls[0] || null,
              result_metadata: { urls, videoUrls, raw: genData },
            }).eq("id", job_id);
          }
          result = { status: "completed", urls, videoUrls, raw: genData };
        } else if (genData?.status === "FAILED") {
          if (job_id) {
            await userClient.from("generation_jobs").update({ status: "failed", error_message: "Generation failed on Leonardo" }).eq("id", job_id);
          }
          result = { status: "failed" };
        } else {
          result = { status: "processing" };
        }
        break;
      }

      // ── Estimate Cost ──
      case "estimate_cost": {
        const model = options.model || "VEO3_1";
        const duration = options.duration || 8;
        const cost = calculateCreditCost(body.estimate_action || "generate_video_from_text", { model, duration });
        const modelInfo = VIDEO_MODELS[model];
        result = { estimated_cost: cost, model, model_label: modelInfo?.label || model, duration, api_version: modelInfo?.apiVersion || "v1" };
        break;
      }

      // ── List Keys ──
      case "list_keys": {
        const { data: keys } = await adminClient
          .from("leonardo_keys")
          .select("id, label, is_active, remaining_credits, reserved_credits, total_uses, last_used_at, daily_limit, uses_today, notes, created_at")
          .order("label");
        result = { keys };
        break;
      }

      // ── Add Key ──
      case "add_key": {
        const { api_key, label, notes } = body;
        if (!api_key) throw new Error("api_key required");
        // Try to sync credits immediately
        let credits = 2500;
        try { credits = await syncKeyCredits(api_key); } catch (_e) { /* use default */ }
        const { data: newKey, error: insertErr } = await adminClient.from("leonardo_keys").insert({
          api_key, label: label || null, notes: notes || "", remaining_credits: credits,
        }).select("id, label, remaining_credits").single();
        if (insertErr) throw new Error(`Erro ao adicionar key: ${insertErr.message}`);
        result = { key: newKey, message: "Key adicionada com sucesso" };
        break;
      }

      // ── Remove Key ──
      case "remove_key": {
        const { key_id } = body;
        if (!key_id) throw new Error("key_id required");
        await adminClient.from("leonardo_keys").update({ is_active: false }).eq("id", key_id);
        result = { message: "Key desativada" };
        break;
      }

      // ── Update Key ──
      case "update_key": {
        const { key_id: updateKeyId, label: updateLabel, daily_limit: updateLimit, notes: updateNotes, is_active: updateActive } = body;
        if (!updateKeyId) throw new Error("key_id required");
        const updateData: Record<string, any> = {};
        if (updateLabel !== undefined) updateData.label = updateLabel;
        if (updateLimit !== undefined) updateData.daily_limit = updateLimit;
        if (updateNotes !== undefined) updateData.notes = updateNotes;
        if (updateActive !== undefined) updateData.is_active = updateActive;
        await adminClient.from("leonardo_keys").update(updateData).eq("id", updateKeyId);
        result = { message: "Key atualizada" };
        break;
      }

      // ── Sync Credits (single key) ──
      case "sync_credits": {
        const { key_id: syncKeyId } = body;
        if (!syncKeyId) throw new Error("key_id required");
        const { data: keyRow } = await adminClient.from("leonardo_keys").select("api_key").eq("id", syncKeyId).single();
        if (!keyRow) throw new Error("Key não encontrada");
        const credits = await syncKeyCredits(keyRow.api_key);
        await adminClient.from("leonardo_keys").update({ remaining_credits: credits }).eq("id", syncKeyId);
        result = { credits, message: "Créditos sincronizados" };
        break;
      }

      // ── Sync All Credits ──
      case "sync_all_credits": {
        const { data: allKeys } = await adminClient.from("leonardo_keys").select("id, api_key").eq("is_active", true);
        const results: any[] = [];
        for (const k of allKeys || []) {
          try {
            const credits = await syncKeyCredits(k.api_key);
            await adminClient.from("leonardo_keys").update({ remaining_credits: credits }).eq("id", k.id);
            results.push({ id: k.id, credits, status: "ok" });
          } catch (e) {
            results.push({ id: k.id, status: "error", error: e instanceof Error ? e.message : "unknown" });
          }
        }
        result = { synced: results, message: `${results.filter(r => r.status === "ok").length}/${results.length} keys sincronizadas` };
        break;
      }

      // ── Get Models Info ──
      case "get_models_info": {
        result = {
          image: { sd_versions: SD_VERSIONS, preset_styles: IMAGE_PRESET_STYLES, default_model_id: "b24e16ff-06e3-43eb-8d33-4416c2d75876" },
          video: { models: VIDEO_MODELS, costs: VIDEO_COSTS, motion_controls: Object.keys(MOTION_CONTROLS) },
        };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("leonardo-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
