/*
  # Add remaining anonymous user policies

  1. Changes
    - Add UPDATE policy for business_admins (for password changes)
    - Add SELECT policy for exchange_rates to show all (not just active)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_admins' 
    AND policyname = 'Anon can update business admins'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can update business admins"
      ON business_admins
      FOR UPDATE
      TO anon
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'exchange_rates' 
    AND policyname = 'Anon can select all exchange rates'
  ) THEN
    EXECUTE 'CREATE POLICY "Anon can select all exchange rates"
      ON exchange_rates
      FOR SELECT
      TO anon
      USING (business_id IS NOT NULL)';
  END IF;
END $$;
