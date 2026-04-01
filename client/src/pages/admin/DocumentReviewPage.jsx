import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, XCircle, User, Calendar, FileType, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { formatDateTime, formatFileSize, getFileIcon } from '../../utils/format';

const REJECTION_PRESETS = [
  { code: 'DOCUMENT_UNREADABLE', text: 'Document Unreadable — upload in better quality' },
  { code: 'DOCUMENT_FORGED', text: 'Document Forged' },
  { code: 'EXPIRED_DOCUMENT', text: 'Expired Document' },
  { code: 'MISMATCHED_INFORMATION', text: 'Mismatched Information' },
  { code: 'WRONG_DOCUMENT_TYPE', text: 'Wrong Document Type' },
  { code: 'MISSING_REQUIRED_INFORMATION', text: 'Missing Required Information' },
];

export default function DocumentReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [declining, setDeclining] = useState(false);

  const fetchDoc = () => {
    setLoading(true);
    api.get(`/admin/documents/${id}`).then(r => setDoc(r.data.document)).catch(() => toast.error('Document not found')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoc(); }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/admin/documents/${id}/approve`);
      toast.success('Document approved');
      fetchDoc();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async (e) => {
    e.preventDefault();
    const reasonText = selectedPreset
      ? REJECTION_PRESETS.find(p => p.code === selectedPreset)?.text
      : customReason.trim();
    const reasonCode = selectedPreset || 'CUSTOM';

    if (!reasonText) { toast.error('Please provide a rejection reason'); return; }
    setDeclining(true);
    try {
      await api.patch(`/admin/documents/${id}/decline`, {
        rejectionReasonCode: reasonCode,
        rejectionReasonText: reasonText,
      });
      toast.success('Document declined');
      setShowDeclineForm(false);
      fetchDoc();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Decline failed');
    } finally {
      setDeclining(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.get(`/admin/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!doc) return <p className="text-center text-gray-500 py-20">Document not found.</p>;

  const canReview = doc.verificationStatus === 'PENDING_VERIFICATION';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Document Review</h1>
        </div>
        <StatusBadge status={doc.verificationStatus} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Document Info */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-start gap-3">
            <span className="text-4xl">{getFileIcon(doc.mimeType)}</span>
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">{doc.originalName}</h2>
              <p className="text-sm text-gray-500">{doc.mimeType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { icon: User, label: 'Uploaded by', value: `${doc.user?.name} (${doc.user?.email})` },
              { icon: Calendar, label: 'Upload date', value: formatDateTime(doc.uploadedAt) },
              { icon: HardDrive, label: 'File size', value: formatFileSize(doc.size) },
              { icon: FileType, label: 'File type', value: doc.mimeType },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {doc.verificationStatus === 'DECLINED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium text-red-700">Rejection Reason</p>
              <p className="text-sm text-red-600 mt-0.5">{doc.rejectionReasonText}</p>
              {doc.reviewedBy && <p className="text-xs text-red-400 mt-1">Reviewed by {doc.reviewedBy.name} · {formatDateTime(doc.reviewedAt)}</p>}
            </div>
          )}

          {doc.verificationStatus === 'VERIFIED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
              <p className="text-sm font-medium text-green-700">Verified</p>
              {doc.reviewedBy && <p className="text-xs text-green-500 mt-1">Approved by {doc.reviewedBy.name} · {formatDateTime(doc.verifiedAt)}</p>}
            </div>
          )}

          <button onClick={handleDownload} className="btn-secondary w-full">
            <Download size={15} /> Download / Preview File
          </button>
        </div>

        {/* Actions */}
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Admin Actions</h3>
          {canReview ? (
            <>
              <button onClick={handleApprove} disabled={approving} className="btn-success w-full">
                <CheckCircle size={15} /> {approving ? 'Approving...' : 'Approve Document'}
              </button>
              <button onClick={() => setShowDeclineForm(v => !v)} className="btn-danger w-full">
                <XCircle size={15} /> Decline Document
              </button>

              {showDeclineForm && (
                <form onSubmit={handleDecline} className="space-y-3 pt-2 border-t border-gray-100 mt-3">
                  <p className="text-sm font-medium text-gray-700">Select a reason:</p>
                  <div className="space-y-2">
                    {REJECTION_PRESETS.map(preset => (
                      <label key={preset.code} className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="reason"
                          value={preset.code}
                          checked={selectedPreset === preset.code}
                          onChange={(e) => { setSelectedPreset(e.target.value); setCustomReason(''); }}
                          className="mt-0.5"
                        />
                        <span className="text-xs text-gray-700">{preset.text}</span>
                      </label>
                    ))}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value=""
                        checked={selectedPreset === ''}
                        onChange={() => setSelectedPreset('')}
                        className="mt-0.5"
                      />
                      <span className="text-xs text-gray-700">Custom reason</span>
                    </label>
                  </div>
                  {selectedPreset === '' && (
                    <textarea
                      className="input text-xs"
                      rows={3}
                      placeholder="Enter custom rejection reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  )}
                  <button type="submit" disabled={declining} className="btn-danger w-full text-sm">
                    {declining ? 'Declining...' : 'Confirm Decline'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <StatusBadge status={doc.verificationStatus} />
              <p className="text-xs text-gray-400 mt-2">This document has already been reviewed.</p>
              <button
                onClick={() => { setShowDeclineForm(true); setDoc(d => ({ ...d, verificationStatus: 'PENDING_VERIFICATION' })); }}
                className="text-xs text-primary-600 hover:underline mt-2 block w-full"
              >
                Re-review
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
