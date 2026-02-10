/*
  # Add YouTube Support to Media Items

  1. Changes
    - Update media_items type enum to include 'youtube'
    - Existing media items remain unchanged
    - New youtube items will use embed URLs

  2. Notes
    - YouTube URLs should be in the format: https://www.youtube.com/embed/VIDEO_ID
    - Duration still applies for automatic rotation timing
*/

-- Add 'youtube' as a new media type option
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE media_items DROP CONSTRAINT IF EXISTS media_items_type_check;
  
  -- Add new constraint with youtube support
  ALTER TABLE media_items ADD CONSTRAINT media_items_type_check 
    CHECK (type IN ('image', 'video', 'youtube'));
END $$;