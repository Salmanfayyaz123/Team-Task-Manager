import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTeam, deleteTeam, addMember, removeMember } from '../api/teams';
import { getTasks } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import TaskModal from '../components/TaskModal';

export default function TeamPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', assignedTo: '' });
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const isOwner = members.find((m) => m.id === user?.id)?.role === 'owner';

  const fetchTeam = async () => {
    try {
      const res = await getTeam(teamId);
      setTeam(res.data.team);
      setMembers(res.data.members);
    } catch (e) {
      if (e.response?.status === 403) navigate('/');
    }
  };

  const fetchTasks = async (f = filters) => {
    const params = { teamId };
    if (f.search) params.search = f.search;
    if (f.status) params.status = f.status;
    if (f.priority) params.priority = f.priority;
    if (f.assignedTo) params.assignedTo = f.assignedTo;
    const res = await getTasks(params);
    setTasks(res.data.tasks);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTeam(), fetchTasks()]).finally(() => setLoading(false));
  }, [teamId]);

  const handleFilterChange = (f) => {
    setFilters(f);
    fetchTasks(f);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteLoading(true);
    try {
      await addMember(teamId, inviteEmail);
      setInviteEmail('');
      fetchTeam();
    } catch (err) {
      setInviteError(err.response?.data?.error || 'Failed to add member.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await removeMember(teamId, memberId);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Delete team "${team.name}"? This will also delete all tasks.`)) return;
    try {
      await deleteTeam(teamId);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete team.');
    }
  };

  const handleTaskSaved = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    fetchTasks();
  };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (!team) return <div className="text-center py-12 text-gray-400">Team not found.</div>;

  const stats = {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-600 text-lg font-bold">
              {team.name[0].toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-surface-800">{team.name}</h1>
          </div>
          {team.description && <p className="text-gray-500 text-sm ml-13">{team.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
            className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
          {isOwner && (
            <button onClick={handleDeleteTeam} className="btn-danger">
              Delete Team
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
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

          {/* Filters */}
          <TaskFilters filters={filters} onChange={handleFilterChange}
            teams={[]} members={members} showAssigneeFilter />

          {/* Tasks */}
          {tasks.length === 0 ? (
            <div className="text-center py-12 card">
              <p className="text-gray-500 font-medium">No tasks yet</p>
              <p className="text-gray-400 text-sm mt-1">Create the first task for this team.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task}
                  onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                  onDeleted={() => fetchTasks()} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Members */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-surface-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.role === 'owner' && (
                      <span className="badge bg-brand-50 text-brand-600">Owner</span>
                    )}
                    {isOwner && m.id !== user.id && (
                      <button onClick={() => handleRemoveMember(m.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member form (owner only) */}
            {isOwner && (
              <form onSubmit={handleInvite} className="mt-4 pt-4 border-t border-surface-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Add member by email</p>
                {inviteError && <p className="text-red-500 text-xs mb-2">{inviteError}</p>}
                <div className="flex gap-2">
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    className="input text-xs py-1.5" placeholder="email@example.com" required />
                  <button type="submit" disabled={inviteLoading} className="btn-primary text-xs px-3 py-1.5">
                    {inviteLoading ? '…' : 'Add'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          teams={[{ id: parseInt(teamId), name: team.name }]}
          defaultTeamId={parseInt(teamId)}
          members={members}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
}
