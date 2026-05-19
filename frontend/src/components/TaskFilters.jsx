import React from 'react';

export default function TaskFilters({ filters, onChange, teams = [], members = [], showAssigneeFilter = false }) {
  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" value={filters.search} onChange={(e) => set('search', e.target.value)}
          className="input pl-9 text-sm" placeholder="Search tasks…" />
      </div>

      {/* Team filter */}
      {teams.length > 0 && (
        <select value={filters.teamId} onChange={(e) => set('teamId', e.target.value)}
          className="input w-auto text-sm">
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      {/* Assignee filter */}
      {showAssigneeFilter && members.length > 0 && (
        <select value={filters.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}
          className="input w-auto text-sm">
          <option value="">All assignees</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      )}

      {/* Status filter */}
      <select value={filters.status} onChange={(e) => set('status', e.target.value)}
        className="input w-auto text-sm">
        <option value="">All statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      {/* Priority filter */}
      <select value={filters.priority} onChange={(e) => set('priority', e.target.value)}
        className="input w-auto text-sm">
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* Clear filters */}
      {(filters.search || filters.teamId || filters.status || filters.priority || filters.assignedTo) && (
        <button onClick={() => onChange({ search: '', teamId: '', status: '', priority: '', assignedTo: '' })}
          className="btn-ghost text-sm text-gray-400">
          Clear
        </button>
      )}
    </div>
  );
}
