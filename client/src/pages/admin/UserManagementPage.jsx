import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck, UserX, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/format';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState(null); // { user, newStatus }
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api.get(`/admin/users?${params}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${actionTarget.user.id}/status`, { status: actionTarget.newStatus });
      toast.success(`User ${actionTarget.newStatus === 'DISABLED' ? 'disabled' : 'enabled'}`);
      setActionTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all user accounts</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Documents</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={user.profileStatus} /></td>
                      <td className="px-4 py-3 text-gray-600">{user._count?.documents ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {user.profileStatus === 'ACTIVE' ? (
                            <button
                              onClick={() => setActionTarget({ user, newStatus: 'DISABLED' })}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-medium"
                            >
                              <UserX size={13} /> Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => setActionTarget({ user, newStatus: 'ACTIVE' })}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-green-600 hover:bg-green-50 font-medium"
                            >
                              <UserCheck size={13} /> Enable
                            </button>
                          )}
                          <Link to={`/admin/users/${user.id}`} className="p-1.5 rounded hover:bg-gray-100 text-gray-400">
                            <ChevronRight size={15} />
                          </Link>
                        </div>
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

      <ConfirmModal
        open={!!actionTarget}
        title={actionTarget?.newStatus === 'DISABLED' ? 'Disable User Account' : 'Enable User Account'}
        message={
          actionTarget?.newStatus === 'DISABLED'
            ? `This will prevent ${actionTarget?.user?.name} from logging in. Continue?`
            : `This will restore access for ${actionTarget?.user?.name}. Continue?`
        }
        confirmLabel={actionTarget?.newStatus === 'DISABLED' ? 'Disable' : 'Enable'}
        confirmVariant={actionTarget?.newStatus === 'DISABLED' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleStatusChange}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  );
}
