'use client';
import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Trash2, CheckCheck, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'expiring' | 'expired' | 'payment' | 'society' | 'system';
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const NOTIF_KEY = 'nivasi_notifications';

const SAMPLE: Notification[] = [
  {
    id: '1', type: 'expiring', title: 'Subscription Expiring',
    description: 'Rajhans Residency expires in 7 days',
    read: false, createdAt: new Date().toISOString(),
  },
  {
    id: '2', type: 'payment', title: 'Payment Received',
    description: 'Swastik Heights paid ₹999 for June 2026',
    read: false, createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '3', type: 'society', title: 'New Society Added',
    description: 'Green Park Society joined Nivasi',
    read: true, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '4', type: 'expired', title: 'Subscription Expired',
    description: 'Sun Towers subscription expired today',
    read: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: '5', type: 'system', title: 'System Update',
    description: 'Nivasi Command Centre v1.1 is available',
    read: true, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const TYPE_CONFIG: Record<string, { dot: string; bg: string }> = {
  expiring: { dot: 'bg-yellow-400', bg: 'bg-yellow-50'  },
  expired:  { dot: 'bg-red-500',    bg: 'bg-red-50'     },
  payment:  { dot: 'bg-blue-500',   bg: 'bg-blue-50'    },
  society:  { dot: 'bg-green-500',  bg: 'bg-green-50'   },
  system:   { dot: 'bg-gray-400',   bg: 'bg-gray-50'    },
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');

  useEffect(() => {
    const saved = localStorage.getItem(NOTIF_KEY);
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      setNotifications(SAMPLE);
      localStorage.setItem(NOTIF_KEY, JSON.stringify(SAMPLE));
    }
  }, []);

  const persist = useCallback((updated: Notification[]) => {
    setNotifications(updated);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
    // Signal layout to re-read badge count
    window.dispatchEvent(new Event('nivasi_notif_update'));
  }, []);

  const markRead = (id: string) => {
    persist(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const remove = (id: string) => {
    persist(notifications.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    persist(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearRead = () => {
    persist(notifications.filter((n) => !n.read));
  };

  const filtered = notifications.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? !n.read : n.read,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <CheckCheck size={15} /> Mark all read
            </button>
          )}
          {notifications.some((n) => n.read) && (
            <button onClick={clearRead}
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-500 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              <Trash2 size={15} /> Clear read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {label}
            {key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <Bell size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No {filter === 'all' ? '' : filter} notifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-4 p-4 border-b border-gray-50 last:border-0 transition-colors ${
                  !n.read ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
              >
                {/* Dot */}
                <div className="mt-1 flex-shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${n.read ? 'bg-gray-200' : cfg.dot}`} />
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 p-3 rounded-xl ${n.read ? 'bg-white' : cfg.bg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">{n.description}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{formatTimeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                          title="Mark as read"
                          className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-green-600 transition-colors">
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                        title="Delete"
                        className="p-1.5 hover:bg-white rounded-lg text-gray-300 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
