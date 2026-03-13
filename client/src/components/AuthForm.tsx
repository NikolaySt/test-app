import { useState } from 'react';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { AuthMode } from '../types/auth';
import Alert from './Alert';
import ConfigNotice from './ConfigNotice';

interface AuthFormProps {
  initialMode?: AuthMode;
  onPasswordUpdated?: () => void;
}

export default function AuthForm({ initialMode = 'login', onPasswordUpdated }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => { setError(''); setSuccess(''); };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setPassword('');
    setConfirmPassword('');
    reset();
  };

  const validate = (): string | null => {
    if (mode === 'forgot-password') {
      if (!email.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
      return null;
    }
    if (mode === 'reset-password') {
      if (!password) return 'New password is required.';
      if (password.length < 6) return 'Password must be at least 6 characters.';
      if (password !== confirmPassword) return 'Passwords do not match.';
      return null;
    }
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
      if (mode === 'forgot-password') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setSuccess(`Password reset link sent! Check your inbox at ${email}.`);
      } else if (mode === 'reset-password') {
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        setSuccess('Password updated successfully!');
        setTimeout(() => {
          if (onPasswordUpdated) onPasswordUpdated();
        }, 1500);
      } else if (mode === 'magic') {
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
    magic: { title: 'Magic link', subtitle: "We'll email you a link — no password needed." },
    'forgot-password': { title: 'Reset password', subtitle: "Enter your email and we'll send you a reset link." },
    'reset-password': { title: 'Set new password', subtitle: 'Choose a strong new password for your account.' },
  };

  const buttonLabel = () => {
    if (loading) {
      if (mode === 'login') return 'Signing in…';
      if (mode === 'signup') return 'Creating account…';
      if (mode === 'forgot-password') return 'Sending link…';
      if (mode === 'reset-password') return 'Updating password…';
      return 'Sending link…';
    }
    if (mode === 'login') return 'Sign In';
    if (mode === 'signup') return 'Create Account';
    if (mode === 'forgot-password') return 'Send Reset Link';
    if (mode === 'reset-password') return 'Update Password';
    return 'Send Magic Link';
  };

  // Forgot-password and reset-password are standalone views (no tabs)
  const isStandaloneMode = mode === 'forgot-password' || mode === 'reset-password';

  return (
    <div className="card">
      <div className="logo">
        <div className="logo-icon">S</div>
        <div className="logo-text">Supa<span>base</span></div>
      </div>

      {!isConfigured && <ConfigNotice />}

      {/* Mode tab switcher — hidden for forgot/reset modes */}
      {!isStandaloneMode && (
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
      )}

      <h2>{headings[mode].title}</h2>
      <p className="subtitle">{headings[mode].subtitle}</p>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} noValidate>
        {/* Email field — shown for all modes except reset-password */}
        {mode !== 'reset-password' && (
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
        )}

        {/* Password field — shown for login, signup, reset-password */}
        {(mode === 'login' || mode === 'signup' || mode === 'reset-password') && (
          <div className="form-group">
            <label htmlFor="password">
              {mode === 'reset-password' ? 'New password' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              placeholder={mode === 'signup' || mode === 'reset-password' ? 'Min. 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
          </div>
        )}

        {/* Forgot password link — only in login mode */}
        {mode === 'login' && (
          <button
            type="button"
            className="forgot-link"
            onClick={() => switchMode('forgot-password')}
            disabled={loading}
          >
            Forgot password?
          </button>
        )}

        {/* Confirm password field — only in reset-password mode */}
        {mode === 'reset-password' && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="spinner" />}
          {buttonLabel()}
        </button>
      </form>

      {/* Back to Sign In — shown in forgot-password mode */}
      {mode === 'forgot-password' && (
        <div className="toggle-link">
          <button type="button" onClick={() => switchMode('login')}>
            ← Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
}