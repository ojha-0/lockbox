import { useState, useRef } from 'react';
import { Camera, User, Mail, Lock, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LockboxLogo from '../../components/common/LockboxLogo';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const avatarInputRef = useRef(null);

  // ── Profile section ──
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.profilePicture || null);
  const [avatarFile, setAvatarFile] = useState(null);

  // ── Password section ──
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwDone, setPwDone] = useState(false);

  // ── Avatar picker ──
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save profile ──
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const firstName = profileForm.firstName.trim();
    const lastName  = profileForm.lastName.trim();
    if (!firstName) { toast.error('First name cannot be empty'); return; }
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      if (avatarFile) formData.append('profilePicture', avatarFile);

      const { data } = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      updateUser(data.user || { firstName, lastName, profilePicture: avatarPreview });
      setAvatarFile(null);
      toast.success('Profile updated!');
    } catch (err) {
      try {
        const { data } = await api.put('/users/profile', { firstName, lastName });
        updateUser(data.user || { firstName, lastName });
        toast.success('Profile updated!');
      } catch (err2) {
        toast.error(err2.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Change password ──
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwDone(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
      setTimeout(() => setPwDone(false), 4000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* ── Profile card ── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Profile Information</h2>

        <form onSubmit={handleProfileSave} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: '#0e1826' }}>
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors shadow"
                title="Change photo"
              >
                <Camera size={13} />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile Photo</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or GIF — max 5 MB</p>
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="text-xs text-gray-700 underline mt-1 hover:text-black">
                Change photo
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={15} /></span>
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="First name"
                  value={profileForm.firstName}
                  onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Last Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={15} /></span>
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="Last name"
                  value={profileForm.lastName}
                  onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={15} /></span>
              <input type="email" className="input pl-9 opacity-60 cursor-not-allowed" value={user?.email || ''} readOnly />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-6" disabled={profileLoading}>
              {profileLoading ? <><Loader2 size={14} className="animate-spin" />Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password card ── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Change Password</h2>

        {pwDone ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={15} /></span>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Current password"
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={15} /></span>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Min. 8 characters"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={15} /></span>
                <input
                  type="password"
                  className="input pl-9"
                  placeholder="Repeat new password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary px-6" disabled={pwLoading}>
                {pwLoading ? <><Loader2 size={14} className="animate-spin" />Updating...</> : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <LockboxLogo variant="wordmark-dark" height={20} className="opacity-20 mx-auto" />
        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
          <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
        </div>
      </div>
    </div>
  );
}
