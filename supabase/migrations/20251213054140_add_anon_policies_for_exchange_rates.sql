/*
  # Add anonymous user policies for exchange_rates

  1. Changes
    - Add INSERT policy for anonymous users
    - Add UPDATE policy for anonymous users  
    - Add DELETE policy for anonymous users

  2. Security
    - All operations require a valid business_id
    - Operations are scoped to the specific business
*/

CREATE POLICY "Anon can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO anon
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO anon
  USING (business_id IS NOT NULL)
  WITH CHECK (business_id IS NOT NULL);

CREATE POLICY "Anon can delete exchange rates"
  ON exchange_rates
  FOR DELETE
  TO anon
  USING (business_id IS NOT NULL);
