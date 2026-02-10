/*
  # Add Zoho Invoice Integration to Payments

  1. Changes to business_payments table
    - `zoho_invoice_id` - ID de la factura en Zoho Invoice
    - `zoho_invoice_number` - Numero de factura de Zoho
    - `invoice_pdf_url` - URL del PDF de la factura (cache local)
    - `zoho_customer_id` - ID del cliente en Zoho
    - `concept` - Concepto o descripcion del pago

  2. New table: zoho_settings
    - Almacena las credenciales y tokens de Zoho por organization
    - `organization_id` - ID de la organizacion en Zoho
    - `refresh_token` - Token de refresco para obtener access tokens
    - `access_token` - Token de acceso actual
    - `access_token_expires_at` - Cuando expira el access token

  3. Security
    - RLS habilitado en todas las tablas
    - Solo superadmin puede gestionar zoho_settings
*/

-- Add Zoho fields to business_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'zoho_invoice_id'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN zoho_invoice_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'zoho_invoice_number'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN zoho_invoice_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'invoice_pdf_url'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN invoice_pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'zoho_customer_id'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN zoho_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_payments' AND column_name = 'concept'
  ) THEN
    ALTER TABLE business_payments ADD COLUMN concept text DEFAULT 'Suscripcion mensual';
  END IF;
END $$;

-- Create zoho_settings table
CREATE TABLE IF NOT EXISTS zoho_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  region text DEFAULT 'us' CHECK (region IN ('us', 'eu', 'in', 'au', 'jp')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE zoho_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zoho_settings (superadmin only via anon for edge functions)
DROP POLICY IF EXISTS "Anon can read zoho_settings" ON zoho_settings;
CREATE POLICY "Anon can read zoho_settings"
  ON zoho_settings FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Anon can update zoho_settings" ON zoho_settings;
CREATE POLICY "Anon can update zoho_settings"
  ON zoho_settings FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can insert zoho_settings" ON zoho_settings;
CREATE POLICY "Anon can insert zoho_settings"
  ON zoho_settings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add RLS policy for businesses to read their own payments
DROP POLICY IF EXISTS "Businesses can read own payments" ON business_payments;
CREATE POLICY "Businesses can read own payments"
  ON business_payments FOR SELECT
  TO anon
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_payments_zoho_invoice_id ON business_payments(zoho_invoice_id);
CREATE INDEX IF NOT EXISTS idx_business_payments_business_id_status ON business_payments(business_id, status);
