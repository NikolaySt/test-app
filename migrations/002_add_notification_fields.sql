-- ============================================================
-- Migration: 002_add_notification_fields
-- Description: Add notified_at column to todos to track email notifications
-- Apply: Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================

ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS notified_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.todos.notified_at IS
  'Timestamp when the completion notification email was sent. NULL means not yet notified.';