import { useState, useEffect } from 'react';
import { Activity, Upload, LogIn, LogOut, UserPlus, CheckCircle, XCircle, Trash2, Download, Key, UserX, UserCheck, Share2, MoreVertical } from 'lucide-react';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import LockboxLogo from '../../components/common/LockboxLogo';
import { formatDateTime } from '../../utils/format';

const ACTION_MAP = {
  SIGNUP: { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50', tab: 'other' },
  LOGIN: { icon: LogIn, color: 'text-green-500', bg: 'bg-green-50', tab: 'other' },
  LOGOUT: { icon: LogOut, color: 'text-gray-500', bg: 'bg-gray-50', tab: 'other' },
  DOCUMENT_UPLOAD: { icon: Upload, color: 'text-gray-600', bg: 'bg-gray-100', tab: 'uploads' },
  DOCUMENT_DELETE: { icon: Trash2, color: 'text-red-500', bg: 'bg-red-50', tab: 'uploads' },
  DOCUMENT_DOWNLOAD: { icon: Download, color: 'text-indigo-500', bg: 'bg-indigo-50', tab: 'downloads' },
  DOCUMENT_APPROVED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', tab: 'other' },
  DOCUMENT_DECLINED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', tab: 'other' },
  FORGOT_PASSWORD: { icon: Key, color: 'text-amber-500', bg: 'bg-amber-50', tab: 'other' },
  RESET_PASSWORD: { icon: Key, color: 'text-amber-500', bg: 'bg-amber-50', tab: 'other' },
  USER_DISABLED: { icon: UserX, color: 'text-red-500', bg: 'bg-red-50', tab: 'other' },
  USER_ENABLED: { icon: UserCheck, color: 'text-green-500', bg: 'bg-green-50', tab: 'other' },
  DOCUMENT_SHARED: { icon: Share2, color: 'text-blue-500', bg: 'bg-blue-50', tab: 'shared' },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'shared', label: 'Shared' },
];

function AvatarInitial({ email }) {
  const letter = email ? email[0].toUpperCase() : '?';
  return (
    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
      {letter}
    </div>
  );
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/activity-logs/me?limit=100')
      .then(r => setLogs(r.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'all') return true;
    return ACTION_MAP[log.action]?.tab === activeTab;
  });

  const exportCSV = () => {
    const rows = filteredLogs.map(l => `${l.id},"${formatDateTime(l.createdAt)}","${l.description}"`).join('\n');
    const blob = new Blob([`Log ID,Date,Description\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity_log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadLog = () => {
    const text = filteredLogs.map(l => `[${formatDateTime(l.createdAt)}] ${l.description}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity_log.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs py-1.5 px-3">Export CSV ↗</button>
          <button onClick={downloadLog} className="btn-secondary text-xs py-1.5 px-3">Download Log ↗</button>
        </div>
      </div>

      {/* Tabs + Status filter */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pb-1">
          <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1">Status: All ▾</span>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState title="No activity yet" description="Your actions will appear here once you start using LockBox." />
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[100px_1fr_160px_120px_100px_60px] gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>Log ID</span>
            <span>Accessed Date</span>
            <span>By</span>
            <span>Document</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredLogs.map((log) => {
              const cfg = ACTION_MAP[log.action] || { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50' };
              const Icon = cfg.icon;
              const shortId = String(log.id).slice(-8).padStart(8, '0');
              const actorEmail = log.actor?.email || log.targetUser?.email || '—';

              return (
                <div key={log.id} className="grid grid-cols-[100px_1fr_160px_120px_100px_60px] gap-2 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors text-sm">
                  <span className="text-gray-600 font-mono text-xs">{shortId}</span>
                  <span className="text-gray-600 text-xs">{formatDateTime(log.createdAt)}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarInitial email={actorEmail} />
                    <span className="text-gray-600 text-xs truncate">{actorEmail}</span>
                  </div>
                  <span className="text-gray-600 text-xs truncate">{log.targetDocument?.originalName || '—'}</span>
                  <span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      <Icon size={10} />
                      {log.action.split('_').pop().toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                    </span>
                  </span>
                  <div className="flex justify-center">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
