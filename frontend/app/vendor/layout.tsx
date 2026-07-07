'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { apiPatch } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';

const NAV_ITEMS = [
  { href: '/vendor/kitchen', label: 'Kitchen', icon: '🍳' },
  { href: '/vendor/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/vendor/menu', label: 'Menu', icon: '📋' },
  { href: '/vendor/orders', label: 'Orders', icon: '🧾' },
  { href: '/vendor/reports', label: 'Reports', icon: '📈' },
  { href: '/vendor/operations', label: 'Operations', icon: '🏢' },
  { href: '/vendor/payout', label: 'Payout', icon: '💰' },
  { href: '/vendor/settings', label: 'Settings', icon: '⚙️' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    if (!isAuthenticated() && pathname !== '/vendor/login') {
      router.replace('/vendor/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (pathname === '/vendor/login') return <>{children}</>;
  if (!isAuthenticated()) return null;

  async function toggleOnline() {
    try {
      await apiPatch('/vendor/status', { is_accepting_orders: true });
      addToast({ message: 'Status updated', type: 'success' });
    } catch {}
  }

  function handleLogout() {
    logout();
    router.replace('/vendor/login');
  }

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 glass border-r border-black/6 flex flex-col">
        <div className="px-5 py-5 border-b border-black/6">
          <h1 className="font-heading text-2xl text-brand-orange tracking-widest">FOOD VILLAGE</h1>
          <p className="text-xs text-brand-dim font-mono mt-0.5">{user?.email}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                    active
                      ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/20'
                      : 'text-brand-dim hover:text-brand-white hover:bg-black/5'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-orange"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-black/6 space-y-2">
          <button
            onClick={toggleOnline}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/15 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Online
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-brand-dim hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
