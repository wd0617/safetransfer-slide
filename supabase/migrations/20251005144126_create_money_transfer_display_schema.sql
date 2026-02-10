/*
  # Money Transfer Display System Schema

  1. New Tables
    - `exchange_rates`
      - `id` (uuid, primary key)
      - `country` (text) - Country name
      - `bank` (text) - Bank name
      - `rate` (decimal) - Exchange rate
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Show/hide on display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `media_items`
      - `id` (uuid, primary key)
      - `type` (text) - 'image' or 'video'
      - `url` (text) - Media URL
      - `duration_seconds` (integer) - Display duration
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Show/hide on display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text) - Announcement title
      - `message` (text) - Announcement message
      - `order_index` (integer) - Display order
      - `is_active` (boolean) - Show/hide on display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `business_settings`
      - `id` (uuid, primary key)
      - `business_hours` (text) - Business hours text
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for display screen (anon users)
    - No write access without authentication (admin only)
*/

-- Exchange Rates Table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  bank text NOT NULL,
  rate decimal(10,4) NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exchange rates"
  ON exchange_rates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage exchange rates"
  ON exchange_rates FOR ALL
  USING (auth.role() = 'service_role');

-- Media Items Table
CREATE TABLE IF NOT EXISTS media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('image', 'video')),
  url text NOT NULL,
  duration_seconds integer DEFAULT 10,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active media items"
  ON media_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage media items"
  ON media_items FOR ALL
  USING (auth.role() = 'service_role');

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  message text NOT NULL,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage announcements"
  ON announcements FOR ALL
  USING (auth.role() = 'service_role');

-- Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_hours text NOT NULL DEFAULT 'Lun-Vie: 9:00 AM - 6:00 PM | Sáb: 9:00 AM - 2:00 PM',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business settings"
  ON business_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage business settings"
  ON business_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Insert default business settings
INSERT INTO business_settings (business_hours)
VALUES ('Lun-Vie: 9:00 AM - 6:00 PM | Sáb: 9:00 AM - 2:00 PM')
ON CONFLICT DO NOTHING;

-- Insert sample data for exchange rates
INSERT INTO exchange_rates (country, bank, rate, order_index) VALUES
  ('República Dominicana', 'Banco Popular', 58.50, 1),
  ('Honduras', 'Banco Atlántida', 24.75, 2),
  ('Guatemala', 'Banco Industrial', 7.85, 3),
  ('El Salvador', 'Banco Agrícola', 1.00, 4)
ON CONFLICT DO NOTHING;

-- Insert sample announcement
INSERT INTO announcements (title, message, order_index) VALUES
  ('Bienvenido', '¡Envíos rápidos y seguros a toda Latinoamérica!', 1),
  ('Promoción', 'Tarifas especiales en transferencias mayores a $500', 2)
ON CONFLICT DO NOTHING;