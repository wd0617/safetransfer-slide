/*
  # Add anonymous user policies for media_items

  1. Changes
    - Add INSERT policy for anonymous users
    - Add UPDATE policy for anonymous users  
    - Add DELETE policy for anonymous users
    - Add SELECT policy for all media items (not just active)
*/

CREATE POLICY "Anon can insert media items"
  ON media_items
  FOR INSERT
  TO anon
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can update media items"
  ON media_items
  FOR UPDATE
  TO anon
  USING (business_id IS NOT NULL)
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can delete media items"
  ON media_items
  FOR DELETE
  TO anon
  USING (business_id IS NOT NULL);

CREATE POLICY "Anon can select all media items"
  ON media_items
  FOR SELECT
  TO anon
  USING (business_id IS NOT NULL);
