import { useState, useRef, useEffect } from 'react';
import type { KanbanCard as KanbanCardType } from '../types/kanban';

interface KanbanCardProps {
  card: KanbanCardType;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, description: string) => void;
  onDragStart: (id: string) => void;
}

export default function KanbanCard({ card, onDelete, onUpdate, onDragStart }: KanbanCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDesc, setEditDesc] = useState(card.description ?? '');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    if (!editTitle.trim()) return;
    onUpdate(card.id, editTitle.trim(), editDesc.trim());
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(card.title);
      setEditDesc(card.description ?? '');
      setEditing(false);
    }
  };

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(card.id);
      }}
    >
      {editing ? (
        <div className="kanban-card-edit">
          <input
            ref={titleRef}
            className="kanban-card-input"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Card title"
          />
          <textarea
            className="kanban-card-textarea"
            value={editDesc}
            onChange={e => setEditDesc(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Description (optional)"
            rows={2}
          />
          <div className="kanban-card-edit-actions">
            <button className="kanban-btn-save" onClick={handleSave}>Save</button>
            <button className="kanban-btn-cancel" onClick={() => {
              setEditTitle(card.title);
              setEditDesc(card.description ?? '');
              setEditing(false);
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="kanban-card-view">
          <div className="kanban-card-title" onClick={() => setEditing(true)}>
            {card.title}
          </div>
          {card.description && (
            <div className="kanban-card-desc">{card.description}</div>
          )}
          <div className="kanban-card-actions">
            <button className="kanban-card-edit-btn" onClick={() => setEditing(true)} title="Edit">✏️</button>
            <button className="kanban-card-delete-btn" onClick={() => onDelete(card.id)} title="Delete">🗑️</button>
          </div>
        </div>
      )}
    </div>
  );
}