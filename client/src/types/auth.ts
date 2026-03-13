import type { Session } from '@supabase/supabase-js';

export type AuthMode = 'login' | 'signup' | 'magic';
export type AlertType = 'error' | 'success' | 'warning';

export interface DashboardProps {
  session: Session;
}

export interface AlertProps {
  type: AlertType;
  message: string;
}