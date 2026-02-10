/*
  # Create Storage Policies for Business Logos

  1. Security Policies
    - Allow public read access to business logos (anyone can view)
    - Allow authenticated users to upload logos
    - Allow authenticated users to update logos
    - Allow authenticated users to delete logos
  
  2. Notes
    - Bucket 'business-logos' must be created first
    - Policies use DO blocks to avoid errors if they already exist
*/

-- Policy for viewing business logos (public access)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view business logos'
  ) THEN
    CREATE POLICY "Anyone can view business logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-logos');
  END IF;
END $$;

-- Policy for uploading business logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload business logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload business logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'business-logos');
  END IF;
END $$;

-- Policy for updating business logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update business logos'
  ) THEN
    CREATE POLICY "Authenticated users can update business logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'business-logos');
  END IF;
END $$;

-- Policy for deleting business logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete business logos'
  ) THEN
    CREATE POLICY "Authenticated users can delete business logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'business-logos');
  END IF;
END $$;