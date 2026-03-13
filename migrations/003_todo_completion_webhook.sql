-- ============================================================
-- Migration: 003_todo_completion_webhook
-- Description: Postgres trigger that calls the send-task-notification
--              Edge Function via pg_net whenever a todo is completed.
-- Prerequisites:
--   1. pg_net extension must be enabled (Supabase Dashboard → Extensions → pg_net)
--   2. Set app settings via:
--        ALTER DATABASE postgres
--          SET app.edge_function_url = 'https://<project-ref>.supabase.co/functions/v1';
--        ALTER DATABASE postgres
--          SET app.supabase_anon_key = '<your-anon-key>';
-- Apply: Paste into Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Trigger function: fires Edge Function on todo completion
CREATE OR REPLACE FUNCTION notify_task_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_url  text;
  anon_key  text;
BEGIN
  -- Only fire when is_complete transitions false → true
  IF NEW.is_complete = true AND (OLD.is_complete = false OR OLD.is_complete IS NULL) THEN
    edge_url := current_setting('app.edge_function_url', true);
    anon_key := current_setting('app.supabase_anon_key', true);

    IF edge_url IS NOT NULL AND anon_key IS NOT NULL THEN
      PERFORM net.http_post(
        url     := edge_url || '/send-task-notification',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body    := row_to_json(NEW)::jsonb
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to todos table
DROP TRIGGER IF EXISTS todo_completion_trigger ON public.todos;

CREATE TRIGGER todo_completion_trigger
  AFTER UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completion();