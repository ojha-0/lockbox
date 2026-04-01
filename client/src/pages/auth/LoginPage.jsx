import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LockboxLogo from '../../components/common/LockboxLogo';

const AUTH_BG = {
  background: 'radial-gradient(ellipse at 50% 30%, #162a44 0%, #0c1a2e 55%, #07101e 100%)',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.identifier) e.identifier = mode === 'email' ? 'Email is required' : 'Phone number is required';
    else if (mode === 'email' && !/\S+@\S+\.\S+/.test(form.identifier)) e.identifier = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = mode === 'email'
        ? { email: form.identifier, password: form.password }
        : { phone: form.identifier, password: form.password };
      const { data } = await api.post('/auth/login', payload);
      login(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={AUTH_BG}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <LockboxLogo variant="wordmark-white" height={36} />
        <p className="text-gray-300 mt-4 text-base">Login to LockBox Account</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl">
        {/* Email / Phone toggle */}
        <div className="flex rounded-lg border border-gray-200 mb-5 overflow-hidden">
          <button
            type="button"
            onClick={() => { setMode('email'); setForm(f => ({ ...f, identifier: '' })); setErrors({}); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'email' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Mail size={13} className="inline mr-1.5" />Email
          </button>
          <button
            type="button"
            onClick={() => { setMode('phone'); setForm(f => ({ ...f, identifier: '' })); setErrors({}); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'phone' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Phone size={13} className="inline mr-1.5" />Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier */}
          <div>
            <label className="label">{mode === 'email' ? 'Email' : 'Phone Number'}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {mode === 'email' ? <Mail size={15} /> : <Phone size={15} />}
              </span>
              <input
                type={mode === 'email' ? 'email' : 'tel'}
                className={`input pl-9 ${errors.identifier ? 'input-error' : ''}`}
                placeholder={mode === 'email' ? 'you@example.com' : '+977 98XXXXXXXX'}
                value={form.identifier}
                onChange={(e) => { setForm(f => ({ ...f, identifier: e.target.value })); setErrors(er => ({ ...er, identifier: '' })); }}
              />
            </div>
            {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Password</label>
              <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-gray-800">Forgot Password?</Link>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={15} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Password"
                value={form.password}
                onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })); }}
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-800" />
            <span className="text-sm text-gray-600">Remember Me</span>
          </label>

          <button type="submit" className="btn-primary w-full py-3 rounded-xl" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Do not have an account?{' '}
          <Link to="/signup" className="text-gray-900 font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center gap-5 text-xs text-gray-500">
        <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
      </div>
    </div>
  );
}
