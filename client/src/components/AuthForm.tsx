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

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    reset();
  };

  const validate = (): string | null => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (mode === 'signup' && password.length < 6) return 'Password must be at least 6 characters.';
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
      if (mode === 'signup') {
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

  return (
    <div className="card">
      <div className="logo">
        <div className="logo-icon">S</div>
        <div className="logo-text">Supa<span>base</span></div>
      </div>

      {!isConfigured && <ConfigNotice />}

      <h2>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
      <p className="subtitle">
        {mode === 'login' ? 'Sign in to your account to continue.' : 'Sign up to get started today.'}
      </p>

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
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="spinner" />}
          {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="toggle-link">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        <button onClick={toggleMode} type="button">
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}