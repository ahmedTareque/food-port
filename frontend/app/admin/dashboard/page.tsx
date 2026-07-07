'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import type { AdminOverview, RevenuePoint, AdminOrder } from '@/types';
import Spinner from '@/components/ui/Spinner';
import GlassCard from '@/components/ui/GlassCard';

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', accepted: '#F59E0B', preparing: '#8B5CF6',
  ready: '#10B981', completed: '#6B7280', cancelled: '#EF4444', rejected: '#EF4444',
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [liveOrders, setLiveOrders] = useState<AdminOrder[]>([]);
  const [vendorStats, setVendorStats] = useState<{ vendor_id: string; vendor_name: string; booth_color: string; revenue: number; order_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [ov, rev, live, vs] = await Promise.all([
        apiFetch<AdminOverview>('/admin/overview'),
        apiFetch<RevenuePoint[]>('/admin/analytics/revenue?interval=day'),
        apiFetch<AdminOrder[]>('/admin/orders/live'),
        apiFetch<{ vendor_id: string; vendor_name: string; booth_color: string; revenue: number; order_count: number }[]>('/admin/analytics/vendors'),
      ]);
      setOverview(ov);
      setRevenue(rev);
      setLiveOrders(live);
      setVendorStats(vs.slice(0, 5));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);
  const maxVendorRev = Math.max(...vendorStats.map((v) => v.revenue), 1);

  return (
    <div className="p-8 max-w-7xl">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest mb-6">DASHBOARD</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Orders Today', value: String(overview?.orders_today ?? 0), sub: `${overview?.orders_this_week ?? 0} this week` },
          { label: 'Revenue Today', value: `$${(overview?.revenue_today ?? 0).toFixed(2)}`, sub: `$${(overview?.revenue_this_week ?? 0).toFixed(2)} this week`, yellow: true },
          { label: 'Active Vendors', value: String(overview?.active_vendors ?? 0), sub: 'currently online' },
          { label: 'Avg Prep Time', value: `${overview?.avg_prep_time ?? 0}m`, sub: 'completed today' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <GlassCard className="p-5">
              <p className="text-xs text-brand-dim uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`font-heading text-4xl tracking-wider mb-1 ${stat.yellow ? 'text-brand-yellow' : 'text-brand-white'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-brand-dim font-mono">{stat.sub}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue sparkline */}
        <GlassCard className="p-5 lg:col-span-2">
          <p className="text-xs text-brand-dim uppercase tracking-widest mb-4">Revenue — Last 30 Days</p>
          <div className="flex items-end gap-1 h-28">
            {revenue.slice(-30).map((point, i) => (
              <div
                key={point.date}
                className="flex-1 min-w-0 rounded-t-sm bg-brand-orange/30 hover:bg-brand-orange/60 transition-all relative group"
                style={{ height: `${(point.revenue / maxRevenue) * 100}%`, minHeight: 2 }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-card px-2 py-1 rounded text-xs font-mono text-brand-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {point.date.slice(5)}: ${point.revenue.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Vendor leaderboard */}
        <GlassCard className="p-5">
          <p className="text-xs text-brand-dim uppercase tracking-widest mb-4">Top Vendors (30d)</p>
          <div className="space-y-3">
            {vendorStats.map((v) => (
              <div key={v.vendor_id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-brand-chrome truncate" style={{ color: v.booth_color }}>{v.vendor_name}</span>
                  <span className="text-xs font-mono text-brand-yellow">${v.revenue.toFixed(0)}</span>
                </div>
                <div className="h-1.5 bg-brand-steel rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(v.revenue / maxVendorRev) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: v.booth_color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Live order feed */}
      <GlassCard className="p-5">
        <p className="text-xs text-brand-dim uppercase tracking-widest mb-4">Live Orders (Active)</p>
        {liveOrders.length === 0 ? (
          <p className="text-brand-dim text-sm text-center py-6">No active orders right now</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-dim text-xs uppercase tracking-wider border-b border-black/6">
                  <th className="text-left py-2 pr-4">Token</th>
                  <th className="text-left py-2 pr-4">Vendor</th>
                  <th className="text-left py-2 pr-4">Item</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-right py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {liveOrders.slice(0, 20).map((order) => (
                  <tr key={order.id} className="hover:bg-black/2 transition-colors">
                    <td className="py-2 pr-4 font-heading text-xl text-brand-orange">#{String(order.token_number).padStart(3, '0')}</td>
                    <td className="py-2 pr-4 text-brand-chrome">{order.items?.[0]?.vendor?.name ?? '—'}</td>
                    <td className="py-2 pr-4 text-brand-white">{order.items?.[0]?.item_name ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${STATUS_COLOR[order.status]}22`, color: STATUS_COLOR[order.status] }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-brand-dim text-xs font-mono">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
