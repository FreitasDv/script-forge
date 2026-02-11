import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";

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

async function recordKeyUsage(adminClient: any, keyId: string, creditCost: number) {
  await adminClient
    .from("leonardo_keys")
    .update({
      remaining_credits: adminClient.rpc ? undefined : undefined, // handled below
      total_uses: undefined,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", keyId);

  // Use raw SQL-like update via RPC or direct decrement
  await adminClient.rpc("decrement_key_credits", { key_id: keyId, cost: creditCost }).catch(() => {
    // Fallback: simple update
    adminClient
      .from("leonardo_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", keyId);
  });
}

// ── Leonardo API calls ──
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

// ── Image Generation (Nano Banana / Phoenix) ──
async function generateImage(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = {
    prompt,
    num_images: options.num_images || 1,
    width: options.width || 1024,
    height: options.height || 1024,
    modelId: options.modelId || null, // null = latest default
    alchemy: true,
    photoReal: false,
    ...options,
  };

  const result = await leonardoPost("/generations", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Video Generation (Image-to-Video) ──
async function generateVideoFromImage(
  apiKey: string,
  imageId: string,
  prompt: string,
  options: Record<string, unknown> = {}
) {
  const body: Record<string, unknown> = {
    imageId,
    prompt,
    ...options,
  };

  const result = await leonardoPost("/generations-image-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Text-to-Video ──
async function generateVideoFromText(apiKey: string, prompt: string, options: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = {
    prompt,
    ...options,
  };

  const result = await leonardoPost("/generations-text-to-video", apiKey, body);
  return result?.sdGenerationJob?.generationId || null;
}

// ── Poll generation status ──
async function pollGeneration(apiKey: string, generationId: string, maxAttempts = 30): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000)); // 5s between polls
    const result = await leonardoGet(`/generations/${generationId}`, apiKey);
    const gen = result?.generations_by_pk;
    if (!gen) continue;
    if (gen.status === "COMPLETE") return gen;
    if (gen.status === "FAILED") throw new Error(`Generation failed: ${gen.id}`);
  }
  throw new Error("Generation timed out");
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
    let jobType = "character_sheet";
    let engine = "nano-banana";
    let creditCost = 1;

    switch (action) {
      case "generate_image": {
        jobType = options.job_type || "character_sheet";
        engine = options.engine || "nano-banana";
        creditCost = 5;
        const generationId = await generateImage(keyData.api_key, prompt, options);

        // Create job record
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
        jobType = options.job_type || "video_veo";
        engine = options.engine || "veo-3.1";
        creditCost = 20;
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
          engine,
        });

        result = { generationId, status: "processing", message: "Vídeo sendo gerado..." };
        break;
      }

      case "generate_video_from_text": {
        jobType = options.job_type || "video_kling";
        engine = options.engine || "kling-2.6";
        creditCost = 15;
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
          engine,
        });

        result = { generationId, status: "processing", message: "Vídeo sendo gerado..." };
        break;
      }

      case "check_status": {
        if (!body.generation_id) throw new Error("generation_id required");
        const gen = await leonardoGet(`/generations/${body.generation_id}`, keyData.api_key);
        const genData = gen?.generations_by_pk;

        if (genData?.status === "COMPLETE") {
          const urls = genData.generated_images?.map((img: any) => img.url) || [];
          // Update job
          if (job_id) {
            await userClient
              .from("generation_jobs")
              .update({
                status: "completed",
                result_url: urls[0] || null,
                result_metadata: { urls, raw: genData },
              })
              .eq("id", job_id);
          }
          result = { status: "completed", urls, raw: genData };
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
        creditCost = 0; // checking status doesn't cost
        break;
      }

      case "list_keys": {
        // Return key stats (without actual keys)
        const { data: keys } = await adminClient
          .from("leonardo_keys")
          .select("id, label, is_active, remaining_credits, total_uses, last_used_at")
          .order("label");
        result = { keys };
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
