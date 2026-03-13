import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Todo {
  id: string;
  user_id: string;
  title: string;
  is_complete: boolean;
  notified_at: string | null;
  created_at: string;
}

interface TodoListProps {
  userId: string;
}

export default function TodoList({ userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch todos on mount
  useEffect(() => {
    supabase!
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setFetchError(error.message);
        } else if (data) {
          setTodos(data as Todo[]);
        }
      });
  }, [userId]);

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    const { data, error } = await supabase!
      .from('todos')
      .insert({ title, user_id: userId })
      .select()
      .single();
    if (!error && data) {
      setTodos(prev => [...prev, data as Todo]);
      setNewTitle('');
    }
    setAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo();
  };

  // Toggle completion — triggers the Postgres trigger → Edge Function → email
  const toggleComplete = async (todo: Todo) => {
    setLoadingIds(prev => new Set(prev).add(todo.id));
    const { data, error } = await supabase!
      .from('todos')
      .update({ is_complete: !todo.is_complete })
      .eq('id', todo.id)
      .select()
      .single();
    if (!error && data) {
      setTodos(prev => prev.map(t => (t.id === data.id ? (data as Todo) : t)));
    }
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(todo.id);
      return next;
    });
  };

  const deleteTodo = async (id: string) => {
    setLoadingIds(prev => new Set(prev).add(id));
    const { error } = await supabase!.from('todos').delete().eq('id', id);
    if (!error) {
      setTodos(prev => prev.filter(t => t.id !== id));
    }
    setLoadingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const pending = todos.filter(t => !t.is_complete);
  const completed = todos.filter(t => t.is_complete);

  return (
    <div className="todo-section">
      <div className="todo-section-header">
        <span className="todo-section-title">My Tasks</span>
        <span className="todo-count-badge">{pending.length} remaining</span>
      </div>

      {fetchError && (
        <div className="todo-error">⚠ Could not load tasks: {fetchError}</div>
      )}

      {/* Add task input */}
      <div className="todo-input-row">
        <input
          className="todo-input"
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task…"
          disabled={adding}
          maxLength={200}
        />
        <button
          className="todo-add-btn"
          onClick={addTodo}
          disabled={adding || !newTitle.trim()}
        >
          {adding ? <span className="spinner" style={{ borderTopColor: '#fff' }} /> : '+'}
        </button>
      </div>

      {/* Pending todos */}
      {pending.length === 0 && completed.length === 0 && (
        <div className="todo-empty">No tasks yet. Add one above!</div>
      )}

      <ul className="todo-list">
        {pending.map(todo => (
          <li key={todo.id} className="todo-item">
            <button
              className="todo-checkbox"
              onClick={() => toggleComplete(todo)}
              disabled={loadingIds.has(todo.id)}
              aria-label="Mark complete"
            >
              {loadingIds.has(todo.id)
                ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#3ecf8e' }} />
                : <span className="todo-checkbox-inner" />}
            </button>
            <span className="todo-title">{todo.title}</span>
            <button
              className="todo-delete-btn"
              onClick={() => deleteTodo(todo.id)}
              disabled={loadingIds.has(todo.id)}
              aria-label="Delete task"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Completed todos */}
      {completed.length > 0 && (
        <>
          <div className="todo-completed-header">Completed</div>
          <ul className="todo-list">
            {completed.map(todo => (
              <li key={todo.id} className="todo-item todo-item--done">
                <button
                  className="todo-checkbox todo-checkbox--checked"
                  onClick={() => toggleComplete(todo)}
                  disabled={loadingIds.has(todo.id)}
                  aria-label="Mark incomplete"
                >
                  {loadingIds.has(todo.id)
                    ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#3ecf8e' }} />
                    : <span className="todo-checkbox-inner">✓</span>}
                </button>
                <span className="todo-title todo-title--done">{todo.title}</span>
                {todo.notified_at && (
                  <span className="todo-notified-badge" title={`Email sent ${new Date(todo.notified_at).toLocaleString()}`}>
                    📧
                  </span>
                )}
                <button
                  className="todo-delete-btn"
                  onClick={() => deleteTodo(todo.id)}
                  disabled={loadingIds.has(todo.id)}
                  aria-label="Delete task"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}