import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import LockboxLogo from '../../components/common/LockboxLogo';

// Vault Navy — flat brand surface
const AUTH_BG = { backgroundColor: '#0A1628' };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={AUTH_BG}>
      <div className="mb-8 text-center">
        <LockboxLogo variant="wordmark-white" height={36} />
        <p className="mono-label text-ink-200 mt-5">Reset access — verified, every time.</p>
      </div>

      <div className="bg-white rounded-card p-7 w-full max-w-sm border border-ink-100">
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-4" size={48} style={{ color: '#1C9139' }} />
            <h3 className="font-semibold text-ink-800 text-lg">Check your email</h3>
            <p className="text-ink-400 text-sm mt-2">
              If <strong className="text-ink-800">{email}</strong> is registered, you&apos;ll receive a reset link shortly.
            </p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><Mail size={15} /></span>
                <input type="email" className="input pl-9" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-sm text-ink-400">
              Remembered your password?{' '}
              <Link to="/login" className="text-ink-800 font-semibold hover:underline">Go to Login</Link>
            </p>
          </form>
        )}
      </div>

      <div className="mt-6 flex items-center gap-5 mono-label text-ink-300">
        <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
      </div>
    </div>
  );
}
