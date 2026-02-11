ALTER TABLE public.scripts DROP CONSTRAINT scripts_type_check;
ALTER TABLE public.scripts ADD CONSTRAINT scripts_type_check 
  CHECK (type = ANY (ARRAY['video', 'commercial', 'prompt', 'director']));