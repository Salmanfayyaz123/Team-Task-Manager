import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks, getDueSoon } from '../api/tasks';
import { getTeams } from '../api/teams';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import TaskModal from '../components/TaskModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [filters, setFilters] = useState({ search: '', teamId: '', status: '', priority: '' });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchAll = async (f = filters) => {
    try {
      const params = {};
      if (f.search) params.search = f.search;
      if (f.teamId) params.teamId = f.teamId;
      if (f.status) params.status = f.status;
      if (f.priority) params.priority = f.priority;

      const [tasksRes, teamsRes, dueRes] = await Promise.all([
        getTasks(params),
        getTeams(),
        getDueSoon(),
      ]);
      setTasks(tasksRes.data.tasks);
      setTeams(teamsRes.data.teams);
      setDueSoon(dueRes.data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchAll(newFilters);
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    fetchAll();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleted = () => fetchAll();

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-800">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening across your teams.</p>
        </div>
        {teams.length > 0 && (
          <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
            className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        )}
      </div>

      {/* Due soon banner */}
      {dueSoon.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {dueSoon.length} task{dueSoon.length > 1 ? 's' : ''} due in the next 24 hours
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {dueSoon.map((t) => t.title).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-surface-800', bg: 'bg-surface-100' },
          { label: 'To Do', value: stats.todo, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Done', value: stats.done, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s) => (
          <div key={s.label} className={`card p-4 ${s.bg} border-0`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Teams quick access */}
      {teams.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Teams</h2>
          <div className="flex flex-wrap gap-2">
            {teams.map((team) => (
              <Link key={team.id} to={`/teams/${team.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-surface-200 text-sm text-gray-700 hover:border-brand-300 hover:text-brand-600 transition-colors">
                <span className="w-5 h-5 rounded bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-600 text-xs font-bold">
                  {team.name[0].toUpperCase()}
                </span>
                {team.name}
                <span className="text-xs text-gray-400">({team.member_count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <TaskFilters filters={filters} onChange={handleFilterChange} teams={teams} />

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">
            {teams.length === 0 ? 'Create a team first, then add tasks.' : 'Create a new task to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={handleEdit} onDeleted={handleDeleted} />
          ))}
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          teams={teams}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
