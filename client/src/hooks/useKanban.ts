import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { KanbanCard, KanbanColumn } from '../types/kanban';

interface UseKanbanReturn {
  cards: KanbanCard[];
  loading: boolean;
  error: string | null;
  addCard: (title: string, description: string, column: KanbanColumn) => Promise<void>;
  moveCard: (id: string, newColumn: KanbanColumn) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  updateCard: (id: string, title: string, description: string) => Promise<void>;
}

export function useKanban(userId: string): UseKanbanReturn {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('kanban_cards')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setCards((data as KanbanCard[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = useCallback(async (title: string, description: string, column: KanbanColumn) => {
    if (!supabase) return;
    const colCards = cards.filter(c => c.column === column);
    const position = colCards.length > 0 ? Math.max(...colCards.map(c => c.position)) + 1 : 0;

    const { data, error: err } = await supabase
      .from('kanban_cards')
      .insert({ title: title.trim(), description: description.trim() || null, column, position, user_id: userId })
      .select()
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setCards(prev => [...prev, data as KanbanCard]);
    }
  }, [cards, userId]);

  const moveCard = useCallback(async (id: string, newColumn: KanbanColumn) => {
    if (!supabase) return;
    const colCards = cards.filter(c => c.column === newColumn && c.id !== id);
    const position = colCards.length > 0 ? Math.max(...colCards.map(c => c.position)) + 1 : 0;

    // Optimistic update
    setCards(prev => prev.map(c => c.id === id ? { ...c, column: newColumn, position } : c));

    const { error: err } = await supabase
      .from('kanban_cards')
      .update({ column: newColumn, position })
      .eq('id', id);

    if (err) {
      setError(err.message);
      fetchCards(); // revert on error
    }
  }, [cards, fetchCards]);

  const deleteCard = useCallback(async (id: string) => {
    if (!supabase) return;
    setCards(prev => prev.filter(c => c.id !== id));

    const { error: err } = await supabase
      .from('kanban_cards')
      .delete()
      .eq('id', id);

    if (err) {
      setError(err.message);
      fetchCards();
    }
  }, [fetchCards]);

  const updateCard = useCallback(async (id: string, title: string, description: string) => {
    if (!supabase) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, title, description } : c));

    const { error: err } = await supabase
      .from('kanban_cards')
      .update({ title: title.trim(), description: description.trim() || null })
      .eq('id', id);

    if (err) {
      setError(err.message);
      fetchCards();
    }
  }, [fetchCards]);

  return { cards, loading, error, addCard, moveCard, deleteCard, updateCard };
}