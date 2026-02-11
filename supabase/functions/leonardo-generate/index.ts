import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";

// ── Modelos de vídeo disponíveis na API ──
const VIDEO_MODELS = {
  "VEO3_1": { label: "Veo 3.1", durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"] },
  "VEO3_1FAST": { label: "Veo 3.1 Fast", durations: [4, 6, 8], resolutions: ["RESOLUTION_720", "RESOLUTION_1080"] },
  "MOTION2": { label: "Motion 2.0", durations: [], resolutions: ["RESOLUTION_480", "RESOLUTION_720"] },
};

// ── Custos em API Credits (da documentação oficial) ──
const VIDEO_COSTS: Record<string, Record<number, number>> = {
  "VEO3_1":     { 4: 1070, 6: 1605, 8: 2140 },
  "VEO3_1FAST": { 4: 546,  6: 819,  8: 1092 },
  "MOTION2":    { 4: 100,  6: 100,  8: 100 },  // estimativa Motion 2
};

// ── Estilos de imagem disponíveis ──
const IMAGE_PRESET_STYLES = [
  "DYNAMIC", "PHOTOGRAPHY", "ANIME", "CREATIVE", "ENVIRONMENT",
  "ILLUSTRATION", "RAYTRACED", "RENDER_3D", "SKETCH_BW", "SKETCH_COLOR",
  "CINEMATIC", "CINEMATIC_CLOSEUP", "FASHION", "FILM", "HDR",
  "LONG_EXPOSURE", "MACRO", "MINIMALISTIC", "MONOCHROME", "MOODY",
  "PORTRAIT", "RETRO", "STOCK_PHOTO", "VIBRANT", "NONE",
];

// ── sd_version válidos para geração de imagem ──
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

// ── Key Rotation: pick active key with most remaining credits ──
async function getNextKey(adminClient: any): Promise<{ id: string; api_key: string } | null> {
  const { data, error } = await adminClient
    .from("leonardo_keys")
    .select("id, api_key, remaining_credits")
    .eq("is_active", true)
    .gt("remaining_credits", 0)
    .order("remaining_credits", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return { id: data.id, api_key: data.api_key };
}

// ── Leonardo API helpers ──
async function leonardoPost(path: string, apiKey: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEONARDO_BASE}${path}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function leonardoGet(path: string, apiKey: string) {
  const res = await fetch(`${LEONARDO_BASE}${path}`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Leonardo API error ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Image Generation ──
// POST /generations
// sd_version: PHOENIX | FLUX | FLUX_DEV | KINO_2_0 | SDXL_1_0 | etc.
// presetStyle: DYNAMIC | PHOTOGRAPHY | ANIME | CINEMATIC | etc.
async function generateImage(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = {
    prompt,
    num_images: options.num_images || 1,
    width: options.width || 1024,
    height: options.height || 1024,
    alchemy: options.alchemy !== false, // default true
    presetStyle: options.presetStyle || "DYNAMIC",
  };

  // sd_version OU modelId (não ambos)
  if (options.modelId) {
    body.modelId = options.modelId;
  } else {
    body.sd_version = options.sd_version || "PHOENIX";
  }

  // Parâmetros opcionais
  if (options.negative_prompt) body.negative_prompt = options.negative_prompt;
  if (options.guidance_scale) body.guidance_scale = options.guidance_scale;
  if (options.seed) body.seed = options.seed;
  if (options.contrast) body.contrast = options.contrast;
  if (options.enhancePrompt) body.enhancePrompt = options.enhancePrompt;
  if (options.transparency) body.transparency = options.transparency;
  if (options.photoReal) {
    body.photoReal = true;
    body.photoRealVersion = options.photoRealVersion || "v2";
  }

  const result = await leonardoPost("/generations", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Video from Image ──
// POST /generations-image-to-video
// model: VEO3_1 | VEO3_1FAST | MOTION2 (ou omitir para Motion 2)
// imageType: GENERATED | UPLOADED
// duration: 4 | 6 | 8 (seconds)
// resolution: RESOLUTION_480 | RESOLUTION_720 | RESOLUTION_1080
async function generateVideoFromImage(
  apiKey: string,
  imageId: string,
  prompt: string,
  options: Record<string, unknown> = {}
) {
  const model = options.model || "VEO3_1";
  const body: Record<string, unknown> = {
    imageId,
    imageType: options.imageType || "GENERATED",
    prompt,
    model,
  };

  // Resolução e duração
  if (model === "VEO3_1" || model === "VEO3_1FAST") {
    body.resolution = options.resolution || "RESOLUTION_720";
    body.duration = options.duration || 8;
    // Dimensões padrão para 720p 16:9
    if (body.resolution === "RESOLUTION_1080") {
      body.width = 1920;
      body.height = 1080;
    } else {
      body.width = 1280;
      body.height = 720;
    }
  } else {
    // Motion 2.0
    body.resolution = options.resolution || "RESOLUTION_720";
    if (options.frameInterpolation !== undefined) body.frameInterpolation = options.frameInterpolation;
    if (options.promptEnhance !== undefined) body.promptEnhance = options.promptEnhance;
  }

  // End frame (Veo 3.1 only, força duration = 8)
  if (options.endFrameImageId && (model === "VEO3_1" || model === "VEO3_1FAST")) {
    body.endFrameImage = {
      id: options.endFrameImageId,
      type: options.endFrameImageType || "GENERATED",
    };
    body.duration = 8; // end frame requer 8s
  }

  // Motion control elements (Motion 2.0 only)
  if (options.motionControl && model === "MOTION2") {
    const controlName = options.motionControl as string;
    const akUUID = MOTION_CONTROLS[controlName];
    if (akUUID) {
      body.elements = [{ akUUID, weight: options.motionWeight || 1 }];
    }
  }

  const result = await leonardoPost("/generations-image-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Video from Text ──
// POST /generations-text-to-video
// Mesmos parâmetros de model/duration/resolution
async function generateVideoFromText(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const model = options.model || "VEO3_1";
  const body: Record<string, unknown> = {
    prompt,
    model,
  };

  if (model === "VEO3_1" || model === "VEO3_1FAST") {
    body.resolution = options.resolution || "RESOLUTION_720";
    body.duration = options.duration || 8;
  } else {
    body.resolution = options.resolution || "RESOLUTION_720";
  }

  const result = await leonardoPost("/generations-text-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Calculate credit cost ──
function calculateCreditCost(action: string, options: Record<string, unknown> = {}): number {
  if (action === "generate_image") {
    // Imagem: ~24 credits para Phoenix/Flux com alchemy
    return 24;
  }
  if (action === "generate_video_from_image" || action === "generate_video_from_text") {
    const model = (options.model as string) || "VEO3_1";
    const duration = (options.duration as number) || 8;
    return VIDEO_COSTS[model]?.[duration] || 1000;
  }
  return 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client (for RLS)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Admin client (for key rotation — bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, prompt, options = {}, job_id, script_id, scene_index = 0 } = body;

    // ── Get API key via rotation ──
    const keyData = await getNextKey(adminClient);
    if (!keyData) {
      return new Response(
        JSON.stringify({ error: "Nenhuma API key do Leonardo.ai disponível. Adicione mais keys." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any = null;
    let creditCost = 0;

    switch (action) {
      case "generate_image": {
        const jobType = options.job_type || "character_sheet";
        const engine = options.sd_version || "PHOENIX";
        creditCost = calculateCreditCost("generate_image", options);
        const generationId = await generateImage(keyData.api_key, prompt, options);

        await userClient.from("generation_jobs").insert({
          user_id: userId,
          script_id: script_id || null,
          scene_index,
          job_type: jobType,
          status: "processing",
          leonardo_generation_id: generationId,
          leonardo_key_id: keyData.id,
          prompt,
          engine,
        });

        result = { generationId, status: "processing", message: "Imagem sendo gerada..." };
        break;
      }

      case "generate_video_from_image": {
        const model = options.model || "VEO3_1";
        const jobType = options.job_type || "video";
        creditCost = calculateCreditCost("generate_video_from_image", options);
        const generationId = await generateVideoFromImage(keyData.api_key, options.imageId, prompt, options);

        await userClient.from("generation_jobs").insert({
          user_id: userId,
          script_id: script_id || null,
          scene_index,
          job_type: jobType,
          status: "processing",
          leonardo_generation_id: generationId,
          leonardo_key_id: keyData.id,
          prompt,
          engine: model,
        });

        result = { generationId, status: "processing", message: "Vídeo sendo gerado..." };
        break;
      }

      case "generate_video_from_text": {
        const model = options.model || "VEO3_1";
        const jobType = options.job_type || "video";
        creditCost = calculateCreditCost("generate_video_from_text", options);
        const generationId = await generateVideoFromText(keyData.api_key, prompt, options);

        await userClient.from("generation_jobs").insert({
          user_id: userId,
          script_id: script_id || null,
          scene_index,
          job_type: jobType,
          status: "processing",
          leonardo_generation_id: generationId,
          leonardo_key_id: keyData.id,
          prompt,
          engine: model,
        });

        result = { generationId, status: "processing", message: "Vídeo sendo gerado..." };
        break;
      }

      case "check_status": {
        if (!body.generation_id) throw new Error("generation_id required");
        const gen = await leonardoGet(`/generations/${body.generation_id}`, keyData.api_key);
        const genData = gen?.generations_by_pk;

        if (genData?.status === "COMPLETE") {
          // Imagens vêm em generated_images, vídeos podem ter motionMP4URL
          const images = genData.generated_images || [];
          const urls = images.map((img: any) => img.url).filter(Boolean);
          const videoUrls = images.map((img: any) => img.motionMP4URL).filter(Boolean);

          if (job_id) {
            await userClient
              .from("generation_jobs")
              .update({
                status: "completed",
                result_url: videoUrls[0] || urls[0] || null,
                result_metadata: { urls, videoUrls, raw: genData },
              })
              .eq("id", job_id);
          }
          result = { status: "completed", urls, videoUrls, raw: genData };
        } else if (genData?.status === "FAILED") {
          if (job_id) {
            await userClient
              .from("generation_jobs")
              .update({ status: "failed", error_message: "Generation failed on Leonardo" })
              .eq("id", job_id);
          }
          result = { status: "failed" };
        } else {
          result = { status: "processing" };
        }
        creditCost = 0;
        break;
      }

      case "list_keys": {
        const { data: keys } = await adminClient
          .from("leonardo_keys")
          .select("id, label, is_active, remaining_credits, total_uses, last_used_at")
          .order("label");
        result = { keys };
        creditCost = 0;
        break;
      }

      case "get_models_info": {
        result = {
          image: {
            sd_versions: SD_VERSIONS,
            preset_styles: IMAGE_PRESET_STYLES,
            default_model_id: "b24e16ff-06e3-43eb-8d33-4416c2d75876",
          },
          video: {
            models: VIDEO_MODELS,
            costs: VIDEO_COSTS,
            motion_controls: Object.keys(MOTION_CONTROLS),
          },
        };
        creditCost = 0;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Record key usage
    if (creditCost > 0) {
      await adminClient
        .from("leonardo_keys")
        .update({
          remaining_credits: Math.max(0, (keyData as any).remaining_credits - creditCost),
          total_uses: ((keyData as any).total_uses || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", keyData.id)
        .then(() => {});
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("leonardo-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
