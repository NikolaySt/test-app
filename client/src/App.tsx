import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isConfigured } from './lib/supabaseClient';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="spinner" style={{ borderTopColor: '#3ecf8e', borderColor: 'rgba(62,207,142,0.2)' }} />
        Loading…
      </div>
    );
  }

  return session ? <Dashboard session={session} /> : <AuthForm />;
}