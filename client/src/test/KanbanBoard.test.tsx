import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanBoard from '../components/KanbanBoard';
import type { Session } from '@supabase/supabase-js';

// Mock the useKanban hook
vi.mock('../hooks/useKanban', () => ({
  useKanban: () => ({
    cards: [
      { id: '1', user_id: 'u1', title: 'Fix bug', description: '', column: 'todo',        position: 0, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u1', title: 'Write tests', description: '', column: 'in_progress', position: 0, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u1', title: 'Deploy',  description: '', column: 'done',        position: 0, created_at: '', updated_at: '' },
    ],
    loading: false,
    error: null,
    addCard: vi.fn(),
    moveCard: vi.fn(),
    deleteCard: vi.fn(),
    updateCard: vi.fn(),
  }),
}));

const mockSession = {
  user: { id: 'u1', email: 'test@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' },
  access_token: 'tok',
  token_type: 'bearer',
} as unknown as Session;

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three columns', () => {
    render(<KanbanBoard session={mockSession} />);
    expect(screen.getByText('To Do')).toBeTruthy();
    expect(screen.getByText('In Progress')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('renders cards in correct columns', () => {
    render(<KanbanBoard session={mockSession} />);
    expect(screen.getByText('Fix bug')).toBeTruthy();
    expect(screen.getByText('Write tests')).toBeTruthy();
    expect(screen.getByText('Deploy')).toBeTruthy();
  });

  it('shows add card button in each column', () => {
    render(<KanbanBoard session={mockSession} />);
    const addBtns = screen.getAllByText('+ Add card');
    expect(addBtns.length).toBe(3);
  });

  it('opens add card form when button is clicked', () => {
    render(<KanbanBoard session={mockSession} />);
    const addBtns = screen.getAllByText('+ Add card');
    fireEvent.click(addBtns[0]);
    expect(screen.getByPlaceholderText('Card title…')).toBeTruthy();
  });

  it('shows delete button on each card', () => {
    render(<KanbanBoard session={mockSession} />);
    const deleteBtns = screen.getAllByTitle('Delete');
    expect(deleteBtns.length).toBe(3);
  });
});