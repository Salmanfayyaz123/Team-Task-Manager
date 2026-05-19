import React, { useState } from 'react';
import { deleteTask, updateTask } from '../api/tasks';
import { format, isPast, isToday } from 'date-fns';

const STATUS_STYLES = {
  todo: 'bg-blue-50 text-blue-600',
  in_progress: 'bg-amber-50 text-amber-600',
  done: 'bg-green-50 text-green-600',
};
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-orange-50 text-orange-500',
  high: 'bg-red-50 text-red-500',
};

export default function TaskCard({ task, onEdit, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      onDeleted();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task.');
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    setStatus(newStatus);
    try {
      await updateTask(task.id, { status: newStatus });
    } catch {
      setStatus(task.status); // revert
    } finally {
      setUpdatingStatus(false);
    }
  };

  const dueDateDisplay = task.due_date ? format(new Date(task.due_date), 'MMM d') : null;
  const dueOverdue = task.due_date && isPast(new Date(task.due_date)) && status !== 'done';
  const dueTodayFlag = task.due_date && isToday(new Date(task.due_date));

  return (
    <div className={`card p-4 hover:shadow-md transition-all duration-150 ${status === 'done' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Status checkbox-like toggle */}
        <button onClick={() => handleStatusChange(status === 'done' ? 'todo' : 'done')}
          disabled={updatingStatus}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
            ${status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-brand-400'}`}>
          {status === 'done' && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium text-surface-800 ${status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onEdit(task)}
                className="p-1 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Status selector */}
            <select value={status} onChange={(e) => handleStatusChange(e.target.value)}
              className={`badge cursor-pointer border-0 focus:outline-none ${STATUS_STYLES[status]}`}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <span className={`badge ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>

            {task.team_name && (
              <span className="badge bg-surface-100 text-gray-500">{task.team_name}</span>
            )}

            {task.assigned_to_name && (
              <span className="badge bg-purple-50 text-purple-600">
                @{task.assigned_to_name}
              </span>
            )}

            {dueDateDisplay && (
              <span className={`badge ${dueOverdue ? 'bg-red-100 text-red-600' : dueTodayFlag ? 'bg-amber-100 text-amber-600' : 'bg-surface-100 text-gray-500'}`}>
                {dueOverdue ? '⚠ ' : ''}{dueDateDisplay}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
