import { useState } from 'react';
import type { KanbanCard, KanbanColumn as KanbanColumnType, KanbanColumnDef } from '../types/kanban';
import KanbanCardComponent from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnDef;
  cards: KanbanCard[];
  draggedCardId: string | null;
  onDragStart: (id: string) => void;
  onDrop: (column: KanbanColumnType) => void;
  onAddCard: (title: string, description: string, column: KanbanColumnType) => void;
  onDeleteCard: (id: string) => void;
  onUpdateCard: (id: string, title: string, description: string) => void;
}

export default function KanbanColumn({
  column, cards, draggedCardId, onDragStart, onDrop,
  onAddCard, onDeleteCard, onUpdateCard,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedCardId) onDrop(column.id);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(newTitle.trim(), newDesc.trim(), column.id);
    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  };

  return (
    <div
      className={`kanban-column${isDragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-title">{column.label}</span>
        <span className="kanban-column-count" style={{ background: column.color }}>
          {cards.length}
        </span>
      </div>

      <div className="kanban-cards-list">
        {cards.map(card => (
          <KanbanCardComponent
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
            onUpdate={onUpdateCard}
            onDragStart={onDragStart}
          />
        ))}
      </div>

      {showAddForm ? (
        <form className="add-card-form" onSubmit={handleAddSubmit}>
          <input
            className="kanban-card-input"
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Card title…"
            onKeyDown={e => e.key === 'Escape' && setShowAddForm(false)}
          />
          <textarea
            className="kanban-card-textarea"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            onKeyDown={e => e.key === 'Escape' && setShowAddForm(false)}
          />
          <div className="kanban-card-edit-actions">
            <button type="submit" className="kanban-btn-save">Add Card</button>
            <button type="button" className="kanban-btn-cancel" onClick={() => {
              setShowAddForm(false);
              setNewTitle('');
              setNewDesc('');
            }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-card-btn" onClick={() => setShowAddForm(true)}>
          + Add card
        </button>
      )}
    </div>
  );
}