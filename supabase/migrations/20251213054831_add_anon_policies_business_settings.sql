/*
  # Add anonymous user policies for business_settings

  1. Changes
    - Add INSERT policy for anonymous users
    - Add UPDATE policy for anonymous users
*/

CREATE POLICY "Anon can update business settings"
  ON business_settings
  FOR UPDATE
  TO anon
  USING (business_id IS NOT NULL)
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can insert business settings"
  ON business_settings
  FOR INSERT
  TO anon
  WITH CHECK (business_id IS NOT NULL);
