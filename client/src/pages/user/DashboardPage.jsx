import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, XCircle, Upload, ArrowRight, User } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import FileTypeIcon from '../../components/common/FileTypeIcon';
import LockboxLogo from '../../components/common/LockboxLogo';
import { formatDate } from '../../utils/format';
import { getFilledProfileSections } from '../../utils/formStorage';

// Returns the human-readable label for a document
function docLabel(doc) {
  return doc.documentLabel || doc.documentType || doc.originalName;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileSections = getFilledProfileSections();
  const anyInfo = profileSections.length > 0;

  useEffect(() => {
    api.get('/dashboard/me').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const total = data?.stats?.total ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome {user?.name?.split(' ')[0]}</h1>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Documents</p>
            <p className="text-4xl font-bold text-gray-900 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <FileText size={20} className="text-gray-600" />
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm text-gray-500 font-medium mb-3">Status Overview</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-amber-600"><Clock size={13} />Pending</span>
              <span className="font-semibold text-gray-800">{data?.stats?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-green-600"><CheckCircle size={13} />Verified</span>
              <span className="font-semibold text-gray-800">{data?.stats?.verified ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-red-500"><XCircle size={13} />Declined</span>
              <span className="font-semibold text-gray-800">{data?.stats?.declined ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── My Information card (shown when any form type has saved data) ── */}
      {anyInfo && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <User size={15} className="text-white" />
              </div>
              <h2 className="font-semibold text-gray-900">My Information</h2>
            </div>
            <Link to="/upload" className="text-xs text-gray-400 hover:text-gray-700">Edit</Link>
          </div>
          <div className="space-y-4">
            {profileSections.map(section => (
              <div key={section.key}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section.label}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  {section.filled.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="font-medium text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Documents ── */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Documents</h2>
          <Link to="/documents" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {(!data?.recentDocs || data.recentDocs.length === 0) ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">No documents yet</p>
            <Link to="/upload" className="btn-primary mt-4 inline-flex">
              <Upload size={15} />Upload Document
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recentDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <FileTypeIcon mimeType={doc.mimeType} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Show document label, not raw filename */}
                  <p className="text-sm font-medium text-gray-800 truncate">{docLabel(doc)}</p>
                  <p className="text-xs text-gray-400">Uploaded on {formatDate(doc.uploadedAt)}</p>
                </div>
                <StatusBadge status={doc.verificationStatus} />
              </div>
            ))}
          </div>
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
