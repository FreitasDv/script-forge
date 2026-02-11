
-- Tabela para armazenar API keys do Leonardo.ai com rotação automática
CREATE TABLE public.leonardo_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key text NOT NULL,
  label text, -- ex: "Key #1", "Key #2"
  is_active boolean NOT NULL DEFAULT true,
  remaining_credits integer NOT NULL DEFAULT 2500, -- créditos estimados restantes
  total_uses integer NOT NULL DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: apenas service_role pode acessar (edge functions)
ALTER TABLE public.leonardo_keys ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública — somente service_role acessa via edge functions

-- Tabela para jobs de geração (imagens e vídeos)
CREATE TABLE public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  script_id uuid REFERENCES public.scripts(id) ON DELETE SET NULL,
  scene_index integer NOT NULL DEFAULT 0,
  job_type text NOT NULL CHECK (job_type IN ('character_sheet', 'reference_frame', 'video_veo', 'video_kling')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  leonardo_generation_id text, -- ID retornado pela API do Leonardo
  leonardo_key_id uuid REFERENCES public.leonardo_keys(id),
  prompt text NOT NULL,
  engine text, -- 'veo-3.1', 'kling-2.6', 'nano-banana', etc
  result_url text, -- URL da imagem/vídeo gerado
  result_metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation jobs"
  ON public.generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generation jobs"
  ON public.generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generation jobs"
  ON public.generation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_leonardo_keys_updated_at
  BEFORE UPDATE ON public.leonardo_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX idx_leonardo_keys_active ON public.leonardo_keys(is_active) WHERE is_active = true;
