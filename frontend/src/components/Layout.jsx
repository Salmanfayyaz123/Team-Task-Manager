import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTeams } from '../api/teams';
import CreateTeamModal from './CreateTeamModal';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchTeams = () => {
    getTeams().then((r) => setTeams(r.data.teams)).catch(() => {});
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTeamCreated = (team) => {
    setTeams((prev) => [team, ...prev]);
    setShowCreateTeam(false);
    navigate(`/teams/${team.id}`);
  };

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 flex flex-col bg-white border-r border-surface-200
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-200">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-surface-800 tracking-tight">TeamFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <NavLink to="/" end className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
             ${isActive ? 'bg-brand-50 text-brand-500' : 'text-gray-600 hover:bg-surface-100'}`
          }>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>

          {/* Teams section */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Teams</span>
              <button onClick={() => setShowCreateTeam(true)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                title="New team">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {teams.length === 0 ? (
              <p className="px-3 text-xs text-gray-400 italic">No teams yet</p>
            ) : (
              teams.map((team) => (
                <NavLink key={team.id} to={`/teams/${team.id}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                     ${isActive ? 'bg-brand-50 text-brand-500 font-medium' : 'text-gray-600 hover:bg-surface-100'}`
                  }>
                  <span className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                    {team.name[0].toUpperCase()}
                  </span>
                  <span className="truncate">{team.name}</span>
                  {team.role === 'owner' && (
                    <span className="ml-auto text-xs text-brand-400">★</span>
                  )}
                </NavLink>
              ))
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="px-3 py-3 border-t border-surface-200">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-surface-800">TeamFlow</span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet context={{ refreshTeams: fetchTeams }} />
        </main>
      </div>

      {showCreateTeam && (
        <CreateTeamModal onClose={() => setShowCreateTeam(false)} onCreated={handleTeamCreated} />
      )}
    </div>
  );
}
