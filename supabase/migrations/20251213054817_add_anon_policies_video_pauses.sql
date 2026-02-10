/*
  # Add anonymous user policies for video_pauses

  1. Changes
    - Add INSERT policy for anonymous users
    - Add UPDATE policy for anonymous users  
    - Add DELETE policy for anonymous users
    - Add SELECT policy for all video pauses (not just active)
*/

CREATE POLICY "Anon can insert video pauses"
  ON video_pauses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update video pauses"
  ON video_pauses
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete video pauses"
  ON video_pauses
  FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon can select all video pauses"
  ON video_pauses
  FOR SELECT
  TO anon
  USING (true);
