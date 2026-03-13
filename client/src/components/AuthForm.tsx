import { useState } from 'react';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { AuthMode } from '../types/auth';
import Alert from './Alert';
import ConfigNotice from './ConfigNotice';

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    reset();
  };

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (mode !== 'magic') {
      if (!password) return 'Password is required.';
      if (mode === 'signup' && password.length < 6) return 'Password must be at least 6 characters.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();

    if (!isConfigured || !supabase) {
      setError('Supabase is not configured. Please update client/.env.local.');
      return;
    }

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      if (mode === 'magic') {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        setSuccess(`Magic link sent! Check your inbox at ${email}.`);
      } else if (mode === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data?.user && !data.session) {
          setSuccess('Account created! Check your email to confirm your address before logging in.');
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const headings: Record<AuthMode, { title: string; subtitle: string }> = {
    login: { title: 'Welcome back', subtitle: 'Sign in to your account to continue.' },
    signup: { title: 'Create account', subtitle: 'Sign up to get started today.' },
    magic: { title: 'Magic link', subtitle: 'We\'ll email you a link — no password needed.' },
  };

  const buttonLabel = () => {
    if (loading) {
      if (mode === 'login') return 'Signing in…';
      if (mode === 'signup') return 'Creating account…';
      return 'Sending link…';
    }
    if (mode === 'login') return 'Sign In';
    if (mode === 'signup') return 'Create Account';
    return 'Send Magic Link';
  };

  return (
    <div className="card">
      <div className="logo">
        <div className="logo-icon">S</div>
        <div className="logo-text">Supa<span>base</span></div>
      </div>

      {!isConfigured && <ConfigNotice />}

      {/* Mode tab switcher */}
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab${mode === 'login' ? ' auth-tab--active' : ''}`}
          onClick={() => switchMode('login')}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab${mode === 'signup' ? ' auth-tab--active' : ''}`}
          onClick={() => switchMode('signup')}
        >
          Sign Up
        </button>
        <button
          type="button"
          className={`auth-tab${mode === 'magic' ? ' auth-tab--active' : ''}`}
          onClick={() => switchMode('magic')}
        >
          ✨ Magic Link
        </button>
      </div>

      <h2>{headings[mode].title}</h2>
      <p className="subtitle">{headings[mode].subtitle}</p>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
        </div>

        {mode !== 'magic' && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="spinner" />}
          {buttonLabel()}
        </button>
      </form>
    </div>
  );
}