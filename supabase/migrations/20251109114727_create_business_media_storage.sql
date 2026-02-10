/*
  # Create Business Media Storage

  1. Storage Setup
    - Create `business-media` bucket for storing uploaded images and videos
    - Enable public access for media files
  
  2. Security
    - Allow authenticated business admins to upload files to their business folder
    - Allow public read access to all media files
    - Restrict uploads to image and video formats only
*/

-- Create storage bucket for business media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-media',
  'business-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business admins can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Business admins can update their media" ON storage.objects;
DROP POLICY IF EXISTS "Business admins can delete their media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view business media" ON storage.objects;

-- Policy: Allow authenticated users to upload to their business folder
CREATE POLICY "Business admins can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-media' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text
    FROM businesses b
    INNER JOIN business_admins ba ON b.id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Allow authenticated users to update their business media
CREATE POLICY "Business admins can update their media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-media' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text
    FROM businesses b
    INNER JOIN business_admins ba ON b.id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Allow authenticated users to delete their business media
CREATE POLICY "Business admins can delete their media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-media' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text
    FROM businesses b
    INNER JOIN business_admins ba ON b.id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Allow public read access to all media
CREATE POLICY "Public can view business media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'business-media');