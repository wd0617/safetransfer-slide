import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ExchangeRate = {
  id: string;
  country: string;
  country_code?: string | null;
  bank: string;
  rate: number;
  flag_emoji: string;
  flag_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaItem = {
  id: string;
  type: 'image' | 'video' | 'youtube';
  url: string;
  duration_seconds: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessSettings = {
  id: string;
  business_hours: string;
  business_name: string;
  weather_city: string;
  weather_api_key: string;
  logo_url: string | null;
  color_theme: string;
  custom_primary_color: string | null;
  custom_secondary_color: string | null;
  updated_at: string;
};

export type ServiceLogo = {
  id: string;
  name: string;
  url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VideoPause = {
  id: string;
  media_item_id: string;
  pause_at_seconds: number;
  display_duration_seconds: number;
  overlay_image_url: string | null;
  overlay_type: 'image' | 'media_item';
  overlay_media_item_id: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
