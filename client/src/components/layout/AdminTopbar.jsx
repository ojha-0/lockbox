import { useAuth } from '../../context/AuthContext';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-ink-100 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ink-800 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-ink-800 leading-none">{user?.name}</p>
            <p className="mono-label mt-1">Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-paper text-ink-300 hover:text-ink-800 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
