'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, CreditCard, X } from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Society {
  id: string;
  name: string;
  city: string;
  state: string;
  planType: string;
  monthlyAmount: number;
  subscriptionStart: string;
  subscriptionEnd: string | null;
  subscriptionStatus: string;
  status?: string;
  daysLeft?: number | null;
}

interface Payment {
  id: string;
  amount: number;
  month: number;
  year: number;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-blue-50 text-blue-700',
  STANDARD: 'bg-purple-50 text-purple-700',
  PREMIUM: 'bg-orange-50 text-orange-700',
  CUSTOM: 'bg-teal-50 text-teal-700',
};

// ─── Add Payment Modal ────────────────────────────────────────────────────────

function AddPaymentModal({
  society, onClose, onSuccess,
}: {
  society: Society;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const now = new Date();
  const [form, setForm] = useState({
    amount: society.monthlyAmount.toString(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    method: 'UPI',
    reference: '',
    notes: '',
    extendMonths: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/subscriptions/${society.id}/payment`, {
        amount: parseFloat(form.amount),
        month: Number(form.month),
        year: Number(form.year),
        method: form.method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
        extendMonths: Number(form.extendMonths),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Amount (₹) *</label>
            <input value={form.amount} onChange={set('amount')} type="number"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Month</label>
              <select value={form.month} onChange={set('month')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
              <select value={form.year} onChange={set('year')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
            <select value={form.method} onChange={set('method')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
              {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Reference / UTR</label>
            <input value={form.reference} onChange={set('reference')} placeholder="Optional"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Extend Subscription By</label>
            <select value={form.extendMonths} onChange={set('extendMonths')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>1 year</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <input value={form.notes} onChange={set('notes')} placeholder="Optional"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [society, setSociety] = useState<Society | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/subscriptions/${id}/history`);
      setSociety(res.data.data.society);
      setPayments(res.data.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Delete this payment record?')) return;
    setDeletingId(paymentId);
    try {
      await api.delete(`/subscriptions/payments/${paymentId}`);
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch {
      alert('Failed to delete payment');
    } finally {
      setDeletingId(null);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const lastPayment = payments[0];
  const monthsActive = payments.length;

  const nextDue = society?.subscriptionEnd ? fmt(society.subscriptionEnd) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-400">Society not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{society.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PLAN_COLORS[society.planType] ?? 'bg-gray-100 text-gray-600'}`}>
                {society.planType}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                society.subscriptionStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
              }`}>
                {society.subscriptionStatus}
              </span>
            </div>
            <p className="text-sm text-gray-400">{society.city}, {society.state}</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> Add Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}` },
          { label: 'Months on Record', value: monthsActive.toString() },
          { label: 'Last Payment', value: lastPayment ? fmt(lastPayment.paidAt) : '—' },
          { label: 'Next Due', value: nextDue },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Payment History</h2>
          <p className="text-sm text-gray-400">{payments.length} record{payments.length !== 1 ? 's' : ''}</p>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">No payments recorded yet</p>
            <button onClick={() => setShowAddModal(true)}
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
              Record First Payment
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Month / Year</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Method</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Reference</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Date Paid</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Notes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {MONTHS[p.month - 1]} {p.year}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">{p.method}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.reference ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{fmt(p.paidAt)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-32 truncate">{p.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddPaymentModal
          society={society}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchData(); }}
        />
      )}
    </div>
  );
}
