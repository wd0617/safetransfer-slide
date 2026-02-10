/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Indexes on Foreign Keys
  - `business_sessions.business_id` - Critical for session validation queries
  - `password_recovery_requests.business_id` - Important for recovery lookups

  ### 2. Remove Unused Indexes
  Removing unused indexes improves write performance:
  - `idx_audit_logs_superadmin_id`
  - `idx_business_notifications_business_id`
  - `idx_business_notifications_sent_by`
  - `idx_business_operators_business_id`
  - `idx_business_payments_business_id`
  - `idx_business_payments_recorded_by`
  - `idx_businesses_blocked_by`
  - `idx_media_items_business_id`
  - `idx_business_admins_superadmin`
  - `idx_messages_read`
  - `idx_messages_from_business`
  - `idx_notifications_read`
  - `idx_subscription_history_business_id`

  ### 3. Remove Duplicate RLS Policies
  Removes overly permissive "Enable all access" policies that were added in
  migration 20251118215646. These policies duplicate existing fine-grained
  policies and create security redundancy.

  ## Security Impact
  - Better query performance on foreign key lookups
  - Faster write operations (fewer indexes to maintain)
  - Cleaner RLS policy structure without duplicates
*/

-- =====================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- =====================================================

-- Add index for business_sessions.business_id
CREATE INDEX IF NOT EXISTS idx_business_sessions_business_id 
  ON public.business_sessions(business_id);

-- Add index for password_recovery_requests.business_id
CREATE INDEX IF NOT EXISTS idx_password_recovery_requests_business_id 
  ON public.password_recovery_requests(business_id);

-- =====================================================
-- PART 2: REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_audit_logs_superadmin_id;
DROP INDEX IF EXISTS public.idx_business_notifications_business_id;
DROP INDEX IF EXISTS public.idx_business_notifications_sent_by;
DROP INDEX IF EXISTS public.idx_business_operators_business_id;
DROP INDEX IF EXISTS public.idx_business_payments_business_id;
DROP INDEX IF EXISTS public.idx_business_payments_recorded_by;
DROP INDEX IF EXISTS public.idx_businesses_blocked_by;
DROP INDEX IF EXISTS public.idx_media_items_business_id;
DROP INDEX IF EXISTS public.idx_business_admins_superadmin;
DROP INDEX IF EXISTS public.idx_messages_read;
DROP INDEX IF EXISTS public.idx_messages_from_business;
DROP INDEX IF EXISTS public.idx_notifications_read;
DROP INDEX IF EXISTS public.idx_subscription_history_business_id;

-- =====================================================
-- PART 3: REMOVE DUPLICATE RLS POLICIES
-- =====================================================

-- announcements: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for announcements" ON public.announcements;

-- business_admins: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for business_admins" ON public.business_admins;

-- business_sessions: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for business_sessions" ON public.business_sessions;

-- business_settings: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for business_settings" ON public.business_settings;

-- businesses: Remove "Enable all access" policy (if exists)
DROP POLICY IF EXISTS "Enable all access for businesses" ON public.businesses;

-- exchange_rates: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for exchange_rates" ON public.exchange_rates;

-- media_items: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for media_items" ON public.media_items;

-- service_logos: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for service_logos" ON public.service_logos;

-- video_pauses: Remove "Enable all access" policy
DROP POLICY IF EXISTS "Enable all access for video_pauses" ON public.video_pauses;

-- business_notifications: Remove "Enable all access" policy (if exists)
DROP POLICY IF EXISTS "Enable all access for business_notifications" ON public.business_notifications;

-- messages: Remove "Enable all access" policy (if exists)
DROP POLICY IF EXISTS "Enable all access for messages" ON public.messages;

-- notifications: Remove "Enable all access" policy (if exists)
DROP POLICY IF EXISTS "Enable all access for notifications" ON public.notifications;
