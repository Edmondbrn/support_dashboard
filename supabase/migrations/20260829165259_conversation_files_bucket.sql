
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  5242880, -- 5 MB
  array['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
);



CREATE POLICY "participants can read their discussion files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = (storage.foldername(name))[1]::uuid -- check if the file prefix is equals to the ticket ID
      AND (t.client_id = auth.uid() OR t.agent_id = auth.uid())
  )
);

CREATE POLICY "Participants can delete their discussion files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = ((storage.foldername(name))[1])::uuid
      AND (
        (NOT public.is_agent() AND t.client_id = auth.uid()) 
        OR (public.is_agent() AND t.agent_id = auth.uid())
      )
  )
);

CREATE POLICY "participants can upload to their discussion"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.tickets t
    WHERE t.id = (storage.foldername(name))[1]::uuid -- check if the file prefix is equals to the ticket ID
      AND (t.client_id = auth.uid() OR t.agent_id = auth.uid())
  )
);