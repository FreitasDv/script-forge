CREATE POLICY "Users can delete own generation jobs"
ON public.generation_jobs FOR DELETE
USING (auth.uid() = user_id);