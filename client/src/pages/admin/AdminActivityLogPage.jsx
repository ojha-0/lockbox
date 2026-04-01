import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/format';

const ACTION_COLORS = {
  DOCUMENT_APPROVED: 'text-green-600 bg-green-50',
  DOCUMENT_DECLINED: 'text-red-600 bg-red-50',
  USER_ENABLED: 'text-green-600 bg-green-50',
  USER_DISABLED: 'text-red-600 bg-red-50',
  SIGNUP: 'text-blue-600 bg-blue-50',
  LOGIN: 'text-primary-600 bg-primary-50',
  LOGOUT: 'text-gray-600 bg-gray-50',
  DOCUMENT_UPLOAD: 'text-indigo-600 bg-indigo-50',
  DOCUMENT_DELETE: 'text-red-600 bg-red-50',
};

export default function AdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 30 });
    if (actionFilter) params.set('action', actionFilter);
    api.get(`/admin/activity-logs?${params}`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Full platform audit trail</p>
      </div>

      <div className="flex gap-3">
        <select
          className="input w-auto"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions</option>
          <option value="DOCUMENT_APPROVED">Document Approved</option>
          <option value="DOCUMENT_DECLINED">Document Declined</option>
          <option value="USER_ENABLED">User Enabled</option>
          <option value="USER_DISABLED">User Disabled</option>
          <option value="SIGNUP">Signup</option>
          <option value="LOGIN">Login</option>
          <option value="DOCUMENT_UPLOAD">Document Upload</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : logs.length === 0 ? (
        <EmptyState title="No logs found" />
      ) : (
        <>
          <div className="card divide-y divide-gray-50">
            {logs.map(log => {
              const colorClass = ACTION_COLORS[log.action] || 'text-gray-600 bg-gray-50';
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass.split(' ')[1]}`}>
                    <Activity size={15} className={colorClass.split(' ')[0]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.actor && (
                        <span className="text-xs text-gray-500">by <strong>{log.actor.name}</strong></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-0.5">{log.description}</p>
                    {log.targetDocument && (
                      <p className="text-xs text-gray-400">Document: {log.targetDocument.originalName}</p>
                    )}
                    {log.targetUser && log.targetUser.id !== log.actorUserId && (
                      <p className="text-xs text-gray-400">Target: {log.targetUser.name} ({log.targetUser.email})</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} limit={30} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
