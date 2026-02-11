-- Storage bucket for generated media
INSERT INTO storage.buckets (id, name, public) VALUES ('generations', 'generations', true);

-- Public read access
CREATE POLICY "Public read access for generations"
ON storage.objects FOR SELECT
USING (bucket_id = 'generations');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generations' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'generations' AND auth.uid()::text = (storage.foldername(name))[1]);