import React, { useState, useEffect } from 'react';
import { createTask, updateTask } from '../api/tasks';
import { getTeam } from '../api/teams';
import { format } from 'date-fns';

export default function TaskModal({ task, teams, defaultTeamId, members: propMembers, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    team_id: task?.team_id || defaultTeamId || (teams[0]?.id ?? ''),
    assigned_to: task?.assigned_to || '',
    due_date: task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : '',
  });
  const [members, setMembers] = useState(propMembers || []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // When team changes, load that team's members
  useEffect(() => {
    if (!form.team_id || propMembers) return;
    getTeam(form.team_id)
      .then((r) => setMembers(r.data.members))
      .catch(() => setMembers([]));
  }, [form.team_id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        ...form,
        team_id: parseInt(form.team_id),
        assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
        due_date: form.due_date || null,
      };
      if (isEdit) {
        await updateTask(task.id, payload);
      } else {
        await createTask(payload);
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        const map = {};
        data.errors.forEach((e) => { map[e.path] = e.msg; });
        setErrors(map);
      } else {
        setErrors({ general: data?.error || 'Failed to save task.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/40">
      <div className="modal-content card w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <h2 className="font-semibold text-surface-800">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-surface-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.general && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)}
              className="input" placeholder="Task title" required />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              className="input resize-none" rows={3} placeholder="Optional details…" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Team */}
            {!defaultTeamId && teams.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
                <select value={form.team_id} onChange={(e) => set('team_id', e.target.value)}
                  className="input" required>
                  <option value="">Select team</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <select value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)}
                className="input">
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className="input">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)}
                className="input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
            <input type="datetime-local" value={form.due_date}
              onChange={(e) => set('due_date', e.target.value)} className="input" />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
