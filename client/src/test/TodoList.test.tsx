import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoList from '../components/TodoList';

// ---------------------------------------------------------------------------
// Mock supabaseClient
// ---------------------------------------------------------------------------

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

// Build a chainable mock that resolves with the provided value
function chainable(resolveWith: unknown) {
  const chain: Record<string, unknown> = {};
  const terminal = () => Promise.resolve(resolveWith);
  chain.select = vi.fn(() => chain);
  chain.insert = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.delete = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.single = vi.fn(terminal);
  chain.order = vi.fn(terminal);
  return chain;
}

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      order: mockOrder,
    })),
  },
  isConfigured: true,
}));

// ---------------------------------------------------------------------------
// Re-import after mock is set up
// ---------------------------------------------------------------------------
import { supabase } from '../lib/supabaseClient';

const TODOS = [
  { id: '1', user_id: 'u1', title: 'Buy groceries', is_complete: false, notified_at: null, created_at: '2024-01-01T00:00:00Z' },
  { id: '2', user_id: 'u1', title: 'Write report',  is_complete: true,  notified_at: '2024-01-02T10:00:00Z', created_at: '2024-01-01T01:00:00Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

// Helper: make supabase.from().select().order() resolve with given data
function mockFetch(data: typeof TODOS) {
  (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data, error: null }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  });
}

describe('TodoList', () => {
  it('renders pending and completed todos from Supabase', async () => {
    mockFetch(TODOS);
    render(<TodoList userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText('Buy groceries')).toBeInTheDocument();
      expect(screen.getByText('Write report')).toBeInTheDocument();
    });
  });

  it('shows "Completed" section header when there are done todos', async () => {
    mockFetch(TODOS);
    render(<TodoList userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  it('shows 📧 badge for todos with notified_at set', async () => {
    mockFetch(TODOS);
    render(<TodoList userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText('📧')).toBeInTheDocument();
    });
  });

  it('does NOT show 📧 badge for todos without notified_at', async () => {
    const noNotified = [
      { ...TODOS[0], is_complete: true, notified_at: null },
    ];
    mockFetch(noNotified);
    render(<TodoList userId="u1" />);

    await waitFor(() => {
      expect(screen.queryByText('📧')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no todos exist', async () => {
    mockFetch([]);
    render(<TodoList userId="u1" />);

    await waitFor(() => {
      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });
  });

  it('calls supabase update when checkbox is clicked', async () => {
    const updateSingle = vi.fn().mockResolvedValue({
      data: { ...TODOS[0], is_complete: true, notified_at: null },
      error: null,
    });
    const updateEq = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: updateSingle }) });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

    (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [TODOS[0]], error: null }),
      }),
      update: updateFn,
    });

    render(<TodoList userId="u1" />);

    await waitFor(() => screen.getByText('Buy groceries'));

    const checkbox = screen.getByRole('button', { name: /mark complete/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(updateFn).toHaveBeenCalledWith({ is_complete: true });
    });
  });

  it('adds a new todo when Add button is clicked', async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: '99', user_id: 'u1', title: 'New task', is_complete: false, notified_at: null, created_at: '' },
      error: null,
    });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insertFn = vi.fn().mockReturnValue({ select: insertSelect });

    (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: insertFn,
    });

    render(<TodoList userId="u1" />);
    await waitFor(() => screen.getByPlaceholderText(/Add a new task/i));

    fireEvent.change(screen.getByPlaceholderText(/Add a new task/i), {
      target: { value: 'New task' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => {
      expect(insertFn).toHaveBeenCalledWith({ title: 'New task', user_id: 'u1' });
    });
  });
});