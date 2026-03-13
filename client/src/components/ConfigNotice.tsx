export default function ConfigNotice() {
  return (
    <div className="config-notice">
      <strong>⚙️ Setup Required</strong>
      Open <code>client/.env.local</code> and replace <code>YOUR_SUPABASE_URL</code> and{' '}
      <code>YOUR_SUPABASE_ANON_KEY</code> with your project credentials from the{' '}
      <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#fbbf24' }}>
        Supabase Dashboard
      </a>{' '}
      → Project Settings → API.
    </div>
  );
}