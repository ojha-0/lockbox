import { useEffect, useState } from 'react';
import { Building2, Plus, RotateCw, Trash2, Copy, Loader2, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/organizations');
      setOrgs(data.organizations || []);
    } catch {
      toast.error('Could not load organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const rotate = async (org) => {
    if (!confirm(`Rotate API key for ${org.name}? The previous key stops working immediately.`)) return;
    try {
      const { data } = await api.post(`/admin/organizations/${org.id}/rotate-key`);
      setOrgs(prev => prev.map(o => o.id === org.id ? data.organization : o));
      toast.success('Key rotated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not rotate key');
    }
  };

  const remove = async (org) => {
    if (!confirm(`Delete organization "${org.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/organizations/${org.id}`);
      setOrgs(prev => prev.filter(o => o.id !== org.id));
      toast.success('Organization deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Third-party apps that verify LockBox users through the public API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary px-4 inline-flex items-center gap-1.5"
        >
          <Plus size={14} /> New organization
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center text-gray-500">
            <Loader2 size={18} className="animate-spin mr-2" /> Loading…
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            <Building2 size={22} className="mx-auto mb-2 text-gray-400" />
            No organizations yet. Create one to issue an API key.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Company</th>
                  <th className="text-left font-semibold px-5 py-2.5">Email</th>
                  <th className="text-left font-semibold px-5 py-2.5">API key</th>
                  <th className="text-left font-semibold px-5 py-2.5">Created</th>
                  <th className="text-right font-semibold px-5 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map(org => (
                  <OrgRow key={org.id} org={org} onRotate={rotate} onDelete={remove} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onCreated={(org) => {
            setOrgs(prev => [org, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function OrgRow({ org, onRotate, onDelete }) {
  const [copied, setCopied] = useState(false);
  const key = org.apiKey || '';
  const masked = key ? key.slice(0, 12) + '•'.repeat(Math.max(0, key.length - 16)) + key.slice(-4) : '—';

  const copy = async () => {
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Clipboard not available');
    }
  };

  return (
    <tr>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          {org.profilePicture ? (
            <img src={org.profilePicture} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-200" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Building2 size={14} className="text-gray-500" />
            </div>
          )}
          <span className="font-medium text-gray-800">{org.name}</span>
        </div>
      </td>
      <td className="px-5 py-3 text-gray-600">{org.email}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
          <code className="text-xs font-mono text-gray-700">{masked}</code>
          <button type="button" onClick={copy} className="text-gray-400 hover:text-gray-700" title="Copy full key">
            {copied ? <CheckCircle size={13} className="text-green-600" /> : <Copy size={13} />}
          </button>
        </div>
      </td>
      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(org.createdAt)}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => onRotate(org)} className="text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 text-xs">
            <RotateCw size={12} /> Rotate
          </button>
          <button type="button" onClick={() => onDelete(org)} className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 text-xs">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function CreateOrgModal({ onClose, onCreated }) {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!companyName.trim() || !email.trim() || !password) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('companyName', companyName.trim());
      fd.append('email', email.trim());
      fd.append('password', password);
      if (logo) fd.append('logo', logo);

      const { data } = await api.post('/admin/organizations', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Organization created');
      onCreated(data.organization);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not create organization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">New organization</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="label">Company name</label>
            <input
              className="input"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Company email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="api@acme.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>
          <div>
            <label className="label">Company logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setLogo(e.target.files?.[0] || null)}
              className="block text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-white hover:file:bg-gray-50"
            />
          </div>
          <p className="text-xs text-gray-500">
            An API key will be generated automatically and shown in the list once the organization is created.
          </p>
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-2 bg-gray-50">
          <button type="button" onClick={onClose} className="btn-secondary px-4">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary px-5 inline-flex items-center gap-1.5">
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
