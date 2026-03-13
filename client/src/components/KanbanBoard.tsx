import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useKanban } from '../hooks/useKanban';
import { KANBAN_COLUMNS } from '../types/kanban';
import type { KanbanColumn } from '../types/kanban';
import KanbanColumnComponent from './KanbanColumn';

interface KanbanBoardProps {
  session: Session;
}

export default function KanbanBoard({ session }: KanbanBoardProps) {
  const { cards, loading, error, addCard, moveCard, deleteCard, updateCard } =
    useKanban(session.user.id);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const handleDrop = async (column: KanbanColumn) => {
    if (!draggedCardId) return;
    const card = cards.find(c => c.id === draggedCardId);
    if (card && card.column !== column) {
      await moveCard(draggedCardId, column);
    }
    setDraggedCardId(null);
  };

  if (loading) {
    return (
      <div className="kanban-loading">
        <span className="spinner" />
        Loading board…
      </div>
    );
  }

  return (
    <div className="kanban-board" onDragEnd={() => setDraggedCardId(null)}>
      {error && (
        <div className="kanban-error">⚠️ {error}</div>
      )}
      {KANBAN_COLUMNS.map(col => (
        <KanbanColumnComponent
          key={col.id}
          column={col}
          cards={cards.filter(c => c.column === col.id)}
          draggedCardId={draggedCardId}
          onDragStart={setDraggedCardId}
          onDrop={handleDrop}
          onAddCard={addCard}
          onDeleteCard={deleteCard}
          onUpdateCard={updateCard}
        />
      ))}
    </div>
  );
}