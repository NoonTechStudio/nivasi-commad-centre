'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Home, TrendingUp, AlertTriangle, ArrowUpRight, Plus, CreditCard, MessageSquare, Send } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '@/lib/api';

interface Stats {
  societies: number;
  wings: number;
  residents: number;
}

interface Society {
  id: string;
  name: string;
  city: string;
  subscriptionStatus: string;
  wings: { id: string }[];
  createdAt: string;
}

interface SubscriptionSummary {
  totalActive: number;
  totalExpiring30: number;
  totalExpired: number;
  monthlyRevenue: number;
  annualRevenue: number;
}

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
};

function StatCard({
  title, value, icon: Icon, color, trend, alert: isAlert, onClick,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend: string;
  alert?: boolean;
  onClick?: () => void;
}) {
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border ${isAlert ? 'border-orange-200' : 'border-[#EEF2FF]'} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ boxShadow: isAlert ? undefined : '0 1px 3px rgba(99,102,241,0.08)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon size={20} className={c.icon} />
        </div>
        <ArrowUpRight size={16} className="text-gray-300" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      <p className={`text-xs mt-2 font-medium ${isAlert ? 'text-orange-500' : 'text-green-500'}`}>{trend}</p>
    </div>
  );
}

const revenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 61000 },
  { month: 'Apr', revenue: 58000 },
  { month: 'May', revenue: 72000 },
  { month: 'Jun', revenue: 89000 },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, societiesRes, subsRes] = await Promise.all([
          api.get('/superadmin/stats'),
          api.get('/superadmin/societies'),
          api.get('/subscriptions/summary'),
        ]);
        setStats(statsRes.data.data);
        setSocieties(societiesRes.data.data || []);
        setSubscriptions(subsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const subscriptionData = [
    { name: 'Active',  value: societies.filter(s => s.subscriptionStatus === 'ACTIVE').length  || stats?.societies || 0, color: '#16A34A' },
    { name: 'Trial',   value: societies.filter(s => s.subscriptionStatus === 'TRIAL').length   || 0,                      color: '#D97706' },
    { name: 'Expired', value: societies.filter(s => s.subscriptionStatus === 'EXPIRED').length || 0,                      color: '#DC2626' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1565C0] to-[#1E40AF] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })()}, Admin
            </p>
            <p className="text-white text-xl font-bold mt-1">Here&apos;s your Nivasi overview</p>
            <p className="text-gray-400 text-xs mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats?.societies ?? 0}</p>
              <p className="text-gray-400 text-xs mt-0.5">Societies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                ₹{(subscriptions?.monthlyRevenue ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">MRR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{subscriptions?.totalExpiring30 ?? 0}</p>
              <p className="text-gray-400 text-xs mt-0.5">Expiring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Add Society',    icon: Plus,          href: '/dashboard/societies',     bg: 'bg-blue-50',   text: 'text-blue-600',   hover: 'hover:bg-blue-50'   },
          { label: 'Record Payment', icon: CreditCard,    href: '/dashboard/subscriptions', bg: 'bg-green-50',  text: 'text-green-600',  hover: 'hover:bg-green-50'  },
          { label: 'New Ticket',     icon: MessageSquare, href: '/dashboard/support',       bg: 'bg-orange-50', text: 'text-orange-600', hover: 'hover:bg-orange-50' },
          { label: 'Send Reminders', icon: Send,          href: '/dashboard/subscriptions', bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
        ].map(({ label, icon: Icon, href, bg, text, hover }) => (
          <button key={label} onClick={() => router.push(href)}
            className={`flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700 ${hover}`}>
            <div className={`p-2 rounded-xl ${bg}`}>
              <Icon size={16} className={text} />
            </div>
            {label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Societies"  value={stats?.societies ?? 0}  icon={Building2}     color="blue"   trend="+2 this month" onClick={() => router.push('/dashboard/societies')} />
        <StatCard title="Total Wings"      value={stats?.wings ?? 0}      icon={Home}          color="purple" trend="Active wings" />
        <StatCard title="Monthly Revenue"  value={`₹${(subscriptions?.monthlyRevenue ?? 0).toLocaleString('en-IN')}`} icon={TrendingUp} color="green" trend="+12% vs last month" onClick={() => router.push('/dashboard/subscriptions')} />
        <StatCard title="Expiring Soon"    value={subscriptions?.totalExpiring30 ?? 0} icon={AlertTriangle} color="orange" trend="Next 30 days" alert={!!subscriptions?.totalExpiring30} onClick={() => router.push('/dashboard/subscriptions?filter=expiring')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-full">+23% growth</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="revenue" fill="#1565C0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Subscription Status</h2>
          <p className="text-xs text-gray-400 mb-4">Current distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {subscriptionData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {subscriptionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent societies */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-900">Societies</h2>
            <a href="/dashboard/societies" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="space-y-3">
            {societies.slice(0, 5).map((society) => (
              <div key={society.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{society.name}</p>
                    <p className="text-xs text-gray-400">{society.city} · {society.wings?.length ?? 0} wings</p>
                  </div>
                </div>
                <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-full">Active</span>
              </div>
            ))}
            {societies.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No societies yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[...societies]
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .slice(0, 5)
              .map((s) => (
                <div key={s.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-green-500" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">New society added — {s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(s.createdAt || new Date().toISOString())}</p>
                  </div>
                </div>
              ))
            }
            {societies.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
