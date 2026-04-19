import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, KeyRound, LogOut, Menu, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LockboxLogo from '../common/LockboxLogo';
import toast from 'react-hot-toast';

const SIDEBAR_BG = { backgroundColor: '#0A1628' };

const navItems = [
  { to: '/org',         icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/org/api-key', icon: KeyRound,        label: 'API Key' },
];

export default function OrganizationSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const logo = user?.profilePicture;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col" style={SIDEBAR_BG}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <LockboxLogo variant="icon-white" height={22} />
        </div>
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      <div className="px-5 pb-5 mt-2 flex items-center gap-3">
        {logo ? (
          <img src={logo} alt="" className="w-10 h-10 rounded-lg bg-white object-contain flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white/80" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-white/50">Organization</p>
          <p className="text-sm font-semibold text-white truncate">{user?.name || user?.firstName}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'text-white' : 'text-gray-400 hover:text-white'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: 'rgba(255,255,255,0.10)', borderLeft: '2px solid rgba(255,255,255,0.7)' }
                : {}
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
