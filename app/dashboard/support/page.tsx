'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Phone, CheckCircle, Clock,
  AlertCircle, Search, Plus, Send,
  User, Building2, X, Trash2, Tag,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticket {
  id: string;
  societyName: string;
  secretaryName: string;
  phone: string;
  issue: string;
  category: string;
  status: 'open' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  resolvedAt?: string;
  notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'nivasi_support_tickets';

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: '1', societyName: 'Swastik Heights', secretaryName: 'Zahir Kachwala',
    phone: '9898426416', issue: 'Secretary login not working after password reset',
    category: 'Login Issue', status: 'open', priority: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), notes: '',
  },
  {
    id: '2', societyName: 'Rajhans Residency', secretaryName: 'Mohammadi Lalawala',
    phone: '8877665544', issue: 'Bills not generating for vacant flats',
    category: 'Billing', status: 'open', priority: 'medium',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), notes: '',
  },
  {
    id: '3', societyName: 'Green Park', secretaryName: 'Pinakin Patel',
    phone: '9988776655', issue: 'Guard app crashes when taking photo',
    category: 'App Issue', status: 'resolved', priority: 'low',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Asked to reinstall Expo Go. Issue resolved.',
  },
];

const QUICK_REPLIES = [
  'Please reinstall the Expo Go app and try again.',
  'Please restart the API server and try logging in.',
  'This has been noted and will be fixed in the next update.',
  'Please check your internet connection and try again.',
  'Your issue has been resolved. Please confirm.',
];

const CATEGORIES = ['Login Issue', 'Billing', 'App Crash', 'App Issue', 'Feature Request', 'Other'];
const PRIORITIES = ['high', 'medium', 'low'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-50 text-red-600',
    medium: 'bg-orange-50 text-orange-600',
    low: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority] ?? colors.low}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
      status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700'
    }`}>
      {status === 'open' ? 'Open' : 'Resolved'}
    </span>
  );
}

// ─── Add Ticket Modal ─────────────────────────────────────────────────────────

function AddTicketModal({
  onClose, onAdd,
}: {
  onClose: () => void;
  onAdd: (ticket: Ticket) => void;
}) {
  const [societies, setSocieties] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    societyName: '', secretaryName: '', phone: '',
    issue: '', category: 'Login Issue', priority: 'medium' as 'high' | 'medium' | 'low',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/societies')
      .then((r) => setSocieties(r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = () => {
    if (!form.societyName.trim() || !form.issue.trim()) {
      setError('Society name and issue are required');
      return;
    }
    const ticket: Ticket = {
      id: Date.now().toString(),
      societyName: form.societyName,
      secretaryName: form.secretaryName,
      phone: form.phone,
      issue: form.issue,
      category: form.category,
      priority: form.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      notes: '',
    };
    onAdd(ticket);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">New Support Ticket</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Society *</label>
            {societies.length > 0 ? (
              <select value={form.societyName} onChange={set('societyName')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                <option value="">Select society...</option>
                {societies.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                <option value="__custom__">Other (type manually)</option>
              </select>
            ) : (
              <input value={form.societyName} onChange={set('societyName')} placeholder="Society name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            )}
            {form.societyName === '__custom__' && (
              <input onChange={(e) => setForm((f) => ({ ...f, societyName: e.target.value }))}
                placeholder="Type society name" autoFocus
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 mt-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Secretary Name</label>
              <input value={form.secretaryName} onChange={set('secretaryName')} placeholder="Full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone (+91)</label>
              <input value={form.phone} onChange={set('phone')} placeholder="10 digits" maxLength={10}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
              <select value={form.category} onChange={set('category')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
              <select value={form.priority} onChange={set('priority')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Issue Description *</label>
            <textarea value={form.issue} onChange={set('issue')} rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleAdd}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
            Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ticket Detail Panel ──────────────────────────────────────────────────────

function TicketDetail({
  ticket, onUpdate,
}: {
  ticket: Ticket;
  onUpdate: (t: Ticket) => void;
}) {
  const waMessage = encodeURIComponent(
    `Hi ${ticket.secretaryName}, regarding your support request: ${ticket.issue}`
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-lg font-bold text-gray-900">{ticket.societyName}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Tag size={10} /> {ticket.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {formatTimeAgo(ticket.createdAt)}
          </span>
          {ticket.resolvedAt && (
            <span className="text-xs text-green-500">Resolved {formatTimeAgo(ticket.resolvedAt)}</span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Contact card */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{ticket.secretaryName || 'Unknown'}</p>
                <p className="text-xs text-gray-400">Wing Secretary · {ticket.phone || 'No phone'}</p>
              </div>
            </div>
            {ticket.phone && (
              <div className="flex gap-2">
                <a href={`tel:+91${ticket.phone}`}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
                  <Phone size={12} /> Call
                </a>
                <a href={`https://wa.me/91${ticket.phone}?text=${waMessage}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition-colors">
                  💬 WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Issue */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Issue</p>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 leading-relaxed">{ticket.issue}</p>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Resolution Notes</p>
          <textarea
            value={ticket.notes}
            onChange={(e) => onUpdate({ ...ticket, notes: e.target.value })}
            placeholder="Add notes about resolution steps..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Quick replies */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Replies</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((template) => (
              <button key={template}
                onClick={() => onUpdate({ ...ticket, notes: template })}
                className="text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-lg transition-colors text-left">
                {template.length > 42 ? template.slice(0, 42) + '…' : template}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t border-gray-100 flex gap-3">
        {ticket.status === 'open' ? (
          <button
            onClick={() => onUpdate({ ...ticket, status: 'resolved', resolvedAt: new Date().toISOString() })}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors">
            <CheckCircle size={16} /> Mark Resolved
          </button>
        ) : (
          <button
            onClick={() => onUpdate({ ...ticket, status: 'open', resolvedAt: undefined })}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
            <AlertCircle size={16} /> Reopen Ticket
          </button>
        )}
        <button
          onClick={() => onUpdate({ ...ticket, id: '__delete__' })}
          className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'open' | 'resolved';

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<FilterTab>('open');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setTickets(JSON.parse(saved));
    } else {
      setTickets(SAMPLE_TICKETS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TICKETS));
    }
  }, []);

  const persist = useCallback((updated: Ticket[]) => {
    setTickets(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const handleTicketUpdate = (updated: Ticket) => {
    if (updated.id === '__delete__') {
      const next = tickets.filter((t) => t.id !== selectedTicket?.id);
      persist(next);
      setSelectedTicket(null);
      return;
    }
    const next = tickets.map((t) => t.id === updated.id ? updated : t);
    persist(next);
    setSelectedTicket(updated);
  };

  const handleAdd = (ticket: Ticket) => {
    const next = [ticket, ...tickets];
    persist(next);
    setSelectedTicket(ticket);
    setFilter('open');
  };

  const filtered = tickets.filter((t) => {
    const matchFilter = filter === 'all' ? true : t.status === filter;
    const matchSearch = !search ||
      t.societyName.toLowerCase().includes(search.toLowerCase()) ||
      t.secretaryName.toLowerCase().includes(search.toLowerCase()) ||
      t.issue.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const resolvedToday = tickets.filter((t) => {
    if (!t.resolvedAt) return false;
    return new Date(t.resolvedAt).toDateString() === new Date().toDateString();
  }).length;

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-sm text-gray-400">Manage secretary support requests</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: 'Open Tickets', value: openCount, color: 'text-orange-600', bg: 'bg-orange-50', border: openCount > 0 ? 'border-orange-200' : 'border-gray-100' },
          { label: 'Resolved Today', value: resolvedToday, color: 'text-green-600', bg: 'bg-green-50', border: 'border-gray-100' },
          { label: 'Avg Response', value: '< 2h', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-gray-100' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-xl p-4 border ${border} shadow-sm flex items-center gap-3`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <MessageSquare size={18} className={color} />
            </div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Ticket list */}
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex border-b border-gray-100">
            {FILTER_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  filter === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Ticket items */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <MessageSquare size={28} className="mb-2 opacity-40" />
                <p className="text-xs">No tickets found</p>
              </div>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-blue-50 border-l-2 border-l-blue-600'
                      : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-gray-900 truncate flex-1">{ticket.societyName}</p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2 text-left">{ticket.issue}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatTimeAgo(ticket.createdAt)}</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Ticket detail */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {selectedTicket ? (
            <TicketDetail
              ticket={tickets.find((t) => t.id === selectedTicket.id) ?? selectedTicket}
              onUpdate={handleTicketUpdate}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageSquare size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a ticket to view details</p>
              <p className="text-xs mt-1 opacity-60">or create a new support ticket</p>
              <button onClick={() => setShowAddModal(true)}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                <Plus size={14} /> New Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddTicketModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
