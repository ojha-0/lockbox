import { useEffect, useState } from 'react';
import { Copy, Loader2, RotateCw, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrgApiKeyPage() {
  const { user, updateUser } = useAuth();
  const [org, setOrg] = useState(null);
  const [rotating, setRotating] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/organization/me');
        setOrg(data.organization);
        // Keep apiKey fresh on the client so the sidebar/header reflects any
        // rotation that happened server-side since login.
        if (data.organization?.apiKey) updateUser({ apiKey: data.organization.apiKey });
      } catch {
        toast.error('Could not load organization profile');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apiKey = org?.apiKey || user?.apiKey || '';
  const masked = apiKey ? apiKey.slice(0, 12) + '•'.repeat(Math.max(0, apiKey.length - 16)) + apiKey.slice(-4) : '';

  const rotate = async () => {
    if (rotating) return;
    if (!confirm('Rotating invalidates the current key immediately. Continue?')) return;
    setRotating(true);
    try {
      const { data } = await api.post('/organization/api-key/rotate');
      setOrg(data.organization);
      updateUser({ apiKey: data.organization.apiKey });
      setRevealed(true);
      toast.success('New API key generated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not rotate key');
    } finally {
      setRotating(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Clipboard not available');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Key</h1>
        <p className="text-sm text-gray-500 mt-1">
          Use this key to authenticate calls from your systems. Treat it like a password — anyone with it can verify users on your behalf.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <KeyRound size={16} className="text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-800">Your key</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-mono break-all select-all">
                {apiKey ? (revealed ? apiKey : masked) : 'No key issued yet'}
              </code>
              <button
                type="button"
                onClick={() => setRevealed(v => !v)}
                disabled={!apiKey}
                className="btn-secondary px-3"
              >
                {revealed ? 'Hide' : 'Reveal'}
              </button>
              <button
                type="button"
                onClick={copy}
                disabled={!apiKey}
                className="btn-secondary px-3 inline-flex items-center gap-1.5"
              >
                {copied ? <CheckCircle size={13} className="text-green-600" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Issued {formatDate(org?.apiKeyIssuedAt)}.
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={rotate}
              disabled={rotating}
              className="btn-secondary px-4 inline-flex items-center gap-1.5"
            >
              {rotating ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
              Rotate key
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Rotating generates a new key and revokes the previous one immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-800">How to call the verification API</h2>
        </div>
        <div className="p-5 text-xs">
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
{`POST /api/v1/verify/user
X-API-Key: ${apiKey || '<your-api-key>'}
Content-Type: application/json

{
  "firstName": "Saugat",
  "lastName":  "Ojha",
  "phone":     "+977 98XXXXXXXX"
}

→ 200 OK
{
  "verified": true,
  "user": {
    "firstName": "Saugat",
    "lastName":  "Ojha",
    "name":      "Saugat Ojha",
    "email":     "saugat@lockbox.com",
    "phone":     "+977 98XXXXXXXX",
    "documentVerifiedAt": "2026-04-17T12:34:00.000Z"
  }
}`}
          </pre>
          <p className="text-gray-500 mt-3 leading-relaxed">
            The endpoint matches on <b>firstName + lastName + phone</b>. A match only counts as verified if
            the LockBox user has at least one admin-approved document on file. Every call is
            logged to your dashboard, whether it matched or not.
          </p>
        </div>
      </div>
    </div>
  );
}
