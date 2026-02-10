/*
  # Add anonymous user policies for announcements

  1. Changes
    - Add INSERT policy for anonymous users
    - Add UPDATE policy for anonymous users  
    - Add DELETE policy for anonymous users
    - Add SELECT policy for all announcements (not just active)
*/

CREATE POLICY "Anon can insert announcements"
  ON announcements
  FOR INSERT
  TO anon
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can update announcements"
  ON announcements
  FOR UPDATE
  TO anon
  USING (business_id IS NOT NULL)
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can delete announcements"
  ON announcements
  FOR DELETE
  TO anon
  USING (business_id IS NOT NULL);

CREATE POLICY "Anon can select all announcements"
  ON announcements
  FOR SELECT
  TO anon
  USING (business_id IS NOT NULL);
