import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, CheckCircle, Clock, XCircle, UserX, ArrowRight } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/common/Spinner';
import { formatDateTime } from '../../utils/format';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const { stats, recentUploads = [], recentActions = [] } = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of all platform activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="bg-blue-500" />
        <StatCard label="Active Users" value={stats?.activeUsers ?? 0} icon={Users} color="bg-green-500" />
        <StatCard label="Disabled Users" value={stats?.disabledUsers ?? 0} icon={UserX} color="bg-gray-500" />
        <StatCard label="Pending Review" value={stats?.pendingDocs ?? 0} icon={Clock} color="bg-amber-500" />
        <StatCard label="Verified" value={stats?.verifiedDocs ?? 0} icon={CheckCircle} color="bg-emerald-500" />
        <StatCard label="Declined" value={stats?.declinedDocs ?? 0} icon={XCircle} color="bg-red-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Uploads</h2>
            <Link to="/admin/documents" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View queue <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUploads.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No uploads yet</p>}
            {recentUploads.map(doc => (
              <Link key={doc.id} to={`/admin/documents/${doc.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 block">
                <FileText size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.originalName}</p>
                  <p className="text-xs text-gray-400">{doc.user?.name} · {formatDateTime(doc.uploadedAt)}</p>
                </div>
                <StatusBadge status={doc.verificationStatus} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Actions */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Admin Actions</h2>
            <Link to="/admin/activity" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActions.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No actions yet</p>}
            {recentActions.map(log => (
              <div key={log.id} className="px-5 py-3">
                <p className="text-sm text-gray-700">{log.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
