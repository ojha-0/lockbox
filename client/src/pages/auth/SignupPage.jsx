import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, Share2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { clearLegacyFormKeys } from '../../utils/formStorage';
import LockboxLogo from '../../components/common/LockboxLogo';
import OtpBoxes from '../../components/common/OtpBoxes';

// Vault Navy — flat brand surface
const AUTH_BG = { backgroundColor: '#0A1628' };

const features = [
  {
    icon: ShieldCheck,
    title: 'One-Click Identity Verification',
    desc: 'No more repetitive uploads or manual checks — users stay in control while businesses get instant, secure verification.',
  },
  {
    icon: Share2,
    title: 'Consent-Driven Data Sharing',
    desc: 'Every transaction is logged, giving users full visibility and control over who accesses their data.',
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    desc: 'Built-in security ensures that both users and businesses can rely on a safe, tamper-proof verification process.',
  },
];

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const phoneValid = form.phone.trim().length >= 7;
  const emailOtpValid = emailOtp === '1234';
  const phoneOtpValid = phoneOtp === '1234';

  const validate = () => {
    const e = {};
    if (!form.firstName || form.firstName.length < 1) e.firstName = 'First name required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!emailOtpValid) { toast.error('Please verify your email OTP'); return; }
    if (form.phone && !phoneOtpValid) { toast.error('Please verify your phone OTP'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', {
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        email: form.email,
        password: form.password,
        ...(form.phone ? { phone: form.phone } : {}),
      });
      // Drop any legacy non-namespaced form data from a previous user on this
      // browser so the new account starts with empty details.
      clearLegacyFormKeys();
      login(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created! Welcome to LockBox.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); },
  });

  return (
    <div className="min-h-screen flex" style={AUTH_BG}>
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12">
        <div>
          <LockboxLogo variant="wordmark-white" height={32} />
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-white">Setup your account</h2>
            <p className="text-ink-300 mt-1.5 text-sm">Secure Document Storage with reusable KYC</p>
          </div>
          <div className="mt-10 space-y-7">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-ink-300 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-600">
          <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-card p-8 w-full max-w-md border border-ink-100">
          <h2 className="text-lg font-bold text-ink-800 text-center border-b border-ink-100 pb-4 mb-5">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><User size={14} /></span>
                  <input type="text" className={`input pl-8 ${errors.firstName ? 'input-error' : ''}`} placeholder="First Name" {...field('firstName')} />
                </div>
                {errors.firstName && <p className="text-[color:#FF383C] text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><User size={14} /></span>
                  <input type="text" className="input pl-8" placeholder="Last Name" {...field('lastName')} />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><Phone size={14} /></span>
                <input type="tel" className="input pl-8" placeholder="+977 98XXXXXXXX" {...field('phone')} />
              </div>
              {phoneValid && (
                <div className="mt-2 p-3 rounded-lg bg-paper border border-ink-100">
                  <p className="text-xs text-ink-600 mb-2 flex items-center justify-between">
                    <span>Enter the 4-digit code sent to your phone</span>
                    {phoneOtpValid && <span className="text-[color:#1C9139] font-semibold flex items-center gap-1"><ShieldCheck size={12} />Verified</span>}
                  </p>
                  <OtpBoxes value={phoneOtp} onChange={setPhoneOtp} error={phoneOtp.length === 4 && !phoneOtpValid} />
                  {phoneOtp.length === 4 && !phoneOtpValid && (
                    <p className="text-[color:#FF383C] text-xs mt-1">Invalid OTP. Hint: 1234</p>
                  )}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><Mail size={14} /></span>
                <input type="email" className={`input pl-8 ${errors.email ? 'input-error' : ''}`} placeholder="Email" {...field('email')} />
              </div>
              {errors.email && <p className="text-[color:#FF383C] text-xs mt-1">{errors.email}</p>}
              {emailValid && (
                <div className="mt-2 p-3 rounded-lg bg-paper border border-ink-100">
                  <p className="text-xs text-ink-600 mb-2 flex items-center justify-between">
                    <span>Enter the 4-digit code sent to your email</span>
                    {emailOtpValid && <span className="text-[color:#1C9139] font-semibold flex items-center gap-1"><ShieldCheck size={12} />Verified</span>}
                  </p>
                  <OtpBoxes value={emailOtp} onChange={setEmailOtp} error={emailOtp.length === 4 && !emailOtpValid} />
                  {emailOtp.length === 4 && !emailOtpValid && (
                    <p className="text-[color:#FF383C] text-xs mt-1">Invalid OTP. Hint: 1234</p>
                  )}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"><Lock size={14} /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input pl-8 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Password"
                  {...field('password')}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-600" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[color:#FF383C] text-xs mt-1">{errors.password}</p>}
              <p className="text-xs text-ink-300 mt-1">Minimum length is 8 characters.</p>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Signup'}
            </button>
          </form>

          <p className="text-center text-xs text-ink-300 mt-3">
            By creating an account, you agree to the{' '}
            <span className="text-ink-600 underline cursor-pointer">Terms of Service</span>.
          </p>
          <p className="text-center text-sm text-ink-400 mt-3">
            Already have an account?{' '}
            <Link to="/login" className="text-ink-800 font-semibold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
