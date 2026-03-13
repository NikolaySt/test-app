import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers to simulate the Edge Function logic without Deno runtime
// ---------------------------------------------------------------------------

interface TodoRecord {
  id: string;
  user_id: string;
  title: string;
  is_complete: boolean;
  notified_at: string | null;
}

interface NotificationResult {
  status: 'skipped' | 'ok' | 'error';
  reason?: string;
  to?: string;
}

/**
 * Pure logic extracted from the Edge Function so it can be unit-tested
 * in a Node/Vitest environment without Deno globals.
 */
async function processNotification(
  record: TodoRecord,
  deps: {
    getUserById: (id: string) => Promise<{ email: string | null }>;
    sendEmail: (to: string, title: string) => Promise<{ ok: boolean }>;
    markNotified: (id: string) => Promise<void>;
  }
): Promise<NotificationResult> {
  // Skip if not complete or already notified
  if (!record.is_complete || record.notified_at) {
    return { status: 'skipped', reason: 'not complete or already notified' };
  }

  const user = await deps.getUserById(record.user_id);
  if (!user.email) {
    return { status: 'error', reason: 'user not found' };
  }

  const result = await deps.sendEmail(user.email, record.title);
  if (!result.ok) {
    return { status: 'error', reason: 'email send failed' };
  }

  await deps.markNotified(record.id);
  return { status: 'ok', to: user.email };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('send-task-notification Edge Function logic', () => {
  const mockGetUser = vi.fn();
  const mockSendEmail = vi.fn();
  const mockMarkNotified = vi.fn();

  const deps = {
    getUserById: mockGetUser,
    sendEmail: mockSendEmail,
    markNotified: mockMarkNotified,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ email: 'user@example.com' });
    mockSendEmail.mockResolvedValue({ ok: true });
    mockMarkNotified.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('skips when is_complete is false', async () => {
    const record: TodoRecord = {
      id: 'todo-1',
      user_id: 'user-1',
      title: 'Write tests',
      is_complete: false,
      notified_at: null,
    };

    const result = await processNotification(record, deps);

    expect(result.status).toBe('skipped');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockMarkNotified).not.toHaveBeenCalled();
  });

  it('skips when notified_at is already set', async () => {
    const record: TodoRecord = {
      id: 'todo-2',
      user_id: 'user-1',
      title: 'Already done',
      is_complete: true,
      notified_at: '2024-01-01T00:00:00Z',
    };

    const result = await processNotification(record, deps);

    expect(result.status).toBe('skipped');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns error when user is not found', async () => {
    mockGetUser.mockResolvedValue({ email: null });

    const record: TodoRecord = {
      id: 'todo-3',
      user_id: 'missing-user',
      title: 'Orphaned task',
      is_complete: true,
      notified_at: null,
    };

    const result = await processNotification(record, deps);

    expect(result.status).toBe('error');
    expect(result.reason).toBe('user not found');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('returns error when email send fails', async () => {
    mockSendEmail.mockResolvedValue({ ok: false });

    const record: TodoRecord = {
      id: 'todo-4',
      user_id: 'user-1',
      title: 'Failing email task',
      is_complete: true,
      notified_at: null,
    };

    const result = await processNotification(record, deps);

    expect(result.status).toBe('error');
    expect(result.reason).toBe('email send failed');
    expect(mockMarkNotified).not.toHaveBeenCalled();
  });

  it('sends email and marks notified on success', async () => {
    const record: TodoRecord = {
      id: 'todo-5',
      user_id: 'user-1',
      title: 'Ship the feature',
      is_complete: true,
      notified_at: null,
    };

    const result = await processNotification(record, deps);

    expect(result.status).toBe('ok');
    expect(result.to).toBe('user@example.com');
    expect(mockSendEmail).toHaveBeenCalledWith('user@example.com', 'Ship the feature');
    expect(mockMarkNotified).toHaveBeenCalledWith('todo-5');
  });

  it('calls markNotified only after successful email send', async () => {
    const callOrder: string[] = [];
    mockSendEmail.mockImplementation(async () => {
      callOrder.push('sendEmail');
      return { ok: true };
    });
    mockMarkNotified.mockImplementation(async () => {
      callOrder.push('markNotified');
    });

    const record: TodoRecord = {
      id: 'todo-6',
      user_id: 'user-1',
      title: 'Ordered operations',
      is_complete: true,
      notified_at: null,
    };

    await processNotification(record, deps);

    expect(callOrder).toEqual(['sendEmail', 'markNotified']);
  });
});