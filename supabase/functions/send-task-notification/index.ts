// Supabase Edge Function: send-task-notification
// Triggered by a Supabase Database Webhook (or pg_net trigger) on todos UPDATE.
// Sends a completion email via Resend when a task is marked complete.
//
// Deploy:
//   supabase functions deploy send-task-notification
//
// Required secrets (set via `supabase secrets set`):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   NOTIFY_FROM_EMAIL   (e.g. noreply@yourdomain.com)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TodoRecord {
  id: string;
  user_id: string;
  title: string;
  is_complete: boolean;
  notified_at: string | null;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: TodoRecord;
  old_record: TodoRecord | null;
}

serve(async (req: Request) => {
  try {
    // Accept both webhook payloads (nested) and direct row payloads (from pg_net)
    const body = await req.json();
    const record: TodoRecord = body.record ?? body;

    // Guard: only process completed, not-yet-notified todos
    if (!record?.is_complete || record?.notified_at) {
      return new Response(JSON.stringify({ status: 'skipped' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the user's email from auth.users
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(record.user_id);

    if (userError || !userData?.user?.email) {
      console.error('Failed to fetch user:', userError?.message);
      return new Response(JSON.stringify({ error: 'user not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userEmail = userData.user.email;
    const fromEmail = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'noreply@example.com';
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: userEmail,
        subject: `✅ Task completed: ${record.title}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #3ecf8e, #1a9e6e); border-radius: 12px; line-height: 48px; font-size: 24px; color: white; font-weight: bold;">S</div>
              <div style="margin-top: 8px; font-size: 20px; font-weight: 700; color: #1a1a2e;">Supabase<span style="color: #3ecf8e;">base</span> Todo</div>
            </div>

            <h2 style="font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 12px;">Task Completed! 🎉</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              Great work! Your task has been marked as complete:
            </p>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
              <span style="font-size: 16px; font-weight: 600; color: #15803d;">✓ ${record.title}</span>
            </div>

            <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
              You're receiving this because you completed a task in your Supabase Todo app.
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('Resend error:', errBody);
      return new Response(JSON.stringify({ error: 'email send failed', detail: errBody }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark the todo as notified to prevent duplicate emails
    const { error: updateError } = await supabase
      .from('todos')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', record.id);

    if (updateError) {
      console.error('Failed to set notified_at:', updateError.message);
      // Non-fatal: email was sent, just log the failure
    }

    return new Response(JSON.stringify({ status: 'ok', to: userEmail }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});