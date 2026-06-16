'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, CreditCard,
  BarChart3, Settings, LogOut, Bell, HelpCircle,
  MessageCircle, Mail, FileText, User, X, MessageSquare,
  ChevronLeft, ChevronRight, Search, Menu,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Nav config ───────────────────────────────────────────────────────────────

const mainNavItems = [
  { label: 'Dashboard',     href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Societies',     href: '/dashboard/societies',    icon: Building2       },
  { label: 'Partners',      href: '/dashboard/partners',     icon: Users           },
  { label: 'Subscriptions', href: '/dashboard/subscriptions',icon: CreditCard      },
  { label: 'Analytics',     href: '/dashboard/analytics',   icon: BarChart3       },
  { label: 'Support',       href: '/dashboard/support',      icon: MessageSquare   },
];

const bottomNavItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', societies: 'Society Management', partners: 'Partner Network',
  subscriptions: 'Subscriptions', analytics: 'Analytics', settings: 'Settings',
  support: 'Support', notifications: 'Notifications',
};

const getPageTitle = (path: string) => {
  const seg = path.split('/').filter(Boolean);
  return PAGE_LABELS[seg[1]] ?? PAGE_LABELS[seg[0]] ?? 'Dashboard';
};

const getBreadcrumbs = (path: string) => {
  const seg = path.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: 'Dashboard', href: '/dashboard' }];
  if (seg[1] && PAGE_LABELS[seg[1]]) {
    crumbs.push({ label: PAGE_LABELS[seg[1]], href: `/dashboard/${seg[1]}` });
  }
  if (seg[2]) crumbs.push({ label: 'Detail', href: path });
  if (seg[4]) crumbs.push({ label: 'Wing', href: path });
  return crumbs;
};

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  item, pathname, collapsed,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

  return (
    <Link
      href={item.href}
      title={item.label}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
        collapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
          : 'text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <item.icon size={18} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
    </Link>
  );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────

interface SearchItem { id: string; name: string; sub: string; type: 'society' | 'partner'; }

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    Promise.all([
      api.get('/superadmin/societies').catch(() => ({ data: { data: [] } })),
      api.get('/superadmin/subadmins').catch(() => ({ data: { data: [] } })),
    ]).then(([sr, pr]) => {
      const societies: SearchItem[] = (sr.data.data || []).map((s: { id: string; name: string; city: string }) => ({
        id: s.id, name: s.name, sub: s.city, type: 'society' as const,
      }));
      const partners: SearchItem[] = (pr.data.data || []).map((p: { id: string; name: string; region: string }) => ({
        id: p.id, name: p.name, sub: p.region, type: 'partner' as const,
      }));
      setAllItems([...societies, ...partners]);
    }).finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? allItems.filter(i => i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q))
    : allItems.slice(0, 8);
  const societies = filtered.filter(i => i.type === 'society').slice(0, 4);
  const partners = filtered.filter(i => i.type === 'partner').slice(0, 4);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const go = (item: SearchItem) => {
    router.push(item.type === 'society' ? `/dashboard/societies/${item.id}` : `/dashboard/partners/${item.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search societies, partners..."
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent"
          />
          <kbd className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {societies.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Societies ({societies.length})
                  </p>
                  {societies.map(s => (
                    <button key={s.id} onClick={() => go(s)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.sub}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {partners.length > 0 && (
                <>
                  <p className="px-4 py-1.5 mt-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Partners ({partners.length})
                  </p>
                  {partners.map(p => (
                    <button key={p.id} onClick={() => go(p)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sub}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            <kbd className="font-mono bg-white border border-gray-200 rounded px-1 py-0.5">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({
  user, onLogout,
}: {
  user: { name?: string; role?: string } | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const navigate = (path: string) => { setOpen(false); router.push(path); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((x) => !x)}
        className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition-all"
        title={user?.name ?? 'Admin'}
      >
        <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() ?? 'A'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30 w-48 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-xs text-gray-400">Super Administrator</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings?tab=account')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <User size={15} className="text-gray-400" /> My Account
          </button>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={15} className="text-gray-400" /> Settings
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Help Button ──────────────────────────────────────────────────────────────

function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const settings = (() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('nivasi_settings') : null;
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  })();

  const supportPhone = settings.supportWhatsApp || settings.supportPhone || '9000000000';
  const supportEmail = settings.supportEmail || 'support@nivasi.in';

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((x) => !x)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Help & Support"
      >
        <HelpCircle size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-gray-100 py-4 px-4 z-30 w-64">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Need Help?</p>
            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500">
              <X size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">Contact our support team</p>

          <div className="space-y-2">
            <a
              href={`https://wa.me/91${supportPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
            >
              <MessageCircle size={16} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-800">WhatsApp Support</p>
                <p className="text-xs text-green-600">+91 {supportPhone}</p>
              </div>
            </a>

            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              <Mail size={16} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800">Email Support</p>
                <p className="text-xs text-blue-600 truncate">{supportEmail}</p>
              </div>
            </a>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60">
              <FileText size={16} className="text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Documentation</p>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ name?: string; role?: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('nivasi_admin_token');
    if (!token) { router.replace('/login'); return; }
    const saved = localStorage.getItem('nivasi_admin_user');
    if (saved) setUser(JSON.parse(saved));
    const savedCollapsed = localStorage.getItem('nivasi_sidebar_collapsed');
    if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
    setChecking(false);
  }, [router]);

  useEffect(() => {
    const refreshBadge = () => {
      try {
        const n = localStorage.getItem('nivasi_notifications');
        if (n) setUnreadCount(JSON.parse(n).filter((x: { read: boolean }) => !x.read).length);
      } catch {}
    };
    refreshBadge();
    window.addEventListener('nivasi_notif_update', refreshBadge);
    return () => window.removeEventListener('nivasi_notif_update', refreshBadge);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('nivasi_sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('nivasi_admin_token');
    localStorage.removeItem('nivasi_admin_user');
    document.cookie = 'nivasi_admin_token=; path=/; max-age=0';
    window.location.href = '/login';
  };

  const sidebarW = collapsed ? 'w-16' : 'w-64';
  const contentML = collapsed ? 'ml-16' : 'ml-64';
  const breadcrumbs = getBreadcrumbs(pathname);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading Nivasi Command Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FF]">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Search overlay */}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`no-print fixed left-0 top-0 h-screen bg-[#0F172A] flex flex-col z-20 transition-all duration-300 ${sidebarW} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/10 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-white font-semibold text-sm">Nivasi</p>
              <p className="text-blue-400 text-xs">Command Centre</p>
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        {/* Divider + Settings */}
        <div className="px-3 pb-3">
          <div className="border-t border-white/10 mb-3" />
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </div>

        {/* User bar */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10">
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 cursor-pointer"
              onClick={() => router.push('/dashboard/settings?tab=account')}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() ?? 'A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.name ?? 'Admin'}</p>
                <p className="text-gray-500 text-xs">{user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Wing Admin'}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="text-gray-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Collapse toggle + version */}
        <div className={`px-3 pb-3 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-xs"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
          </button>
          {!collapsed && <p className="text-gray-600 text-xs text-center pb-1 mt-1">v1.0.0</p>}
        </div>
      </aside>

      {/* Header */}
      <header
        className={`no-print fixed top-0 right-0 h-16 border-b border-[#EEF2FF] flex items-center justify-between px-4 z-10 transition-all duration-300 bg-gradient-to-r from-white to-blue-50/30 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        } lg:left-${collapsed ? '16' : '64'} left-0`}
        style={{ left: `${collapsed ? 64 : 256}px` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(x => !x)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-gray-300 flex-shrink-0">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-gray-900 truncate">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-gray-400 hover:text-gray-600 truncate">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-400 transition-colors"
          >
            <Search size={14} />
            <span>Search...</span>
            <kbd className="text-xs border border-gray-300 rounded px-1 font-mono ml-1">⌘K</kbd>
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Search size={18} />
          </button>

          <HelpButton />

          <Link
            href="/dashboard/notifications"
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <ProfileDropdown user={user} onLogout={handleLogout} />
        </div>
      </header>

      {/* Main content */}
      <main
        className={`mt-16 min-h-screen bg-[#F5F7FF] p-6 transition-all duration-300 hidden lg:block ${contentML}`}
      >
        {children}
      </main>
      {/* Mobile main (no margin offset) */}
      <main className="mt-16 min-h-screen bg-[#F5F7FF] p-4 lg:hidden">
        {children}
      </main>
    </div>
  );
}
