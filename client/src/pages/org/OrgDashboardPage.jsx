import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrgDashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/organization/verifications?limit=50');
        setRows(data.verifications || []);
        setTotal(data.total ?? data.verifications?.length ?? 0);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const verifiedCount = rows.filter(r => r.verified).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, <span className="font-medium text-gray-800">{user?.name || user?.firstName}</span>.
          Every verification call you make via the LockBox API is logged below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total lookups"      value={total} />
        <StatCard label="Verified matches"   value={verifiedCount} accent="green" />
        <StatCard label="Unverified / no match" value={rows.length - verifiedCount} accent="gray" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gray-700" />
            <h2 className="text-sm font-semibold text-gray-800">Verification log</h2>
          </div>
          <span className="text-xs text-gray-400">Latest 50</span>
        </div>

        {loading ? (
          <div className="p-10 flex items-center justify-center text-gray-500">
            <Loader2 size={18} className="animate-spin mr-2" />
            Loading verifications…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No verification calls yet. Use your API key to POST <code>/api/v1/verify/user</code> and your results will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">Status</th>
                  <th className="text-left font-semibold px-5 py-2.5">Name</th>
                  <th className="text-left font-semibold px-5 py-2.5">Email</th>
                  <th className="text-left font-semibold px-5 py-2.5">Phone</th>
                  <th className="text-left font-semibold px-5 py-2.5">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3">
                      {r.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 rounded-full border border-green-200">
                          <CheckCircle size={12} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                          <XCircle size={12} />
                          Not verified
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-800">
                      {r.subjectUser?.name || r.queriedName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.subjectUser?.email || '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {r.subjectUser?.phone || r.queriedPhone}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const color = accent === 'green' ? 'text-green-700' : accent === 'gray' ? 'text-gray-600' : 'text-gray-900';
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
