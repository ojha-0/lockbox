import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Download, Trash2, AlertCircle, Eye, Share2,
  X, Search, CheckCircle, Loader2, Send, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/common/StatusBadge';
import FileTypeIcon from '../../components/common/FileTypeIcon';
import LockboxLogo from '../../components/common/LockboxLogo';
import OtpBoxes from '../../components/common/OtpBoxes';
import { formatDate } from '../../utils/format';
import { loadForm, loadProfile, getFilledProfileSections } from '../../utils/formStorage';

function getDocDates(doc) {
  const map = {
    passport: { formKey: 'passport', issueField: 'issueDate', expiryField: 'expiryDate' },
    citizenship_front: { formKey: 'citizenship', issueField: 'issueDate', expiryField: 'expiryDate' },
    citizenship_back: { formKey: 'citizenship', issueField: 'issueDate', expiryField: 'expiryDate' },
  };
  const m = map[doc.documentType];
  if (!m) return {};
  const d = loadForm(m.formKey);
  return { issueDate: d[m.issueField] || null, expiryDate: d[m.expiryField] || null };
}

function getPrimaryInitials() {
  const { givenName, familyName } = loadProfile();
  const name = [givenName, familyName].filter(Boolean).join(' ').trim();
  if (!name) return '?';
  return name.split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function docLabel(doc) {
  return doc.documentLabel || doc.documentType || doc.originalName;
}

// ── Get the document number from localStorage for the given doc ──
function getDocNumber(doc) {
  const typeKey = {
    passport: 'passport', national_id: 'national_id',
    citizenship_front: 'citizenship', citizenship_back: 'citizenship',
    drivers_license: 'drivers_license', pan_card: 'pan_card',
  }[doc.documentType];
  if (!typeKey) return null;
  const data = loadForm(typeKey);
  if (typeKey === 'passport') return data.passportNumber || null;
  if (typeKey === 'national_id') return data.nin || null;
  if (typeKey === 'citizenship') return data.certNumber || null;
  if (typeKey === 'drivers_license') return data.licenseNumber || null;
  if (typeKey === 'pan_card') return data.panNumber || null;
  return null;
}

// ─────────────────────────────────────────────────────────────
// Share Modal
// ─────────────────────────────────────────────────────────────
function ShareModal({ doc, onClose }) {
  const [email, setEmail] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const [otp, setOtp] = useState('');

  const otpValid = otp === '1234';

  const docNumber = getDocNumber(doc);
  const maskedNumber = docNumber ? `****${String(docNumber).replace(/\s/g, '').slice(-4)}` : null;
  const label = docLabel(doc);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLookupLoading(true);
    setRecipient(null);
    try {
      const { data } = await api.get(`/shares/lookup?email=${encodeURIComponent(email.trim())}`);
      setRecipient(data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'User not found');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleShare = async () => {
    if (!recipient || !maskedNumber || !otpValid) return;
    setSharing(true);
    try {
      await api.post('/shares', {
        documentType: doc.documentType,
        maskedNumber,
        toEmail: recipient.email,
      });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Share failed');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-900">Share Document Number</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {done ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Shared successfully!</p>
                <p className="text-xs text-gray-500 mt-1">
                  {maskedNumber} sent to <span className="font-medium">{recipient.name}</span>
                </p>
              </div>
              <button onClick={onClose} className="btn-secondary w-full">Close</button>
            </div>
          ) : (
            <>
              {/* Document preview */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sharing from</p>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                {maskedNumber ? (
                  <p className="text-xl font-mono font-bold text-gray-900 tracking-widest mt-1">{maskedNumber}</p>
                ) : (
                  <p className="text-xs text-amber-600 mt-1">
                    No document number saved. Fill in your details in Upload Documents first.
                  </p>
                )}
              </div>

              {/* Recipient search */}
              <div>
                <label className="label">Recipient Email</label>
                <form onSubmit={handleLookup} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      className="input pl-8"
                      placeholder="recipient@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setRecipient(null); }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={lookupLoading || !email.trim()}
                    className="btn-secondary px-3 flex-shrink-0"
                  >
                    {lookupLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                </form>

                {recipient && (
                  <>
                    <div className="flex items-center gap-3 mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-800">
                        {recipient.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{recipient.name}</p>
                        <p className="text-xs text-gray-500 truncate">{recipient.email}</p>
                      </div>
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    </div>

                    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-2 flex items-center justify-between">
                        <span>Enter the 4-digit code sent to your email</span>
                        {otpValid && <span className="text-green-600 font-semibold flex items-center gap-1"><ShieldCheck size={12} />Verified</span>}
                      </p>
                      <div className="flex justify-center">
                        <OtpBoxes value={otp} onChange={setOtp} error={otp.length === 4 && !otpValid} />
                      </div>
                      {otp.length === 4 && !otpValid && (
                        <p className="text-red-500 text-xs mt-2 text-center">Invalid OTP. Hint: 1234</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleShare}
                disabled={!recipient || !maskedNumber || !otpValid || sharing}
                className="btn-primary w-full"
              >
                {sharing
                  ? <><Loader2 size={14} className="animate-spin" />Sharing...</>
                  : <><Send size={14} />Share Last 4 Digits</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function MyDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const profileSections = getFilledProfileSections();
  const anyInfo = profileSections.length > 0;

  const fetchDocuments = () => {
    setLoading(true);
    api.get('/documents')
      .then(r => setDocuments(r.data.documents))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      toast.success('Document deleted');
      setDeleteTarget(null);
      fetchDocuments();
    } catch { toast.error('Failed to delete document'); }
    finally { setDeleting(false); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: doc.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.originalName; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const handleView = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const mimeType = doc.mimeType || res.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        toast('Popup blocked — downloading instead.');
        const a = document.createElement('a');
        a.href = url; a.download = doc.originalName; a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { toast.error('Could not open file'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <Link to="/upload" className="btn-primary"><Upload size={15} />Upload New</Link>
      </div>

      {/* ── My Information banner ── */}
      {anyInfo && (
        <div className="card p-4 flex items-start gap-4 border-l-4 border-gray-900">
          <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
            {getPrimaryInitials()}
          </div>
          <div className="flex-1 space-y-3 min-w-0">
            {profileSections.map(section => (
              <div key={section.key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{section.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm">
                  {section.filled.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="font-medium text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Link to="/upload" className="text-xs text-gray-400 hover:text-gray-700 flex-shrink-0">Edit</Link>
        </div>
      )}

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload your first document to get started."
          action={<Link to="/upload" className="btn-primary">Upload Document</Link>}
        />
      ) : (
        <div className="card overflow-hidden divide-y divide-gray-100">
          {documents.map(doc => (
            <div key={doc.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileTypeIcon mimeType={doc.mimeType} size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{docLabel(doc)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Uploaded on {formatDate(doc.uploadedAt)}</p>
                    {doc.verificationStatus === 'DECLINED' && doc.rejectionReasonText && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle size={11} className="text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600">{doc.rejectionReasonText}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge status={doc.verificationStatus} />
                  {(() => {
                    const { issueDate, expiryDate } = getDocDates(doc);
                    if (!issueDate && !expiryDate) return null;
                    return (
                      <div className="text-right text-xs text-gray-400 hidden sm:block">
                        {issueDate && <p>Issue: {issueDate}</p>}
                        {expiryDate && <p>Expiry: {expiryDate}</p>}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => handleView(doc)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-black transition-colors"
                >
                  <Eye size={13} />View
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-green-400 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors"
                >
                  <Download size={13} />Download
                </button>
                <button
                  onClick={() => setShareTarget(doc)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={13} />Share
                </button>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="ml-auto p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center py-4">
        <LockboxLogo variant="wordmark-dark" height={20} className="opacity-20 mx-auto" />
        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-400">
          <span>Terms</span><span>·</span><span>Privacy</span><span>·</span><span>Docs</span><span>·</span><span>Help</span>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget ? docLabel(deleteTarget) : ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {shareTarget && (
        <ShareModal doc={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}
