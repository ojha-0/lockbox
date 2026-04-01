import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, Activity, Settings, LogOut, Search, Menu, Share2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LockboxLogo from '../common/LockboxLogo';
import toast from 'react-hot-toast';
import { useState } from 'react';

const SIDEBAR_BG = { backgroundColor: '#0e1826' };

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Documents' },
  { to: '/documents', icon: FileText, label: 'My Documents' },
  { to: '/shared', icon: Share2, label: 'Shared Documents' },
  { to: '/activity', icon: Activity, label: 'Activity Log' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function UserSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const avatarUrl = user?.profilePicture;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col" style={SIDEBAR_BG}>
      {/* Top: icon avatar + hamburger */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <LockboxLogo variant="icon-white" height={22} />
          </div>
        )}
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm text-gray-200 placeholder-gray-500 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/12 text-white border-l-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: 'rgba(255,255,255,0.10)', borderLeft: '2px solid rgba(255,255,255,0.7)' }
              : {}}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-200 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || user?.phone}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
