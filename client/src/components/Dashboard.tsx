import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { DashboardProps } from '../types/auth';
import TodoList from './TodoList';

function getInitial(email?: string) {
  return email ? email[0].toUpperCase() : '?';
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default function Dashboard({ session }: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const user = session.user;

  const handleLogout = async () => {
    setLoading(true);
    await supabase!.auth.signOut();
  };

  let signedInAt = '—';
  try {
    if (session.access_token) {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]));
      signedInAt = new Date(payload.iat * 1000).toLocaleString();
    } else {
      signedInAt = formatDate(user.last_sign_in_at);
    }
  } catch {
    signedInAt = formatDate(user.last_sign_in_at);
  }

  return (
    <div className="card">
      <div className="logo">
        <div className="logo-icon">S</div>
        <div className="logo-text">Supa<span>base</span></div>
      </div>

      <div className="dashboard-header">
        <div className="avatar">{getInitial(user.email)}</div>
        <div className="welcome-text">Welcome back!</div>
        <div className="user-email">{user.email}</div>
      </div>

      <div className="info-card">
        <div className="info-row">
          <span className="info-label">Status</span>
          <span className="info-value"><span className="badge">● Authenticated</span></span>
        </div>
        <div className="info-row">
          <span className="info-label">User ID</span>
          <span className="info-value" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            {user.id ? user.id.slice(0, 18) + '…' : '—'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Provider</span>
          <span className="info-value">{user.app_metadata?.provider ?? 'email'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Signed in</span>
          <span className="info-value" style={{ fontSize: '12px' }}>{signedInAt}</span>
        </div>
      </div>

      <TodoList userId={user.id} />

      <button className="btn btn-outline" onClick={handleLogout} disabled={loading}>
        {loading && <span className="spinner" style={{ borderTopColor: '#94a3b8' }} />}
        {loading ? 'Signing out…' : '→ Sign Out'}
      </button>
    </div>
  );
}