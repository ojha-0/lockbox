import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronRight, FileCheck, FileClock, FileX,
  ScrollText, ShieldCheck, ShieldAlert, ShieldQuestion, Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/format';

const FILTERS = [
  { value: 'pending', label: 'Needs Review' },
  { value: 'all', label: 'All Users' },
];

function PersonalPill({ status }) {
  const cfg = {
    VERIFIED:             { icon: ShieldCheck,    cls: 'bg-green-50 text-green-700 border border-green-200', label: 'Personal info verified' },
    PENDING_VERIFICATION: { icon: ShieldQuestion, cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Personal info pending' },
    DECLINED:             { icon: ShieldAlert,   cls: 'bg-red-50 text-red-700 border border-red-200',       label: 'Personal info declined' },
  }[status] || { icon: ScrollText, cls: 'bg-gray-100 text-gray-500', label: 'No personal info' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      <Icon size={11} />{cfg.label}
    </span>
  );
}

function CountChip({ icon: Icon, count, label, cls }) {
  if (!count) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      <Icon size={11} />{count} {label}
    </span>
  );
}

export default function VerificationQueuePage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20, filter });
    if (search) params.set('search', search);
    api.get(`/admin/verification-queue?${params}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load verification queue'))
      .finally(() => setLoading(false));
  }, [page, search, filter]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Review each user's uploaded documents and saved personal information, then verify or decline.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          description={filter === 'pending'
            ? 'There are no users with pending documents or personal details right now.'
            : 'No users match your search.'}
        />
      ) : (
        <>
          <div className="space-y-3">
            {users.map(u => {
              const initial = (u.name || u.email)?.[0]?.toUpperCase() || '?';
              const needsReview = u.docCounts.pending > 0
                || u.personalDetailsStatus === 'PENDING_VERIFICATION';
              return (
                <Link
                  key={u.id}
                  to={`/admin/users/${u.id}`}
                  className="card p-4 flex items-center gap-4 hover:border-gray-300 transition-colors block"
                >
                  <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-base font-bold text-gray-700">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      {needsReview && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
                          Needs review
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <PersonalPill status={u.personalDetailsStatus} />
                      <CountChip icon={FileClock} count={u.docCounts.pending}  label="pending"  cls="bg-amber-50 text-amber-700 border border-amber-200" />
                      <CountChip icon={FileCheck} count={u.docCounts.verified} label="verified" cls="bg-green-50 text-green-700 border border-green-200" />
                      <CountChip icon={FileX}     count={u.docCounts.declined} label="declined" cls="bg-red-50 text-red-700 border border-red-200" />
                      {u.lastUpload && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={11} />last upload {formatDateTime(u.lastUpload)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
          <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
