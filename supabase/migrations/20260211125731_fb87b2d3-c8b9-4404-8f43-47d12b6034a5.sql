
-- leonardo_keys: campos de gestao avancada
ALTER TABLE public.leonardo_keys ADD COLUMN reserved_credits integer NOT NULL DEFAULT 0;
ALTER TABLE public.leonardo_keys ADD COLUMN daily_limit integer DEFAULT NULL;
ALTER TABLE public.leonardo_keys ADD COLUMN uses_today integer NOT NULL DEFAULT 0;
ALTER TABLE public.leonardo_keys ADD COLUMN last_reset_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.leonardo_keys ADD COLUMN notes text DEFAULT '';

-- generation_jobs: campos de extensao e rastreamento
ALTER TABLE public.generation_jobs ADD COLUMN parent_job_id uuid REFERENCES public.generation_jobs(id);
ALTER TABLE public.generation_jobs ADD COLUMN extend_mode text;
ALTER TABLE public.generation_jobs ADD COLUMN credit_cost integer DEFAULT 0;
ALTER TABLE public.generation_jobs ADD COLUMN source_frame_id text;
