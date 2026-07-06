'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import GlassCard from '@/components/ui/GlassCard';
import Spinner from '@/components/ui/Spinner';

interface WeeklyDay { date: string; revenue: number; orders: number }

interface DashboardData {
  orders_today: number;
  revenue_today: number;
  active_queue: number;
  avg_prep_time: number;
  avg_rating: number | null;
  rating_count: number;
  top_items: { name: string; count: number }[];
  recent_orders: {
    id: string;
    token_number: number;
    total: number;
    status: string;
    created_at: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#888888',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#10B981',
  completed: '#6EE7B7',
  cancelled: '#EF4444',
};

function RevenueSparkline({ days }: { days: WeeklyDay[] }) {
  const maxRev = Math.max(...days.map((d) => d.revenue), 1);
  const W = 280, H = 60, barW = 28, gap = 12;
  const labels = days.map((d) => new Date(d.date + 'T00:00:00').toLocaleDateString([], { weekday: 'short' }));
  return (
    <svg width={W} height={H + 20} className="overflow-visible">
      {days.map((d, i) => {
        const h = Math.max(2, (d.revenue / maxRev) * H);
        const x = i * (barW + gap);
        const y = H - h;
        const isToday = i === days.length - 1;
        return (
          <g key={d.date}>
            <rect x={x} y={y} width={barW} height={h} rx={4}
              fill={isToday ? '#F59E0B' : '#F59E0B44'} />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize={9} fill="#888">
              {labels[i]}
            </text>
            {d.revenue > 0 && (
              <title>${d.revenue.toFixed(0)} · {d.orders} orders</title>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);

  useEffect(() => {
    apiFetch<DashboardData>('/vendor/dashboard')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    apiFetch<{ days: WeeklyDay[] }>('/vendor/revenue/weekly')
      .then((r) => setWeekly(r.days))
      .catch(() => {});
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-brand-dim">Failed to load dashboard.</div>;
  }

  const maxCount = Math.max(...data.top_items.map((i) => i.count), 1);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="font-heading text-4xl text-brand-white tracking-widest">DASHBOARD</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Orders Today', value: data.orders_today, mono: false },
          { label: 'Revenue Today', value: `$${data.revenue_today.toFixed(2)}`, mono: true },
          { label: 'Active Queue', value: data.active_queue, mono: false },
          { label: 'Avg Prep Time', value: `${data.avg_prep_time}m`, mono: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard>
              <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">{stat.label}</p>
              <p
                className={`text-3xl font-bold text-brand-yellow ${stat.mono ? 'font-mono' : 'font-heading'}`}
              >
                {stat.value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <GlassCard>
            <p className="text-xs text-brand-dim uppercase tracking-wider mb-1">Avg Rating</p>
            {data.avg_rating !== null ? (
              <>
                <p className="text-3xl font-bold font-mono" style={{ color: '#FF6B35' }}>
                  {data.avg_rating.toFixed(1)}
                  <span className="text-lg ml-1">★</span>
                </p>
                <p className="text-xs text-brand-dim mt-0.5">{data.rating_count} review{data.rating_count !== 1 ? 's' : ''}</p>
              </>
            ) : (
              <p className="text-3xl font-bold font-heading text-brand-dim">—</p>
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* 7-day sparkline */}
      {weekly.length > 0 && (
        <GlassCard>
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-heading text-2xl text-brand-white tracking-wide">7-DAY REVENUE</h2>
            <div className="text-right">
              <p className="font-mono text-brand-orange text-lg">
                ${weekly.reduce((s, d) => s + d.revenue, 0).toFixed(2)}
              </p>
              <p className="text-xs text-brand-dim">total this week</p>
            </div>
          </div>
          <RevenueSparkline days={weekly} />
          <div className="flex gap-4 mt-2">
            {weekly.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                {d.revenue > 0 && (
                  <p className="text-xs font-mono text-brand-dim">${d.revenue.toFixed(0)}</p>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Top items */}
      <GlassCard>
        <h2 className="font-heading text-2xl text-brand-white tracking-wide mb-4">TOP ITEMS</h2>
        <div className="space-y-3">
          {data.top_items.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-brand-chrome">{item.name}</span>
                <span className="font-mono text-brand-dim">{item.count}</span>
              </div>
              <div className="h-1.5 bg-brand-steel rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-brand-orange rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent orders */}
      <GlassCard>
        <h2 className="font-heading text-2xl text-brand-white tracking-wide mb-4">RECENT ORDERS</h2>
        <div className="space-y-2">
          {data.recent_orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="font-heading text-xl text-brand-orange w-12">
                  #{String(order.token_number).padStart(3, '0')}
                </span>
                <span className="font-mono text-brand-orange text-sm">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-brand-dim font-mono">
                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-md capitalize"
                  style={{
                    color: STATUS_COLORS[order.status] ?? '#888',
                    backgroundColor: `${STATUS_COLORS[order.status] ?? '#888'}18`,
                  }}
                >
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
