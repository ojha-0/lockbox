import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime, formatFileSize, getFileIcon } from '../../utils/format';

const TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING_VERIFICATION', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'DECLINED', label: 'Declined' },
];

export default function DocumentQueuePage() {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_VERIFICATION');
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/admin/documents?${params}`)
      .then(r => { setDocuments(r.data.documents); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and verify user-uploaded documents</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search by name, email, or filename..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : documents.length === 0 ? (
        <EmptyState title="No documents found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Document</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded By</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Size</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Uploaded</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFileIcon(doc.mimeType)}</span>
                          <p className="font-medium text-gray-800 truncate max-w-[200px]">{doc.originalName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{doc.user?.name}</p>
                        <p className="text-xs text-gray-400">{doc.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatFileSize(doc.size)}</td>
                      <td className="px-4 py-3"><StatusBadge status={doc.verificationStatus} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(doc.uploadedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/admin/documents/${doc.id}`} className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm font-medium">
                          Review <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
