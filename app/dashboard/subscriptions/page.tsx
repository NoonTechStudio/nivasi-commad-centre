'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard, AlertTriangle, CheckCircle, XCircle,
  Clock, TrendingUp, Send, Plus, Search,
  ChevronDown, Calendar, RefreshCw, X, MoreVertical,
} from 'lucide-react';
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
  trialEndsAt: string | null;
  autoRenew: boolean;
  notes: string | null;
  subscriptionStatus: string;
  status: string;
  daysLeft: number | null;
  secretaryPhone: string | null;
}

interface Summary {
  totalActive: number;
  totalExpiring30: number;
  totalExpired: number;
  monthlyRevenue: number;
  annualRevenue: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-blue-50 text-blue-700',
  STANDARD: 'bg-purple-50 text-purple-700',
  PREMIUM: 'bg-orange-50 text-orange-700',
  CUSTOM: 'bg-teal-50 text-teal-700',
};

function getDaysLeft(subscriptionEnd: string | null, daysLeft: number | null) {
  if (!subscriptionEnd) return { text: 'Active', color: 'text-green-600 bg-green-50' };
  if (daysLeft === null) return { text: 'Active', color: 'text-green-600 bg-green-50' };
  if (daysLeft < 0) return { text: 'Expired', color: 'text-red-600 bg-red-50' };
  if (daysLeft <= 30) return { text: `${daysLeft}d`, color: 'text-red-600 bg-red-50' };
  if (daysLeft <= 90) return { text: `${daysLeft}d`, color: 'text-orange-600 bg-orange-50' };
  return { text: `${daysLeft}d`, color: 'text-green-600 bg-green-50' };
}

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  societies, preselected, onClose, onSuccess,
}: {
  societies: Society[];
  preselected?: Society | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const now = new Date();
  const [form, setForm] = useState({
    societyId: preselected?.id ?? '',
    amount: preselected?.monthlyAmount?.toString() ?? '499',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    method: 'UPI',
    reference: '',
    notes: '',
    extendMonths: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedSociety = societies.find((s) => s.id === form.societyId);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  useEffect(() => {
    if (selectedSociety) {
      setForm((f) => ({ ...f, amount: selectedSociety.monthlyAmount.toString() }));
    }
  }, [form.societyId, selectedSociety]);

  const handleSubmit = async () => {
    if (!form.societyId) { setError('Select a society'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/subscriptions/${form.societyId}/payment`, {
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
            <label className="text-sm font-medium text-gray-700 block mb-1">Society *</label>
            <select value={form.societyId} onChange={set('societyId')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
              <option value="">Select society...</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.city}</option>
              ))}
            </select>
          </div>

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
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Year</label>
              <select value={form.year} onChange={set('year')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Payment Method</label>
            <select value={form.method} onChange={set('method')}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
              {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
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

// ─── Change Plan Modal ────────────────────────────────────────────────────────

const PLANS = [
  { key: 'STARTER', label: 'Starter', desc: 'Up to 50 flats', amount: 499 },
  { key: 'STANDARD', label: 'Standard', desc: '51–150 flats', amount: 999 },
  { key: 'PREMIUM', label: 'Premium', desc: '151–300 flats', amount: 1499 },
  { key: 'CUSTOM', label: 'Custom', desc: 'Enter amount manually', amount: null },
];

function ChangePlanModal({
  society, onClose, onSuccess,
}: {
  society: Society;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedPlan, setSelectedPlan] = useState(society.planType);
  const [customAmount, setCustomAmount] = useState(society.monthlyAmount.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const chosenPlan = PLANS.find((p) => p.key === selectedPlan);
  const amount = selectedPlan === 'CUSTOM' ? parseFloat(customAmount) : (chosenPlan?.amount ?? 499);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/subscriptions/${society.id}/plan`, { planType: selectedPlan, monthlyAmount: amount });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Change Plan</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-4 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-600">
          Current: <span className="font-medium">{society.planType}</span> — ₹{society.monthlyAmount}/month
        </div>

        <div className="space-y-3 mb-4">
          {PLANS.map((p) => (
            <button key={p.key} onClick={() => setSelectedPlan(p.key)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                selectedPlan === p.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-left">
                <p className="font-medium text-sm text-gray-900">{p.label}</p>
                <p className="text-xs text-gray-400">{p.desc}</p>
              </div>
              {p.amount && (
                <p className="text-sm font-bold text-gray-900">₹{p.amount}<span className="text-xs text-gray-400 font-normal">/mo</span></p>
              )}
            </button>
          ))}
        </div>

        {selectedPlan === 'CUSTOM' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Custom Amount (₹/month)</label>
            <input value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} type="number"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
          </div>
        )}

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Updating...' : 'Update Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send Reminder Modal ──────────────────────────────────────────────────────

function ReminderModal({
  society, onClose,
}: {
  society: Society;
  onClose: () => void;
}) {
  const dl = getDaysLeft(society.subscriptionEnd, society.daysLeft);
  const defaultMsg = `Hi ${society.name} Secretary,\n\nYour Nivasi subscription is expiring in ${dl.text}.\n\nPlan: ${society.planType} — ₹${society.monthlyAmount}/month\nExpiry: ${fmt(society.subscriptionEnd)}\n\nPlease renew to continue using Nivasi without interruption.\n\nPay to UPI: nivasi@upi\n\nFor help: Call/WhatsApp +91 9000000000\n\nThank you!\nNivasi Team`;
  const [message, setMessage] = useState(defaultMsg);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  const openWhatsApp = () => {
    if (!society.secretaryPhone) { alert('No secretary phone on record for this society'); return; }
    window.open(`https://wa.me/91${society.secretaryPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const markReminded = async () => {
    setMarking(true);
    try {
      await api.post(`/subscriptions/${society.id}/reminder`);
      setMarked(true);
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Send Reminder — {society.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Close
          </button>
          <button onClick={openWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
            <Send size={15} /> Open WhatsApp
          </button>
          <button onClick={markReminded} disabled={marking || marked}
            className="py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {marked ? 'Marked ✓' : marking ? 'Marking...' : 'Mark as Reminded'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function RowMenu({
  society,
  onRecordPayment,
  onChangePlan,
  onSendReminder,
  onViewHistory,
}: {
  society: Society;
  onRecordPayment: () => void;
  onChangePlan: () => void;
  onSendReminder: () => void;
  onViewHistory: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((x) => !x)}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
        <MoreVertical size={16} className="text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 w-44">
            {[
              { label: 'Record Payment', action: onRecordPayment },
              { label: 'Change Plan', action: onChangePlan },
              { label: 'Send Reminder', action: onSendReminder },
              { label: 'View History', action: onViewHistory },
            ].map(({ label, action }) => (
              <button key={label}
                onClick={() => { setOpen(false); action(); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Reminder Settings Card ───────────────────────────────────────────────────

const REMINDER_DEFAULTS = {
  d90: true, d60: true, d30: true, d7: true, autoDeactivate: true,
};

function ReminderSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('nivasi_reminder_settings');
      return saved ? JSON.parse(saved) : REMINDER_DEFAULTS;
    } catch { return REMINDER_DEFAULTS; }
  });

  const toggle = (key: string) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem('nivasi_reminder_settings', JSON.stringify(next));
  };

  const rows = [
    { key: 'd90', label: 'Send reminder 90 days before expiry', desc: 'Early renewal notice' },
    { key: 'd60', label: 'Send reminder 60 days before expiry', desc: 'Follow-up reminder' },
    { key: 'd30', label: 'Send reminder 30 days before expiry', desc: 'Urgent renewal reminder' },
    { key: 'd7', label: 'Send reminder 7 days before expiry', desc: 'Final warning' },
    { key: 'autoDeactivate', label: 'Auto-deactivate on expiry day', desc: 'Shows expired notice in app' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#EEF2FF] p-6" style={{ boxShadow: '0 1px 3px rgba(99,102,241,0.08)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-blue-500" />
        <h2 className="text-base font-bold text-slate-900">Reminder Schedule</h2>
      </div>
      <div>
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                settings[key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings[key] ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4">Reminders are sent manually via WhatsApp. Automation coming soon.</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'active' | 'expiring' | 'expired';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, socRes] = await Promise.all([
        api.get('/subscriptions/summary'),
        api.get('/subscriptions'),
      ]);
      setSummary(sumRes.data.data);
      setSocieties(socRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = societies.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'active' ? s.status === 'ACTIVE' :
      filter === 'expiring' ? s.status === 'EXPIRING' :
      s.status === 'EXPIRED';
    return matchSearch && matchFilter;
  });

  // Expiry timeline buckets
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const in3Months = new Date(now.getTime() + 90 * 86400000);

  const thisMonth = societies.filter((s) => s.subscriptionEnd && new Date(s.subscriptionEnd) <= endOfMonth && new Date(s.subscriptionEnd) >= now);
  const nextMonth = societies.filter((s) => s.subscriptionEnd && new Date(s.subscriptionEnd) > endOfMonth && new Date(s.subscriptionEnd) <= endOfNext);
  const in3Mon = societies.filter((s) => s.subscriptionEnd && new Date(s.subscriptionEnd) > endOfNext && new Date(s.subscriptionEnd) <= in3Months);

  const openPayment = (s?: Society) => {
    setSelectedSociety(s ?? null);
    setShowPaymentModal(true);
  };

  const openPlan = (s: Society) => {
    setSelectedSociety(s);
    setShowPlanModal(true);
  };

  const openReminder = (s: Society) => {
    setSelectedSociety(s);
    setShowReminderModal(true);
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expiring', label: 'Expiring Soon' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-400 mt-1">Manage society plans and payments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setLoading(true); fetchData(); }}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => openPayment()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20">
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="skeleton h-10 w-10 mb-4" style={{ borderRadius: '12px' }} />
              <div className="skeleton h-6 w-24 mb-2" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">₹{summary?.monthlyRevenue?.toLocaleString('en-IN')}</p>
            <p className="text-sm text-gray-500 mt-0.5">Monthly Recurring Revenue</p>
            <p className="text-xs text-gray-400 mt-1">₹{((summary?.annualRevenue ?? 0) / 100000).toFixed(1)}L annual run rate</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalActive}</p>
            <p className="text-sm text-gray-500 mt-0.5">Active Subscriptions</p>
            <p className="text-xs text-gray-400 mt-1">Paying societies</p>
          </div>

          <div className={`bg-white rounded-2xl p-5 border shadow-sm ${(summary?.totalExpiring30 ?? 0) > 0 ? 'border-orange-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalExpiring30}</p>
            <p className="text-sm text-gray-500 mt-0.5">Expiring in 30 days</p>
            <p className="text-xs text-orange-400 mt-1">{(summary?.totalExpiring30 ?? 0) > 0 ? 'Needs attention ⚠️' : 'All good'}</p>
          </div>

          <div className={`bg-white rounded-2xl p-5 border shadow-sm ${(summary?.totalExpired ?? 0) > 0 ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalExpired}</p>
            <p className="text-sm text-gray-500 mt-0.5">Expired</p>
            <p className="text-xs text-red-400 mt-1">{(summary?.totalExpired ?? 0) > 0 ? 'Renewal required' : 'None expired'}</p>
          </div>
        </div>
      )}

      {/* Expiry Timeline */}
      {!loading && (thisMonth.length > 0 || nextMonth.length > 0 || in3Mon.length > 0) && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> Upcoming Renewals
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'This Month', items: thisMonth, color: 'border-red-200 bg-red-50/50', badge: 'text-red-600 bg-red-100' },
              { label: 'Next Month', items: nextMonth, color: 'border-orange-200 bg-orange-50/50', badge: 'text-orange-600 bg-orange-100' },
              { label: 'In 3 Months', items: in3Mon, color: 'border-yellow-200 bg-yellow-50/50', badge: 'text-yellow-700 bg-yellow-100' },
            ].map(({ label, items, color, badge }) => (
              <div key={label} className={`rounded-2xl border p-4 ${color}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400">None</p>
                ) : (
                  <ul className="space-y-1">
                    {items.slice(0, 4).map((s) => (
                      <li key={s.id} className="text-xs text-gray-600 truncate">• {s.name}</li>
                    ))}
                    {items.length > 4 && <li className="text-xs text-gray-400">+{items.length - 4} more</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search societies..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Society Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 flex-1" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400">No societies match your filter</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Society</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Plan</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Start</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Expiry</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Days Left</th>
                <th className="text-center text-xs font-medium text-gray-400 px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const dl = getDaysLeft(s.subscriptionEnd, s.daysLeft);
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.city}, {s.state}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PLAN_COLORS[s.planType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.planType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ₹{s.monthlyAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(s.subscriptionStart)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(s.subscriptionEnd)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${dl.color}`}>
                        {dl.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        s.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                        s.status === 'EXPIRING' ? 'bg-orange-50 text-orange-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <RowMenu
                        society={s}
                        onRecordPayment={() => openPayment(s)}
                        onChangePlan={() => openPlan(s)}
                        onSendReminder={() => openReminder(s)}
                        onViewHistory={() => router.push(`/dashboard/subscriptions/${s.id}`)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Reminder Settings */}
      <ReminderSettings />

      {/* Modals */}
      {showPaymentModal && (
        <RecordPaymentModal
          societies={societies}
          preselected={selectedSociety}
          onClose={() => { setShowPaymentModal(false); setSelectedSociety(null); }}
          onSuccess={() => { setShowPaymentModal(false); setSelectedSociety(null); fetchData(); }}
        />
      )}
      {showPlanModal && selectedSociety && (
        <ChangePlanModal
          society={selectedSociety}
          onClose={() => { setShowPlanModal(false); setSelectedSociety(null); }}
          onSuccess={() => { setShowPlanModal(false); setSelectedSociety(null); fetchData(); }}
        />
      )}
      {showReminderModal && selectedSociety && (
        <ReminderModal
          society={selectedSociety}
          onClose={() => { setShowReminderModal(false); setSelectedSociety(null); }}
        />
      )}
    </div>
  );
}
