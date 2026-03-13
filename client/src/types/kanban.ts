export type KanbanColumn = 'todo' | 'in_progress' | 'done';

export interface KanbanCard {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  column: KanbanColumn;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumnDef {
  id: KanbanColumn;
  label: string;
  color: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: 'todo',        label: 'To Do',       color: '#64748b' },
  { id: 'in_progress', label: 'In Progress',  color: '#f59e0b' },
  { id: 'done',        label: 'Done',         color: '#3ecf8e' },
];