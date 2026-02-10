/*
  # Add business_id to video_pauses table

  1. Changes
    - Add business_id column to video_pauses
    - This allows proper RLS policies scoped to business
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'video_pauses' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE video_pauses ADD COLUMN business_id uuid REFERENCES businesses(id);
  END IF;
END $$;
