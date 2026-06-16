'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, ChevronRight, X, Plus, Percent } from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubAdmin {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  region: string;
  regionType: string;
  parentId?: string;
  parent?: { id: string; name: string } | null;
  commissionPct: number;
  isActive: boolean;
  createdAt: string;
  _count?: { children: number; societies: number };
  children?: SubAdmin[];
}

interface Society {
  id: string;
  name: string;
  city: string;
  state: string;
  subscriptionStatus: string;
  wings?: { id: string; name: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  STATE_ADMIN: 'State Admin',
  CITY_ADMIN: 'City Admin',
  AREA_PARTNER: 'Area Partner',
  CUSTOM: 'Custom',
};

const ROLE_COLORS: Record<string, string> = {
  STATE_ADMIN: 'bg-blue-50 text-blue-700',
  CITY_ADMIN: 'bg-purple-50 text-purple-700',
  AREA_PARTNER: 'bg-orange-50 text-orange-700',
  CUSTOM: 'bg-teal-50 text-teal-700',
};

// ─── Mock Commission Data ─────────────────────────────────────────────────────

const MOCK_COMMISSION = [
  { month: 'May 2026', societies: 0, revenue: 0, pct: 20, amount: 0, status: 'Pending' },
  { month: 'Apr 2026', societies: 0, revenue: 0, pct: 20, amount: 0, status: 'Pending' },
  { month: 'Mar 2026', societies: 0, revenue: 0, pct: 20, amount: 0, status: 'Paid' },
];

// ─── Assign Society Modal ──────────────────────────────────────────────────────

function AssignSocietyModal({
  partnerId, assignedIds, onClose, onSuccess,
}: {
  partnerId: string;
  assignedIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [all, setAll] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/societies')
      .then(r => setAll(r.data.data || []))
      .catch(() => setError('Failed to load societies'))
      .finally(() => setLoading(false));
  }, []);

  const unassigned = all.filter(s => !assignedIds.includes(s.id));

  const handleAssign = async (societyId: string) => {
    setSubmitting(societyId);
    try {
      await api.post(`/subadmin/${partnerId}/assign-society`, { societyId });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign');
    } finally {
      setSubmitting('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Assign Society</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : unassigned.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <Building2 size={36} className="text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">All societies are already assigned or none exist</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            {unassigned.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.city}, {s.state}</p>
                </div>
                <button
                  onClick={() => handleAssign(s.id)}
                  disabled={submitting === s.id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {submitting === s.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [partner, setPartner] = useState<SubAdmin | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [children, setChildren] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'societies' | 'subpartners' | 'commission'>('societies');
  const [showAssign, setShowAssign] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [partnerRes, societiesRes, allRes] = await Promise.all([
        api.get('/subadmin'),
        api.get(`/subadmin/${id}/societies`),
        api.get('/subadmin'),
      ]);
      const all: SubAdmin[] = partnerRes.data.data || [];
      const found = all.find(p => p.id === id) ?? null;
      setPartner(found);
      setSocieties(societiesRes.data.data || []);
      setChildren(all.filter(p => p.parentId === id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleActive = async () => {
    if (!partner) return;
    setToggling(true);
    try {
      await api.put(`/subadmin/${id}`, { isActive: !partner.isActive });
      setPartner(p => p ? { ...p, isActive: !p.isActive } : p);
    } catch {
      /* ignore */
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-1/5" />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
        <Users size={48} className="mx-auto mb-4 text-gray-200" />
        <p className="text-gray-500 font-medium">Partner not found</p>
        <button onClick={() => router.push('/dashboard/partners')}
          className="mt-4 text-blue-600 text-sm font-medium hover:underline">
          Back to Partners
        </button>
      </div>
    );
  }

  const totalSocieties = societies.length;
  const directChildren = children.length;
  const estRevenue = totalSocieties * 999;
  const commissionEarned = Math.round(estRevenue * partner.commissionPct / 100);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/partners')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Partners
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{partner.name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{partner.name}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[partner.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[partner.role] ?? partner.role}
                </span>
              </div>
              <p className="text-sm text-gray-400">{partner.regionType}: {partner.region}</p>
              {partner.phone && <p className="text-xs text-gray-400 mt-0.5">+91 {partner.phone}</p>}
              {partner.parent && (
                <p className="text-xs text-gray-400 mt-0.5">Reports to: {partner.parent.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${partner.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {partner.isActive ? '● Active' : '● Inactive'}
            </span>
            <button
              onClick={toggleActive}
              disabled={toggling}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {toggling ? '...' : partner.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Direct Societies', value: totalSocieties, color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Building2, label: 'Total Societies', value: totalSocieties, color: 'text-teal-600', bg: 'bg-teal-50' },
          { icon: Users, label: 'Sub-Partners', value: directChildren, color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Percent, label: 'Commission Earned', value: `₹${commissionEarned.toLocaleString('en-IN')}`, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'societies', label: 'Societies' },
          { key: 'subpartners', label: 'Sub-Partners' },
          { key: 'commission', label: 'Commission' },
        ] as { key: typeof tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'societies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{societies.length} societies assigned</p>
            <button
              onClick={() => setShowAssign(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> Assign Society
            </button>
          </div>

          {societies.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
              <Building2 size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No societies assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {societies.map(s => (
                <div key={s.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Building2 size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.city}, {s.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.subscriptionStatus === 'EXPIRED' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}>
                      {s.subscriptionStatus === 'EXPIRED' ? 'Expired' : 'Active'}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/societies/${s.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                    >
                      View <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'subpartners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{children.length} direct sub-partners</p>
            <button
              onClick={() => router.push('/dashboard/partners')}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} /> Add Sub-Partner
            </button>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
              <Users size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">No sub-partners yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map(c => (
                <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.regionType}: {c.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{c._count?.societies ?? 0} societies</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[c.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[c.role] ?? c.role}
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/partners/${c.id}`)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                    >
                      View <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'commission' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Month</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Societies</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Revenue</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Commission %</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Amount</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_COMMISSION.map(row => {
                const actualSocieties = row.month.includes('May') ? totalSocieties : row.societies;
                const actualRevenue = actualSocieties * 999;
                const actualAmount = Math.round(actualRevenue * partner.commissionPct / 100);
                return (
                  <tr key={row.month} className="border-b border-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{row.month}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{actualSocieties}</td>
                    <td className="px-4 py-3 text-center text-gray-600">₹{actualRevenue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{partner.commissionPct}%</td>
                    <td className="px-4 py-3 text-center font-medium text-gray-900">₹{actualAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        row.status === 'Paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Society Modal */}
      {showAssign && (
        <AssignSocietyModal
          partnerId={partner.id}
          assignedIds={societies.map(s => s.id)}
          onClose={() => setShowAssign(false)}
          onSuccess={() => { fetchAll(); setShowAssign(false); }}
        />
      )}
    </div>
  );
}
