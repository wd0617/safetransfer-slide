/*
  # Update Storage Bucket to Support More Video Formats

  1. Changes
    - Update `business-media` bucket to support additional video formats
    - Add support for: AVI, MKV, FLV, WMV, MPEG, MPG, OGG, 3GP
    - Keep existing image formats
    - Increase file size limit to 100MB
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update storage bucket to support more video formats
UPDATE storage.buckets
SET 
  file_size_limit = 104857600, -- 100MB limit
  allowed_mime_types = ARRAY[
    -- Image formats
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    -- Video formats
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo', -- AVI
    'video/x-matroska', -- MKV
    'video/x-flv', -- FLV
    'video/x-ms-wmv', -- WMV
    'video/mpeg', -- MPEG
    'video/ogg', -- OGG
    'video/3gpp', -- 3GP
    'video/3gpp2' -- 3G2
  ]
WHERE id = 'business-media';