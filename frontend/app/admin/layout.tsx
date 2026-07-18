'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { setToken } from '@/lib/api';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/admin/orders', label: 'Orders', icon: '◎' },
  { href: '/admin/vendors', label: 'Vendors', icon: '◈' },
  { href: '/admin/finance', label: 'Finance', icon: '◆' },
  { href: '/admin/analytics', label: 'Analytics', icon: '◉' },
  { href: '/admin/promotions', label: 'Promotions', icon: '◇' },
  { href: '/admin/audit', label: 'Audit Log', icon: '◐' },
  { href: '/admin/users', label: 'Users', icon: '◻' },
  { href: '/admin/settings', label: 'Settings', icon: '◫' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, token, logout } = useAdminAuthStore();

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!isAuthenticated()) {
      router.replace('/admin/login');
    } else if (token) {
      setToken(token);
    }
  }, [pathname, isAuthenticated, token]);

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-black/6 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-black/6">
          <p className="font-mono text-xs text-brand-dim uppercase tracking-widest mb-0.5">Food Port</p>
          <h2 className="font-heading text-2xl text-brand-orange tracking-widest">ADMIN</h2>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-5 py-2.5 text-sm font-semibold transition-all ${
                  active ? 'text-brand-white' : 'text-brand-dim hover:text-brand-chrome'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-orange rounded-r"
                  />
                )}
                <span className="text-xs opacity-60">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-5 py-4 border-t border-black/6">
          {user && (
            <p className="text-xs text-brand-dim truncate mb-2">{user.email}</p>
          )}
          <button
            onClick={() => { logout(); router.push('/admin/login'); }}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
