import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserCheck, UserX, FileText, ScrollText,
  CheckCircle, XCircle, ShieldCheck, ShieldAlert, ShieldQuestion, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import { formatDate, formatDateTime, formatFileSize } from '../../utils/format';

const PERSONAL_SECTIONS = [
  { title: 'Basic Information', fields: [
    ['gender', 'Gender'],
    ['dateOfBirthAD', 'Date of Birth (AD)'],
    ['dobBS', 'Date of Birth (BS)'],
    ['bloodGroup', 'Blood Group'],
    ['nationality', 'Nationality'],
  ]},
  { title: 'Addresses', fields: [
    ['birthAddress', 'Birth Address'],
    ['permanentAddress', 'Permanent Address'],
    ['temporaryAddress', 'Temporary Address'],
  ]},
  { title: 'Citizenship', fields: [
    ['citizenshipNumber', 'Citizenship Number'],
    ['citizenshipType', 'Type'],
    ['citizenshipIssuingDistrict', 'Issuing District'],
    ['citizenshipIssueDate', 'Issue Date'],
    ['citizenshipIssuingOfficer', 'Issuing Officer'],
  ]},
  { title: 'Passport', fields: [
    ['passportNumber', 'Passport Number'],
    ['passportIssueDate', 'Issue Date'],
    ['passportExpiryDate', 'Expiry Date'],
  ]},
  { title: 'National ID', fields: [['nin', 'NIN']] },
  { title: "Driver's License", fields: [
    ['dlLicenseNumber', 'License Number'],
    ['dlCategory', 'Category'],
    ['dlIssueDate', 'Issue Date'],
    ['dlExpiryDate', 'Expiry Date'],
    ['dlLicenseOffice', 'License Office'],
  ]},
  { title: 'PAN', fields: [
    ['panNumber', 'PAN Number'],
    ['panRegisteredOffice', 'Registered Office'],
  ]},
];

function PersonalStatusPill({ status }) {
  const cfg = {
    VERIFIED:             { icon: ShieldCheck,    cls: 'bg-green-50 text-green-700 border border-green-200', label: 'Verified' },
    PENDING_VERIFICATION: { icon: ShieldQuestion, cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Pending verification' },
    DECLINED:             { icon: ShieldAlert,   cls: 'bg-red-50 text-red-700 border border-red-200',       label: 'Declined' },
  }[status] || { icon: ScrollText, cls: 'bg-gray-100 text-gray-500', label: 'Unknown' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function PersonalDetailsCard({ details, onVerify, onDecline, busy }) {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [reason, setReason] = useState('');

  if (!details) {
    return (
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ScrollText size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Personal Details</h2>
        </div>
        <div className="p-5 text-sm text-gray-400 text-center">
          This user has not saved any personal details yet.
        </div>
      </div>
    );
  }

  const visibleSections = PERSONAL_SECTIONS
    .map(s => ({ ...s, fields: s.fields.filter(([k]) => details[k]) }))
    .filter(s => s.fields.length > 0);

  const status = details.verificationStatus || 'PENDING_VERIFICATION';
  const canAct = status === 'PENDING_VERIFICATION' || status === 'DECLINED' || status === 'VERIFIED';

  const submitDecline = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    await onDecline(reason.trim());
    setReason('');
    setShowDeclineForm(false);
  };

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScrollText size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Personal Details</h2>
        </div>
        <PersonalStatusPill status={status} />
      </div>

      {visibleSections.length === 0 ? (
        <div className="p-5 text-sm text-gray-400 text-center">
          Personal details record exists but is empty.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {visibleSections.map(section => (
            <div key={section.title} className="px-5 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{section.title}</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {section.fields.map(([key, label]) => (
                  <div key={key} className="flex justify-between gap-3 text-sm">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="text-gray-800 font-medium text-right break-words max-w-[60%]">{details[key]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      {/* Status context */}
      {status === 'VERIFIED' && details.verifiedAt && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100 text-xs text-green-700 flex items-center gap-1.5">
          <ShieldCheck size={13} />
          Verified{details.verifiedBy?.name ? ` by ${details.verifiedBy.name}` : ''} · {formatDateTime(details.verifiedAt)}
        </div>
      )}
      {status === 'DECLINED' && details.rejectionReasonText && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-100 text-xs text-red-700">
          <p className="font-medium flex items-center gap-1.5"><ShieldAlert size={13} />Declined</p>
          <p className="mt-0.5">{details.rejectionReasonText}</p>
          {details.verifiedAt && <p className="mt-0.5 text-red-500">Reviewed {formatDateTime(details.verifiedAt)}{details.verifiedBy?.name ? ` by ${details.verifiedBy.name}` : ''}</p>}
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="px-5 py-3 border-t border-gray-100 space-y-2">
          {!showDeclineForm ? (
            <div className="flex gap-2">
              {status !== 'VERIFIED' && (
                <button onClick={onVerify} disabled={busy} className="btn-success flex-1">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Verify Personal Details
                </button>
              )}
              {status !== 'DECLINED' && (
                <button onClick={() => setShowDeclineForm(true)} disabled={busy} className="btn-danger flex-1">
                  <XCircle size={14} />Decline
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                className="input text-sm"
                rows={3}
                placeholder="Reason for declining (shown to the user)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowDeclineForm(false); setReason(''); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={submitDecline} disabled={busy || !reason.trim()} className="btn-danger flex-1">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}Confirm Decline
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [personalBusy, setPersonalBusy] = useState(false);

  const fetchUser = () => {
    setLoading(true);
    api.get(`/admin/users/${id}`)
      .then(r => setUser(r.data.user))
      .catch(() => toast.error('User not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      const newStatus = user.profileStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      toast.success(`User ${newStatus === 'DISABLED' ? 'disabled' : 'enabled'}`);
      setActionTarget(null);
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const verifyPersonal = async () => {
    setPersonalBusy(true);
    try {
      await api.patch(`/admin/users/${id}/personal-details/verify`);
      toast.success('Personal details verified');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to verify');
    } finally { setPersonalBusy(false); }
  };

  const declinePersonal = async (rejectionReasonText) => {
    setPersonalBusy(true);
    try {
      await api.patch(`/admin/users/${id}/personal-details/decline`, { rejectionReasonText });
      toast.success('Personal details declined');
      fetchUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to decline');
    } finally { setPersonalBusy(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!user) return <p className="text-center text-gray-500 py-20">User not found.</p>;

  const pendingDocs = user.documents?.filter(d => d.verificationStatus === 'PENDING_VERIFICATION').length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
        </div>
        {pendingDocs > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700">
            {pendingDocs} document{pendingDocs === 1 ? '' : 's'} pending
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="card p-5 space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Account Info</h2>
            <StatusBadge status={user.profileStatus} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{user.role}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Joined</span><span>{formatDate(user.createdAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Last login</span><span>{formatDate(user.lastLoginAt)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Documents</span><span>{user._count?.documents ?? 0}</span></div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            {user.profileStatus === 'ACTIVE' ? (
              <button onClick={() => setActionTarget(true)} className="btn-danger w-full">
                <UserX size={15} /> Disable Account
              </button>
            ) : (
              <button onClick={() => setActionTarget(true)} className="btn-success w-full">
                <UserCheck size={15} /> Enable Account
              </button>
            )}
          </div>
        </div>

        {/* Personal details */}
        <div className="lg:col-span-2">
          <PersonalDetailsCard
            details={user.personalDetails}
            onVerify={verifyPersonal}
            onDecline={declinePersonal}
            busy={personalBusy}
          />
        </div>

        {/* Documents */}
        <div className="card lg:col-span-3">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Documents</h2>
            <span className="text-xs text-gray-400">{user.documents?.length || 0} total</span>
          </div>
          <div className="divide-y divide-gray-50">
            {(!user.documents || user.documents.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-8">No documents</p>
            )}
            {user.documents?.map(doc => (
              <Link
                key={doc.id}
                to={`/admin/documents/${doc.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50"
              >
                <FileText size={16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.documentLabel || doc.originalName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.documentType ? `${doc.documentType.replace(/_/g, ' ')} · ` : ''}
                    {formatFileSize(doc.size)} · {formatDateTime(doc.uploadedAt)}
                  </p>
                  {doc.verificationStatus === 'DECLINED' && doc.rejectionReasonText && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">Declined: {doc.rejectionReasonText}</p>
                  )}
                </div>
                <StatusBadge status={doc.verificationStatus} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!actionTarget}
        title={user.profileStatus === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
        message={user.profileStatus === 'ACTIVE'
          ? `Disable ${user.name}'s account? They will no longer be able to log in.`
          : `Enable ${user.name}'s account? They will regain access.`
        }
        confirmLabel={user.profileStatus === 'ACTIVE' ? 'Disable' : 'Enable'}
        confirmVariant={user.profileStatus === 'ACTIVE' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
