import { useEffect, useState, useCallback } from 'react';
import {
  Share2, Eye, ShieldCheck, ShieldAlert, ShieldQuestion,
  Clock, CheckCircle, XCircle, X, Loader2, Inbox, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/format';

const DOC_TYPE_LABELS = {
  passport: 'Passport',
  national_id: 'National ID',
  citizenship_front: 'Citizenship Certificate',
  citizenship_back: 'Citizenship Certificate',
  drivers_license: "Driver's License",
  pan_card: 'PAN Card',
};

const FIELD_LABELS = {
  gender: 'Gender',
  dateOfBirthAD: 'Date of Birth (AD)',
  dobBS: 'Date of Birth (BS)',
  bloodGroup: 'Blood Group',
  birthAddress: 'Birth Address',
  permanentAddress: 'Permanent Address',
  temporaryAddress: 'Temporary Address',
  nationality: 'Nationality',
  passportNumber: 'Passport Number',
  passportIssueDate: 'Passport Issue Date',
  passportExpiryDate: 'Passport Expiry Date',
  nin: 'National ID Number',
  citizenshipNumber: 'Citizenship Number',
  citizenshipType: 'Citizenship Type',
  citizenshipIssuingDistrict: 'Issuing District',
  citizenshipIssueDate: 'Citizenship Issue Date',
  citizenshipIssuingOfficer: 'Issuing Officer',
  dlLicenseNumber: 'License Number',
  dlCategory: 'License Category',
  dlIssueDate: 'License Issue Date',
  dlExpiryDate: 'License Expiry Date',
  dlLicenseOffice: 'License Office',
  panNumber: 'PAN Number',
  panRegisteredOffice: 'PAN Registered Office',
};

function StatusPill({ status }) {
  const cfg = {
    NONE:    { icon: ShieldAlert,    label: 'Masked only',      cls: 'bg-gray-100 text-gray-700' },
    PENDING: { icon: Clock,          label: 'Request pending',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    GRANTED: { icon: ShieldCheck,    label: 'Full access',      cls: 'bg-green-50 text-green-700 border border-green-200' },
    DENIED:  { icon: XCircle,        label: 'Access denied',    cls: 'bg-red-50 text-red-700 border border-red-200' },
  }[status] || { icon: ShieldQuestion, label: status, cls: 'bg-gray-100 text-gray-700' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Detail Modal
// ─────────────────────────────────────────────────────────────
function ShareDetailModal({ shareId, role, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/shares/${shareId}`)
      .then(r => setData(r.data))
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load share');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [shareId, onClose]);

  useEffect(() => { load(); }, [load]);

  const requestAccess = async () => {
    setBusy(true);
    try {
      await api.post(`/shares/${shareId}/request-access`);
      toast.success('Access request sent');
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally { setBusy(false); }
  };

  const respond = async (decision) => {
    setBusy(true);
    try {
      await api.post(`/shares/${shareId}/respond`, { decision });
      toast.success(decision === 'GRANT' ? 'Full access granted' : 'Request denied');
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">
              {role === 'RECIPIENT' ? 'Shared with you' : 'You shared'}
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {loading || !data ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {role === 'RECIPIENT' ? 'From' : 'Shared with'}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {(role === 'RECIPIENT' ? data.fromUser : data.toUser)?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(role === 'RECIPIENT' ? data.fromUser : data.toUser)?.email}
                </p>
                {role === 'RECIPIENT' && data.fromUser?.phone && (
                  <p className="text-xs text-gray-500">{data.fromUser.phone}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Document</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {DOC_TYPE_LABELS[data.share.documentType] || data.share.documentType}
                  </p>
                </div>
                <StatusPill status={data.share.fullAccessStatus || 'NONE'} />
              </div>

              {/* Personal details */}
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
                {Object.entries(data.personal).map(([key, value]) => {
                  const isNumberField = key === data.numberField;
                  const display = value || <span className="text-gray-300">—</span>;
                  return (
                    <div key={key} className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <span className="text-xs text-gray-500 font-medium">{FIELD_LABELS[key] || key}</span>
                      <span className={`text-sm text-right ${isNumberField ? 'font-mono font-bold tracking-wider text-gray-900' : 'text-gray-800'}`}>
                        {isNumberField && !data.granted && value
                          ? <span title="Masked — full access not granted">{value}</span>
                          : display}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-gray-400">
                Shared on {formatDateTime(data.share.sharedAt)}
                {data.share.fullAccessRespondedAt && (
                  <> · Responded {formatDateTime(data.share.fullAccessRespondedAt)}</>
                )}
              </div>

              {/* Recipient actions */}
              {role === 'RECIPIENT' && (
                <div className="pt-2">
                  {(data.share.fullAccessStatus || 'NONE') === 'NONE' && (
                    <button
                      onClick={requestAccess}
                      disabled={busy}
                      className="btn-primary w-full"
                    >
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <ShieldQuestion size={14} />}
                      Request Full Document Access
                    </button>
                  )}
                  {(data.share.fullAccessStatus || 'NONE') === 'PENDING' && (
                    <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                      Your request is pending. You'll see the full document number here once the sender approves it.
                    </div>
                  )}
                  {(data.share.fullAccessStatus || 'NONE') === 'GRANTED' && (
                    <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center justify-center gap-1.5">
                      <ShieldCheck size={13} />Full access granted — document number is visible above.
                    </div>
                  )}
                  {(data.share.fullAccessStatus || 'NONE') === 'DENIED' && (
                    <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      The sender denied your full-access request.
                    </div>
                  )}
                </div>
              )}

              {/* Sender actions */}
              {role === 'SENDER' && (data.share.fullAccessStatus || 'NONE') === 'PENDING' && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-gray-600 text-center">
                    {data.toUser?.name} is requesting full access to this document number.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => respond('DENY')}
                      disabled={busy}
                      className="btn-secondary w-full"
                    >
                      <XCircle size={14} />Deny
                    </button>
                    <button
                      onClick={() => respond('GRANT')}
                      disabled={busy}
                      className="btn-primary w-full"
                    >
                      <CheckCircle size={14} />Grant
                    </button>
                  </div>
                </div>
              )}

              {role === 'SENDER' && (data.share.fullAccessStatus || 'NONE') === 'GRANTED' && (
                <div className="pt-2">
                  <button
                    onClick={() => respond('DENY')}
                    disabled={busy}
                    className="btn-secondary w-full"
                  >
                    <XCircle size={14} />Revoke full access
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
function ShareCard({ share, role, onView, onAction }) {
  const other = role === 'RECIPIENT' ? share.fromUser : share.toUser;
  const label = DOC_TYPE_LABELS[share.documentType] || share.documentType;
  const initial = other?.name?.[0]?.toUpperCase() || '?';
  // Treat missing/unknown status as NONE so pre-migration rows still render
  // the "Request Full Access" flow instead of looking broken.
  const status = share.fullAccessStatus || 'NONE';
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-700">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{other?.name}</p>
          {status === 'PENDING' && role === 'SENDER' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
              Action needed
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {label} · <span className="font-mono">{share.maskedNumber}</span> · {formatDateTime(share.sharedAt)}
        </p>
        <div className="mt-1.5">
          <StatusPill status={status} />
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-shrink-0 w-44">
        <button onClick={onView} className="btn-secondary w-full">
          <Eye size={14} />View
        </button>

        {role === 'RECIPIENT' && status === 'NONE' && (
          <button
            onClick={() => run(() => onAction('request', share.id))}
            disabled={busy}
            className="btn-primary w-full text-xs"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <ShieldQuestion size={12} />}
            Request Full Access
          </button>
        )}
        {role === 'RECIPIENT' && status === 'DENIED' && (
          <button
            onClick={() => run(() => onAction('request', share.id))}
            disabled={busy}
            className="btn-secondary w-full text-xs"
          >
            <ShieldQuestion size={12} />Request Again
          </button>
        )}

        {role === 'SENDER' && status === 'PENDING' && (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => run(() => onAction('deny', share.id))}
              disabled={busy}
              className="btn-secondary text-xs"
            >
              <XCircle size={12} />Deny
            </button>
            <button
              onClick={() => run(() => onAction('grant', share.id))}
              disabled={busy}
              className="btn-primary text-xs"
            >
              <CheckCircle size={12} />Grant
            </button>
          </div>
        )}
        {role === 'SENDER' && status === 'GRANTED' && (
          <button
            onClick={() => run(() => onAction('revoke', share.id))}
            disabled={busy}
            className="btn-secondary w-full text-xs"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
            Revoke Access
          </button>
        )}
        {role === 'SENDER' && status === 'NONE' && (
          <span className="text-[10px] text-gray-400 text-center">Masked only</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SharedWithMePage() {
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // { id, role }

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/shares/received').then(r => r.data.shares),
      api.get('/shares/sent').then(r => r.data.shares),
    ])
      .then(([r, s]) => { setReceived(r); setSent(s); })
      .catch(() => toast.error('Failed to load shares'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const runAction = async (kind, shareId) => {
    try {
      if (kind === 'request') {
        await api.post(`/shares/${shareId}/request-access`);
        toast.success('Access request sent');
      } else if (kind === 'grant') {
        await api.post(`/shares/${shareId}/respond`, { decision: 'GRANT' });
        toast.success('Full access granted');
      } else if (kind === 'deny' || kind === 'revoke') {
        await api.post(`/shares/${shareId}/respond`, { decision: 'DENY' });
        toast.success(kind === 'revoke' ? 'Access revoked' : 'Request denied');
      }
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    }
  };

  const pendingInbound = received.filter(s => s.fullAccessStatus === 'PENDING').length;
  const pendingOutbound = sent.filter(s => s.fullAccessStatus === 'PENDING').length;

  const list = tab === 'received' ? received : sent;
  const role = tab === 'received' ? 'RECIPIENT' : 'SENDER';

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shared Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          View documents shared with you, and manage access requests on documents you've shared.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'received' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Inbox size={15} />Shared with me
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
            {received.length}
          </span>
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'sent' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Send size={15} />I shared
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
            {sent.length}
          </span>
          {pendingOutbound > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
              {pendingOutbound} pending
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === 'received' ? 'No shared documents yet' : 'You haven\'t shared anything yet'}
          description={tab === 'received'
            ? 'When someone shares a document number with you, it will appear here.'
            : 'Share a document from My Documents to see it here.'}
        />
      ) : (
        <div className="space-y-3">
          {list.map(share => (
            <ShareCard
              key={share.id}
              share={share}
              role={role}
              onView={() => setActive({ id: share.id, role })}
              onAction={runAction}
            />
          ))}
        </div>
      )}

      {active && (
        <ShareDetailModal
          shareId={active.id}
          role={active.role}
          onClose={() => setActive(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
}
