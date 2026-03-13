import type { AlertProps } from '../types/auth';

const icons: Record<string, string> = { error: '✕', success: '✓', warning: '⚠' };

export default function Alert({ type, message }: AlertProps) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span className="alert-icon">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}