import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import LockboxLogo from '../../components/common/LockboxLogo';

const AUTH_BG = {
  background: 'radial-gradient(ellipse at 50% 30%, #162a44 0%, #0c1a2e 55%, #07101e 100%)',
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (!token) { toast.error('Invalid reset link'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={AUTH_BG}>
      <div className="mb-8 text-center">
        <LockboxLogo variant="wordmark-white" height={36} />
        <p className="text-gray-300 mt-4 text-base">Reset your password to LockBox Account</p>
      </div>

      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h3 className="font-bold text-gray-900 text-lg">Password Updated!</h3>
            <p className="text-gray-500 text-sm mt-2">Your password has been reset successfully.</p>
            <button onClick={() => navigate('/login')} className="btn-primary mt-6 rounded-xl">Go to Login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={15} /></span>
                <input type={showPass ? 'text' : 'password'} className="input pl-9 pr-10" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={15} /></span>
                <input type="password" className="input pl-9" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-3 rounded-xl" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Remembered your password?{' '}
              <Link to="/login" className="text-gray-900 font-semibold hover:underline">Go to Login</Link>
            </p>
          </form>
        )}
      </div>

      <div className="mt-6 flex items-center gap-5 text-xs text-gray-500">
        <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
      </div>
    </div>
  );
}
