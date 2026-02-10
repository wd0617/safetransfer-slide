/*
  # Create Video Pauses System

  1. New Tables
    - `video_pauses`
      - `id` (uuid, primary key)
      - `media_item_id` (uuid, foreign key to media_items)
      - `pause_at_seconds` (integer) - When to pause the video
      - `display_duration_seconds` (integer) - How long to show the overlay
      - `overlay_image_url` (text) - URL of the image to display
      - `overlay_type` (text) - Type of overlay: 'image' or 'media_item'
      - `overlay_media_item_id` (uuid, nullable) - Reference to another media item
      - `order_index` (integer) - Order of pauses if multiple
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `video_pauses` table
    - Add policies for business admins to manage their video pauses
*/

CREATE TABLE IF NOT EXISTS video_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_item_id uuid NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  pause_at_seconds integer NOT NULL CHECK (pause_at_seconds >= 0),
  display_duration_seconds integer NOT NULL DEFAULT 5 CHECK (display_duration_seconds > 0),
  overlay_image_url text,
  overlay_type text NOT NULL DEFAULT 'image' CHECK (overlay_type IN ('image', 'media_item')),
  overlay_media_item_id uuid REFERENCES media_items(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE video_pauses ENABLE ROW LEVEL SECURITY;

-- Policy: Business admins can view their video pauses
CREATE POLICY "Business admins can view their video pauses"
ON video_pauses
FOR SELECT
TO authenticated
USING (
  media_item_id IN (
    SELECT mi.id
    FROM media_items mi
    INNER JOIN business_admins ba ON mi.business_id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Business admins can insert video pauses
CREATE POLICY "Business admins can insert video pauses"
ON video_pauses
FOR INSERT
TO authenticated
WITH CHECK (
  media_item_id IN (
    SELECT mi.id
    FROM media_items mi
    INNER JOIN business_admins ba ON mi.business_id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Business admins can update their video pauses
CREATE POLICY "Business admins can update their video pauses"
ON video_pauses
FOR UPDATE
TO authenticated
USING (
  media_item_id IN (
    SELECT mi.id
    FROM media_items mi
    INNER JOIN business_admins ba ON mi.business_id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Business admins can delete their video pauses
CREATE POLICY "Business admins can delete their video pauses"
ON video_pauses
FOR DELETE
TO authenticated
USING (
  media_item_id IN (
    SELECT mi.id
    FROM media_items mi
    INNER JOIN business_admins ba ON mi.business_id = ba.business_id
    WHERE ba.user_id = auth.uid() AND ba.is_active = true
  )
);

-- Policy: Public can view active video pauses for display
CREATE POLICY "Public can view active video pauses"
ON video_pauses
FOR SELECT
TO public
USING (is_active = true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_pauses_media_item_id ON video_pauses(media_item_id);
CREATE INDEX IF NOT EXISTS idx_video_pauses_active ON video_pauses(is_active) WHERE is_active = true;